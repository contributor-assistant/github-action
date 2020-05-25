import * as core from "@actions/core"
import { context } from "@actions/github"
import { getclas } from "./checkcla"
import { lockPullRequest } from "./pullRequestLock"

export async function run() {
  try {
    const pullRequestNo: number = context.issue.number
    core.info(`CLA Assistant GitHub Action has started`)
    core.info(`the Pull request number is ${JSON.stringify(pullRequestNo)}`)
    return core.setOutput("test", "success")

    if (context.payload.action != "closed") {
      await getclas(pullRequestNo)
    } else {
      return lockPullRequest(pullRequestNo)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
run()
