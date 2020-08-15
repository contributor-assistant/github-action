import { octokit, isPersonalAccessTokenPresent, octokitUsingPAT } from './octokit'
import { checkAllowList } from './checkAllowList'
import getCommitters from './graphql'
import prComment from './pullRequestComment'
import { CommitterMap, CommittersDetails, ReactedCommitterMap } from './interfaces'
import { context } from '@actions/github'

import * as _ from 'lodash'
import * as core from '@actions/core'
import * as input from './shared/getInputs'
import { reRunLastWorkFlowIfRequired } from './pullRerunRunner'

const octokitInstance = isPersonalAccessTokenPresent() ? octokitUsingPAT : octokit

export async function setupClaCheck() {

  const pullRequestNo: number = context.issue.number
  let committerMap = getInitialCommittersMap()
  let signed: boolean = false
  let sha: string, claFileContent

  let committers = await getCommitters() as CommittersDetails[]
  committers = checkAllowList(committers) as CommittersDetails[]
  [claFileContent, sha] = await getCLAFileContentandSHA(committers, committerMap, pullRequestNo)

  committerMap = prepareCommiterMap(committers, claFileContent) as CommitterMap

  if (committerMap?.notSigned && committerMap?.notSigned.length === 0) {
    signed = true
  }
  try {
    const reactedCommitters: any = (await prComment(signed, committerMap, committers, pullRequestNo)) as ReactedCommitterMap

    if (signed) {
      core.info(`All committers have signed the CLA`)
      return reRunLastWorkFlowIfRequired()
    }
    if (reactedCommitters?.newSigned.length) {
      claFileContent.signedContributors.push(...reactedCommitters.newSigned)
      let contentString = JSON.stringify(claFileContent, null, 2)
      let contentBinary = Buffer.from(contentString).toString("base64")
      /* pushing the recently signed  contributors to the CLA Json File */
      await updateFile(sha, contentBinary, pullRequestNo)
    }
    if (reactedCommitters?.allSignedFlag) {
      core.info(`All contributors have signed the CLA`)
      return reRunLastWorkFlowIfRequired()
    }

    /* return when there are no unsigned committers */
    if (committerMap.notSigned === undefined || committerMap.notSigned.length === 0) {
      core.info(`All contributors have signed the CLA`)
      return reRunLastWorkFlowIfRequired()
    } else {
      core.setFailed(`committers of Pull Request number ${context.issue.number} have to sign the CLA`)
    }
  } catch (err) {
    core.setFailed(`Could not update the JSON file: ${err.message}`)
  }

}

function prepareCommiterMap(committers: CommittersDetails[], claFileContent): CommitterMap {

  let committerMap = getInitialCommittersMap()

  committerMap.notSigned = committers.filter(
    committer => !claFileContent.signedContributors.some(cla => committer.id === cla.id)
  )
  committerMap.signed = committers.filter(committer =>
    claFileContent.signedContributors.some(cla => committer.id === cla.id)
  )
  committers.map(committer => {
    if (!committer.id) {
      committerMap.unknown.push(committer)
    }
  })
  return committerMap
}

const getInitialCommittersMap = (): CommitterMap => ({
  signed: [],
  notSigned: [],
  unknown: []
})

async function createClaFileAndPRComment(committers: CommittersDetails[], committerMap: CommitterMap, pullRequestNo: number): Promise<any> {
  const signed = false
  committerMap.notSigned = committers
  committerMap.signed = []
  committers.map(committer => {
    if (!committer.id) {
      committerMap.unknown.push(committer)
    }
  })

  const initialContent = { signedContributors: [] }
  const initialContentString = JSON.stringify(initialContent, null, 3)
  const initialContentBinary = Buffer.from(initialContentString).toString('base64')

  await createFile(initialContentBinary).catch(error => core.setFailed(
    `Error occurred when creating the signed contributors file: ${error.message || error}. Make sure the branch where signatures are stored is NOT protected.`
  ))
  //await prComment(signed, committerMap, committers, pullRequestNo)
  core.setFailed(`Committers of pull request ${context.issue.number} have to sign the CLA`)
}

async function getCLAFileContentandSHA(committers: CommittersDetails[], committerMap: CommitterMap, pullRequestNo: number): Promise<any> {
  let result
  try {
    result = await octokitInstance.repos.getContent({
      owner: input.getRemoteOrgName(),
      repo: input.getRemoteRepoName(),
      path: input.getPathToSignatures(),
      ref: input.getBranch()
    })
    const sha = result?.data?.sha
    const claFileContentString = Buffer.from(result.data.content, 'base64').toString()
    const claFileContent = JSON.parse(claFileContentString)
    return [claFileContent, sha]
  } catch (error) {
    if (error.status === 404) {
      return createClaFileAndPRComment(committers, committerMap, pullRequestNo)
    } else {
      core.setFailed(`Could not retrieve repository contents: ${error.message}. Status: ${error.status || 'unknown'}`)
    }
    return
  }
}

// TODO: refactor the commit message when a project admin does recheck PR
async function updateFile(sha, contentBinary, pullRequestNo) {

  await octokitInstance.repos.createOrUpdateFileContents({
    owner: input.getRemoteOrgName(),
    repo: input.getRemoteRepoName(),
    path: input.getPathToSignatures(),
    sha,
    message: input.getSignedCommitMessage() ?
      input.getSignedCommitMessage().replace('$contributorName', context.actor).replace('$pullRequestNo', pullRequestNo) :
      `@${context.actor} has signed the CLA from Pull Request #${pullRequestNo}`,
    content: contentBinary,
    branch: input.getBranch()
  })

}

function createFile(contentBinary): Promise<any> {

  return octokitInstance.repos.createOrUpdateFileContents({
    owner: input.getRemoteOrgName(),
    repo: input.getRemoteRepoName(),
    path: input.getPathToSignatures(),
    message: input.getCreateFileCommitMessage() || 'Creating file for storing CLA Signatures',
    content: contentBinary,
    branch: input.getBranch()
  })

}