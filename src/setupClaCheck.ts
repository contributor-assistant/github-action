import { checkAllowList } from './checkAllowList'
import getCommitters from './graphql'
import prCommentSetup from './pullrequest/pullRequestComment'
import { CommitterMap, CommittersDetails, ReactedCommitterMap, ClafileContentAndSha } from './interfaces'
import { context } from '@actions/github'
import { createFile, getFileContent, updateFile } from './persistence/persistence'
import { reRunLastWorkFlowIfRequired } from './pullRerunRunner'
import { isAppPrivateKeyPresent, isPersonalAccessTokenPresent } from './octokit'

import * as _ from 'lodash'
import * as core from '@actions/core'

export async function setupClaCheck() {

  let committerMap = getInitialCommittersMap()
  if (!isPersonalAccessTokenPresent() && !isAppPrivateKeyPresent()) {
    core.setFailed('Please enter a personal access token or app private key as a environment variable in the CLA workflow file as described in the https://github.com/cla-assistant/github-action documentation')
    return
  }

  let committers = await getCommitters()
  committers = checkAllowList(committers)

  const { claFileContent, sha } = await getCLAFileContentandSHA(committers, committerMap) as ClafileContentAndSha

  committerMap = prepareCommiterMap(committers, claFileContent) as CommitterMap

  try {
    const reactedCommitters = await prCommentSetup(committerMap, committers) as ReactedCommitterMap 

    if (reactedCommitters?.newSigned.length) {
      /* pushing the recently signed  contributors to the CLA Json File */
      await updateFile(sha, claFileContent, reactedCommitters)
    }
    if (reactedCommitters?.allSignedFlag || (committerMap?.notSigned === undefined || committerMap.notSigned.length === 0)) {
      core.info(`All contributors have signed the CLA 📝 ✅ `)
      return reRunLastWorkFlowIfRequired()
    } else {
      core.setFailed(`committers of Pull Request number ${context.issue.number} have to sign the CLA 📝`)
    }

  } catch (err) {
    core.setFailed(`Could not update the JSON file: ${err.message}`)
  }

}

async function getCLAFileContentandSHA(committers: CommittersDetails[], committerMap: CommitterMap): Promise<void | ClafileContentAndSha> {
  let result, claFileContentString, claFileContent, sha
  try {
    result = await getFileContent()
  } catch (error) {
    if (error.status === 404) {
      return createClaFileAndPRComment(committers, committerMap)
    } else {
      core.setFailed(`Could not retrieve repository contents: ${error.message}. Status: ${error.status || 'unknown'}`)
    }
  }
  sha = result?.data?.sha
  claFileContentString = Buffer.from(result.data.content, 'base64').toString()
  claFileContent = JSON.parse(claFileContentString)
  return { claFileContent, sha }
}

async function createClaFileAndPRComment(committers: CommittersDetails[], committerMap: CommitterMap): Promise<void> {
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
  await prCommentSetup(committerMap, committers)
  throw new Error(`Committers of pull request ${context.issue.number} have to sign the CLA`)
}

function prepareCommiterMap(committers: CommittersDetails[], claFileContent): CommitterMap {

  let committerMap = getInitialCommittersMap()

  committerMap.notSigned = committers.filter(
    committer => !claFileContent?.signedContributors.some(cla => committer.id === cla.id)
  )
  committerMap.signed = committers.filter(committer =>
    claFileContent?.signedContributors.some(cla => committer.id === cla.id)
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