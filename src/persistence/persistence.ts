import {
  isPersonalAccessTokenNotPresent,
  octokit,
  personalAccessToken
} from '../octokit'
import { context, getOctokit } from '@actions/github'

import * as input from '../shared/getInputs'
import { ReactedCommitterMap } from '../interfaces'
import * as core from '@actions/core'

async function getOctokitInstance() {
  if (input?.getRemoteRepoName() || input.getRemoteOrgName()) {
    if (isPersonalAccessTokenNotPresent()) {
      console.log('IamisPersonalAccessTokenNotPresent')
      core.setFailed(
        'Please enter a personal access token "PERSONAL_ACCESS_TOKEN" as a environment variable with repo scope for storing signatures in a remote repository!'
      )
    }
    return getOctokit(personalAccessToken)
  } else {
    return octokit
  }
}

export async function getFileContent(): Promise<any> {
  let octokitInstance = await getOctokitInstance()
  const result = await octokitInstance.repos.getContent({
    owner: input.getRemoteOrgName() || context.repo.owner,
    repo: input.getRemoteRepoName() || context.repo.repo,
    path: input.getPathToSignatures(),
    ref: input.getBranch()
  })
  return result
}

export async function createFile(contentBinary): Promise<any> {
  let octokitInstance = await getOctokitInstance()
  return octokitInstance.repos.createOrUpdateFileContents({
    owner: input.getRemoteOrgName() || context.repo.owner,
    repo: input.getRemoteRepoName() || context.repo.repo,
    path: input.getPathToSignatures(),
    message:
      input.getCreateFileCommitMessage() ||
      'Creating file for storing CLA Signatures',
    content: contentBinary,
    branch: input.getBranch()
  })
}

export async function updateFile(
  sha: string,
  claFileContent,
  reactedCommitters: ReactedCommitterMap
): Promise<any> {
  let octokitInstance = await getOctokitInstance()
  const pullRequestNo = context.issue.number
  claFileContent?.signedContributors.push(...reactedCommitters.newSigned)
  let contentString = JSON.stringify(claFileContent, null, 2)
  let contentBinary = Buffer.from(contentString).toString('base64')
  await octokitInstance.repos.createOrUpdateFileContents({
    owner: input.getRemoteOrgName() || context.repo.owner,
    repo: input.getRemoteRepoName() || context.repo.repo,
    path: input.getPathToSignatures(),
    sha,
    message: input.getSignedCommitMessage()
      ? input
          .getSignedCommitMessage()
          .replace('$contributorName', context.actor)
          .replace('$pullRequestNo', context.issue.number.toString())
      : `@${context.actor} has signed the CLA from Pull Request #${pullRequestNo}`,
    content: contentBinary,
    branch: input.getBranch()
  })
}
