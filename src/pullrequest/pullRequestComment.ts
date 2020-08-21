import { octokit } from '../octokit'
import { context } from '@actions/github'
import signatureWithPRComment from './signatureComment'
import { commentContent } from './pullRequestCommentContent'
import {
  CommitterMap,
  ReactedCommitterMap,
  CommittersDetails
} from '../interfaces'


export default async function prCommentSetup(signed: boolean, committerMap: CommitterMap, committers: CommittersDetails[]) {
  try {
    const claBotComment = await getComment()
    if (!claBotComment) {
      return createComment(signed, committerMap)
    } else if (claBotComment?.id) {
      if (signed) {
        await updateComment(signed, committerMap, claBotComment)
      }

      // reacted committers are contributors who have newly signed by posting the Pull Request comment
      const reactedCommitters: ReactedCommitterMap = (await signatureWithPRComment(committerMap, committers)) as ReactedCommitterMap
      if (reactedCommitters) {
        if (reactedCommitters.onlyCommitters) {
          reactedCommitters.allSignedFlag = prepareAllSignedCommitters(committerMap, reactedCommitters.onlyCommitters, committers)
        }
      }
      committerMap = prepareCommiterMap(committerMap, reactedCommitters)
      await updateComment(reactedCommitters.allSignedFlag, committerMap, claBotComment)
      return reactedCommitters
    }
  } catch (error) {
    throw new Error(
      `Error occured when creating or editing the comments of the pull request: ${error.message}`)
  }
}

async function createComment(signed: boolean, committerMap: CommitterMap): Promise<void> {
  await octokit.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    body: commentContent(signed, committerMap)
  }).catch(error => { throw new Error(`Error occured when creating a pull request comment: ${error.message}`) })
}

async function updateComment(signed: boolean, committerMap: CommitterMap, claBotComment: any): Promise<void> {
  await octokit.issues.updateComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    comment_id: claBotComment.id,
    body: commentContent(signed, committerMap)
  }).catch(error => { throw new Error(`Error occured when getting  all the comments of the pull request: ${error.message}`) })
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

function prepareCommiterMap(committerMap: CommitterMap, reactedCommitters) {
  committerMap.signed?.push(...reactedCommitters.newSigned)
  committerMap.notSigned = committerMap.notSigned!.filter(
    committer =>
      !reactedCommitters.newSigned.some(
        reactedCommitter => committer.id === reactedCommitter.id
      )
  )
  return committerMap

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

