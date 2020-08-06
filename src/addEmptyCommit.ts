import octokit from './octokit'
import * as core from '@actions/core'
import { context } from '@actions/github'

export async function addEmptyCommit() {
    const contributorName: string = context?.payload?.comment?.user.login
    core.info(`Adding empty commit for ${contributorName} who has signed the CLA `)

    if (context.payload.comment) {

        //Do empty commit only when the contributor signs the CLA with the PR comment 
        if (context.payload.comment.body === 'I have read the CLA Document and I hereby sign the CLA') {
            try {
                const commitMessage = core.getInput('signed-empty-commit-message')
                const message = commitMessage ?
                    commitMessage.replace('$contributorName', contributorName) :
                    ` @${contributorName} has signed the CLA `
                const pullRequestResponse = await octokit.pulls.get({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    pull_number: context.payload.issue!.number
                })

                const baseCommit = await octokit.git.getCommit({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    commit_sha: pullRequestResponse.data.head.sha
                })

                const tree = await octokit.git.getTree({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    tree_sha: baseCommit.data.tree.sha
                })
                const newCommit = await octokit.git.createCommit(
                    {
                        owner: context.repo.owner,
                        repo: context.repo.repo,
                        message: message,
                        tree: tree.data.sha,
                        parents: [pullRequestResponse.data.head.sha]
                    }
                )
                return octokit.git.updateRef({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    ref: `heads/${pullRequestResponse.data.head.ref}`,
                    sha: newCommit.data.sha
                })

            } catch (e) {
                core.error(`failed when adding empty commit  with the contributor's signature name `)

            }
        }
    }
    return
}
