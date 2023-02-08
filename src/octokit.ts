import { getOctokit } from '@actions/github'

const githubActionsDefaultToken = process.env.GITHUB_TOKEN

export const octokit = getOctokit(githubActionsDefaultToken as string)
