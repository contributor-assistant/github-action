import { context } from '@actions/github'
import { setupClaCheck } from './setupClaCheck'
import { lockPullRequest } from './pullrequest/pullRequestLock'

import * as util from 'util'
import * as  figlet from 'figlet'
import * as core from '@actions/core'




export async function run() {
  try {
    const text = await figlet('CLA ASSISTANT')
    core.info(text)

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
