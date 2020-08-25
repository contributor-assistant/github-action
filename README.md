
![build](https://github.com/cla-assistant/github-action/workflows/build/badge.svg)
# Handling CLAs with GitHub Action (Alpha)

Streamline your workflow and let this GitHub Action(a lite version of [CLA Assistant](https://github.com/cla-assistant/cla-assistant)) handle the legal side of contributions to a repository for you. CLA assistant gitHub action enables contributors to sign CLAs from within a pull request. With this GitHub Action we could get rid of the need for a centrally managed database by **storing the contributor's signature data** in a decentralized way - **in the same repository's file system** or **in a remote repository**

### Features
1. decentralized data storage
1. fully integrated within github environment 
1. no User Interface is required
1. contributors can sign the CLA by just posting a Pull Request comment
1. signatures will be stored in a file inside the repository or in a remote repository
1. signatures can also be stored inside a private repository
1. versioning of signatures

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
        uses: cla-assistant/github-action@v2.0.1-alpha
        env: 
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # the below token should have repo scope and must be manually added by you in the repository's secret
          PERSONAL_ACCESS_TOKEN : ${{ secrets.PERSONAL_ACCESS_TOKEN }}
        with: 
          path-to-signatures: 'signatures/version1/cla.json'
          path-to-cla-document: 'https://github.com/cla-assistant/github-action/blob/master/SAPCLA.md'
          # branch should not be protected
          branch: 'master'
          allowlist: user1,bot*
          
         #below are the optional inputs - If the optional inputs are not given, then default values will be taken
          #remote-organization-name: enter the remote organization name where the signatures should be stored (Default is storing the signatures in the same repository)   
          #remote-repository-name:  enter the  remote repository name where the signatures should be stored (Default is storing the signatures in the same repository)
          #create-file-commit-message: 'For example: Creating file for storing CLA Signatures'
          #signed-commit-message: 'For example: $contributorName has signed the CLA in #$pullRequestNo'
          #custom-notsigned-prcomment: 'pull request comment with Introductory message to ask new contributors to sign'
          #custom-allsigned-prcomment: 'pull request comment when all contributors has signed, defaults to **CLA Assistant Lite bot** All Contributors have signed the CLA.'


```

#### 2. Pull Request event triggers CLA Workflow

CLA action workflow will be triggered on all Pull Request `opened, synchronize, closed`. This workflow will always run in the base repository and thats why we are making use of the [pull_request_target](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#pull_request_target) event.
<br/> When the CLA workflow is triggered on pull request `closed` event, it will lock the Pull Request conversation after the Pull Request merge so that the contributors cannot modify or delete the signatures (Pull Request comment) later. This feature is optional. 

#### 3. Signing the CLA
CLA workflow creates a comment on Pull Request asking contributors who have not signed  CLA to sign and also fails the pull request status check with a `failure`. The contributors are requested to sign the CLA within the pull request by copy and pasting **"I have read the CLA Document and I hereby sign the CLA"** as a Pull Request comment like below.
If the contributor has already signed the CLA, then the PR status will pass with `success`. <br/>

<img width="685" alt="Screen Shot 2020-08-21 at 15 07 28" src="https://user-images.githubusercontent.com/33329946/90894332-b8179280-e3c0-11ea-9700-44d31a77b857.png">

<br/>

#### 4. Signatures stored in a JSON file

After the contributor signed a CLA, the contributor's signature with metadata will be stored in a JSON file inside the repository like below screenshot and you can specify the custom path to this file with `path-to-signatures` input in the workflow. <br/> The default path is `path-to-signatures: 'signatures/version1/cla.json'`

![Screenshot 2020-01-07 at 16 13 43](https://user-images.githubusercontent.com/33329946/71905595-c33aec80-3168-11ea-8a08-c78f13cb0dcb.png)

#### 5. Users and bots in allowlist 

If a GitHub username is included in the allowlist, they will not be required to sign a CLA. You can make use of this feature If you don't want your colleagues working in the same team/organisation to sign a CLA. And also, since there's no way for bot users (such as Dependabot or Greenkeeper) to sign a CLA, you may want to add them in `allowlist`. You can do so by adding their names in a comma separated string to the `allowlist` input in the CLA  workflow file(in this case `dependabot-preview[bot],greenkeeper[bot]`). You can also use wildcard symbol in case you want to allow all bot users something like `bot*`.

### Environmental Variables :


| Name                  | Requirement | Description |
| --------------------- | ----------- | ----------- |
| `GITHUB_TOKEN`        | _required_ | Usage: `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`,  CLA Action uses this in-built GitHub token to make the API calls for interacting with GitHub. It is built into Github Actions and does not need to be manually specified in your secrets store. [More Info](https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token)|
| `PERSONAL_ACCESS_TOKEN`        | _required_ | Usage: `PERSONAL_ACCESS_TOKEN : ${{ secrets.PERSONAL_ACCESS_TOKEN}}`, you have to create a [Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) with `repo scope` and store in the repository's [secrets](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets). This token is required for consuming the  [Actions re-run API](https://docs.github.com/en/rest/reference/actions#re-run-a-workflow) to automatically re-run the last failed workflow and also for storing the signatures in a remote repository if required. |

### Inputs Description :

| Name                  | Requirement | Description | Example |
| --------------------- | ----------- | ----------- | ------- |
| `path-to-cla-document`     | _required_ |  provide full URL `https://<clafile>` to the Contributor License Agreement (CLA) to which the Contributor can read  before signing the CLA. It can be a file inside the repository or it can be a gist. | https://github.com/cla-assistant/github-action/blob/master/SAPCLA.md |
| `path-to-signatures`       | _optional_ |  Path to the JSON file where  all the signatures of the contributors will be stored inside the repository. | signatures/version1/cla.json |
| `branch`   | _optional_ |  Branch in which all the signatures of the contributors will be stored and Default branch is `master`.  | master | 
| `allowlist`   | _optional_ | You can specify users and bots to be [added in allowlist](https://github.com/cla-assistant/github-action#5-allowlist-users-and-bots).  | user1,user2,bot* | 
| `remote-repository-name`   | _optional_ | provide the remote repository name where all the signatures should be stored . | remote repository name | 
| `remote-organization-name`   | _optional_ | provide the remote organization name where all the signatures should be stored. | remote organization name | 
| `create-file-commit-message`   | _optional_ |Commit message when a new CLA file is created. | Creating file for storing CLA Signatures. |
| `signed-commit-message`   | _optional_ | Commit message when a new contributor signs the CLA in a Pull Request. |  $contributorName has signed the CLA in $pullRequestNo |
| `custom-notsigned-prcomment`   | _optional_ | Introductory Pull Request comment to ask new contributors to sign. | Thank you for your contribution and please kindly read and sign our $pathToCLADocument |
| ` custom-allsigned-prcomment`   | _optional_ | pull request comment when everyone has signed | All Contributors have signed the CLA. |

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

