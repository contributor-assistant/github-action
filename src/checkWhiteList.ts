const _ = require('lodash')
import * as core from "@actions/core"
import { CommittersDetails } from "./interfaces"

function isUserWhitelisted(committer) {

    const whitelistedItem: string = core.getInput("whitelist")
    const whitelistPatterns: string[] = whitelistedItem.split(',')
    return whitelistPatterns.filter(function (pattern) {
        pattern = pattern.trim()
        if (pattern.includes('*')) {
            const regex = _.escapeRegExp(pattern).split('\\*').join('.*')

            return new RegExp(regex).test(committer)
        }
        return pattern === committer
    }).length > 0
}

export function checkWhitelist(committers: CommittersDetails[]) {
    const committersAfterWhiteListCheck: CommittersDetails[] = committers.filter(committer => committer && !(isUserWhitelisted !== undefined && isUserWhitelisted(committer.name)))
    return committersAfterWhiteListCheck
}