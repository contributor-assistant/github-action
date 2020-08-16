
![build](https://github.com/cla-assistant/github-action/workflows/build/badge.svg)
# Handling CLAs with GitHub Action (Alpha)

Streamline your workflow and let this GitHub Action(a lite version of [CLA Assistant](https://github.com/cla-assistant/cla-assistant)) handle the legal side of contributions to a repository for you. CLA assistant enables contributors to sign CLAs from within a pull request. With this GitHub Action we could get rid of the need for a centrally managed database by **storing the contributor's signature data** in a decentralized way - **in the same repository's file system** or **in a remote repository**

### Features
1. decentralized data storage
1. fully integrated within github environment 
1. no User Interface is required
1. no need for permission/scope handling
1. contributors can sign the CLA by just posting a Pull Request comment
1. signatures will be stored in a file inside the repository or in a remote repository

## Configure Contributor License Agreement within two minutes 

#### 1. Add the following Workflow File to your repository in this path`.github/workflows/cla.yml`

```yml
name: "CLA Assistant"
on:
  issue_comment:
    types: [created]
  pull_request_target:
    types: [opened,closed,synchronize]
    
jobs:
  CLAssistant:
    runs-on: ubuntu-latest
    steps:
      - name: "CLA Assistant"
        if: (github.event.comment.body == 'recheckcla' || github.event.comment.body == 'I have read the CLA Document and I hereby sign the CLA') || github.event_name == 'pull_request_target'
        # Alpha Release
        uses: cla-assistant/github-action@refactor
        env: 
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PERSONAL_ACCESS_TOKEN : ${{ secrets.REMOTE_REPOSITORY_TOKEN }}
        with: 
          path-to-signatures: 'signatures/version1/cla.json'
          path-to-cla-document: 'https://github.com/cla-assistant/github-action/blob/master/SAPCLA.md'
          # branch should not be protected
          branch: 'master'
          allowlist: user1,bot*
          empty-commit-flag: false
          remote-repository-name: safebees
          remote-organization-name: ibakshay  
         #optional inputs - If the optional inputs are not given, then default values will be taken
         #create-file-commit-message: 'For example: Creating file for storing CLA Signatures'
         #signed-commit-message: 'For example: $contributorName has signed the CLA in #$pullRequestNo'
         #custom-notsigned-prcomment: 'pull request comment with Introductory message to ask new contributors to sign'
         #custom-allsigned-prcomment: 'pull request comment when everyone has signed, defaults to **CLA Assistant Lite bot** All Contributors have signed the CLA.'


```

#### 2. Pull Request event triggers CLA Workflow

CLA action workflow will be triggered on all Pull Request `opened, synchronize, closed`. 
<br/> When the CLA workflow is triggered on pull request `closed` event, it will lock the Pull Request conversation after the Pull Request merge so that the contributors cannot modify or delete the signatures (Pull Request comment) later. This feature is optional. 

#### 3. Signing the CLA
CLA workflow creates a comment on Pull Request asking contributors who have not signed  CLA to sign and also fails the pull request status check with a `failure`. The contributors are requested to sign the CLA within the pull request by copy and pasting **"I have read the CLA Document and I hereby sign the CLA"** as a Pull Request comment like below.
If the contributor has already signed the CLA, then the PR status will pass with `success`. <br/> By default, this  Action workflow will also create an empty commit with a message  **"@#contributorname# has signed the CLA"** whenever a contributor signs the CLA. 

![Screenshot 2020-02-13 at 10 24 17](https://user-images.githubusercontent.com/33329946/74420003-0ca6e780-4e4b-11ea-85a7-4ccc3f53e3d5.png)

<br/>

#### 4. Signatures stored in a JSON file

After the contributor signed a CLA, the contributor's signature with metadata will be stored in a JSON file inside the repository like below screenshot and you can specify the custom path to this file with `path-to-signatures` input in the workflow. <br/> The default path is `path-to-signatures: 'signatures/version1/cla.json'`

![Screenshot 2020-01-07 at 16 13 43](https://user-images.githubusercontent.com/33329946/71905595-c33aec80-3168-11ea-8a08-c78f13cb0dcb.png)

#### 5. Users and bots in allowlist 

If a GitHub username is included in the allowlist, they will not be required to sign a CLA. You can make use of this feature If you don't want your colleagues working in the same team/organisation to sign a CLA. And also, since there's no way for bot users (such as Dependabot or Greenkeeper) to sign a CLA, you may want to add them in `allowlist`. You can do so by adding their names in a comma separated string to the `allowlist` input in the CLA  workflow file(in this case `dependabot-preview[bot],greenkeeper[bot]`). You can also use wildcard symbol in case you want to allow all bot users something like `bot*`.

#### 6. Signatures can be additionally stored on the Ethereum Blockchain

To make the whole process more fraud resistant we grant the option to additionally store the signatures on the Ethereum Blockchain. To use this feature just set the `blockchain-storage-flag: true`. A detailed description on integrating with the Ethereum Blockchain can be found [here](https://github.com/cla-assistant/blockchain-services) - special credits and thanks goes to [@FabianRiewe](https://github.com/fabianriewe).  




### Environmental Variables :


| Name                  | Requirement | Description |
| --------------------- | ----------- | ----------- |
| `GITHUB_TOKEN`        | _required_ | Must be in the form of `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`  ,  CLA Action uses this in-built GitHub token to make the API calls for interacting with GitHub. It is built into Github Actions and does not need to be manually specified in your secrets store. [More Info](https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token)|

### Inputs Description :

| Name                  | Requirement | Description |
| --------------------- | ----------- | ----------- |
| `path-to-cla-document`     | _required_ |  provide full URL `https://<clafile>` to the Contributor License Agreement (CLA) to which the Contributor can read  before signing the CLA. It can be a file inside the repository or it can be a gist |
| `path-to-signatures`       | _optional_ |  Path to the JSON file where  all the signatures of the contributors will be stored inside the repository. Default path is  "./signatures/cla.json". |
| `branch`   | _optional_ |  Branch in which all the signatures of the contributors will be stored and Default branch is `master`  |
| `empty-commit-flag`   | _optional_ |  provide the boolean `true` or `false` so that GitHub Actions will add empty commit whenever user signs the CLA. Default is `true`  |
| `allowlist`   | _optional_ | You can specify users and bots to be [added in allowlist](https://github.com/cla-assistant/github-action#5-allowlist-users-and-bots). For example `user1,user2,bot*`  |
| `blockchain-storage-flag`     | _optional_ |  provide the boolean `true` or `false` to optionally store the Contributor's signature data in the Ethereum blockchain. Default is `false` |

This action won't work for Pull Request coming from the forks as the [GitHub Action Token](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token) does not have write access for the forks, However, the GitHub team assured in one of the [discussion](https://github.community/t5/GitHub-Actions/Github-Workflow-not-running-from-pull-request-from-forked/m-p/32979#M1325) that they will ship this feature to enable read/write access for the PRs coming from the forks. 

## License

Contributor License Agreement assistant

Copyright (c) 2020 [SAP SE](http://www.sap.com) or an SAP affiliate company. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.


Credits
=======

<p align="center">
    <img src="https://raw.githubusercontent.com/reviewninja/review.ninja/master/sap_logo.png" title="SAP" />
<p align="center">
:heart: from the GitHub team @SAP

