import { getOctokit } from '@actions/github'

const githubActionsDefaultToken = process.env.GITHUB_TOKEN
const tokenToRemoteRepository = process.env.REMOTE_REPOSITORY_TOKEN

export const octokit = getOctokit(githubActionsDefaultToken as string)
export const octokitUsingPAT = isTokenToRemoteRepositoryPresent() ? getOctokit(tokenToRemoteRepository as string) : octokit

export function isTokenToRemoteRepositoryPresent(): boolean {
    return (typeof tokenToRemoteRepository !== "undefined") || tokenToRemoteRepository !== ''
}

