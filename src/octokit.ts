import { getOctokit } from '@actions/github'

const githubActionsDefaultToken = process.env.GITHUB_TOKEN
export const personalAccessToken = process.env.PERSONAL_ACCESS_TOKEN as string

export const octokit = getOctokit(githubActionsDefaultToken as string)

/*export async function isPersonalAccessTokenPresent() {
  if (!process.env.PERSONAL_ACCESS_TOKEN) {
    console.log(process.env.PERSONAL_ACCESS_TOKEN)
    core.setFailed(
      'Please enter a personal access token "PERSONAL_ACCESS_TOKEN" as a environment variable with repo scope for storing signatures in a remote repository!'
    )
  }
}*/

export function isPersonalAccessTokenPresent(): boolean {
  console.log(process.env.PERSONAL_ACCESS_TOKEN)
  return personalAccessToken !== ''
}
