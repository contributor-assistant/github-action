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
        core.info("pattern is " + pattern)
        core.info("committer is " + committer)
        return pattern === committer
    }).length > 0
}

export function checkWhitelist(committers: CommittersDetails[]) {
    const committersAfterWhiteListCheck: CommittersDetails[] = committers.filter(committer => committer && !(isUserWhitelisted !== undefined && isUserWhitelisted(committer.name)))
    console.log("committersAfterWhiteListCheck " + JSON.stringify(committersAfterWhiteListCheck, null, 2))
    return committersAfterWhiteListCheck
}