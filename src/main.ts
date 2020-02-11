import * as core from "@actions/core"
import { context } from "@actions/github"
const io = require("@actions/io")
import { getclas } from "./checkcla"
import { lockPullRequest } from "./pullRequestLock"

export async function run()
{
  try {
    const pullRequestNo: number = context.issue.number
    core.info("CLA Assistant GitHub Action has started")
    core.info("the PR No is " + JSON.stringify(pullRequestNo))
    const whitelistedUsers: string = core.getInput("whitelist")
    const whitelistArray: string[] = whitelistedUsers.split(',')
    core.info(`the whitelisted users are  ${whitelistArray[0]} ${whitelistArray[1]}`)
    core.info
    if (context.payload.action === "closed") {
      return lockPullRequest(pullRequestNo)
    } else {
      await getclas(pullRequestNo)

      // const rateLimit = await octokit.rateLimit.get()
      // console.log(JSON.stringify(rateLimit.data.resources, null, 4))
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
run()
