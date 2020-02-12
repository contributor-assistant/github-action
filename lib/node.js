"use strict";
const _ = require('lodash');
function isUserWhitelisted(committer) {
    const whitelistPatterns = ['ibakshay', 'testuser61', 'bot*'];
    return whitelistPatterns.filter(function (pattern) {
        pattern = pattern.trim();
        if (pattern.includes('*')) {
            const regex = _.escapeRegExp(pattern).split('\\*').join('.*');
            return new RegExp(regex).test(committer);
        }
        console.log("whitelist pattern is " + pattern);
        console.log("committer is " + committer);
        return pattern === committer;
    }).length > 0;
}
function prepareCommiterMap() {
    const committers = [{
            name: "ibakshay",
            id: 1234
        }, {
            name: "testuser61",
            id: 1234
        }, {
            name: "akshayib",
            id: 1234
        }];
    //const committersAfterWhiteListCheck = committers.filter(committer => { isUserWhitelisted(committer.name) })
    const committersAfterWhiteListCheck = committers.filter(committer => committer && !(isUserWhitelisted !== undefined && isUserWhitelisted(committer.name)));
    //    committer && !(isUserWhitelisted !== undefined && isUserWhitelisted(committer.name)))
    console.log("committersAfterWhiteListCheck " + JSON.stringify(committersAfterWhiteListCheck, null, 2));
    return committersAfterWhiteListCheck;
}
prepareCommiterMap();
