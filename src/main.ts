import { context } from '@actions/github'
import { getclas } from './checkcla'
import { lockPullRequest } from './pullRequestLock'
import { octokit } from './octokit'

import * as core from '@actions/core'

export async function run() {
  try {

    const selfWorkFlowId: any = await getSelfWorkflowId()
    core.info(selfWorkFlowId)
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

async function getSelfWorkflowId(): Promise<number> {
  const workflowList = await octokit.actions.listRepoWorkflows({
    owner: context.repo.owner,
    repo: context.repo.repo,
  });

  const workflow = workflowList.data.workflows
    .find(w => w.name == context.workflow)

  if (!workflow) {
    throw new Error(`Unable to locate this workflow's ID in this repository, can't retrigger job..`)
  }
  return workflow.id
}
