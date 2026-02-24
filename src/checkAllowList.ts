import { CommittersDetails } from './interfaces'

import * as _ from 'lodash'
import * as input from './shared/getInputs'
import { getFileContent } from './persistence/persistence'


const usernameAllowListPatterns: string[] = input.getUsernameAllowList().split(',')
const domainAllowList: string[] = input.getDomainAllowList().split(',')


function isUserNotInAllowList(committer) {

    for(let pattern of domainAllowList) {
        pattern = pattern.trim()
        if(!pattern) continue
        if(!pattern.startsWith('@')) pattern = '@' + pattern
        if(committer.email.endsWith(pattern)) {
            return true
        }
    }

    return usernameAllowListPatterns.filter(function (pattern) {
        pattern = pattern.trim()
        if (pattern.includes('*')) {
            const regex = _.escapeRegExp(pattern).split('\\*').join('.*')

            return new RegExp(regex).test(committer.name)
        }
        return pattern === committer.name
    }).length > 0
}

export async function checkAllowList(committers: CommittersDetails[]): Promise<CommittersDetails[]> {
    const domainsFile: string = input.getDomainsFile()

    if(domainsFile) {
        try {
            const result = await getFileContent(domainsFile)
            const jsonData = Buffer.from(result.data.content, 'base64').toString()
            let domainsFileContent = JSON.parse(jsonData)
            if(domainsFileContent && Array.isArray(domainsFileContent)) {
                domainAllowList.push(...domainsFileContent)
            }

        } catch (error) {
            if (error.status != "404") {
                throw new Error(
                    `Could not retrieve whitelisted email domains. Status: ${
                        error.status || 'unknown'
                    }`
                )
            }
        }
    }

    const committersAfterAllowListCheck: CommittersDetails[] = committers.filter(committer => committer && !(isUserNotInAllowList !== undefined && isUserNotInAllowList(committer)))
    return committersAfterAllowListCheck
}