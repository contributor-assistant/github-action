import * as core from '@actions/core'
import { context } from '@actions/github'
import { checkAllowList } from './checkAllowList'
import getCommitters from './graphql'
import * as input from './shared/getInputs'
import {
  ClafileContentAndSha,
  CommitterMap,
  CommittersDetails,
  ReactedCommitterMap
} from './interfaces'
import {
  createFile,
  getFileContent,
  updateFile
} from './persistence/persistence'
import prCommentSetup from './pullrequest/pullRequestComment'
import { reRunLastWorkFlowIfRequired } from './pullRerunRunner'

export async function setupClaCheck() {
  let committerMap = getInitialCommittersMap()

  let committers = await getCommitters()
  committers = await checkAllowList(committers)

  const { claFileContent, sha } = (await getCLAFileContentandSHA(
    committers,
    committerMap
  )) as ClafileContentAndSha

  committerMap = prepareCommiterMap(committers, claFileContent) as CommitterMap

  try {
    const reactedCommitters = (await prCommentSetup(
      committerMap,
      committers
    )) as ReactedCommitterMap

    if (reactedCommitters?.newSigned.length) {
      /* pushing the recently signed  contributors to the CLA Json File */
      await updateFile(sha, claFileContent, reactedCommitters)
    }
    if (
      reactedCommitters?.allSignedFlag ||
      committerMap?.notSigned === undefined ||
      committerMap.notSigned.length === 0
    ) {
      core.info(`All contributors have signed the CLA 📝 ✅ `)
      await createSuccessSummary(committerMap)
      return reRunLastWorkFlowIfRequired()
    } else {
      await createFailureSummary(committerMap)
      core.setFailed(
        `${committerMap.notSigned.length} contributor(s) need to sign the CLA: ${committerMap.notSigned.map(c => `@${c.name}`).join(', ')}`
      )
    }
  } catch (err) {
    core.info(JSON.stringify(err))
    core.setFailed(`Error: ${err.message}`)
    await createErrorSummary(err)
  }
}

async function createSuccessSummary(committerMap: CommitterMap): Promise<void> {
  const totalCount = (committerMap.signed?.length || 0) + (committerMap.notSigned?.length || 0) + (committerMap.unknown?.length || 0)

  await core.summary
    .addHeading('✅ All Contributors Signed')
    .addRaw(`All ${totalCount} contributor(s) have signed the CLA.`)
    .addBreak()
    .addTable([
      [{data: 'Contributor', header: true}, {data: 'Status', header: true}],
      ...(committerMap.signed || []).map(c => [c.name, '✅ Signed'])
    ])
    .write()
}

async function createFailureSummary(committerMap: CommitterMap): Promise<void> {
  const totalCount = (committerMap.signed?.length || 0) + committerMap.notSigned.length + (committerMap.unknown?.length || 0)
  const docUrl = input.getPathToDocument()

  await core.summary
    .addHeading('❌ CLA Signature Required')
    .addRaw(`<strong>${committerMap.notSigned.length}</strong> of <strong>${totalCount}</strong> contributors need to sign the CLA.`)
    .addBreak()
    .addHeading('Unsigned Contributors', 3)
    .addList(committerMap.notSigned.map(c => `<strong>@${c.name}</strong>${c.email ? ` (${c.email})` : ''}`))
    .addBreak()
    .addRaw(`📝 <a href="${docUrl}">View CLA Document</a>`)
    .addBreak()
    .addRaw('<strong>To sign:</strong> Comment on this PR with "I have read the CLA Document and I hereby sign the CLA"')
    .write()

  // Add annotations for each unsigned contributor
  committerMap.notSigned.forEach(c => {
    core.warning(`@${c.name}${c.email ? ` (${c.email})` : ''} has not signed the CLA`, {
      title: '📝 CLA Signature Required'
    })
  })

  // Add info about unknown users if any
  if (committerMap.unknown && committerMap.unknown.length > 0) {
    committerMap.unknown.forEach(c => {
      core.notice(`@${c.name} appears to be committing without a linked GitHub account`, {
        title: '⚠️ Unknown GitHub User'
      })
    })
  }
}

async function createErrorSummary(err: any): Promise<void> {
  await core.summary
    .addHeading('❌ CLA Check Error')
    .addRaw(`An error occurred while checking CLA signatures:`)
    .addBreak()
    .addCodeBlock(err.message || JSON.stringify(err), 'text')
    .write()
}

async function getCLAFileContentandSHA(
  committers: CommittersDetails[],
  committerMap: CommitterMap
): Promise<void | ClafileContentAndSha> {
  let result, claFileContentString, claFileContent, sha
  try {
    result = await getFileContent()
  } catch (error) {
    if (error.status === "404") {
      return createClaFileAndPRComment(committers, committerMap)
    } else {
      throw new Error(
        `Could not retrieve repository contents. Status: ${
          error.status || 'unknown'
        }`
      )
    }
  }
  sha = result?.data?.sha
  claFileContentString = Buffer.from(result.data.content, 'base64').toString()
  claFileContent = JSON.parse(claFileContentString)
  return { claFileContent, sha }
}

async function createClaFileAndPRComment(
  committers: CommittersDetails[],
  committerMap: CommitterMap
): Promise<void> {
  committerMap.notSigned = committers
  committerMap.signed = []
  committers.map(committer => {
    if (!committer.id) {
      committerMap.unknown.push(committer)
    }
  })

  const initialContent = { signedContributors: [] }
  const initialContentString = JSON.stringify(initialContent, null, 3)
  const initialContentBinary =
    Buffer.from(initialContentString).toString('base64')

  await createFile(initialContentBinary).catch(error =>
    core.setFailed(
      `Error occurred when creating the signed contributors file: ${
        error.message || error
      }. Make sure the branch where signatures are stored is NOT protected.`
    )
  )
  await prCommentSetup(committerMap, committers)
  throw new Error(
    `Committers of pull request ${context.issue.number} have to sign the CLA`
  )
}

function prepareCommiterMap(
  committers: CommittersDetails[],
  claFileContent
): CommitterMap {
  let committerMap = getInitialCommittersMap()

  committerMap.notSigned = committers.filter(
    committer =>
      !(claFileContent?.signedContributors || []).some(cla => committer.id === cla.id)
  )
  committerMap.signed = committers.filter(committer =>
    (claFileContent?.signedContributors || []).some(cla => committer.id === cla.id)
  )
  committers.map(committer => {
    if (!committer.id) {
      committerMap.unknown.push(committer)
    }
  })
  return committerMap
}

const getInitialCommittersMap = (): CommitterMap => ({
  signed: [],
  notSigned: [],
  unknown: []
})
