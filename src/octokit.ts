import { getOctokit } from '@actions/github'

const octokit = getOctokit(process.env.GITHUB_TOKEN as string)

export default octokit 