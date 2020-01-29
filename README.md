# Handling CLAs with GitHub Actions

We are excited to announce that we developed a CLA Assistant Github Action (a light version of CLA Assistant). With this GitHub Action we get rid of the need for a centrally managed database by **storing the contributor's signature data** in a decentralized way - **in the repository's file system plus optionally on the Ethereum Blockchain**

Feel free to test this GitHub Action and give us the feedback. 

### Features
1. decentralized data storage
1. fully integrated with github environment 
1. no UI  required
1. no need for permission/scope handling
1. contributors can sign the CLA by just posting a Pull Request comment
1. signatures will be stored in a file inside the repository plus optionally on the Ethereum Blockchain

## Configure Contributor License Agreement within two minutes 

#### 1. Add the following Workflow File to your repository in this path`.github/workflow/cla.yml`

```yml
name: "CLA Assistant"
on:
  issue_comment:
    types: [created]
  pull_request:
    types: [opened,closed,synchronize]
    
jobs:
  CLAssistant:
    runs-on: ubuntu-latest
    steps:
    - name: "CLA Assistant"
      if: (github.event.comment.body == 'recheckcla' || github.event.comment.body == 'I have read the CLA Document and I hereby sign the CLA') || github.event_name == 'pull_request'
      # Test Release
      uses: cla-assistant/github-action@v1.0.0
      env: 
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with: 
        path-to-signatures: 'signatures/version1/cla.json'
        path-To-cladocument: 'https://github.com/ibakshay/test-action-workflow/blob/master/cla.md'
        branch: 'master'
        blockchain-storage-flag: false
```

#### 2. Pull Request event triggers CLA Workflow

CLA action workflow will be triggered on all Pull Request `opened, synchronize, closed(optional) `. 
<br/> When the CLA workflow is triggered on pull request `closed` event, it will lock the Pull Request conversation after the Pull Request merge,  so that the contributors cannot modify or delete the signatures (Pull Request comment) later. This feature is optional. 

#### 3. Signing the CLA
CLA workflow  creates a comment on Pull Request asking contributors who have not signed the CLA to sign and also fails the pull request status check with a `failure`. The contributors are asked to sign the CLA within the pull request by copy and pasting **"I have read the CLA Document and I hereby sign the CLA"** as a Pull Request comment like below.
If the contributor has already signed the CLA then the PR status will pass with `success`. <br/> By default, the GitHub Action workflow will also create an empty commit with message  **"@#contributorname# has signed the CLA"** whenever a contributor signs the CLA. 

![Screenshot 2020-01-08 at 14 16 37](https://user-images.githubusercontent.com/33329946/71981019-c219c600-3221-11ea-874b-bb12107e77a9.png)

<br/>

#### 4. Signatures stored in a JSON file

After the contributor signed the CLA, the contributor's signature with metadata will be stored in a json file inside the repository like below screenshot and you can specify the custom path to this file with `path-to-signatures` input in the workflow . <br/> The default path is `path-to-signatures: 'signatures/version1/cla.json'`

![Screenshot 2020-01-07 at 16 13 43](https://user-images.githubusercontent.com/33329946/71905595-c33aec80-3168-11ea-8a08-c78f13cb0dcb.png)

#### 5. Signatures can be additionally stored on the Ethereum Blockchain

To make the whole process more fraud resistant we grant the option to additionally store the signatures on the Ethereum Blockchain. To use this feature just set the `blockchain-storage-flag: true`. It might take some minutes until the transaction is validated. After this you can view the signatures stored on the Ethereum Blockchain [here](https://fabianriewe.github.io/cla-assistant-signature-finder) - special credits and thanks goes to [@FabianRiewe](https://github.com/fabianriewe).  




### Environmental Variables :


| Name                  | Requirement | Description |
| --------------------- | ----------- | ----------- |
| `GITHUB_TOKEN`        | _required_ | Must be in the form of `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`  ,  CLA Action uses this in-built GitHub token to make the API calls for interacting with GitHub. It is built into Github Actions and does not need to be manually specified in your secrets store. [More Info](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret)|

### Inputs Description :

| Name                  | Requirement | Description |
| --------------------- | ----------- | ----------- |
| `path-To-cladocument`     | _required_ |  provide full URL `https://<clafile>` to the Contributor License Agreement (CLA) to which the Contributor can read  before signing the CLA. It can be a file inside the repository or it can be a gist |
| `blockchain-storage-flag`     | _required_ |  provide the boolean `true` or `false` to optionally store the Controbutor's signature data in the Ethereum blockchain |
| `path-to-signatures`       | _optional_ |  Path to the JSON file where  all the signatures of the contributors will be stored inside the repository. Default path is  "./signatures/cla.json". |
| `branch`   | _optional_ |  Branch in which all the signatures of the contributors will be stored and Default branch is `master`  |
| `empty-commit-flag`   | _optional_ |  provide the boolean `true` or `false` so that GitHub Actions will add empty commit whenever the user signs the CLA. Default is `true`  |

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

