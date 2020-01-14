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
const graphql_1 = __importDefault(require("./graphql"));
const octokit_1 = __importDefault(require("./octokit"));
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const pullRequestComment_1 = __importDefault(require("./pullRequestComment"));
function prepareCommiterMap(committers, clas) {
    let committerMap = {};
    committerMap.notSigned = committers.filter(committer => !clas.signedContributors.some(cla => committer.id === cla.id));
    committerMap.signed = committers.filter(committer => clas.signedContributors.some(cla => committer.id === cla.id));
    committers.map(committer => {
        if (!committer.id) {
            committerMap.unknown.push(committer);
        }
    });
    return committerMap;
}
function updateFile(pathToClaSignatures, sha, contentBinary, branch, pullRequestNo) {
    return __awaiter(this, void 0, void 0, function* () {
        yield octokit_1.default.repos.createOrUpdateFile({
            owner: github_1.context.repo.owner,
            repo: github_1.context.repo.repo,
            path: pathToClaSignatures,
            sha: sha,
            message: `**CLA ASSISTANT ACTION** Updating file for storing signatures from Pull Request ${pullRequestNo}`,
            content: contentBinary,
            branch: branch
        });
    });
}
function createFile(pathToClaSignatures, contentBinary, branch) {
    return __awaiter(this, void 0, void 0, function* () {
        /* TODO: add dynamic  Message content  */
        let response = yield octokit_1.default.repos.createOrUpdateFile({
            owner: github_1.context.repo.owner,
            repo: github_1.context.repo.repo,
            path: pathToClaSignatures,
            message: "**CLA ASSISTANT ACTION** Creating file for storing CLA Signatures",
            content: contentBinary,
            branch: branch
        });
        return response;
    });
}
function getclas(pullRequestNo) {
    return __awaiter(this, void 0, void 0, function* () {
        let committerMap = {};
        let signed = false;
        //getting the path of the cla from the user
        let pathToClaSignatures = core.getInput("path-to-signatures");
        let branch = core.getInput("branch");
        if (!pathToClaSignatures || pathToClaSignatures == "") {
            pathToClaSignatures = "signatures/cla.json"; // default path for storing the signatures
        }
        if (!branch || branch == "") {
            branch = "master";
        }
        let result, clas, sha;
        const committers = (yield graphql_1.default());
        try {
            result = yield octokit_1.default.repos.getContents({
                owner: github_1.context.repo.owner,
                repo: github_1.context.repo.repo,
                path: pathToClaSignatures,
                ref: branch
            });
            sha = result.data.sha;
        }
        catch (error) {
            if (error.status === 404) {
                committerMap.notSigned = committers;
                committerMap.signed = [];
                committers.map(committer => {
                    if (!committer.id) {
                        committerMap.unknown.push(committer);
                    }
                });
                const initialContent = { signedContributors: [] };
                const initalContentString = JSON.stringify(initialContent, null, 2);
                const initalContentBinary = Buffer.from(initalContentString).toString("base64");
                const promise = Promise.all([
                    createFile(pathToClaSignatures, initalContentBinary, branch),
                    pullRequestComment_1.default(signed, committerMap, committers, pullRequestNo)
                ]);
                if (promise) {
                    core.setFailed(`committers of pull request ${github_1.context.issue.number}  has to sign the CLA`);
                    return;
                }
                core.setFailed("error occured when creating the signed contributors file " + error);
            }
            else {
                core.setFailed(error.message);
            }
        }
        clas = Buffer.from(result.data.content, "base64").toString();
        clas = JSON.parse(clas);
        committerMap = prepareCommiterMap(committers, clas);
        core.debug("unsigned contributors are: " +
            JSON.stringify(committerMap.notSigned, null, 2));
        core.debug("signed contributors are: " + JSON.stringify(committerMap.signed, null, 2));
        //DO NULL CHECK FOR below
        if (committerMap) {
            if (committerMap.notSigned.length === 0) {
                core.debug("null check");
                signed = true;
            }
        }
        try {
            const reactedCommitters = (yield pullRequestComment_1.default(signed, committerMap, committers, pullRequestNo));
            /* pushing the unsigned contributors to the CLA Json File */
            if (signed) {
                core.info("All committers have signed the CLA");
                return;
            }
            if (reactedCommitters) {
                if (reactedCommitters.newSigned) {
                    //reactedCommitters.newSigned.forEach((reactedCommitter) => reactedCommitter.pullRequestNo = pullRequestNo)
                    clas.signedContributors.push(...reactedCommitters.newSigned);
                    let contentString = JSON.stringify(clas, null, 2);
                    let contentBinary = Buffer.from(contentString).toString("base64");
                    yield updateFile(pathToClaSignatures, sha, contentBinary, branch, pullRequestNo);
                }
                if (reactedCommitters.allSignedFlag) {
                    core.info("All committers have signed the CLA");
                    return;
                }
            }
            /* return when there are no unsigned committers */
            if (committerMap.notSigned === undefined ||
                committerMap.notSigned.length === 0) {
                core.info("All committers have signed the CLA");
                return;
            }
            else {
                core.setFailed(`committers of Pull Request number ${github_1.context.issue.number}  has to sign the CLA`);
            }
        }
        catch (err) {
            core.setFailed(err.message);
            throw new Error("error while updating the JSON file" + err);
        }
        return clas;
    });
}
exports.getclas = getclas;
