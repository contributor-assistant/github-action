"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require('lodash');
const core = __importStar(require("@actions/core"));
function isUserWhitelisted(committer) {
    const whitelistedItem = core.getInput("whitelist");
    const whitelistPatterns = whitelistedItem.split(',');
    return whitelistPatterns.filter(function (pattern) {
        pattern = pattern.trim();
        if (pattern.includes('*')) {
            const regex = _.escapeRegExp(pattern).split('\\*').join('.*');
            return new RegExp(regex).test(committer);
        }
        return pattern === committer;
    }).length > 0;
}
function checkWhitelist(committers) {
    const committersAfterWhiteListCheck = committers.filter(committer => committer && !(isUserWhitelisted !== undefined && isUserWhitelisted(committer.name)));
    console.debug("committersAfterWhiteListCheck " + JSON.stringify(committersAfterWhiteListCheck, null, 2));
    return committersAfterWhiteListCheck;
}
exports.checkWhitelist = checkWhitelist;
