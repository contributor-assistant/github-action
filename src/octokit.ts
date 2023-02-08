import { getOctokit } from '@actions/github'

import * as core from '@actions/core'

const githubActionsDefaultToken = process.env.GITHUB_TOKEN
const personalAcessToken = process.env.PERSONAL_ACCESS_TOKEN as string

export const octokit = getOctokit(githubActionsDefaultToken as string)

/*export async function getOctokitClient() {
  if (isPersonalAccessTokenPresent()) {
    return getPATOctokit()
  }
  return octokit
}*/
export function getPATOctokit() {
  if (!isPersonalAccessTokenPresent()) {
    core.setFailed(
      `Please add a personal access token as an environment variable for writing signatures in a remote repository/org`
    )
  }
  return getOctokit(personalAcessToken)
}

export function isPersonalAccessTokenPresent(): boolean {
  return personalAcessToken !== undefined && personalAcessToken !== ''
}
