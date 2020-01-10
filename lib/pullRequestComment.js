"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const octokit_1 = __importDefault(require("./octokit"));
const core = __importStar(require("@actions/core"));
const url_1 = require("./url");
const github_1 = require("@actions/github");
const signatureComment_1 = __importDefault(require("./signatureComment"));
function getComment() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield octokit_1.default.issues.listComments({
                owner: github_1.context.repo.owner,
                repo: github_1.context.repo.repo,
                issue_number: github_1.context.issue.number
            });
            return response.data.find(comment => comment.body.match(/.*CLA Assistant Lite.*/));
        }
        catch (e) {
            core.setFailed("Error occured when getting  all the comments of the pull request: " +
                e.message);
        }
    });
}
function commentContent(signed, committerMap) {
    const labelName = {};
    if (signed) {
        labelName.current_name = "CLA signed :smiley:";
        updateLabel(signed, labelName);
        return `**CLA Assistant Lite** All committers have signed the CLA. :smiley:`;
    }
    /* TODO: Unhandled Promise Rejection  */
    labelName.current_name = "CLA Not Signed :worried:";
    //updateLabel(signed, labelName)
    let committersCount = 1;
    if (committerMap && committerMap.signed && committerMap.notSigned) {
        committersCount =
            committerMap.signed.length + committerMap.notSigned.length;
    }
    let you = committersCount > 1 ? "you all" : "you";
    let text = `**CLA Assistant Lite:** <br/>Thank you for your submission, we really appreciate it. Like many open source projects, we ask that ${you} sign our [Contributor License Agreement](${url_1.pathToCLADocument()}) before we can accept your contribution.You can sign the CLA by just  posting a Pull Request Comment same as the below format.
    ***I have read the CLA Document and I hereby sign the CLA*** <br/><br/>`;
    if (committersCount > 1 &&
        committerMap &&
        committerMap.signed &&
        committerMap.notSigned) {
        text += `**${committerMap.signed.length}** out of **${committerMap.signed
            .length +
            committerMap.notSigned.length}** committers have signed the CLA.`;
        committerMap.signed.forEach(signedCommitter => {
            text += `<br/>:white_check_mark: @${signedCommitter.name}`;
        });
        committerMap.notSigned.forEach(unsignedCommitter => {
            text += `<br/>:x: @${unsignedCommitter.name}`;
        });
        text += "<br/>";
    }
    if (committerMap && committerMap.unknown && committerMap.unknown.length > 0) {
        let seem = committerMap.unknown.length > 1 ? "seem" : "seems";
        text += `<hr/>**${committerMap.unknown.join(", ")}** ${seem} not to be a GitHub user.`;
        text +=
            " You need a GitHub account to be able to sign the CLA. If you have already a GitHub account, please [add the email address used for this commit to your account](https://help.github.com/articles/why-are-my-commits-linked-to-the-wrong-user/#commits-are-not-linked-to-any-user).<br/>";
    }
    return text;
}
function prepareAllSignedCommitters(committerMap, signedInPrCommitters, committers) {
    let allSignedCommitters = [];
    /*
      Reference: https://stackoverflow.com/questions/54134156/javascript-merge-two-arrays-of-objects-only-if-not-duplicate-based-on-specifi
      merging two arrays if not duplicate. 1) already signed committers in the file 2) signed committers in the PR comment
      */
    let ids = new Set(signedInPrCommitters.map(committer => committer.id));
    allSignedCommitters = [
        ...signedInPrCommitters,
        ...committerMap.signed.filter(signedCommitter => !ids.has(signedCommitter.id))
    ];
    core.debug("all signed committers after merging " +
        JSON.stringify(allSignedCommitters, null, 2));
    //checking if all the unsigned committers have reacted to the PR comment (this is needed for changing the content of the PR comment to "All committers have signed the CLA")
    let allSignedFlag = committers.every(committer => allSignedCommitters.some(reactedCommitter => committer.id === reactedCommitter.id));
    return allSignedFlag;
}
function prComment(signed, committerMap, committers, pullRequestNo) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const prComment = yield getComment();
            if (!prComment) {
                yield octokit_1.default.issues.createComment({
                    owner: github_1.context.repo.owner,
                    repo: github_1.context.repo.repo,
                    issue_number: github_1.context.issue.number,
                    body: commentContent(signed, committerMap)
                });
                return;
            }
            else if (prComment && prComment.id) {
                if (signed) {
                    yield octokit_1.default.issues.updateComment({
                        owner: github_1.context.repo.owner,
                        repo: github_1.context.repo.repo,
                        comment_id: prComment.id,
                        body: commentContent(signed, committerMap)
                    });
                }
                const reactedCommitters = (yield signatureComment_1.default(prComment.id, committerMap, committers, pullRequestNo));
                if (reactedCommitters) {
                    if (reactedCommitters.onlyCommitters) {
                        reactedCommitters.allSignedFlag = prepareAllSignedCommitters(committerMap, reactedCommitters.onlyCommitters, committers);
                    }
                }
                core.debug("allSignedFlag is " + reactedCommitters.allSignedFlag);
                committerMap.signed.push(...reactedCommitters.newSigned);
                committerMap.notSigned = committerMap.notSigned.filter(committer => !reactedCommitters.newSigned.some(reactedCommitter => committer.id === reactedCommitter.id));
                yield octokit_1.default.issues.updateComment({
                    owner: github_1.context.repo.owner,
                    repo: github_1.context.repo.repo,
                    comment_id: prComment.id,
                    body: commentContent(reactedCommitters.allSignedFlag, committerMap)
                });
                return reactedCommitters;
            }
        }
        catch (e) {
            core.setFailed("Error occured when creating or editing the comments of the pull request: " +
                e.message);
        }
    });
}
exports.default = prComment;
function addLabel() {
    return octokit_1.default.issues.addLabels({
        owner: github_1.context.repo.owner,
        repo: github_1.context.repo.repo,
        issue_number: github_1.context.issue.number,
        labels: ["CLA  Signed"]
    });
}
function updateLabel(signed, labelName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const getLabel = yield octokit_1.default.issues.getLabel({
                owner: github_1.context.repo.owner,
                repo: github_1.context.repo.repo,
                name: labelName.current_name
            });
            if (getLabel) {
                return;
            }
        }
        catch (error) {
            if (error.status === 404) {
                yield addLabel();
                //   if (signed) {
                //     labelName = {
                //       current_name: "CLA Not Signed",
                //       name: "CLA signed"
                //     };
                //   } else {
                //     labelName = {
                //       current_name: "CLA signed :smiley:",
                //       name: "CLA Not Signed :worried:"
                //     };
                //   }
                //   return octokit.issues.updateLabel({
                //     owner: context.repo.owner,
                //     repo: context.repo.repo,
                //     current_name: labelName.current_name,
                //     name: labelName.name
                //   });
                // }
                core.setFailed("error when creating a label :" + error);
            }
        }
    });
}
