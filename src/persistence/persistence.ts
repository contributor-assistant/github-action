
import { octokit, octokitUsingPAT } from '../octokit'
import { context } from '@actions/github'

import * as input from '../shared/getInputs'
import { ReactedCommitterMap } from '../interfaces'

let octokitInstance
if (input?.getRemoteRepoName() || input.getRemoteOrgName()) {
    octokitInstance = octokitUsingPAT
} else {
    octokitInstance = octokit
}

export async function getFileContent(): Promise<any> {
    const result = await octokitInstance.repos.getContent({
        owner: input.getRemoteOrgName() || context.repo.owner,
        repo: input.getRemoteRepoName() || context.repo.repo,
        path: input.getPathToSignatures(),
        ref: input.getBranch()
    })
    return result
}

export async function createFile(contentBinary): Promise<any> {
    return octokitInstance.repos.createOrUpdateFileContents({
        owner: input.getRemoteOrgName() || context.repo.owner,
        repo: input.getRemoteRepoName() || context.repo.repo,
        path: input.getPathToSignatures(),
        message: input.getCreateFileCommitMessage() || 'Creating file for storing CLA Signatures',
        content: contentBinary,
        branch: input.getBranch()
    })
}

export async function updateFile(sha: string, claFileContent, reactedCommitters: ReactedCommitterMap): Promise<any> {
    const pullRequestNo = context.issue.number
    claFileContent?.signedContributors.push(...reactedCommitters.newSigned)
    let contentString = JSON.stringify(claFileContent, null, 2)
    let contentBinary = Buffer.from(contentString).toString("base64")
    await octokitInstance.repos.createOrUpdateFileContents({
        owner: input.getRemoteOrgName() || context.repo.owner,
        repo: input.getRemoteRepoName() || context.repo.repo,
        path: input.getPathToSignatures(),
        sha,
        message: input.getSignedCommitMessage() ?
            input.getSignedCommitMessage().replace('$contributorName', context.actor).replace('$pullRequestNo', context.issue.number.toString()) :
            `@${context.actor} has signed the CLA from Pull Request #${pullRequestNo}`,
        content: contentBinary,
        branch: input.getBranch()
    })
}