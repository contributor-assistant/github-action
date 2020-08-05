import { octokit } from './octokit'
import * as core from '@actions/core'
import { context } from '@actions/github'

export async function lockPullRequest(pullRequestNo: number) {
    core.info('Locking the Pull Request to safe guard the Pull Request CLA Signatures')
    try {
        await octokit.issues.lock(
            {
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: pullRequestNo
            }
        )
        core.info(`successfully locked the pull request ${pullRequestNo}`)
    } catch (e) {
        core.error(`failed when locking the pull request `)

    }

}