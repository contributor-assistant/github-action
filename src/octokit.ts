import { getOctokit } from '@actions/github'

const githubActionsDefaultToken = process.env.GITHUB_TOKEN
const personalAcessToken = process.env.PERSONAL_ACCESS_TOKEN as string

export const octokit = getOctokit(githubActionsDefaultToken as string)
export const octokitUsingPAT = isPersonalAccessTokenPresent() ? getOctokit(personalAcessToken as string) : octokit

export function isPersonalAccessTokenPresent(): boolean {

    return (typeof personalAcessToken !== "undefined")
}

