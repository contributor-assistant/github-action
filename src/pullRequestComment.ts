import { octokit } from './octokit'
import { context } from '@actions/github'
import signatureWithPRComment from './signatureComment'
import { commentContent } from './pullRequestCommentContent'
import {
  CommitterMap,
  ReactedCommitterMap,
  CommittersDetails
} from './interfaces'

import * as core from '@actions/core'

export default async function prComment(signed: boolean, committerMap: CommitterMap, committers: CommittersDetails[], pullRequestNo: number) {
  try {
    const prComment = await getComment()
    if (!prComment) {
      await octokit.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body: commentContent(signed, committerMap)
      })
      return
    } else if (prComment && prComment.id) {
      if (signed) {
        await octokit.issues.updateComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          comment_id: prComment.id,
          body: commentContent(signed, committerMap)
        })
      }
      const reactedCommitters: ReactedCommitterMap = (await signatureWithPRComment(committerMap, committers, pullRequestNo)) as ReactedCommitterMap
      if (reactedCommitters) {
        if (reactedCommitters.onlyCommitters) {
          reactedCommitters.allSignedFlag = prepareAllSignedCommitters(committerMap, reactedCommitters.onlyCommitters, committers)
        }
      }

      committerMap.signed!.push(...reactedCommitters.newSigned)
      committerMap.notSigned = committerMap.notSigned!.filter(
        committer =>
          !reactedCommitters.newSigned.some(
            reactedCommitter => committer.id === reactedCommitter.id
          )
      )

      await octokit.issues.updateComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        comment_id: prComment.id,
        body: commentContent(reactedCommitters.allSignedFlag, committerMap)
      })
      return reactedCommitters
    }
  } catch (error) {
    throw new Error(
      `Error occured when creating or editing the comments of the pull request: ${error.message}`)
  }
}


async function getComment() {
  try {
    const response = await octokit.issues.listComments({ owner: context.repo.owner, repo: context.repo.repo, issue_number: context.issue.number })

    //TODO: check the below regex
    return response.data.find(comment => comment.body.match(/.*CLA Assistant Lite bot.*/))
  } catch (error) {
    throw new Error(`Error occured when getting  all the comments of the pull request: ${error.message}`)
  }
}

function prepareAllSignedCommitters(committerMap: CommitterMap, signedInPrCommitters: CommittersDetails[], committers: CommittersDetails[]): boolean {
  let allSignedCommitters = [] as CommittersDetails[]
  /*
1) already signed committers in the file 2) signed committers in the PR comment
    */
  let ids = new Set(signedInPrCommitters.map(committer => committer.id))
  allSignedCommitters = [...signedInPrCommitters, ...committerMap.signed!.filter(signedCommitter => !ids.has(signedCommitter.id))]

  //checking if all the unsigned committers have reacted to the PR comment (this is needed for changing the content of the PR comment to "All committers have signed the CLA")
  let allSignedFlag: boolean = committers.every(committer => allSignedCommitters.some(reactedCommitter => committer.id === reactedCommitter.id))
  return allSignedFlag
}

