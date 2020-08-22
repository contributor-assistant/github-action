
import { octokit, isPersonalAccessTokenPresent, octokitUsingPAT } from '../octokit'
import { context } from '@actions/github'

import * as input from '../shared/getInputs'
import * as core from '@actions/core'
let octokitInstance

if (input?.getRemoteRepoName() || input.getRemoteOrgName()) {
    octokitInstance = isPersonalAccessTokenPresent() ? octokitUsingPAT : core.setFailed('You need a personal access token for storing signatures in a remote repository')
} else {
    octokitInstance = octokit
}

export async function getFileContent(): Promise<any> {
    const result = await octokitInstance.repos.getContent({
        owner: input.getRemoteOrgName(),
        repo: input.getRemoteRepoName(),
        path: input.getPathToSignatures(),
        ref: input.getBranch()
    })
    return result
}

export async function createFile(contentBinary): Promise<any> {
    return octokitInstance.repos.createOrUpdateFileContents({
        owner: input.getRemoteOrgName(),
        repo: input.getRemoteRepoName(),
        path: input.getPathToSignatures(),
        message: input.getCreateFileCommitMessage() || 'Creating file for storing CLA Signatures',
        content: contentBinary,
        branch: input.getBranch()
    })
}

export async function updateFile(sha, contentBinary): Promise<any> {
    const pullRequestNo = context.issue.number
    await octokitInstance.repos.createOrUpdateFileContents({
        owner: input.getRemoteOrgName(),
        repo: input.getRemoteRepoName(),
        path: input.getPathToSignatures(),
        sha,
        message: input.getSignedCommitMessage() ?
            input.getSignedCommitMessage().replace('$contributorName', context.actor).replace('$pullRequestNo', context.issue.number.toString()) :
            `@${context.actor} has signed the CLA from Pull Request #${pullRequestNo}`,
        content: contentBinary,
        branch: input.getBranch()
    })
}