import { getOctokit } from "@actions/github"

const githubActionsDefaultToken = process.env.GITHUB_TOKEN
/*const personalAccessToken = process.env.PERSONAL_ACCESS_TOKEN as string*/
const personalAccessToken = "test token"

export const octokit = getOctokit(githubActionsDefaultToken as string)
/*export const octokitUsingPAT = isPersonalAccessTokenPresent()
  ? getOctokit(personalAccessToken as string)
  : octokit*/

export const octokitUsingPAT = getOctokit(githubActionsDefaultToken as string)
export function isPersonalAccessTokenPresent(): boolean {
  return true
}
