# Testing Enhanced Check Run Feedback

This document explains how to test the enhanced feedback features on GitHub.

## Test Setup Options

### Option 1: Self-Test on This Repository ✅ (Easiest)

The `feat/enhanced-check-run-feedback` branch includes a self-testing workflow.

**Steps:**
1. Push the branch to GitHub:
   ```bash
   git push origin feat/enhanced-check-run-feedback
   ```

2. Create a test PR from this branch targeting `master`

3. The `.github/workflows/self-test-cla.yml` workflow will:
   - Build the action from the PR branch
   - Run the CLA check using the enhanced feedback code
   - Display rich job summaries and annotations

4. Observe the enhanced feedback in:
   - **Checks tab** - Job summary with formatted tables
   - **Checks tab** - Annotations/warnings for unsigned contributors
   - **PR comments** - Still works as before

**To test different scenarios:**
- **Unsigned contributor**: Create PR from a GitHub account not in signatures.json
- **All signed**: Create PR from a signed account (or sign via comment)
- **Unknown user**: Create commits with unlinked email

---

### Option 2: Test on Another rdkcentral Repo

Pick a low-traffic repo for testing (or create one):

**Steps:**
1. Push the branch:
   ```bash
   git push origin feat/enhanced-check-run-feedback
   ```

2. In the test repo, create a test branch:
   ```bash
   cd /path/to/test-repo
   git checkout -b test/enhanced-cla-feedback
   ```

3. Modify `.github/workflows/cla.yml`:
   ```yaml
   # Change the uses line in the cla.yml
   # FROM:
   uses: rdkcentral/cmf-actions/.github/workflows/cla.yml@v1

   # TO (temporarily):
   uses: rdkcentral/contributor-assistant_github-action/.github/workflows/self-test-cla.yml@feat/enhanced-check-run-feedback
   ```

4. Push and create a PR in the test repo

5. Observe enhanced feedback!

6. **Don't forget to revert** the workflow change after testing

---

### Option 3: Test via cmf-actions Workflow

Modify the central CLA workflow for controlled testing:

**Steps:**
1. Push the feature branch:
   ```bash
   git push origin feat/enhanced-check-run-feedback
   ```

2. In cmf-actions repository:
   ```bash
   cd /Users/aryan100/ws/github/rdkcentral/cmf-actions
   git checkout -b test/cla-enhanced-feedback
   ```

3. Edit `.github/workflows/cla.yml`:
   ```yaml
   # Line ~20, change:
   uses: rdkcentral/contributor-assistant_github-action@v2.6.3
   # TO:
   uses: rdkcentral/contributor-assistant_github-action@feat/enhanced-check-run-feedback
   ```

4. Push the test branch:
   ```bash
   git push origin test/cla-enhanced-feedback
   ```

5. In ANY repo using the CLA workflow, temporarily update:
   ```yaml
   # In the repo's .github/workflows/cla.yml
   uses: rdkcentral/cmf-actions/.github/workflows/cla.yml@test/cla-enhanced-feedback
   ```

6. Create a test PR in that repo

7. **Revert all changes** after testing

---

### Option 4: Create Development Tag

For more permanent testing across multiple repos:

**Steps:**
1. Create a dev tag:
   ```bash
   git checkout feat/enhanced-check-run-feedback
   git tag v2.7.0-beta.1
   git push origin v2.7.0-beta.1
   ```

2. Update cmf-actions workflow:
   ```yaml
   uses: rdkcentral/contributor-assistant_github-action@v2.7.0-beta.1
   ```

3. Test across multiple repos safely

4. When ready for production:
   ```bash
   git tag v2.7.0  # Remove beta
   git push origin v2.7.0
   ```

---

## What to Observe During Testing

### ✅ Success Case
In the **Checks tab**, you should see:
```
✅ All Contributors Signed
All X contributor(s) have signed the CLA.

| Contributor | Status    |
|-------------|-----------|
| @user1      | ✅ Signed  |
| @user2      | ✅ Signed  |
```

### ❌ Failure Case
In the **Checks tab**, you should see:
```
❌ CLA Signature Required
2 of 3 contributors need to sign the CLA.

### Unsigned Contributors
• **@user1** (email@example.com)
• **@user2**

📝 View CLA Document
To sign: Comment on this PR with "I have read the CLA Document and I hereby sign the CLA"
```

Plus **annotations** visible as warnings.

### 🔴 No More Duplicate Status Checks
- Before: Both "Check" (from workflow) AND "Signature / Check" (from status API)
- After: Only "CLA-Lite / Check" or similar (single check)

---

## Recommended Testing Flow

1. **Self-test first** (Option 1) - validates the code works
2. **Test on a quiet repo** (Option 2) - validates real-world usage
3. **Create beta tag** (Option 4) - for extended testing
4. **Deploy to production** - tag as v2.7.0 or v3.0.0

---

## Rollback Plan

If issues are found:

1. **Immediate**: Revert workflow changes in affected repos
2. **Quick fix**: Point back to `@v2.6.3` (current stable)
3. **Investigation**: Check workflow logs for error details
4. **Fix and retest**: Update branch, re-test, then redeploy
