import { getOctokit } from '@actions/github'
import { context } from '@actions/github'
import { createAppAuth } from '@octokit/auth-app'
const { Octokit } = require('@octokit/rest');

const githubActionsDefaultToken = process.env.GITHUB_TOKEN
const personalAcessToken = process.env.PERSONAL_ACCESS_TOKEN as string

const appPivateKey = process.env.APP_PRIVATE_KEY as string
const appId = process.env.APP_ID as string

export const octokit = getOctokit(githubActionsDefaultToken as string)
export const octokitUsingPAT = isPersonalAccessTokenPresent() ? getOctokit(personalAcessToken as string) : octokit

export function isPersonalAccessTokenPresent(): boolean {

    return (typeof personalAcessToken !== "undefined")
}

export function isAppPrivateKeyPresent(): boolean {

    return (typeof appPivateKey !== "undefined" && typeof appId !== "undefined")
}

export async function getOctokitByAppSecret() {
  const appPivateKey = process.env.APP_PRIVATE_KEY as string
  const appId = process.env.APP_ID as string
  let token = await getAppToken(appId, appPivateKey)
  return getOctokit(token)
}

async function getAppToken(appId: string | number, appPivateKey: string) {
  let octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: appId,
      privateKey: appPivateKey,
    }
  })

  const app_installation = await octokit.rest.apps.getRepoInstallation({
    owner: context.repo.owner,
    repo: context.repo.repo
  });

  let { token } = await octokit.auth({
      type: "installation",
      installationId: app_installation.data.id
    });

  return token
}
