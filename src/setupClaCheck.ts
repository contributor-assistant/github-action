import { octokit, isPersonalAccessTokenPresent, octokitUsingPAT } from './octokit'
import { checkAllowList } from './checkAllowList'
import getCommitters from './graphql'
import prComment from './pullRequestComment'
import { CommitterMap, CommittersDetails, ReactedCommitterMap, ClafileContentAndSha } from './interfaces'
import { context } from '@actions/github'
import { createFile, getFileContent, updateFile } from './persistence'
import { reRunLastWorkFlowIfRequired } from './pullRerunRunner'

import * as _ from 'lodash'
import * as core from '@actions/core'

export async function setupClaCheck() {

  let committerMap = getInitialCommittersMap()
  let signed: boolean = false
  let response

  let committers = await getCommitters() as CommittersDetails[]
  committers = checkAllowList(committers) as CommittersDetails[]

  try {
    response = await getCLAFileContentandSHA(committers, committerMap)
  } catch (error) {
    core.setFailed(error)
    return
  }
  const claFileContent = response?.claFileContent
  const sha = response?.sha

  committerMap = prepareCommiterMap(committers, claFileContent) as CommitterMap

  if (committerMap?.notSigned && committerMap?.notSigned.length === 0) {
    signed = true
  }
  try {
    const reactedCommitters: any = (await prComment(signed, committerMap, committers)) as ReactedCommitterMap

    if (signed) {
      core.info(`All committers have signed the CLA`)
      return reRunLastWorkFlowIfRequired()
    }
    if (reactedCommitters?.newSigned.length) {
      claFileContent?.signedContributors.push(...reactedCommitters.newSigned)
      let contentString = JSON.stringify(claFileContent, null, 2)
      let contentBinary = Buffer.from(contentString).toString("base64")
      /* pushing the recently signed  contributors to the CLA Json File */
      await updateFile(sha, contentBinary)
    }
    if (reactedCommitters?.allSignedFlag) {
      core.info(`All contributors have signed the CLA`)
      return reRunLastWorkFlowIfRequired()
    }

    /* return when there are no unsigned committers */
    if (committerMap?.notSigned === undefined || committerMap.notSigned.length === 0) {
      core.info(`All contributors have signed the CLA`)
      return reRunLastWorkFlowIfRequired()
    } else {
      core.setFailed(`committers of Pull Request number ${context.issue.number} have to sign the CLA`)
    }
  } catch (err) {
    core.setFailed(`Could not update the JSON file: ${err.message}`)
  }

}

async function getCLAFileContentandSHA(committers: CommittersDetails[], committerMap: CommitterMap): Promise<any> {
  let result, claFileContentString, claFileContent, sha
  try {
    result = await getFileContent()
  } catch (error) {
    if (error.status === 404) {
      await createClaFileAndPRComment(committers, committerMap)
      return
    } else {
      core.setFailed(`Could not retrieve repository contents: ${error.message}. Status: ${error.status || 'unknown'}`)
    }
  }
  sha = result?.data?.sha
  claFileContentString = Buffer.from(result.data.content, 'base64').toString()
  claFileContent = JSON.parse(claFileContentString)
  return { claFileContent: claFileContent, sha: sha } as ClafileContentAndSha
}

async function createClaFileAndPRComment(committers: CommittersDetails[], committerMap: CommitterMap): Promise<any> {
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
  await prComment(signed, committerMap, committers)
  throw new Error(`Committers of pull request ${context.issue.number} have to sign the CLA`)
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