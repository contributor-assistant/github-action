import octokit from './octokit'
import { context } from '@actions/github'
import { CommitterMap, CommittersDetails, CommentedCommitterMap } from './interfaces'
const fetch = require("node-fetch");
import * as core from '@actions/core'
import { addEmptyCommit } from "./addEmptyCommit"

async function webhookSmartContract(newSignedCommitters: CommittersDetails[]) {
    const blockchainURL = core.getInput('blockchain-webhook-endpoint') || 'https://u9afh6n36g.execute-api.eu-central-1.amazonaws.com/dev/webhook'

    try {
        const config = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newSignedCommitters)
        }
        const res = await fetch(blockchainURL, config)
        const response = await res.json()
        core.debug("the response of the webhook is " + JSON.stringify(response))
        //const response = await res.json()
        if (response.success) {
            core.debug("the response2 of the webhook is " + JSON.stringify(response))
            //return json
            return response
        }
    } catch (error) {
        core.setFailed('The webhook post request for storing signatures in smart contract failed' + error)
    }


}
export default async function signatureWithPRComment(commentId, committerMap: CommitterMap, committers, pullRequestNo: number) {
    let blockchainFlag = core.getInput('blockchain-storage-flag')
    core.debug("the blockchainflag is " + blockchainFlag)
    let repoId = context.payload.repository!.id
    let commentedCommitterMap = {} as CommentedCommitterMap
    let prResponse = await octokit.issues.listComments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number
    })
    let listOfPRComments = [] as CommittersDetails[]
    let filteredListOfPRComments = [] as CommittersDetails[]

    //TODO: Do null check for repoID
    prResponse.data.map((prComment) => {
        listOfPRComments.push({
            name: prComment.user.login,
            id: prComment.user.id,
            comment_id: prComment.id,
            body: prComment.body.toLowerCase(),
            created_at: prComment.created_at,
            repoId: repoId,
            pullRequestNo: pullRequestNo
        })
    })

    listOfPRComments.map((comment) => {
        if (comment.body!.match(/^.*i \s*have \s*read \s*the \s*cla \s*document \s*and \s*i \s*hereby \s*sign \s*the \s*cla.*$/) && comment.name !== 'github-actions[bot]') {
            filteredListOfPRComments.push(comment)
        }
    })

    for (var i = 0; i < filteredListOfPRComments.length; i++) {
        delete filteredListOfPRComments[i].body
    }
    // //checking if the reacted committers are not the signed committers(not in the storage file) and filtering only the unsigned committers
    commentedCommitterMap.newSigned = filteredListOfPRComments.filter(commentedCommitter => committerMap.notSigned!.some(notSignedCommitter => commentedCommitter.id === notSignedCommitter.id))
    if (context.eventName === "issue_comment") {
        //Do empty commit only when the contributor signs the CLA with the PR comment and then check if the comment is from the newsigned contributor
            core.debug(JSON.stringify(context.payload.comment.user.login.id))
            if ( commentedCommitterMap.newSigned.some(contributor => contributor.id === context.payload.comment.user.login.id)) {
                core.debug("Adding empty commit for the signee")
                await addEmptyCommit()
              }
    }

    core.debug("the new commented committers(signed) are :" + JSON.stringify(commentedCommitterMap.newSigned, null, 3))
    if (blockchainFlag == 'true' && commentedCommitterMap.newSigned) {
        await webhookSmartContract(commentedCommitterMap.newSigned)
    }


    //checking if the commented users are only the contributors who has committed in the same PR (This is needed for the PR Comment and changing the status to success when all the contributors has reacted to the PR)
    commentedCommitterMap.onlyCommitters = committers.filter(committer => filteredListOfPRComments.some(commentedCommitter => committer.id == commentedCommitter.id))

    core.debug("the reacted signed committers comments are " + JSON.stringify(commentedCommitterMap.onlyCommitters, null, 3))


    return commentedCommitterMap

}