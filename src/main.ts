import { context } from '@actions/github'
import { setupClaCheck } from './setupClaCheck'
import { lockPullRequest } from './pullrequest/pullRequestLock'
import { getOctokit } from '@actions/github'

import * as core from '@actions/core'
import * as input from './shared/getInputs'
import { isPersonalAccessTokenPresent } from './octokit';



export async function run() {
  try {
    core.info(`CLA Assistant GitHub Action bot has started the process`)

    if (process.env.PERSONAL_ACCESS_TOKEN == undefined || process.env.PERSONAL_ACCESS_TOKEN == "" ) {
      core.warning(`I am called`)
    }
    //const octokit = getOctokit(process.env.PERSONAL_ACCESS_TOKEN as string)
    if (!isPersonalAccessTokenPresent()) {
      core.warning(`Test warning----`)
      core.setFailed('Please enter a personal access token as a environment variable in the CLA workflow file as described in the https://github.com/cla-assistant/github-action documentation')
      return
    }

    /*
    * using a `string` true or false purposely as github action input cannot have a boolean value
    */
    if (context.payload.action === 'closed' && input.lockPullRequestAfterMerge() == 'true') {
      return lockPullRequest()
    } else {
      await setupClaCheck()
    }
  } catch (error) {
    core.warning(`I am inside catch`)
    if (!isPersonalAccessTokenPresent()) {
      core.warning(`Test warning----`)
      core.setFailed('Please enter a personal access token as a environment variable in the CLA workflow file as described in the https://github.com/cla-assistant/github-action documentation')
      return
    }
   // core.setFailed(error.message)
  }
}

run()
