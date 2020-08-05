import { getOctokit } from '@actions/github'

const tokenToRemoteRepository = process.env.REMOTE_REPOSITORY_TOKEN
const githubActionsDefaultToken = process.env.GITHUB_TOKEN

export const octokit = getOctokit(githubActionsDefaultToken as string)
export const octokitUsingPAT = getOctokit(githubActionsDefaultToken as string)

export function isTokenToRemoteRepositoryPresent(): boolean {
    return (typeof tokenToRemoteRepository !== "undefined") || tokenToRemoteRepository !== ''
}

