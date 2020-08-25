# Change Log

## [v2.0.1-alpha](https://github.com/cla-assistant/github-action/tree/v2.0.1-alpha) (2020-08-25)

**Fixed Bugs:**
- Skip CLA comment if already commented [issue#46](https://github.com/cla-assistant/github-action/issues/46)

## [v2.0.0-alpha](https://github.com/cla-assistant/github-action/tree/v2.0.0-alpha) (2020-08-22)

**New features:**
- Support for **pull request from forked repositories** by making use of the new [pull_request_target](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#pull_request_target) event - [Issue#14](https://github.com/cla-assistant/github-action/issues/14)
- support for storing signatures in a remote repository (including private repository) [Issue#12](https://github.com/cla-assistant/github-action/issues/12)
- Added support for custom commit and CLA bot pull request comment messages: [PullRequest#33](https://github.com/cla-assistant/github-action/pull/33), Credits: [AnandChowdhary](https://github.com/AnandChowdhary)

**Improvements:**
- complete refactoring of all the files to make the bot more efficient and more readable
- updated content in README file
- Changed from using Whitelist to allow list 

**Fixed Bugs:**
- CLA check not updated to success when all the contributors have the signed the CLA [Issue#39](https://github.com/cla-assistant/github-action/issues/39)
- Unknown users comment displays [object Object] & MD Formatting [PullRequest#30](https://github.com/cla-assistant/github-action/pull/30), Credits: [mikheevm](https://github.com/mikheevm)
- Initialize CommitterMap with empty default properties [PullRequest#29](https://github.com/cla-assistant/github-action/pull/29), Credits: [mikheevm](https://github.com/mikheevm)
- Typo fix in README file, [PullRequest#10](https://github.com/cla-assistant/github-action/pull/10), Credits: [shunkakinoki](https://github.com/shunkakinoki)
