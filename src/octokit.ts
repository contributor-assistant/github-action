import { GitHub } from '@actions/github'

const octokit = new GitHub(process.env.GITHUB_TOKEN as string)

export default octokit 