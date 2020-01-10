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
function lockPullRequest(pullRequestNo) {
    return __awaiter(this, void 0, void 0, function* () {
        core.info('Locking the Pull Request to safe guard the Pull Request CLA Signatures');
        try {
            yield octokit_1.default.issues.lock({
                owner: github_1.context.repo.owner,
                repo: github_1.context.repo.repo,
                issue_number: pullRequestNo
            });
            core.info(`successfully locked the pull request ${pullRequestNo}`);
        }
        catch (e) {
            core.error(`failed when locking the pull request `);
        }
    });
}
exports.lockPullRequest = lockPullRequest;
