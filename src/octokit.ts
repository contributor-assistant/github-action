import { getOctokit } from '@actions/github'
import * as core from '@actions/core'

const githubActionsDefaultToken = process.env.GITHUB_TOKEN
const tokenToRemoteRepository = process.env.REMOTE_REPOSITORY_TOKEN as string

export const octokit = getOctokit(githubActionsDefaultToken as string)
//export const octokitUsingPAT = isTokenToRemoteRepositoryPresent() ? getOctokit(tokenToRemoteRepository as string) : octokit

export function isTokenToRemoteRepositoryPresent(): boolean {

    return (typeof tokenToRemoteRepository !== "undefined")
}

