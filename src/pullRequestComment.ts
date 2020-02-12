import octokit from "./octokit";
import * as core from "@actions/core";
import { pathToCLADocument } from "./url";
import { context } from "@actions/github";
import signatureWithPRComment from "./signatureComment";
import {
  CommitterMap,
  ReactedCommitterMap,
  LabelName,
  CommittersDetails
} from "./interfaces";

async function getComment() {
  try {
    const response = await octokit.issues.listComments({ owner: context.repo.owner, repo: context.repo.repo, issue_number: context.issue.number });

    //TODO: check the below regex
    return response.data.find(comment => comment.body.match(/.*CLA Assistant Lite.*/));
  } catch (e) {
    core.setFailed("Error occured when getting  all the comments of the pull request: " + e.message);
  }
}

function commentContent(signed: boolean, committerMap: CommitterMap): string {
  const labelName = {} as LabelName;
  if (signed) {
    core.debug("all signed flag inside commentContent is" + signed)
    labelName.current_name = "CLA signed :smiley:";
    // updateLabel(signed, labelName);
    return `**CLA Assistant Lite** All committers have signed the CLA. :smiley:`;
  }
  labelName.current_name = "CLA Not Signed :worried:";
  // updateLabel(signed, labelName)
  let committersCount = 1;
  if (committerMap && committerMap.signed && committerMap.notSigned) {
    committersCount =
      committerMap.signed.length + committerMap.notSigned.length;
  }
  let you = committersCount > 1 ? "you all" : "you";
  let text = `**CLA Assistant Lite:** <br/>Thank you for your submission, we really appreciate it. Like many open-source projects, we ask that ${you} sign our [Contributor License Agreement](${pathToCLADocument()}) before we can accept your contribution. You can sign the CLA by just  posting a Pull Request Comment same as the below format.
  - - -
  ***I have read the CLA Document and I hereby sign the CLA***
  - - - `
  if (committersCount > 1 && committerMap && committerMap.signed && committerMap.notSigned) {
    text += `**${committerMap.signed.length}** out of **${committerMap.signed.length + committerMap.notSigned.length}** committers have signed the CLA.`;
    committerMap.signed.forEach(signedCommitter => { text += `<br/>:white_check_mark: @${signedCommitter.name}` })
    committerMap.notSigned.forEach(unsignedCommitter => {
      text += `<br/>:x: @${unsignedCommitter.name}`
    })
    text += "<br/>"
  }
  if (committerMap && committerMap.unknown && committerMap.unknown.length > 0) {
    let seem = committerMap.unknown.length > 1 ? "seem" : "seems"
    text += `<hr/>**${committerMap.unknown.join(
      ", "
    )}** ${seem} not to be a GitHub user.`
    text += " You need a GitHub account to be able to sign the CLA. If you have already a GitHub account, please [add the email address used for this commit to your account](https://help.github.com/articles/why-are-my-commits-linked-to-the-wrong-user/#commits-are-not-linked-to-any-user).<br/>"
  }
  return text
}

function prepareAllSignedCommitters(committerMap: CommitterMap, signedInPrCommitters: CommittersDetails[], committers: CommittersDetails[]): boolean {
  let allSignedCommitters = [] as CommittersDetails[]
  /*
    Reference: https://stackoverflow.com/questions/54134156/javascript-merge-two-arrays-of-objects-only-if-not-duplicate-based-on-specifi
    merging two arrays if not duplicate. 1) already signed committers in the file 2) signed committers in the PR comment
    */
  let ids = new Set(signedInPrCommitters.map(committer => committer.id))
  allSignedCommitters = [...signedInPrCommitters, ...committerMap.signed!.filter(signedCommitter => !ids.has(signedCommitter.id))]
  core.debug("all signed committers after merging " + JSON.stringify(allSignedCommitters, null, 2))

  //checking if all the unsigned committers have reacted to the PR comment (this is needed for changing the content of the PR comment to "All committers have signed the CLA")
  let allSignedFlag: boolean = committers.every(committer => allSignedCommitters.some(reactedCommitter => committer.id === reactedCommitter.id))
  return allSignedFlag
}

export default async function prComment(signed: boolean, committerMap: CommitterMap, committers: CommittersDetails[], pullRequestNo: number) {
  try {
    const prComment = await getComment();
    if (!prComment) {
      await octokit.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body: commentContent(signed, committerMap)
      })
      return;
    } else if (prComment && prComment.id) {
      if (signed) {
        await octokit.issues.updateComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          comment_id: prComment.id,
          body: commentContent(signed, committerMap)
        })
      }
      const reactedCommitters: ReactedCommitterMap = (await signatureWithPRComment(prComment.id, committerMap, committers, pullRequestNo)) as ReactedCommitterMap;
      if (reactedCommitters) {
        if (reactedCommitters.onlyCommitters) {
          reactedCommitters.allSignedFlag = prepareAllSignedCommitters(committerMap, reactedCommitters.onlyCommitters, committers)
        }
      }

      core.debug("allSignedFlag is " + reactedCommitters.allSignedFlag);

      committerMap.signed!.push(...reactedCommitters.newSigned);
      committerMap.notSigned = committerMap.notSigned!.filter(
        committer =>
          !reactedCommitters.newSigned.some(
            reactedCommitter => committer.id === reactedCommitter.id
          )
      );

      await octokit.issues.updateComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        comment_id: prComment.id,
        body: commentContent(reactedCommitters.allSignedFlag, committerMap)
      });
      return reactedCommitters;
    }
  } catch (e) {
    core.setFailed(
      "Error occured when creating or editing the comments of the pull request: " +
      e.message
    );
  }
}

// function addLabel() {
//   core.debug("updateLabel catch function");
//   return octokit.issues.addLabels({
//     owner: context.repo.owner,
//     repo: context.repo.repo,
//     issue_number: context.issue.number,
//     labels: ["CLA  Signed"]
//   });
// }

// async function updateLabel(signed: boolean, labelName: LabelName) {
//   try {
//     core.debug("updateLabel function");
//     const getLabel = await octokit.issues.getLabel({
//       owner: context.repo.owner,
//       repo: context.repo.repo,
//       name: labelName.current_name
//     });
//     console.log(getLabel, null, 2);
//     if (getLabel) {
//       await addLabel();
//       return;
//     }
//     await addLabel();
//   } catch (error) {
//     if (error.status === 404) {
//       core.debug("updateLabel catch function");
//       await addLabel();
//       //   if (signed) {
//       //     labelName = {
//       //       current_name: "CLA Not Signed",
//       //       name: "CLA signed"
//       //     };
//       //   } else {
//       //     labelName = {
//       //       current_name: "CLA signed :smiley:",
//       //       name: "CLA Not Signed :worried:"
//       //     };
//       //   }
//       //   return octokit.issues.updateLabel({
//       //     owner: context.repo.owner,
//       //     repo: context.repo.repo,
//       //     current_name: labelName.current_name,
//       //     name: labelName.name
//       //   });
//       // }
//       core.setFailed("error when creating a label :" + error);
//     }
//   }
// }
