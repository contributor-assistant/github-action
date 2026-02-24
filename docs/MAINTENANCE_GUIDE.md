# CLA Assistant Lite - Maintenance Guide

## Table of Contents
- [Routine Maintenance](#routine-maintenance)
- [Monitoring & Alerts](#monitoring--alerts)
- [Signature Management](#signature-management)
- [Security Best Practices](#security-best-practices)
- [Performance Optimization](#performance-optimization)
- [Incident Response](#incident-response)
- [Version Management](#version-management)

## Routine Maintenance

### Weekly Tasks

#### 1. Review Failed CLA Checks
**Purpose:** Identify patterns in failures, help stuck contributors

**Process:**
```bash
# List recent CLA check failures across organization
gh run list --workflow="CLA Assistant" --status failure --limit 20

# Review specific failures
gh run view RUN_ID --log

# Common issues to look for:
# - Unknown GitHub users (email not linked)
# - Bot not in allowlist
# - Signature comment typos
```

**Actions:**
- Add missing bots to allowlist
- Contact contributors with unknown GitHub users
- Update documentation if pattern emerges

#### 2. Token Expiration Check
**Purpose:** Prevent workflow failures due to expired PAT

**Process:**
1. Check PAT expiration in GitHub Settings → Developer settings
2. If < 30 days remaining: Generate new token
3. Update repository secret
4. Document token rotation

**Automation Opportunity:**
```yaml
# Add to monitoring workflow
- name: Check PAT Expiration
  run: |
    # Check token validity
    curl -H "Authorization: token ${{ secrets.CLA_ASSISTANT }}" \
      https://api.github.com/user
```

#### 3. Allowlist Review
**Purpose:** Keep allowlist current, remove deprecated bots

**Process:**
1. Review current allowlist patterns
2. Check for new bots in failed checks
3. Remove patterns for deprecated bots
4. Update workflow files

**Common Bots to Add:**
```yaml
allowlist: >
  dependabot*,
  dependabot[bot],
  renovate[bot],
  github-actions[bot],
  copilot*,
  copilot[bot],
  copilot-swe-agent[bot],
  semantic-release-bot,
  greenkeeper[bot],
  imgbot[bot],
  snyk-bot
```

### Monthly Tasks

#### 1. Signature Repository Audit
**Purpose:** Ensure data integrity, identify anomalies

**Process:**
```bash
# Clone signatures repo
git clone https://github.com/myorg/cla_signatures
cd cla_signatures

# Check file size growth
ls -lh signatures.json

# Verify JSON structure
jq . signatures.json > /dev/null && echo "Valid JSON"

# Count signatures
jq '.signedContributors | length' signatures.json

# Recent signers (last 30 days)
jq '[.signedContributors[] | select(.created_at > "'$(date -d '30 days ago' +%Y-%m-%d)'")]' signatures.json
```

**Red Flags:**
- ⚠️ Duplicate entries (same user ID multiple times)
- ⚠️ Missing required fields (name, id, created_at)
- ⚠️ Unusual spike in signatures (potential abuse)
- ⚠️ File corruption (invalid JSON)

**Remediation:**
```bash
# Backup before fixes
cp signatures.json signatures.json.backup

# Remove duplicates (keep first occurrence)
jq '.signedContributors |= unique_by(.id)' signatures.json > signatures-cleaned.json

# Verify
jq . signatures-cleaned.json

# Commit fix
mv signatures-cleaned.json signatures.json
git add signatures.json
git commit -m "chore: Remove duplicate signature entries"
git push origin main
```

#### 2. Workflow Performance Review
**Purpose:** Identify slow runs, optimize configuration

**Process:**
```bash
# Get run times for last 50 runs
gh run list --workflow="CLA Assistant" --json databaseId,conclusion,createdAt,updatedAt --limit 50 > runs.json

# Calculate average duration
jq -r '.[] | [.createdAt, .updatedAt] | @tsv' runs.json | \
  awk '{print ($2-$1)}' | \
  awk '{sum+=$1; count++} END {print sum/count " seconds"}'
```

**Expected Performance:**
- Typical run: 10-20 seconds
- Large PR (10+ contributors): 20-30 seconds
- Timeout threshold: 60 seconds

**Optimization if Slow:**
1. Check signatures.json file size (>1MB may slow parsing)
2. Review allowlist complexity (many patterns = slower)
3. Consider archiving old signatures

#### 3. Security Audit
**Purpose:** Ensure CLA workflow hasn't been compromised

**Checklist:**
- [ ] PAT scope limited to required permissions
- [ ] No unauthorized changes to workflow files
- [ ] No suspicious signatures in signatures.json
- [ ] Branch protection rules intact
- [ ] CodeQL security scanning passing

**Review Git History:**
```bash
# Check workflow file changes
git log -p -- .github/workflows/cla.yml

# Look for:
# - Unexpected version changes
# - Modified remote-organization-name (could redirect signatures)
# - Disabled security checks
```

### Quarterly Tasks

#### 1. Version Upgrade Review
**Purpose:** Stay current with security patches and features

**Process:**
1. Check for new releases:
   ```bash
   gh release list --repo rdkcentral/contributor-assistant_github-action
   ```

2. Review changelog:
   - Security fixes (⚠️ PRIORITY)
   - Bug fixes
   - New features
   - Breaking changes

3. Test in non-production environment

4. Roll out org-wide

**Example Upgrade:**
```yaml
# OLD
uses: rdkcentral/contributor-assistant_github-action@v2.6.3

# NEW (test first!)
uses: rdkcentral/contributor-assistant_github-action@v2.7.0
```

#### 2. Documentation Update
**Purpose:** Keep internal wiki/docs current

**Topics to Review:**
- CLA signing process for contributors
- Troubleshooting guide
- Allowlist procedures
- Contact information for CLA issues

#### 3. Contributor Feedback Review
**Purpose:** Improve CLA process based on user experience

**Data Sources:**
- GitHub discussions
- Support tickets
- Contributor surveys
- Failed check analysis

**Common Feedback:**
- "Signature phrase too long" → Consider custom phrase
- "Don't know how to link email" → Add to PR comment
- "Bot keeps failing" → Add to allowlist

## Monitoring & Alerts

### Key Metrics to Track

#### 1. Success Rate
**Metric:** Percentage of PRs that pass CLA check initially

**Calculation:**
```bash
# Last 100 CLA checks
gh run list --workflow="CLA Assistant" --limit 100 --json conclusion | \
  jq '[.[] | select(.conclusion == "success")] | length'
# Result: X/100 = X% success rate
```

**Good:** >80% success rate
**Concerning:** <60% success rate (indicates allowlist gaps or documentation issues)

#### 2. Time to Signature
**Metric:** Average time from PR open to all signatures collected

**Manual Tracking:**
- PR opened: Timestamp A
- Final signature: Timestamp B
- Duration: B - A

**Target:** <24 hours average

**High Duration Causes:**
- Unclear instructions
- Unknown GitHub users
- Time zone differences
- PRs opened during weekends

#### 3. Signature Volume
**Metric:** New signatures per month

**Calculation:**
```bash
# Signatures in last 30 days
jq '[.signedContributors[] | select(.created_at > "'$(date -d '30 days ago' -I)'")]  | length' signatures.json
```

**Trend Analysis:**
- Increasing: Growing contributor base ✅
- Decreasing: Fewer external contributors (investigate)
- Spike: New project onboarding or event

### Alerting Setup

#### GitHub Discussions Watching
**Setup:**
1. "Watch" signatures repository
2. Enable notifications for:
   - All activity (if low volume)
   - Issues and PRs only (if high volume)

**Purpose:** Catch signature-related discussions

#### Workflow Failure Notifications
**Setup:**
```yaml
# Add to CLA workflow
jobs:
  CLA-Lite:
    runs-on: ubuntu-latest
    steps:
      # ... existing steps

      - name: Notify on Failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: '⚠️ CLA check encountered an error. @cla-maintainers will investigate.'
            })
```

**Alternative:** Slack, email, PagerDuty integration

#### Security Alert Monitoring
**Setup:**
1. Enable Dependabot alerts for contributor-assistant repo
2. Enable CodeQL scanning
3. Review security advisories weekly

**Critical Alerts:**
- CodeQL critical/high severity
- Dependabot critical vulnerabilities
- Unauthorized workflow changes

## Signature Management

### Adding Signature Manually

**Use Case:** User unable to sign via PR comment (technical issues)

**Process:**
```bash
# Clone signatures repo
git clone https://github.com/myorg/cla_signatures
cd cla_signatures

# Get user information from GitHub
gh api users/USERNAME

# Add to signatures.json
jq '.signedContributors += [{
  "name": "username",
  "id": 12345678,
  "comment_id": 0,
  "created_at": "'$(date -Iseconds)'",
  "repoId": 0,
  "pullRequestNo": 0
}]' signatures.json > temp.json

mv temp.json signatures.json

# Commit and push
git add signatures.json
git commit -m "manual: Add CLA signature for @username (support ticket #123)"
git push origin main

# Trigger recheck on user's PR
gh pr comment PR_NUMBER --body "recheck" --repo org/repo
```

**Documentation:**
- Keep log of manual additions
- Reference support ticket or email
- Note reason (e.g., "email authentication issues")

### Removing Signature (Rare)

**Use Cases:**
- User requests removal (GDPR, privacy)
- Duplicate entry
- Fraudulent signature

**Process:**
```bash
# Backup first!
cp signatures.json signatures.json.backup.$(date +%Y%m%d)

# Remove by user ID
jq '.signedContributors |= map(select(.id != 12345678))' signatures.json > temp.json

mv temp.json signatures.json

# Verify
jq . signatures.json

# Commit with explanation
git add signatures.json
git commit -m "admin: Remove signature for @username (user request - ticket #456)"
git push origin main
```

**Legal Considerations:**
- Document removal reason
- Retain audit trail (Git history)
- Notify legal team if removing multiple

### Archiving Old Signatures

**Scenario:** signatures.json grows too large (>10MB), slowing workflow

**Strategy: Split by Year**
```bash
# Archive 2023 signatures
jq '{signedContributors: [.signedContributors[] | select(.created_at | startswith("2023"))]}' \
  signatures.json > archive/2023-signatures.json

# Keep 2024+ in main file
jq '.signedContributors |= [.[] | select(.created_at | startswith("2024") or startswith("2025") or startswith("2026"))]' \
  signatures.json > signatures-current.json

mv signatures-current.json signatures.json

git add signatures.json archive/2023-signatures.json
git commit -m "chore: Archive 2023 signatures"
git push origin main
```

**Update Workflow:**
No changes needed - archived signatures not checked

**Caveat:** Contributors who signed in 2023 may need to re-sign

## Security Best Practices

### 1. Personal Access Token Hygiene

**Do's:**
- ✅ Use fine-grained PAT limited to signatures repo
- ✅ Set expiration (90 days recommended)
- ✅ Rotate monthly or quarterly
- ✅ Document token creation in runbook
- ✅ Revoke immediately if compromised

**Don'ts:**
- ❌ Use classic PAT with broad scope
- ❌ Set "No expiration"
- ❌ Share token across multiple purposes
- ❌ Store token in plaintext (logs, notes)

### 2. Workflow Security

**pull_request_target Risks:**
- Runs with write permissions
- Accesses secrets
- Can modify repository

**Mitigation:**
- ✅ CLA Assistant does NOT check out PR code
- ✅ Only processes GitHub API data
- ✅ Input validation in action code
- ✅ CodeQL scanning enabled

**Review Checklist:**
```yaml
# SAFE ✅
- uses: rdkcentral/contributor-assistant_github-action@v2.7.0

# DANGEROUS ❌ (if used together)
- uses: rdkcentral/contributor-assistant_github-action@v2.7.0
- uses: actions/checkout@v4  # ⚠️ Checks out PR code with write permissions!
```

### 3. Dependency Management

**Strategy:**
- Pin action versions: `@v2.7.0` (not `@master`)
- Review Dependabot PRs promptly
- Test updates in non-critical repo first

**Automated Updates:**
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

### 4. Access Control

**Signatures Repository:**
- Restrict write access to 2-3 admins
- Use branch protection (require reviews)
- Enable audit log

**Action Secrets:**
- Limit secret access to required repositories
- Use environment-specific secrets if possible
- Audit secret usage quarterly

## Performance Optimization

### Reducing Workflow Run Time

#### 1. Optimize Allowlist
**Problem:** Long allowlist = slower pattern matching

**Solution A - Consolidate Patterns:**
```yaml
# ❌ SLOW (many patterns)
allowlist: bot-deploy, bot-release, bot-test, bot-prod, bot-staging

# ✅ FAST (wildcard)
allowlist: bot-*
```

**Solution B - Use Domain Allowlist:**
```yaml
# ❌ SLOW (individual users)
allowlist: alice, bob, charlie, david, eve, frank

# ✅ FAST (domain)
domain-allow-list-file: 'domains.json'
# domains.json: {"domainAllowList": ["@company.com"]}
```

#### 2. Trim Signatures File
**Problem:** Large signatures.json (>1MB) slows parsing

**Benchmarks:**
- <100KB: <1s parsing
- 1MB: ~3s parsing
- 10MB: ~15s parsing

**Solution:** Archive old signatures (see [Signature Management](#archiving-old-signatures))

#### 3. Reduce GraphQL Query Complexity
**Problem:** Large PRs (100+ commits) slow committer fetching

**Current:** Handled by action (paginated queries)

**If Still Slow:**
- Consider caching committer list (advanced)
- Exclude merge commits from check

### Workflow Concurrency

**Problem:** Multiple signature comments → multiple concurrent runs

**Solution:**
```yaml
concurrency:
  group: cla-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

**Effect:** Only latest run continues, older runs cancelled

## Incident Response

### Scenario 1: Mass Signature Loss

**Symptoms:**
- All PRs suddenly showing as unsigned
- signatures.json empty or corrupted

**Immediate Actions:**
1. **Stop the Bleeding:**
   ```yaml
   # Temporarily disable CLA workflow
   # Comment out workflow file or add:
   if: false
   ```

2. **Investigate signature.json:**
   ```bash
   git log signatures.json  # Check recent changes
   git show COMMIT:signatures.json  # View previous version
   ```

3. **Restore from Backup:**
   ```bash
   git revert BAD_COMMIT
   # OR restore from GitHub UI: History → View file → Revert
   ```

4. **Re-enable Workflow:**
   ```yaml
   # Remove if: false
   ```

5. **Post-Mortem:**
   - How did corruption happen?
   - Was it malicious? (check Git author)
   - Add preventive measures (branch protection)

### Scenario 2: Workflow Outage (GitHub Actions Down)

**Symptoms:**
- No CLA checks running
- GitHub Actions status page shows incident

**Actions:**
1. **Verify Outage:** https://www.githubstatus.com/
2. **Communicate:**
   ```markdown
   🔔 GitHub Actions is experiencing issues. CLA checks may be delayed.
   Signatures will be processed once service is restored.
   See: https://www.githubstatus.com/
   ```
3. **Wait for Resolution:** GitHub will restore
4. **Post-Outage:** Trigger rechecks on pending PRs

### Scenario 3: PAT Revoked/Expired

**Symptoms:**
```
Error: Bad credentials
HttpError: Bad credentials
```

**Actions:**
1. **Generate New Token:**
   - GitHub Settings → Developer settings → Personal access tokens
   - Scope: `repo`
   - Expiration: 90 days

2. **Update Secret:**
   ```bash
   gh secret set CLA_ASSISTANT --body "ghp_NEW_TOKEN"
   ```

3. **Trigger Rechecks:**
   ```bash
   # Comment "recheck" on recent failing PRs
   gh pr list --state open --limit 10 | \
     awk '{print $1}' | \
     xargs -I {} gh pr comment {} --body "recheck"
   ```

4. **Document:**
   - Log token rotation
   - Set calendar reminder for next rotation

### Scenario 4: False Negatives (Signed Users Showing Unsigned)

**Symptoms:**
- User signed CLA but still showing unsigned
- Signature exists in signatures.json

**Debug:**
```bash
# Check if signature recorded
jq '.signedContributors[] | select(.name == "username")' signatures.json

# Check committer details from workflow logs
gh run view RUN_ID --log | grep "username"

# Compare user IDs (must match exactly)
```

**Common Causes:**
- User ID mismatch (email vs GitHub account)
- Signature under different username
- Co-author not recognized

**Resolution:**
1. Verify GitHub user ID: `gh api users/username | jq .id`
2. Check signature entry has correct ID
3. If mismatch: Remove old signature, ask user to re-sign
4. If co-author: Verify Co-authored-by: line syntax

## Version Management

### Release Workflow

**For Maintainers of contributor-assistant_github-action:**

#### 1. Pre-Release Testing
```bash
# Test changes on feature branch
git checkout feat/new-feature

# Update version in package.json
npm version patch  # or minor, major

# Build
npm run build

# Push to test
git push origin feat/new-feature

# Test on real repository (cmf-release-app)
# Update workflow to use @feat/new-feature
```

#### 2. Merge to Master
```bash
git checkout master
git merge feat/new-feature
npm run build  # Rebuild on master
git add .
git commit -m "chore: Rebuild for release"
git push origin master
```

#### 3. Tag Release
```bash
# Create tag
git tag v2.7.0
git push origin v2.7.0

# Update major version tag (v2)
git tag -fa v2 -m "Update v2 tag to v2.7.0"
git push origin v2 --force
```

#### 4. Create GitHub Release
```bash
gh release create v2.7.0 \
  --title "v2.7.0 - Enhanced Check Run Feedback" \
  --notes "$(cat CHANGELOG.md)"
```

#### 5. Announce
- Post in GitHub Discussions
- Update documentation
- Notify major users

### User Version Pinning Strategies

**Option 1: Specific Version (Safest)**
```yaml
uses: rdkcentral/contributor-assistant_github-action@v2.7.0
```
- ✅ Predictable, no surprises
- ❌ Must manually update

**Option 2: Major Version (Recommended)**
```yaml
uses: rdkcentral/contributor-assistant_github-action@v2
```
- ✅ Gets patches and minor updates
- ✅ No breaking changes (semver)
- ⚠️ Test updates before org-wide rollout

**Option 3: Master Branch (Not Recommended)**
```yaml
uses: rdkcentral/contributor-assistant_github-action@master
```
- ✅ Always latest
- ❌ Untested changes, potential breakage
- ❌ Use only for testing/development

## Best Practices Summary

### Do's ✅
- Pin action versions for production
- Rotate PAT every 90 days
- Monitor CLA check success rates
- Archive old signatures when file grows large
- Document all manual signature additions
- Test action updates before org-wide rollout
- Use domain allowlist for corporate contributors
- Enable branch protection on signatures repo
- Review failed checks weekly
- Keep allowlist current

### Don'ts ❌
- Don't use `@master` in production
- Don't store PAT in plaintext
- Don't check out PR code in CLA workflow
- Don't manually edit signatures.json without backup
- Don't ignore security alerts
- Don't use universal wildcard `*` in allowlist
- Don't deploy updates without testing
- Don't let signatures.json grow unbounded

---

## Quick Reference

### Emergency Contacts
- CLA Workflow Owner: [Name]
- Signatures Repo Admin: [Name]
- GitHub Organization Admin: [Name]

### Key Links
- Signatures Repository: https://github.com/org/cla_signatures
- CLA Document: https://gist.github.com/...
- Action Repository: https://github.com/rdkcentral/contributor-assistant_github-action
- Support: [Team Email/Slack]

### Common Commands
```bash
# Recheck all open PRs
gh pr list --state open --json number --jq '.[].number' | \
  xargs -I {} gh pr comment {} --body "recheck"

# Count signatures
jq '.signedContributors | length' signatures.json

# Recent signatures (last 7 days)
jq '[.signedContributors[] | select(.created_at > "'$(date -d '7 days ago' -I)'")]' signatures.json

# Workflow success rate
gh run list --workflow="CLA Assistant" --limit 100 --json conclusion | \
  jq '[.[] | select(.conclusion == "success")] | length'
```

---

**Maintenance Guide Version:** 1.0
**Last Updated:** February 24, 2026
**Next Review:** May 24, 2026
