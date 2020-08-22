import { context } from '@actions/github'
import { setupClaCheck } from './setupClaCheck'
import { lockPullRequest } from './pullrequest/pullRequestLock'

import * as core from '@actions/core'
import * as input from './shared/getInputs'



export async function run() {
  try {
    core.info(`CLA Assistant GitHub Action bot has started the process`)
    core.warning(JSON.stringify(input.getRemoteRepoName()))
    core.warning('or name----->')
    core.warning(JSON.stringify(input.getRemoteOrgName()))

    if (context.payload.action === 'closed') {
      return lockPullRequest()
    } else {
      await setupClaCheck()
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
