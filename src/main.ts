import { context } from '@actions/github'
import { setupClaCheck } from './setupClaCheck'
import { lockPullRequest } from './pullrequest/pullRequestLock'

import * as figlet from 'figlet'

import * as core from '@actions/core'



export async function run() {
  try {
    figlet('Cla Assistant', function(err, data) {
      if (err) {
          console.log('Something went wrong...');
          console.dir(err);
          return;
      }
      console.log(data)
  });
    core.info(`CLA Assistant GitHub Action bot has started the process`)

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
