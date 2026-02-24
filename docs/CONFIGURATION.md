# CLA Assistant Lite - Configuration & Deployment Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Repository Setup](#repository-setup)
- [Workflow Configuration](#workflow-configuration)
- [Input Parameters Reference](#input-parameters-reference)
- [Advanced Configuration](#advanced-configuration)
- [Deployment Scenarios](#deployment-scenarios)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Resources
1. **Signatures Repository**
   - Dedicated repository to store CLA signatures
   - Can be private or public
   - Structure: `signatures.json` file in root or subdirectory

2. **CLA Document**
   - Publicly accessible CLA text
   - Recommended: GitHub Gist or repository markdown file
   - Must have stable URL

3. **GitHub Personal Access Token**
   - Scope: `repo` (or `public_repo` for public repos only)
   - Purpose: Write access to signatures repository
   - Storage: GitHub repository secrets

### Optional Resources
1. **Domain Allowlist File** (`domains.json`)
   - Auto-approve contributors from corporate email domains
   - Example: `@mycompany.com`

2. **Custom PR Comments**
   - Customize messaging for signature requests
   - Localization support

## Repository Setup

### Step 1: Create Signatures Repository

**Option A: New Repository**
```bash
# Create new repo via GitHub UI or CLI
gh repo create myorg/cla_signatures --public

# Clone locally
git clone https://github.com/myorg/cla_signatures
cd cla_signatures

# Initialize signatures file
echo '{"signedContributors": []}' > signatures.json

# Commit and push
git add signatures.json
git commit -m "chore: Initialize CLA signatures storage"
git push origin main
```

**Option B: Existing Repository (Add File)**
```bash
cd existing-repo

# Create in subdirectory if desired
mkdir -p cla
echo '{"signedContributors": []}' > cla/signatures.json

git add cla/signatures.json
git commit -m "chore: Add CLA signatures storage"
git push origin main
```

### Step 2: Create CLA Document

**Option A: GitHub Gist (Recommended)**
1. Go to https://gist.github.com/
2. Create new gist with your CLA text
3. Name file: `CLA.md` or `CONTRIBUTOR_LICENSE_AGREEMENT.md`
4. Set visibility: Public
5. Create gist
6. Copy URL (e.g., `https://gist.github.com/username/abc123...`)

**Option B: Repository File**
```bash
# In your project repository
echo "# Contributor License Agreement
..." > CLA.md

git add CLA.md
git commit -m "docs: Add CLA document"
git push origin main

# URL will be: https://github.com/myorg/myrepo/blob/main/CLA.md
```

**CLA Template Example:**
```markdown
# Contributor License Agreement

## Introduction
Thank you for your interest in contributing to [Project Name] ("We" or "Us").

## Grant of Copyright License
You grant Us a perpetual, worldwide, non-exclusive, no-charge, royalty-free,
irrevocable copyright license to reproduce, prepare derivative works of,
publicly display, publicly perform, sublicense, and distribute Your contributions
and such derivative works.

## Grant of Patent License
You grant Us a perpetual, worldwide, non-exclusive, no-charge, royalty-free,
irrevocable patent license to make, have made, use, offer to sell, sell, import,
and otherwise transfer Your contributions.

## Representations
You represent that You are legally entitled to grant the above licenses.

## Notification
You agree to notify Us if You become aware of any facts or circumstances that
would make these representations inaccurate.

---
By commenting "I have read the CLA Document and I hereby sign the CLA" on a
Pull Request, you agree to the terms of this CLA.
```

### Step 3: Generate Personal Access Token

**GitHub UI Method:**
1. Go to Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Note: "CLA Assistant Token"
4. Expiration: 90 days or No expiration (for automation)
5. Scopes:
   - ✅ `repo` (Full control of private repositories)
   - OR ✅ `public_repo` (if signatures repo is public)
6. Generate token
7. **IMPORTANT:** Copy token immediately (won't be shown again)

**GitHub CLI Method:**
```bash
gh auth refresh -h github.com -s repo
```

### Step 4: Add Token to Repository Secrets

**For Single Repository:**
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `CLA_ASSISTANT` (or `PERSONAL_ACCESS_TOKEN`)
4. Value: Paste token from Step 3
5. Click "Add secret"

**For Organization-Wide Use:**
1. Go to Organization Settings → Secrets and variables → Actions
2. Click "New organization secret"
3. Name: `CLA_ASSISTANT_TOKEN`
4. Value: Paste token
5. Repository access:
   - "All repositories" OR
   - "Selected repositories" (choose which repos can use it)
6. Click "Add secret"

**GitHub CLI Method:**
```bash
# Repository secret
gh secret set CLA_ASSISTANT --body "ghp_your_token_here"

# Verify
gh secret list
```

### Step 5: Optional - Create Domain Allowlist

**File:** `domains.json` in signatures repository

```json
{
  "domainAllowList": [
    "@example.com",
    "@mycompany.org",
    "@corporate-email.co.uk"
  ]
}
```

**Effect:** Any contributor with email matching these domains automatically passes CLA check.

**Use Cases:**
- Corporate contributors (employees)
- Trusted partner organizations
- Internal project forks

**Security Consideration:** Only add domains you trust completely.

## Workflow Configuration

### Basic Workflow (Recommended)

**File:** `.github/workflows/cla.yml`

```yaml
name: "CLA Assistant"

on:
  issue_comment:
    types: [created]
  pull_request_target:
    types: [opened, closed, synchronize]

permissions:
  contents: read
  pull-requests: write
  actions: write
  statuses: write

jobs:
  CLA-Lite:
    runs-on: ubuntu-latest
    steps:
      - name: "CLA Check"
        if: (startsWith(github.event.comment.body, 'recheck') || startsWith(github.event.comment.body, 'I have read the CLA Document and I hereby sign the CLA')) || github.event_name == 'pull_request_target'
        uses: rdkcentral/contributor-assistant_github-action@v2.7.0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PERSONAL_ACCESS_TOKEN: ${{ secrets.CLA_ASSISTANT }}
        with:
          remote-organization-name: 'myorg'
          remote-repository-name: 'cla_signatures'
          path-to-signatures: 'signatures.json'
          path-to-document: 'https://gist.github.com/username/abc123...'
          branch: 'main'
          allowlist: dependabot*, dependabot[bot], renovate[bot]
```

**Customization Points:**
1. **Version:** `@v2.7.0` → Use specific version or `@master` for latest
2. **Secret Name:** `CLA_ASSISTANT` → Match your secret name from Step 4
3. **Organization:** `myorg` → Your organization name
4. **Signatures Repo:** `cla_signatures` → Your signatures repository name
5. **Signature File:** `signatures.json` → Path within signatures repo
6. **CLA URL:** `https://gist.github.com/...` → Your CLA document URL
7. **Branch:** `main` → Branch in signatures repo (use `main` or `master`)
8. **Allowlist:** Add bots and trusted users

### Advanced Workflow (All Features)

```yaml
name: "CLA Assistant"

on:
  issue_comment:
    types: [created]
  pull_request_target:
    types: [opened, closed, synchronize]

permissions:
  contents: read
  pull-requests: write
  actions: write
  statuses: write

jobs:
  CLA-Lite:
    runs-on: ubuntu-latest
    steps:
      - name: "CLA Check"
        if: (startsWith(github.event.comment.body, 'recheck') || startsWith(github.event.comment.body, 'I have read the CLA Document and I hereby sign the CLA')) || github.event_name == 'pull_request_target'
        uses: rdkcentral/contributor-assistant_github-action@v2.7.0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PERSONAL_ACCESS_TOKEN: ${{ secrets.CLA_ASSISTANT }}
        with:
          # Required inputs
          remote-organization-name: 'myorg'
          remote-repository-name: 'cla_signatures'
          path-to-signatures: 'signatures.json'
          path-to-document: 'https://gist.github.com/username/abc123...'
          branch: 'main'

          # Bot allowlist (wildcard patterns supported)
          allowlist: dependabot*, dependabot[bot], renovate[bot], github-actions[bot], *-bot

          # Domain-based allowlist (from domains.json)
          domain-allow-list-file: 'domains.json'

          # Custom PR comments
          custom-pr-sign-comment: 'I agree to the CLA terms'
          custom-not-signed-pr-comment: 'Thank you! Please sign our CLA: $you need to sign before we can merge.'
          custom-all-signed-pr-comment: 'All contributors are covered by the CLA! 🎉'

          # PR locking after merge
          lock-pull-request-after-merge: 'false'

          # Custom branch for signatures
          branch: 'main'
```

## Input Parameters Reference

### Required Inputs

| Parameter | Description | Example |
|-----------|-------------|---------|
| `remote-organization-name` | GitHub organization/user owning signatures repo | `'myorg'` |
| `remote-repository-name` | Signatures repository name | `'cla_signatures'` |
| `path-to-signatures` | Path to signatures.json within repo | `'signatures.json'` or `'cla/signatures.json'` |
| `path-to-document` | Public URL to CLA document | `'https://gist.github.com/...'` |
| `branch` | Branch in signatures repo | `'main'` |

### Optional Inputs

| Parameter | Description | Default | Example |
|-----------|-------------|---------|---------|
| `allowlist` | Comma-separated list of users/patterns to bypass CLA | `''` | `'dependabot*, bot-*'` |
| `domain-allow-list-file` | Path to domains.json in signatures repo | `''` | `'domains.json'` |
| `custom-pr-sign-comment` | Custom signature phrase | `'I have read the CLA Document and I hereby sign the CLA'` | `'I agree to the CLA'` |
| `custom-not-signed-pr-comment` | Custom message for unsigned contributors | (See default in action.yml) | `'Please sign our CLA'` |
| `custom-all-signed-pr-comment` | Custom message when all signed | `'All contributors have signed the CLA ✍️ ✅'` | `'CLA complete!'` |
| `lock-pull-request-after-merge` | Lock PR conversation after merge | `'false'` | `'true'` |
| `suggest-recheck` | Show "recheck" hint in PR comment | `'true'` | `'false'` |

### Deprecated Inputs (v2.7.0+)

| Parameter | Status | Action Required |
|-----------|--------|-----------------|
| `status-context` | **DEPRECATED** | Remove from workflow - no longer used |

## Advanced Configuration

### Wildcard Patterns in Allowlist

**Exact Match:**
```yaml
allowlist: copilot, dependabot, renovate
```
Matches: `copilot`, `dependabot`, `renovate` only

**Prefix Wildcard:**
```yaml
allowlist: '*-bot, *[bot]'
```
Matches: `renovate-bot`, `dependabot[bot]`, `github-actions[bot]`

**Suffix Wildcard:**
```yaml
allowlist: 'bot-*, dependabot*'
```
Matches: `bot-deploy`, `bot-release`, `dependabot`, `dependabot-preview`

**Universal (NOT RECOMMENDED):**
```yaml
allowlist: '*'
```
Matches: Everyone (defeats CLA purpose!)

### Domain Allowlist Configuration

**File:** `domains.json` in signatures repo

**Single Domain:**
```json
{
  "domainAllowList": [
    "@mycompany.com"
  ]
}
```

**Multiple Domains:**
```json
{
  "domainAllowList": [
    "@example.com",
    "@subsidiary.com",
    "@partner.org"
  ]
}
```

**Subdomains:**
```json
{
  "domainAllowList": [
    "@subdomain.example.com",
    "@example.com"
  ]
}
```

**Usage in Workflow:**
```yaml
with:
  # ... other inputs
  domain-allow-list-file: 'domains.json'
```

### Custom Signature Phrases

**Default Phrase:**
```
I have read the CLA Document and I hereby sign the CLA
```

**Custom Phrase:**
```yaml
with:
  custom-pr-sign-comment: 'I agree to the terms of the CLA'
```

**Contributors must post:**
```
I agree to the terms of the CLA
```

**Note:** Matching is case-insensitive and whitespace-tolerant.

### Localization Example

**Spanish:**
```yaml
with:
  custom-pr-sign-comment: 'He leído el documento CLA y por la presente firmo el CLA'
  custom-not-signed-pr-comment: 'Gracias por tu contribución. Por favor, firma nuestro CLA.'
  custom-all-signed-pr-comment: 'Todos los contribuyentes han firmado el CLA ✍️ ✅'
```

**French:**
```yaml
with:
  custom-pr-sign-comment: "J'ai lu le document CLA et je signe par la présente le CLA"
  custom-not-signed-pr-comment: 'Merci ! Veuillez signer notre CLA.'
  custom-all-signed-pr-comment: 'Tous les contributeurs ont signé le CLA ✍️ ✅'
```

### Lock PR After Merge

**Purpose:** Prevent further comments on merged PRs

**Configuration:**
```yaml
with:
  lock-pull-request-after-merge: 'true'
```

**Effect:**
- When PR is merged, conversation is locked
- Bot adds lock comment
- No further comments allowed

**Use Case:** High-volume repositories to reduce notification noise

## Deployment Scenarios

### Scenario 1: Single Repository

**Setup:**
1. Create signatures repo: `myorg/myrepo-cla`
2. Add workflow to `.github/workflows/cla.yml`
3. Configure with single repo signatures

**Workflow:**
```yaml
with:
  remote-organization-name: 'myorg'
  remote-repository-name: 'myrepo-cla'
  path-to-signatures: 'signatures.json'
```

**Pros:**
- Simple setup
- Dedicated CLA storage per project

**Cons:**
- Separate signatures for each repo
- User must sign CLA for each project

---

### Scenario 2: Organization-Wide CLA

**Setup:**
1. Create central signatures repo: `myorg/cla_signatures`
2. Add workflow to all project repositories
3. All projects share same signatures.json

**Workflow (Project A):**
```yaml
with:
  remote-organization-name: 'myorg'
  remote-repository-name: 'cla_signatures'
  path-to-signatures: 'signatures.json'
```

**Workflow (Project B):**
```yaml
with:
  remote-organization-name: 'myorg'
  remote-repository-name: 'cla_signatures'
  path-to-signatures: 'signatures.json'  # Same file!
```

**Pros:**
- ✅ Sign once, contribute to all projects
- ✅ Centralized signature management
- ✅ Easier audit trail

**Cons:**
- All projects must have same CLA terms

---

### Scenario 3: Multiple CLAs (Different Projects)

**Setup:**
1. Create signatures repo: `myorg/cla_signatures`
2. Use subdirectories for different CLAs

**Structure:**
```
myorg/cla_signatures/
  ├── project-a/
  │   ├── signatures.json
  │   └── CLA.md
  ├── project-b/
  │   ├── signatures.json
  │   └── CLA.md
  └── corporate/
      ├── signatures.json
      └── CLA.md
```

**Workflow (Project A):**
```yaml
with:
  remote-organization-name: 'myorg'
  remote-repository-name: 'cla_signatures'
  path-to-signatures: 'project-a/signatures.json'
  path-to-document: 'https://github.com/myorg/cla_signatures/blob/main/project-a/CLA.md'
```

**Workflow (Project B):**
```yaml
with:
  remote-organization-name: 'myorg'
  remote-repository-name: 'cla_signatures'
  path-to-signatures: 'project-b/signatures.json'
  path-to-document: 'https://github.com/myorg/cla_signatures/blob/main/project-b/CLA.md'
```

**Pros:**
- Centralized repository
- Different CLA terms per project
- Organized storage

**Cons:**
- More complex setup
- User must sign for each project

---

### Scenario 4: Corporate + Open Source

**Setup:**
1. Domain allowlist for corporate contributors
2. Standard CLA for external contributors

**Configuration:**
```yaml
with:
  remote-organization-name: 'myorg'
  remote-repository-name: 'cla_signatures'
  path-to-signatures: 'signatures.json'
  path-to-document: 'https://gist.github.com/...'
  domain-allow-list-file: 'domains.json'
  allowlist: 'dependabot*, renovate[bot]'
```

**domains.json:**
```json
{
  "domainAllowList": [
    "@mycompany.com",
    "@mycompany.co.uk"
  ]
}
```

**Effect:**
- Corporate employees: Auto-approved (domain match)
- External contributors: Must sign CLA
- Bots: Auto-approved (allowlist match)

**Pros:**
- Seamless for employees
- No CLA signature required for internal PRs
- External contributors still covered

**Use Case:** Companies with both internal and external contributions

## Branch Protection Configuration

### Step 1: Enable Branch Protection

1. Go to repository Settings → Branches
2. Click "Add rule" or edit existing rule
3. Branch name pattern: `main` (or `master`, `develop`)

### Step 2: Configure Status Checks

4. ✅ Check "Require status checks to pass before merging"
5. ✅ Check "Require branches to be up to date before merging" (optional)
6. Search for: `CLA-Lite` (or your job name from workflow)
7. Select: `CLA-Lite / Check` OR `CLA Assistant` (workflow name)
8. Save changes

**Important:**
- v2.7.0+ uses Check Runs: Status name is job name (e.g., `CLA-Lite`)
- v2.6.3 and earlier: Status name was configurable via `status-context`

### Step 3: Verify Protection

1. Create test PR
2. Check "Checks" tab
3. Verify "CLA-Lite / Check" appears
4. Verify status is required for merge

**Troubleshooting:**
- Status not appearing? Check workflow triggers (`pull_request_target`)
- Can still merge? Status may not be required in branch protection

## Troubleshooting

### Issue: CLA Check Not Running

**Symptoms:**
- Workflow doesn't trigger on PR
- No status check appears

**Checklist:**
1. ✅ Workflow file in `.github/workflows/` directory
2. ✅ Workflow file syntax valid (use YAML validator)
3. ✅ Triggers include `pull_request_target`
4. ✅ Workflow file committed to default branch (not PR branch!)
5. ✅ GitHub Actions enabled for repository

**Debug:**
```bash
# Verify workflow file exists
git ls-files .github/workflows/

# Check syntax
cat .github/workflows/cla.yml | yq eval - > /dev/null

# Trigger manually
gh workflow run cla.yml
```

---

### Issue: "Permission denied" Error

**Symptoms:**
```
Error: Resource not accessible by integration
HttpError: Resource not accessible by integration
```

**Cause:** Missing permissions in workflow

**Fix:**
```yaml
permissions:
  contents: read        # ✅ Add
  pull-requests: write  # ✅ Add
  actions: write        # ✅ Add
  statuses: write       # ✅ Add (legacy, but safe to keep)
```

---

### Issue: Cannot Write to Signatures Repository

**Symptoms:**
```
Error: Bad credentials
Error: 404 Not Found
```

**Checklist:**
1. ✅ Personal Access Token created
2. ✅ Token has `repo` scope
3. ✅ Token added to repository secrets
4. ✅ Secret name matches workflow (`CLA_ASSISTANT`)
5. ✅ Token not expired
6. ✅ Signatures repository exists
7. ✅ Repository names spelled correctly

**Debug:**
```bash
# Test token
curl -H "Authorization: token $TOKEN" \
  https://api.github.com/repos/myorg/cla_signatures

# Verify secret exists
gh secret list
```

**Fix:**
- Generate new token
- Update secret value
- Verify repository name and organization

---

### Issue: Job Summary Not Showing

**Symptoms:**
- Workflow runs successfully
- No summary in "Summary" tab

**Cause:** Summary API usage error

**Debug:**
Check workflow logs for errors:
```
Error writing summary: ...
```

**Fix:**
- Ensure using v2.7.0+
- Check for HTML syntax errors in custom comments
- Verify `core.summary.write()` completes

---

### Issue: Duplicate Status Checks

**Symptoms:**
- Two status checks: "Signature / Check" and "CLA-Lite / Check"
- One passes, one fails

**Cause:** Using v2.6.3 or earlier with `status-context` input

**Fix:**
1. Upgrade to v2.7.0+
2. Remove `status-context` input from workflow
3. Update branch protection to require "CLA-Lite / Check"

---

### Issue: Contributors Can't Sign

**Symptoms:**
- User posts signature comment
- Still shows as unsigned

**Checklist:**
1. ✅ Comment text exactly matches (check capitalization, spacing)
2. ✅ User is a contributor to the PR (author or co-author)
3. ✅ `issue_comment` trigger in workflow
4. ✅ Personal Access Token has write access

**Debug:**
- Check workflow run logs
- Look for comment parsing errors
- Verify user ID matches committer ID

---

### Issue: Unknown GitHub User

**Symptoms:**
- Annotation: "@username seems not to be a GitHub user"
- User has active GitHub account

**Cause:** Commit email not linked to GitHub account

**Solution for User:**
1. Go to GitHub Settings → Emails
2. Add commit email address
3. Verify email
4. Comment "recheck" on PR

**Alternative:**
- Rebase/amend commit with GitHub-linked email
- Force push to PR branch

---

## Migration from v2.6.3 to v2.7.0

### Step 1: Update Workflow Version
```yaml
# OLD
uses: rdkcentral/contributor-assistant_github-action@v2.6.3

# NEW
uses: rdkcentral/contributor-assistant_github-action@v2.7.0
```

### Step 2: Remove Deprecated Input
```yaml
with:
  # ... other inputs
  status-context: 'CLA Assistant'  # ❌ REMOVE THIS LINE
```

### Step 3: Update Branch Protection
1. Go to repository Settings → Branches
2. Edit branch protection rule
3. Remove old status check requirement (e.g., "CLA Assistant")
4. Add new status check: "CLA-Lite / Check" (or your job name)
5. Save changes

### Step 4: Test on Non-Critical PR
1. Create test PR with unsigned contributor
2. Verify single status check appears
3. Verify job summary renders correctly
4. Verify annotations appear on Files Changed tab
5. Test signature flow

### Step 5: Roll Out to All Repositories
- Update workflow files across organization
- Update branch protection rules
- Monitor for issues
- Communicate changes to contributors

## Next Steps

- See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- See [EXECUTION_PATHS.md](./EXECUTION_PATHS.md) for detailed workflows
- See [ENHANCED_FEEDBACK.md](./ENHANCED_FEEDBACK.md) for v2.7.0 features
- See [DEBUGGING_HISTORY.md](./DEBUGGING_HISTORY.md) for troubleshooting examples
