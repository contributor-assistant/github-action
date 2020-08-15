import { context } from '@actions/github'
import { setupClaCheck } from './setupClaCheck'
import { lockPullRequest } from './pullRequestLock'

import * as core from '@actions/core'



export async function run() {
  try {
    core.info(`CLA Assistant GitHub Action bot has started the process`)

    if (context.payload.action === 'closed') {
      return lockPullRequest()
    } else {
      await setupClaCheck()
    }
  } catch (error) {
    throw new Error(error.message)
  }
}

run()
