import { getOctokit } from '@actions/github'
import { createAppAuth } from '@octokit/auth-app'
import * as core from '@actions/core'

const githubActionsDefaultToken = process.env.GITHUB_TOKEN
const personalAccessToken = process.env.PERSONAL_ACCESS_TOKEN as string
const appId = process.env.GITHUB_APP_ID as string
const appPrivateKey = process.env.GITHUB_APP_PRIVATE_KEY as string
const appInstallationId = process.env.GITHUB_APP_INSTALLATION_ID as string

export const octokit = getOctokit(githubActionsDefaultToken as string)

export function getDefaultOctokitClient() {
  return getOctokit(githubActionsDefaultToken as string)
}
export function getPATOctokit() {
	if (isGitHubAppAuthPresent()) {
    core.info('Using GitHub App authentication')
    return getGitHubAppOctokit()
  }

  if (!isPersonalAccessTokenPresent()) {
    core.setFailed(
      `Please add a personal access token as an environment variable for writing signatures in a remote repository/organization as mentioned in the README.md file`
    )
  }
  return getOctokit(personalAccessToken)
}

export function isPersonalAccessTokenPresent(): boolean {
  return personalAccessToken !== undefined && personalAccessToken !== ''
}

export function isGitHubAppAuthPresent(): boolean {
  return appId !== undefined && appId !== '' && 
         appPrivateKey !== undefined && appPrivateKey !== '' &&
         appInstallationId !== undefined && appInstallationId !== ''
}

export function getGitHubAppOctokit() {
  try {
    const auth = createAppAuth({
      appId: appId,
      privateKey: appPrivateKey.replace(/\\n/g, '\n'),
      installationId: appInstallationId
    })
    
    return getOctokit('', {
      authStrategy: auth,
      auth: {
        type: 'installation',
        installationId: appInstallationId
      }
    })
  } catch (error) {
    core.error(`Failed to initialize GitHub App authentication: ${error}`)
    throw error
  }
}
