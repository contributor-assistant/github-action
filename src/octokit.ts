import { getOctokit } from '@actions/github'

const githubActionsDefaultToken = process.env.GITHUB_TOKEN
export const personalAccessToken = process.env.PERSONAL_ACCESS_TOKEN as string

export const octokit = getOctokit(githubActionsDefaultToken as string)

export function isPersonalAccessTokenNotPresent(): boolean {
  if (!process.env.PERSONAL_ACCESS_TOKEN) {
    console.log(process.env.PERSONAL_ACCESS_TOKEN)
    return true
  }
  return false
}

/*export function isPersonalAccessTokenPresent(): boolean {
  console.log(process.env.PERSONAL_ACCESS_TOKEN)
  return personalAccessToken !== ''
}*/
