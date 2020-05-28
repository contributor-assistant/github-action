import getCommittersGraphQL from "./graphql"
import octokit from "./octokit"
import * as core from "@actions/core"
import { context } from "@actions/github"
import prComment from "./pullRequestComment"
import { CommitterMap, CommittersDetails, ReactedCommitterMap } from "./interfaces"
import { filterWhitelistedCommitters } from "./checkWhiteList"
const _ = require('lodash')

export async function startClaCheck() {
  const pullRequestNo: number = context.issue.number
  let committerMap = {} as CommitterMap
  let signed: boolean = false
  let pathToClaSignatures: string = core.getInput("path-to-signatures")
  let branch: string = core.getInput("branch")
  let repoContent, clas, sha
  let signatureFilePresent = true
  let committers = (await getCommitters()) as CommittersDetails[]
  committers = filterWhitelistedCommitters(committers)
  try {
    repoContent = await getRepoContents()
    sha = repoContent.data.sha
  } catch (error) {
    if (error.status === 404) {
      committerMap = prepareContributorMap(committers, null, signatureFilePresent = false) as CommitterMap
      await Promise.all([
        createFile(),
        prComment(signed, committerMap, committers, pullRequestNo),
      ])
      core.setFailed(`Committers of pull request ${context.issue.number} have to sign the CLA`)
    } else {
      core.setFailed(`Could not retrieve repository contents: ${error.message}. Status: ${error.status || 'unknown'}`);
    }
    //TODO.  return statement needed ?
    return
  }
  let claFileContent = Buffer.from(repoContent.data.content, "base64").toString()
  claFileContent = JSON.parse(claFileContent)
  core.debug(`the signatures contributores are ${JSON.stringify(claFileContent, null, 2)}`)
  committerMap = prepareContributorMap(committers, claFileContent, signatureFilePresent) as CommitterMap
  core.debug(`commiterMap:  ${JSON.stringify(committerMap, null, 2)}`)
  //DO NULL CHECK FOR below
  if (committerMap && committerMap.notSigned && committerMap.notSigned.length === 0) {
    core.debug("null check")
    signed = true
  }
  try {
    const reactedCommitters: ReactedCommitterMap = (await prComment(signed, committerMap, committers, pullRequestNo)) as ReactedCommitterMap
    if (signed) {
      core.info("All committers have signed the CLA")
      return
    }
    if (reactedCommitters) {
      if (reactedCommitters.newSigned) {
        clas.signedContributors.push(...reactedCommitters.newSigned)
        let contentString = JSON.stringify(clas, null, 2)
        let contentBinary = Buffer.from(contentString).toString("base64")
        /* pushing the recently signed  contributors to the CLA Json File */
        await updateFile(pathToClaSignatures, sha, contentBinary, branch, pullRequestNo)
      }
      if (reactedCommitters.allSignedFlag) {
        core.info("All committers have signed the CLA")
        return
      }
    }

    /* return when there are no unsigned committers */
    if (committerMap.notSigned === undefined || committerMap.notSigned.length === 0) {
      core.info("All committers have signed the CLA")
      return
    } else {
      core.setFailed(`committers of Pull Request number ${context.issue.number} have to sign the CLA`)
    }
  } catch (err) {
    core.setFailed(`Could not update the JSON file: ${err.message}`)
    throw new Error("error while updating the JSON file" + err)
  }
  return clas
}

async function getCommitters() {
  let committers = (await getCommittersGraphQL()) as CommittersDetails[]
  return committers
}

function prepareContributorMap(committers: CommittersDetails[], claFileContent, signatureFilePresent): CommitterMap {

  let contributorMap: CommitterMap = {}
  if (signatureFilePresent === false) {
    contributorMap.notSigned = committers
    contributorMap.signed = []
    committers.map(committer => {
      if (!committer.id && contributorMap.unknown) {
        contributorMap.unknown.push(committer)
      }
    })

  }
  else if (signatureFilePresent === true) {
    core.debug(`the signatures contributores are ${JSON.stringify(claFileContent, null, 2)}`)
    contributorMap.notSigned = committers.filter(
      committer => !claFileContent.signedContributors.some(cla => committer.id === cla.id)
    )
    contributorMap.signed = committers.filter(committer =>
      claFileContent.signedContributors.some(cla => committer.id === cla.id)
    )
    committers.map(committer => {
      if (!committer.id) {
        contributorMap.unknown!.push(committer)
      }
    })
  }
  return contributorMap
}
//TODO: refactor the commit message when a project admin does recheck PR
async function updateFile(pathToClaSignatures, sha, contentBinary, branch, pullRequestNo) {
  try {
    await octokit.repos.createOrUpdateFile({
      owner: context.repo.owner,
      repo: context.repo.repo,
      path: pathToClaSignatures,
      sha: sha,
      message: `@${context.actor} has signed the CLA from Pull Request ${pullRequestNo}`,
      content: contentBinary,
      branch: branch
    })
  } catch (error) {
    core.setFailed(
      `Error occurred when creating the signed contributors file: ${error.message || error}. Make sure the branch where signatures are stored is NOT protected.`)
  }
}

async function createFile() {
  let pathToClaSignatures: string = core.getInput("path-to-signatures")
  let branch: string = core.getInput("branch")
  const initialContent = { signedContributors: [] }
  const initialContentString = JSON.stringify(initialContent, null, 2)
  const initialContentBinary = Buffer.from(initialContentString).toString("base64")
  let result
  try {
    await octokit.repos.createOrUpdateFile({
      owner: context.repo.owner,
      repo: context.repo.repo,
      path: pathToClaSignatures,
      message:
        "Creating file for storing CLA Signatures",
      content: initialContentBinary,
      branch: branch
    })
  } catch (error) {
    core.setFailed(
      `Error occurred when creating the signed contributors file: ${error.message || error}. Make sure the branch where signatures are stored is NOT protected.`)
  }
}

async function getRepoContents() {
  let pathToClaSignatures: string = core.getInput("path-to-signatures")
  let branch: string = core.getInput("branch")
  return octokit.repos.getContents({
    owner: context.repo.owner,
    repo: context.repo.repo,
    path: pathToClaSignatures,
    ref: branch
  })

}




  //if (!pathToClaSignatures || pathToClaSignatures == "") {
  //  pathToClaSignatures = "signatures/cla.json" // default path for storing the signatures
  //}
  //if (!branch || branch == "") {
  // branch = "master"
  //}