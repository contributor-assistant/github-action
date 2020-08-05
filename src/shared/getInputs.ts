import { context } from '@actions/github'
import * as core from '@actions/core'


export const getRemoteRepoName = (): string => { return core.getInput('remote-repository-name') || context.repo.repo }

export const getRemoteOrgName = (): string => { return core.getInput('remote-organization-name') || context.repo.owner }

export const getPathToSignatures = (): string => core.getInput('path-to-signatures')

export const getPathToCLADocument = (): string => core.getInput('path-to-cla-document')

export const getBranch = (): string => core.getInput('branch')

export const getEmptyCommitFlag = (): string => core.getInput('allowlist')


