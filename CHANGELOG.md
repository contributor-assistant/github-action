# Change Log
## [v2.1.1-beta](https://github.com/cla-assistant/github-action/tree/v2.1.1-beta) (2021-02-20)
**New features:**
- new beta release
**Improvements:**
- updated the Readme content

## [v2.1.0-alpha](https://github.com/cla-assistant/github-action/tree/v2.1.0-alpha) (2021-02-05)
**Improvements:**

- skip posting comment in every PR if the contributor has already signed [Issue#68](https://github.com/cla-assistant/github-action/issues/68)
## [v2.0.4-alpha](https://github.com/cla-assistant/github-action/tree/v2.0.4-alpha) (2021-02-05)
**Improvements:**
- removed unwanted logging comments

## [v2.0.3-alpha](https://github.com/cla-assistant/github-action/tree/v2.0.3-alpha) (2021-01-21)
**New features:**
- Trim the signature comment to allow dealing with new lines.  [Issue#57](https://github.com/cla-assistant/github-action/issues/57) [PullRequest#69](https://github.com/cla-assistant/github-action/pull/69) Credits: [Yahav Itzhak](https://github.com/yahavi)

## [v2.0.2-alpha](https://github.com/cla-assistant/github-action/tree/v2.0.2-alpha) (2020-10-09)
**Improvements:**
- Added description for DCO
**Fixed Bugs:**
- Fixed bug for DCO support [PullRequest#52](https://github.com/cla-assistant/github-action/pull/52)

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
