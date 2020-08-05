import { getOctokit } from '@actions/github'

const githubActionsDefaultToken = process.env.GITHUB_TOKEN
const tokenToRemoteRepository = process.env.REMOTE_REPOSITORY_TOKEN

export const octokit = getOctokit(githubActionsDefaultToken as string)
export const octokitUsingPAT = getOctokit(tokenToRemoteRepository as string)

export function isTokenToRemoteRepositoryPresent(): boolean {
    return (typeof tokenToRemoteRepository !== "undefined") || tokenToRemoteRepository !== ''
}

