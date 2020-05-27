import * as core from "@actions/core"
import { context } from "@actions/github"
import { startClaCheck } from "./checkcla"
import { lockPullRequest } from "./pullRequestLock"

export async function run() {
  try {
    core.info(`CLA Assistant GitHub Action has started`)
    core.info(`the Pull request number is ${JSON.stringify(context.issue.number)}`)

    if (context.payload.action != "closed") {
      return startClaCheck()
    } else {
      return lockPullRequest()
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
run()
