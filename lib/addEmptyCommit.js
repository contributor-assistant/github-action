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
const github_1 = require("@actions/github");
function addEmptyCommit() {
    return __awaiter(this, void 0, void 0, function* () {
        core.info(`Adding empty commit with the contributor name who has signed the CLA `);
        if (github_1.context.payload.comment) {
            //Do empty commit only when the contributor signs the CLA with the PR comment 
            if (github_1.context.payload.comment.body === 'I have read the CLA Document and I hereby sign the CLA') {
                try {
                    const message = ` @${github_1.context.payload.comment.user.login} has signed the CLA `;
                    const pullRequestResponse = yield octokit_1.default.pulls.get({
                        owner: github_1.context.repo.owner,
                        repo: github_1.context.repo.repo,
                        pull_number: github_1.context.payload.issue.number
                    });
                    const baseCommit = yield octokit_1.default.git.getCommit({
                        owner: github_1.context.repo.owner,
                        repo: github_1.context.repo.repo,
                        commit_sha: pullRequestResponse.data.head.sha
                    });
                    const tree = yield octokit_1.default.git.getTree({
                        owner: github_1.context.repo.owner,
                        repo: github_1.context.repo.repo,
                        tree_sha: baseCommit.data.tree.sha
                    });
                    const newCommit = yield octokit_1.default.git.createCommit({
                        owner: github_1.context.repo.owner,
                        repo: github_1.context.repo.repo,
                        message: message,
                        tree: tree.data.sha,
                        parents: [pullRequestResponse.data.head.sha]
                    });
                    return octokit_1.default.git.updateRef({
                        owner: github_1.context.repo.owner,
                        repo: github_1.context.repo.repo,
                        ref: `heads/${pullRequestResponse.data.head.ref}`,
                        sha: newCommit.data.sha
                    });
                }
                catch (e) {
                    core.error(`failed when adding empty commit  with the contributor's signature name `);
                }
            }
        }
        return;
    });
}
exports.addEmptyCommit = addEmptyCommit;
