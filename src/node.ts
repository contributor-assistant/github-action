const _ = require('lodash')
import * as core from "@actions/core"

function isUserWhitelisted(committer) {
    const whitelistedItem: string = core.getInput("whitelist")
    const whitelistPatterns: string[] = whitelistedItem.split(',')
    //const whitelistPatterns = ['ibakshay', 'testuser61', 'bot*']

    return whitelistPatterns.filter(function (pattern) {
        pattern = pattern.trim()
        if (pattern.includes('*')) {
            const regex = _.escapeRegExp(pattern).split('\\*').join('.*')

            return new RegExp(regex).test(committer)
        }
        console.log("whitelist pattern is " + pattern)
        console.log("committer is " + committer)
        return pattern === committer
    }).length > 0
}

export function prepareCommiterMap() {

    const committers = [
        {
            name: "ibakshay",
            id: 33329946,
            pullRequestNo: 284
        },
        {
            name: "becky",
            id: 33329946,
            pullRequestNo: 284
        },
        {
            name: "testuser",
            id: 33329946,
            pullRequestNo: 284
        }
    ]

    //const committersAfterWhiteListCheck = committers.filter(committer => { isUserWhitelisted(committer.name) })
    const committersAfterWhiteListCheck = committers.filter(committer => committer && !(isUserWhitelisted !== undefined && isUserWhitelisted(committer.name)))
    //    committer && !(isUserWhitelisted !== undefined && isUserWhitelisted(committer.name)))
    console.log("committersAfterWhiteListCheck " + JSON.stringify(committersAfterWhiteListCheck, null, 2))

    return committersAfterWhiteListCheck
}

prepareCommiterMap()