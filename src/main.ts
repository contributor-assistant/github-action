import { context } from '@actions/github'
import { setupClaCheck } from './setupClaCheck'
import { lockPullRequest } from './pullrequest/pullRequestLock'

import * as core from '@actions/core'
import * as input from './shared/getInputs'
import { isPersonalAccessTokenPresent } from './octokit';



export async function run() {
  try {
    core.info(`CLA Assistant GitHub Action bot has started the process`)
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
    core.setFailed(error.message)
  }
}

run()
