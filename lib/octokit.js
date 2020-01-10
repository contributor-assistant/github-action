"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const github_1 = require("@actions/github");
const octokit = new github_1.GitHub(process.env.GITHUB_TOKEN);
exports.default = octokit;
