import { CommittersDetails } from './interfaces'

import * as _ from 'lodash'
import * as core from '@actions/core'

function isUserNotInAllowList(committer) {

    const allowListedItem: string = core.getInput('allowlist')
    const allowListPatterns: string[] = allowListedItem.split(',')

    return allowListPatterns.filter(function (pattern) {
        pattern = pattern.trim()
        if (pattern.includes('*')) {
            const regex = _.escapeRegExp(pattern).split('\\*').join('.*')

            return new RegExp(regex).test(committer)
        }
        return pattern === committer
    }).length > 0
}

export function checkAllowList(committers: CommittersDetails[]) {
    const committersAfterAllowListCheck: CommittersDetails[] = committers.filter(committer => committer && !(isUserNotInAllowList !== undefined && isUserNotInAllowList(committer.name)))
    return committersAfterAllowListCheck
}