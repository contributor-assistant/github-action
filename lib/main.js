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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const checkcla_1 = require("./checkcla");
const pullRequestLock_1 = require("./pullRequestLock");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pullRequestNo = github_1.context.issue.number;
            core.info("CLA Assistant GitHub Action has started");
            core.info("the PR No is " + JSON.stringify(pullRequestNo));
            if (github_1.context.payload.action === "closed") {
                return pullRequestLock_1.lockPullRequest(pullRequestNo);
            }
            else {
                yield checkcla_1.getclas(pullRequestNo);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
exports.run = run;
run();
