import getCommitters from "./graphql"
import octokit from "./octokit"
import * as core from "@actions/core"
import { context } from "@actions/github"
import prComment from "./pullRequestComment"
import { CommitterMap, CommittersDetails, ReactedCommitterMap } from "./interfaces"
const _ = require('lodash')

function isUserWhitelisted(committer) {

  const whitelistedItem: string = core.getInput("whitelist")
  const whitelistPatterns: string[] = whitelistedItem.split(',')
  //to be removed
  whitelistPatterns.forEach(function (whitelistElement) {
    core.info(whitelistElement)
  })

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

function prepareCommiterMap(committers: CommittersDetails[], clas): CommitterMap {

  let committerMap: CommitterMap = {}

  const committersAfterWhiteListCheck = committers.filter(committer =>
    committer && !(isUserWhitelisted !== undefined && isUserWhitelisted(committer.name)))
  core.info("committersAfterWhiteListCheck " + committersAfterWhiteListCheck)

  committerMap.notSigned = committers.filter(
    committer => !clas.signedContributors.some(cla => committer.id === cla.id)
  )
  committerMap.signed = committers.filter(committer =>
    clas.signedContributors.some(cla => committer.id === cla.id)
  )
  committers.map(committer => {
    if (!committer.id) {
      committerMap.unknown!.push(committer)
    }
  })
  return committerMap
}

async function updateFile(pathToClaSignatures, sha, contentBinary, branch, pullRequestNo) {
  await octokit.repos.createOrUpdateFile({
    owner: context.repo.owner,
    repo: context.repo.repo,
    path: pathToClaSignatures,
    sha: sha,
    message: `**CLA ASSISTANT ACTION** Updating file for storing signatures from Pull Request ${pullRequestNo}`,
    content: contentBinary,
    branch: branch
  })
}

async function createFile(pathToClaSignatures, contentBinary, branch): Promise<object> {
  /* TODO: add dynamic  Message content  */
  let response = await octokit.repos.createOrUpdateFile({
    owner: context.repo.owner,
    repo: context.repo.repo,
    path: pathToClaSignatures,
    message:
      "**CLA ASSISTANT ACTION** Creating file for storing CLA Signatures",
    content: contentBinary,
    branch: branch
  })
  return response
}
export async function getclas(pullRequestNo: number) {
  let committerMap = {} as CommitterMap

  let signed: boolean = false
  //getting the path of the cla from the user
  let pathToClaSignatures: string = core.getInput("path-to-signatures")
  let branch: string = core.getInput("branch")
  if (!pathToClaSignatures || pathToClaSignatures == "") {
    pathToClaSignatures = "signatures/cla.json" // default path for storing the signatures
  }
  if (!branch || branch == "") {
    branch = "master"
  }
  let result, clas, sha
  const committers = (await getCommitters()) as CommittersDetails[]
  try {
    result = await octokit.repos.getContents({
      owner: context.repo.owner,
      repo: context.repo.repo,
      path: pathToClaSignatures,
      ref: branch
    })
    sha = result.data.sha
  } catch (error) {
    if (error.status === 404) {
      committerMap.notSigned = committers
      committerMap.signed = []
      committers.map(committer => {
        if (!committer.id) {
          committerMap.unknown!.push(committer)
        }
      })

      const initialContent = { signedContributors: [] }
      const initalContentString = JSON.stringify(initialContent, null, 2)
      const initalContentBinary = Buffer.from(initalContentString).toString(
        "base64"
      )
      const promise = Promise.all([createFile(pathToClaSignatures, initalContentBinary, branch), prComment(signed, committerMap, committers, pullRequestNo)])
      if (promise) {
        core.setFailed(`committers of pull request ${context.issue.number}  has to sign the CLA`)
        return
      }
      core.setFailed("error occured when creating the signed contributors file " + error)
    } else {
      core.setFailed(error.message)
    }
  }
  clas = Buffer.from(result.data.content, "base64").toString()
  clas = JSON.parse(clas)
  committerMap = prepareCommiterMap(committers, clas) as CommitterMap
  core.debug("unsigned contributors are: " + JSON.stringify(committerMap.notSigned, null, 2))
  core.debug("signed contributors are: " + JSON.stringify(committerMap.signed, null, 2))
  //DO NULL CHECK FOR below
  if (committerMap) {
    if (committerMap.notSigned!.length === 0) {
      core.debug("null check")
      signed = true
    }
  }
  try {
    const reactedCommitters: ReactedCommitterMap = (await prComment(
      signed,
      committerMap,
      committers,
      pullRequestNo
    )) as ReactedCommitterMap
    /* pushing the unsigned contributors to the CLA Json File */
    if (signed) {
      core.info("All committers have signed the CLA")
      return
    }

    if (reactedCommitters) {
      if (reactedCommitters.newSigned) {
        //reactedCommitters.newSigned.forEach((reactedCommitter) => reactedCommitter.pullRequestNo = pullRequestNo)
        clas.signedContributors.push(...reactedCommitters.newSigned)
        let contentString = JSON.stringify(clas, null, 2)
        let contentBinary = Buffer.from(contentString).toString("base64")
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
      core.setFailed(`committers of Pull Request number ${context.issue.number}  has to sign the CLA`)
    }
  } catch (err) {
    core.setFailed(err.message)
    throw new Error("error while updating the JSON file" + err)
  }
  return clas
}
