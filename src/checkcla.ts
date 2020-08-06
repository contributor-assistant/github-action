import { octokit, isTokenToRemoteRepositoryPresent, octokitUsingPAT } from './octokit'
import { checkAllowList } from './checkAllowList'
import getCommitters from './graphql'
import prComment from './pullRequestComment'
import { CommitterMap, CommittersDetails, ReactedCommitterMap } from './interfaces'
import { context } from '@actions/github'

import * as _ from 'lodash'
import * as core from '@actions/core'
import * as input from './shared/getInputs'

const octokitInstance = isTokenToRemoteRepositoryPresent() ? octokitUsingPAT : octokit

export async function getclas(pullRequestNo: number) {
  let committerMap = getInitialCommittersMap()
  let signed: boolean = false

  let result, clas, sha
  let committers = (await getCommitters()) as CommittersDetails[]
  //TODO code in more readable and efficient way
  committers = checkAllowList(committers)
  try {
    result = await octokitInstance.repos.getContent({
      owner: input.getRemoteOrgName(),
      repo: input.getRemoteRepoName(),
      path: input.getPathToSignatures(),
      ref: input.getBranch()
    })
    sha = result?.data?.sha
  } catch (error) {
    core.warning(error)
    if (error.status === 404) {
      committerMap.notSigned = committers
      committerMap.signed = []
      committers.map(committer => {
        if (!committer.id) {
          committerMap.unknown.push(committer)
        }
      })

      const initialContent = { signedContributors: [] }
      const initialContentString = JSON.stringify(initialContent, null, 2)
      const initialContentBinary = Buffer.from(initialContentString).toString('base64')

      await createFile(initialContentBinary).catch(error => core.setFailed(
        `Error occurred when creating the signed contributors file: ${error.message || error}. Make sure the branch where signatures are stored is NOT protected.`
      ))
      await prComment(signed, committerMap, committers, pullRequestNo)
      core.setFailed(`Committers of pull request ${context.issue.number} have to sign the CLA`)

    } else {
      core.setFailed(`Could not retrieve repository contents: ${error.message}. Status: ${error.status || 'unknown'}`)
    }
    return
  }
  clas = Buffer.from(result.data.content, 'base64').toString()
  clas = JSON.parse(clas)
  committerMap = prepareCommiterMap(committers, clas) as CommitterMap

  // TODO NULL check
  if (committerMap && committerMap.notSigned && committerMap.notSigned.length === 0) {
    signed = true
  }
  try {
    const reactedCommitters: ReactedCommitterMap = (await prComment(signed, committerMap, committers, pullRequestNo)) as ReactedCommitterMap
    if (signed) {
      core.info(`All committers have signed the CLA`)
      return
    }
    if (reactedCommitters) {
      if (reactedCommitters.newSigned) {
        clas.signedContributors.push(...reactedCommitters.newSigned)
        let contentString = JSON.stringify(clas, null, 2)
        let contentBinary = Buffer.from(contentString).toString("base64")
        /* pushing the recently signed  contributors to the CLA Json File */
        await updateFile(sha, contentBinary, pullRequestNo)
      }
      if (reactedCommitters.allSignedFlag) {
        core.info(`All committers have signed the CLA`)
        return
      }
    }

    /* return when there are no unsigned committers */
    if (committerMap.notSigned === undefined || committerMap.notSigned.length === 0) {
      core.info(`All committers have signed the CLA`)
      return
    } else {
      core.setFailed(`committers of Pull Request number ${context.issue.number} have to sign the CLA`)
    }
  } catch (err) {
    core.setFailed(`Could not update the JSON file: ${err.message}`)
  }
  return clas
}

function prepareCommiterMap(committers: CommittersDetails[], clas): CommitterMap {

  let committerMap = getInitialCommittersMap()

  committerMap.notSigned = committers.filter(
    committer => !clas.signedContributors.some(cla => committer.id === cla.id)
  )
  committerMap.signed = committers.filter(committer =>
    clas.signedContributors.some(cla => committer.id === cla.id)
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


async function getFileContent() {
  core.warning(isTokenToRemoteRepositoryPresent().toString())
  const result = await octokitInstance.repos.getContent({
    owner: input.getRemoteOrgName(),
    repo: input.getRemoteRepoName(),
    path: input.getPathToSignatures(),
    ref: input.getBranch()
  }).catch(error => {
    core.setFailed(`Error occured when getting the contents of the repository: ${error}`)
  })
  return result

}

// TODO: refactor the commit message when a project admin does recheck PR
async function updateFile(sha, contentBinary, pullRequestNo) {
  const commitMessage = core.getInput('signed-commit-message')
  const tokenFlag = isTokenToRemoteRepositoryPresent()
  core.info(tokenFlag.toString())
  core.info(`updateFile`)
  await octokitInstance.repos.createOrUpdateFileContents({
    owner: input.getRemoteOrgName(),
    repo: input.getRemoteRepoName(),
    path: input.getPathToSignatures(),
    sha,
    message: commitMessage ?
      commitMessage.replace('$contributorName', context.actor).replace('$pullRequestNo', pullRequestNo) :
      `@${context.actor} has signed the CLA from Pull Request ${pullRequestNo}`,
    content: contentBinary,
    branch: input.getBranch()
  })
}

function createFile(contentBinary): Promise<object> {
  const commitMessage = core.getInput('create-file-commit-message')
  const tokenFlag = isTokenToRemoteRepositoryPresent()
  core.info(tokenFlag.toString())
  core.info(`createFile`)
  return octokitInstance.repos.createOrUpdateFileContents({
    owner: input.getRemoteOrgName(),
    repo: input.getRemoteRepoName(),
    path: input.getPathToSignatures(),
    message: commitMessage || 'Creating file for storing CLA Signatures',
    content: contentBinary,
    branch: input.getBranch()
  })
}

