import * as core from "@actions/core"
import { context } from "@actions/github"
import { getclas } from "./checkcla"
import { lockPullRequest } from "./pullRequestLock"

export async function run() {
  try {
    core.debug(JSON.stringify(context, null, 2));
    const pullRequestNo: number = context.issue.number
    core.info(`CLA Assistant GitHub Action has started`)
    core.info(`the Pull request number is ${JSON.stringify(pullRequestNo)}`)
    if (context.payload.action === "closed") {
      return lockPullRequest(pullRequestNo)
    } else {
      await getclas(pullRequestNo)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
run()
