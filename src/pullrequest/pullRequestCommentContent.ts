import {
    CommitterMap
} from '../interfaces'

import * as input from '../shared/getInputs'

export function commentContent(signed: boolean, committerMap: CommitterMap): string {

    if (signed) {
        const line1 = input.getCustomAllSignedPrComment() || `All contributors have signed the CLA  ✍️ `
        const text = `****CLA Assistant Lite bot**** ${line1}`
        return text
    }
    let committersCount = 1

    if (committerMap && committerMap.signed && committerMap.notSigned) {
        committersCount = committerMap.signed.length + committerMap.notSigned.length

    }

    let you = committersCount > 1 ? `you all` : `you`
    let lineOne = (input.getCustomNotSignedPrComment() || '<br/>Thank you for your submission, we really appreciate it. Like many open-source projects, we ask that $you sign our [Contributor License Agreement]($pathToCLADocument) before we can accept your contribution. You can sign the CLA by just posting a Pull Request Comment same as the below format.<br/>').replace('$pathToCLADocument', input.getPathToCLADocument()).replace('$you', you)
    let text = `**CLA Assistant Lite bot:** ${lineOne} 
   - - -
   ***I have read the CLA Document and I hereby sign the CLA***
   - - - 
   `

    if (committersCount > 1 && committerMap && committerMap.signed && committerMap.notSigned) {
        text += `**${committerMap.signed.length}** out of **${committerMap.signed.length + committerMap.notSigned.length}** committers have signed the CLA.`
        committerMap.signed.forEach(signedCommitter => { text += `<br/>:white_check_mark: @${signedCommitter.name}` })
        committerMap.notSigned.forEach(unsignedCommitter => {
            text += `<br/>:x: @${unsignedCommitter.name}`
        })
        text += '<br/>'
    }

    if (committerMap && committerMap.unknown && committerMap.unknown.length > 0) {
        let seem = committerMap.unknown.length > 1 ? "seem" : "seems"
        let committerNames = committerMap.unknown.map(committer => committer.name)
        text += `**${committerNames.join(", ")}** ${seem} not to be a GitHub user.`
        text += ' You need a GitHub account to be able to sign the CLA. If you have already a GitHub account, please [add the email address used for this commit to your account](https://help.github.com/articles/why-are-my-commits-linked-to-the-wrong-user/#commits-are-not-linked-to-any-user).<br/>'
    }

    text += '<sub>You can retrigger this bot by commenting **recheckcla** in this Pull Request</sub>'
    return text
}