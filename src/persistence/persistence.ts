
import { octokit, isPersonalAccessTokenPresent, octokitUsingPAT } from '../octokit'
import { context } from '@actions/github'

import * as input from '../shared/getInputs'
import * as core from '@actions/core'

let octokitInstance
if (input?.getRemoteRepoName() || input.getRemoteOrgName()) {
    // octokitInstance = isPersonalAccessTokenPresent() ? octokitUsingPAT : core.setFailed('You need a personal access token for storing signatures in a remote repository')
    octokitInstance = octokitUsingPAT
} else {
    octokitInstance = octokit
}

export async function getFileContent(): Promise<any> {
    const octokitInstance = prepareOctokit()
    const result = await octokitInstance.repos.getContent({
        owner: input.getRemoteOrgName() || context.repo.owner,
        repo: input.getRemoteRepoName() || context.repo.repo,
        path: input.getPathToSignatures(),
        ref: input.getBranch()
    })
    return result
}

export async function createFile(contentBinary): Promise<any> {
    const octokitInstance = prepareOctokit()
    return octokitInstance.repos.createOrUpdateFileContents({
        owner: input.getRemoteOrgName() || context.repo.owner,
        repo: input.getRemoteRepoName() || context.repo.repo,
        path: input.getPathToSignatures(),
        message: input.getCreateFileCommitMessage() || 'Creating file for storing CLA Signatures',
        content: contentBinary,
        branch: input.getBranch()
    })
}

export async function updateFile(sha, contentBinary): Promise<any> {
    const octokitInstance = prepareOctokit()
    const pullRequestNo = context.issue.number
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

function prepareOctokit() {
    let octokitInstance

    if (input?.getRemoteRepoName() || input?.getRemoteOrgName()) {
        core.warning("here1")
        octokitInstance = isPersonalAccessTokenPresent() ? octokitUsingPAT : core.setFailed('You need a personal access token for storing signatures in a remote repository')
        if (isPersonalAccessTokenPresent()) {
            octokitInstance = octokitUsingPAT
        } else {
            core.setFailed('You need a personal access token for storing signatures in a remote repository')
        }
    } else {
        core.warning("here2")
        octokitInstance = octokit
    }
    return octokitInstance
}
