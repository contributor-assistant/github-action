import { context } from '@actions/github'
import { getclas } from './checkcla'
import { lockPullRequest } from './pullRequestLock'

import * as core from '@actions/core'

export async function run() {
  try {

    core.info(`CLA Assistant GitHub Action bot has started the process`)

    if (context.payload.action === 'closed') {
      return lockPullRequest()
    } else {

      await getclas()
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
run()
