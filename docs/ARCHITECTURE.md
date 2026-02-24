# CLA Assistant Lite - Architecture Overview

## Table of Contents
- [System Design](#system-design)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [GitHub Actions Integration](#github-actions-integration)
- [Storage Architecture](#storage-architecture)

## System Design

### Purpose
The CLA Assistant Lite bot is a GitHub Action that automates the Contributor License Agreement (CLA) signature process for pull requests. It ensures all contributors have signed the CLA before their contributions can be merged.

### Design Principles
1. **Automated Enforcement**: Blocks PRs until all contributors sign
2. **Transparent Feedback**: Rich job summaries and inline annotations
3. **Self-Service**: Contributors can sign via PR comments
4. **Persistent Storage**: Signatures stored in a separate repository
5. **Allowlist Support**: Bypass for bots, known entities, and email domains

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflow                   │
│  (pull_request_target, issue_comment triggers)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      main.ts (Entry Point)                   │
│  - Event routing (PR vs comment)                            │
│  - Error handling                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   setupClaCheck.ts (Core Logic)              │
│  1. Fetch PR committers (GraphQL)                           │
│  2. Check allowlist                                         │
│  3. Load existing signatures                                │
│  4. Prepare committer map (signed vs unsigned)              │
│  5. Handle PR comments (signature detection)                │
│  6. Update signature storage                                │
│  7. Generate job summaries                                  │
│  8. Set check status (pass/fail)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┼────────────────────┐
          │            │                    │
          ▼            ▼                    ▼
┌─────────────┐ ┌──────────────┐ ┌───────────────────┐
│  GraphQL    │ │  Allowlist   │ │  Persistence      │
│  (GitHub    │ │  Checker     │ │  (signatures.json)│
│   API)      │ │              │ │                   │
└─────────────┘ └──────────────┘ └───────────────────┘
          │            │                    │
          └────────────┼────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              PR Comment Management                           │
│  - Create/update CLA bot comment                            │
│  - Parse signature comments                                 │
│  - React with emojis                                        │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Pull Request Opened/Updated
```
PR Event (pull_request_target)
  ↓
Fetch all commit authors/committers (GraphQL API)
  ↓
Check against allowlist (name, email domain patterns)
  ↓
Load existing signatures from remote repo
  ↓
Build CommitterMap:
  - signed: Already signed contributors
  - notSigned: Contributors needing signature
  - unknown: Non-GitHub users (email-only commits)
  ↓
Create/update PR comment with signing instructions
  ↓
Generate job summary (success/failure)
  ↓
Set check status:
  - ✅ Success: All signed
  - ❌ Failure: Signatures pending
  - Add annotations for unsigned contributors
```

### 2. Contributor Signs via Comment
```
Issue Comment Event (issue_comment.created)
  ↓
Parse all PR comments for signature phrase:
  "I have read the CLA Document and I hereby sign the CLA"
  ↓
Match comment authors against unsigned committers
  ↓
Identify newly signed contributors
  ↓
Update signatures.json in remote repository
  ↓
Update PR comment to reflect new status
  ↓
If all signed:
  - Trigger workflow rerun (updates check status)
  - Update job summary to success
  ↓
If still unsigned:
  - Keep failure status
  - Update summary with remaining unsigned contributors
```

### 3. Recheck Command
```
Issue Comment: "recheck"
  ↓
Re-execute full CLA check flow
  ↓
Re-fetch committers and signatures
  ↓
Update PR comment with current status
  ↓
Generate fresh job summary
  ↓
Trigger workflow rerun if needed
```

## GitHub Actions Integration

### Triggers
The action responds to two event types:

#### pull_request_target
- **Events**: `opened`, `synchronize`, `closed`
- **Purpose**: Initial check and updates when commits are added
- **Security**: Runs in base repo context with write permissions
- **Action**: Full CLA validation

#### issue_comment
- **Events**: `created`
- **Purpose**: Process signature comments and recheck requests
- **Triggers**: Comments containing signature phrase or "recheck"
- **Action**: Update signatures, re-validate CLA status

### Permissions Required
```yaml
permissions:
  contents: read         # Read repository files
  pull-requests: write   # Comment on PRs
  actions: write         # Trigger workflow reruns
  statuses: write        # Create commit statuses (legacy)
```

### Check Run vs Status Context (IMPORTANT)

#### Current Implementation (v2.7.0+)
- **Check Runs API**: Automatic via GitHub Actions
  - Name: `CLA-Lite / Check` (from job name)
  - Rich formatting: Summaries, annotations, multi-line output
  - Modern approach, recommended by GitHub

#### Legacy Implementation (v2.6.3 and earlier)
- **Status Context API**: Manual via `repos.createCommitStatus()`
  - Name: Configurable via `status-context` input
  - Limited formatting: Single line of text
  - **DEPRECATED**: Caused duplicate status checks

⚠️ **Breaking Change in v2.7.0**: The `status-context` input is deprecated. Remove it from workflow configurations to avoid duplicate status checks.

## Storage Architecture

### Signatures Repository
Signatures are stored in a separate repository for:
- **Centralization**: One signature repo serves multiple projects
- **Auditability**: Git history tracks who signed when
- **Security**: Separate access controls from code repositories

### signatures.json Structure
```json
{
  "signedContributors": [
    {
      "name": "username",
      "id": 12345678,
      "comment_id": 987654321,
      "created_at": "2026-02-24T12:00:00Z",
      "repoId": 456789,
      "pullRequestNo": 42
    }
  ]
}
```

### domains.json (Optional)
```json
{
  "domainAllowList": [
    "@example.com",
    "@company.org"
  ]
}
```
Contributors with emails matching these domains bypass CLA requirements.

## Key Files and Responsibilities

| File | Purpose | Key Functions |
|------|---------|---------------|
| `main.ts` | Entry point | Event routing, error handling |
| `setupClaCheck.ts` | Core orchestration | Validation flow, job summaries |
| `graphql.ts` | GitHub API client | Fetch PR commit authors/committers |
| `checkAllowList.ts` | Allowlist filtering | Pattern matching for bypass rules |
| `persistence/persistence.ts` | Storage operations | CRUD for signatures.json |
| `pullrequest/pullRequestComment.ts` | PR comment manager | Create/update bot comments |
| `pullrequest/signatureComment.ts` | Signature parser | Extract signatures from comments |
| `pullRerunRunner.ts` | Workflow automation | Trigger reruns on status change |

## Security Considerations

### pull_request_target Usage
- **Risk**: Runs with write permissions in base repository context
- **Mitigation**:
  - Does NOT check out PR code (no arbitrary code execution)
  - Only processes GitHub API data
  - Validates input strictly

### Personal Access Token
- **Purpose**: Write to signatures repository
- **Scope Required**: `repo` (or `public_repo` for public repos)
- **Storage**: GitHub Secrets as `PERSONAL_ACCESS_TOKEN` or custom name
- **Best Practice**: Use fine-grained PAT limited to signatures repo

### Signature Validation
- **Comment Matching**: Case-insensitive, whitespace-tolerant regex
- **Author Verification**: Must be PR contributor (prevents signature forgery)
- **Bot Detection**: Ignores `github-actions[bot]` comments

## Next Steps
- See [EXECUTION_PATHS.md](./EXECUTION_PATHS.md) for detailed use cases
- See [ENHANCED_FEEDBACK.md](./ENHANCED_FEEDBACK.md) for v2.7.0 improvements
- See [CONFIGURATION.md](./CONFIGURATION.md) for deployment guide
