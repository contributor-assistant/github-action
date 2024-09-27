import * as octokit from './octokit'
import { context } from '@actions/github'
import { CommittersDetails } from './interfaces'
import * as core from '@actions/core'

export default async function getCommitters(): Promise<CommittersDetails[]> {
    try {
        let client = (octokit.isPersonalAccessTokenPresent()) ? octokit.getPATOctokit() : octokit.octokit
        let committers: CommittersDetails[] = []
        let desiredSignatories: CommittersDetails[] = []
        let response: any = await client.graphql(`
        query($owner:String! $name:String! $number:Int! $cursor:String!){
            organization(login: $owner) {
                membersWithRole(first: 100) {
                    edges {
                        node {
                            login
                        }
                    }
                }
            }
            repository(owner: $owner, name: $name) {
            pullRequest(number: $number) {
                commits(first: 100, after: $cursor) {
                    totalCount
                    edges {
                        node {
                            commit {
                                author {
                                    email
                                    name
                                    user {
                                        id
                                        databaseId
                                        login
                                        organizations(first: 100) {
                                            nodes {
                                                login
                                            }
                                        }
                                    }
                                }
                                committer {
                                    name
                                    user {
                                        id
                                        databaseId
                                        login
                                        organizations(first: 100) {
                                            nodes {
                                                login
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        cursor
                    }
                    pageInfo {
                        endCursor
                        hasNextPage
                    }
                }
            }
        }
    }`.replace(/ /g, ''), {
            owner: context.repo.owner,
            name: context.repo.repo,
            number: context.issue.number,
            cursor: ''
        })
        response.repository.pullRequest.commits.edges.forEach(edge => {
            core.debug(JSON.stringify(response.organization, undefined, 2))
            const committer = extractUserFromCommit(edge.node.commit)
            let user = {
                name: committer.login || committer.name,
                id: committer.databaseId || '',
                pullRequestNo: context.issue.number,
                orgLogins: committer.organizations.nodes.map(org => {
                    return org.login
                })
            }
            if (committers.length === 0 || committers.map((c) => {
                return c.name
            }).indexOf(user.name) < 0) {
                committers.push(user)
            }
        })
        desiredSignatories = committers.filter((committer) => {
            if (committer.id === 41898282) { // Filter this one out.
                return false
            }

            if (core.getInput('exemptRepoOrgMembers')) {
                // The `exemptRepoOrgMembers` input determines whether
                // we automatically "allowlist" the members of the org
                // owning the repository we are working in. If so, we
                // can filter those committers here, thus allowing them
                // to bypass the check informing them they need to sign
                // the CLA.
                let members = response.organization.membersWithRole.edges.map(edge => {
                    return edge.node.login
                })
                core.debug("Filtering based on these members:")
                core.debug(JSON.stringify(members, undefined, 2))
                core.debug("Current committer name to check for filtering:")
                return ! members.includes(committer.name) // Negate so `includes()` filters out, not in.
            }

            return true
        })
        core.debug(JSON.stringify(desiredSignatories, undefined, 2))
        return desiredSignatories
    } catch (e) {
        throw new Error(`graphql call to get the committers details failed: ${e}`)
    }
}
const extractUserFromCommit = (commit) => commit.author.user || commit.committer.user || commit.author || commit.committer
