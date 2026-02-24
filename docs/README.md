# CLA Assistant Lite - Technical Documentation

Comprehensive documentation for maintaining and operating the CLA Assistant Lite GitHub Action.

## 📚 Documentation Index

### For New Maintainers (Start Here)
1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and component overview
   - Data flow diagrams
   - API integration points
   - Security architecture
   - Storage design

2. **[CONFIGURATION.md](./CONFIGURATION.md)** - Setup and deployment guide
   - Prerequisites and requirements
   - Step-by-step installation
   - Workflow configuration examples
   - Deployment scenarios
   - Troubleshooting common issues

### For Understanding Behavior
3. **[EXECUTION_PATHS.md](./EXECUTION_PATHS.md)** - Use cases and workflows
   - Complete use case matrix
   - Detailed execution flows
   - Comment interaction patterns
   - Edge cases and state transitions
   - Test PR walkthrough

4. **[ENHANCED_FEEDBACK.md](./ENHANCED_FEEDBACK.md)** - v2.7.0 feature documentation
   - Problem statement (duplicate status checks)
   - Solution design and implementation
   - Migration guide from v2.6.3
   - Testing procedures
   - Visual examples

### For Operations
5. **[MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md)** - Ongoing operations
   - Routine maintenance tasks (weekly, monthly, quarterly)
   - Monitoring metrics and alerts
   - Signature management procedures
   - Security best practices
   - Performance optimization
   - Incident response playbooks

6. **[DEBUGGING_HISTORY.md](./DEBUGGING_HISTORY.md)** - Fixes and lessons learned
   - Critical bugs fixed (February 2026 session)
   - Enhancement implementation details
   - Security alert resolutions
   - Testing infrastructure setup
   - Comprehensive lessons learned

## 🚀 Quick Start

### I Need To...

#### Deploy CLA to a New Repository
→ Read: [CONFIGURATION.md § Repository Setup](./CONFIGURATION.md#repository-setup)

#### Understand Why a PR Failed CLA Check
→ Read: [EXECUTION_PATHS.md § Path 2: Unsigned Contributors](./EXECUTION_PATHS.md#path-2-new-pull-request---contributors-need-to-sign)

#### Fix Duplicate Status Checks
→ Read: [ENHANCED_FEEDBACK.md § Migration Guide](./ENHANCED_FEEDBACK.md#migration-guide)

#### Add a Bot to Allowlist
→ Read: [CONFIGURATION.md § Wildcard Patterns](./CONFIGURATION.md#wildcard-patterns-in-allowlist)

#### Manually Add a Signature
→ Read: [MAINTENANCE_GUIDE.md § Adding Signature Manually](./MAINTENANCE_GUIDE.md#adding-signature-manually)

#### Investigate Workflow Failure
→ Read: [CONFIGURATION.md § Troubleshooting](./CONFIGURATION.md#troubleshooting)

#### Upgrade from v2.6.3 to v2.7.0
→ Read: [ENHANCED_FEEDBACK.md § Migration](./ENHANCED_FEEDBACK.md#migration-from-v263-to-v270)

#### Understand Security Best Practices
→ Read: [MAINTENANCE_GUIDE.md § Security](./MAINTENANCE_GUIDE.md#security-best-practices)

## 📊 Documentation Map

```
┌─────────────────────────────────────────────────────────────┐
│                     ARCHITECTURE.md                         │
│                  (System Design Overview)                   │
│  - Components, APIs, Data Flow, Security                   │
└───────────────┬─────────────────────────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
┌──────────────┐  ┌──────────────────┐
│CONFIGURATION │  │ EXECUTION_PATHS  │
│     .md      │  │      .md         │
│              │  │                  │
│ Setup &      │  │ Workflows &      │
│ Deploy       │  │ Use Cases        │
└──────┬───────┘  └────────┬─────────┘
       │                   │
       │     ┌─────────────┴──────────────┐
       │     │                            │
       ▼     ▼                            ▼
┌──────────────────┐           ┌──────────────────┐
│ ENHANCED_FEEDBACK│           │ DEBUGGING_HISTORY│
│      .md         │           │      .md         │
│                  │           │                  │
│ v2.7.0 Features  │           │ Fixes & Lessons  │
└─────────┬────────┘           └────────┬─────────┘
          │                             │
          └─────────────┬───────────────┘
                        │
                        ▼
             ┌──────────────────┐
             │ MAINTENANCE_GUIDE│
             │      .md         │
             │                  │
             │ Operations &     │
             │ Best Practices   │
             └──────────────────┘
```

## 🎯 Common Scenarios

### Scenario: New Organization Adopting CLA

**Path:**
1. Read: [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand the system
2. Read: [CONFIGURATION.md § Repository Setup](./CONFIGURATION.md#repository-setup) - Set up infrastructure
3. Follow: [CONFIGURATION.md § Basic Workflow](./CONFIGURATION.md#basic-workflow-recommended) - Deploy
4. Review: [MAINTENANCE_GUIDE.md § Routine Maintenance](./MAINTENANCE_GUIDE.md#routine-maintenance) - Plan operations

### Scenario: Investigating Failed PR Check

**Path:**
1. Read: [EXECUTION_PATHS.md § Use Case Matrix](./EXECUTION_PATHS.md#use-case-matrix) - Identify scenario
2. Check: [EXECUTION_PATHS.md § Path 2](./EXECUTION_PATHS.md#path-2-new-pull-request---contributors-need-to-sign) - Expected behavior
3. Review: [CONFIGURATION.md § Troubleshooting](./CONFIGURATION.md#troubleshooting) - Common issues
4. If needed: [MAINTENANCE_GUIDE.md § Incident Response](./MAINTENANCE_GUIDE.md#incident-response) - Advanced debugging

### Scenario: Upgrading to Latest Version

**Path:**
1. Read: [ENHANCED_FEEDBACK.md § Migration Guide](./ENHANCED_FEEDBACK.md#migration-guide) - Breaking changes
2. Test: [ENHANCED_FEEDBACK.md § Testing](./ENHANCED_FEEDBACK.md#testing) - Validate changes
3. Review: [DEBUGGING_HISTORY.md](./DEBUGGING_HISTORY.md) - Known issues and fixes
4. Deploy: [MAINTENANCE_GUIDE.md § Version Management](./MAINTENANCE_GUIDE.md#version-management) - Rollout strategy

### Scenario: Security Incident (Compromised Token)

**Path:**
1. Execute: [MAINTENANCE_GUIDE.md § Incident Response](./MAINTENANCE_GUIDE.md#scenario-3-pat-revokedexpired) - Immediate actions
2. Review: [MAINTENANCE_GUIDE.md § Security Best Practices](./MAINTENANCE_GUIDE.md#security-best-practices) - Prevention
3. Update: [CONFIGURATION.md § Personal Access Token](./CONFIGURATION.md#step-3-generate-personal-access-token) - Token rotation

## 🛠️ Technical Reference

### Architecture Components
- **Entry Point:** `src/main.ts` - Event routing
- **Core Logic:** `src/setupClaCheck.ts` - CLA validation orchestration
- **GraphQL Client:** `src/graphql.ts` - Fetch PR committers
- **Allowlist:** `src/checkAllowList.ts` - Pattern matching
- **Storage:** `src/persistence/persistence.ts` - signatures.json CRUD
- **PR Comments:** `src/pullrequest/pullRequestComment.ts` - Bot comments
- **Signature Parser:** `src/pullrequest/signatureComment.ts` - Extract signatures

### Key Files
| File | Purpose | Documentation |
|------|---------|---------------|
| `signatures.json` | CLA signature storage | [ARCHITECTURE.md § Storage](./ARCHITECTURE.md#storage-architecture) |
| `domains.json` | Domain allowlist | [CONFIGURATION.md § Domain Allowlist](./CONFIGURATION.md#domain-allowlist-configuration) |
| `.github/workflows/cla.yml` | Workflow definition | [CONFIGURATION.md § Workflow](./CONFIGURATION.md#workflow-configuration) |
| `action.yml` | Action metadata | [CONFIGURATION.md § Input Parameters](./CONFIGURATION.md#input-parameters-reference) |

### API Integrations
| API | Purpose | Rate Limits |
|-----|---------|--------------|
| GitHub GraphQL | Fetch PR committers | 5,000 points/hour |
| GitHub REST (Issues) | Create/update PR comments | 5,000 requests/hour |
| GitHub REST (Repos) | Read/write signatures.json | 5,000 requests/hour |
| GitHub REST (Actions) | Trigger workflow reruns | 1,000 requests/hour |

## 📈 Version History

### v2.7.0 (Feb 2026) - Enhanced Feedback
- ✅ Removed duplicate status checks
- ✅ Added rich job summaries
- ✅ Added inline PR annotations
- ⚠️ Breaking: `status-context` deprecated
- 📖 Docs: [ENHANCED_FEEDBACK.md](./ENHANCED_FEEDBACK.md)

### v2.6.3 (Previous) - Bug Fixes
- ✅ Fixed allowlist exact match bug
- ✅ Added email field to GraphQL query
- ✅ Build improvements
- 📖 Docs: [DEBUGGING_HISTORY.md § Critical Bugs](./DEBUGGING_HISTORY.md#critical-bugs-fixed)

## 🤝 Contributing to Documentation

### Adding New Documentation
1. Follow existing structure and formatting
2. Update this README with links
3. Cross-reference related sections
4. Test all code examples
5. Include visual examples where applicable

### Documentation Standards
- Use Markdown with GitHub Flavored Markdown extensions
- Include code blocks with language specifiers
- Provide real-world examples
- Reference actual PRs and commits where possible
- Keep "I Need To..." section updated

## 📞 Support

### For Users (Contributors)
- See PR comment for signing instructions
- Check [EXECUTION_PATHS.md § Comment Interactions](./EXECUTION_PATHS.md#comment-interactions) for recheck process
- Contact repository maintainers if stuck

### For Administrators
- Review [MAINTENANCE_GUIDE.md § Incident Response](./MAINTENANCE_GUIDE.md#incident-response) for emergencies
- Check [CONFIGURATION.md § Troubleshooting](./CONFIGURATION.md#troubleshooting) for common issues
- Consult [DEBUGGING_HISTORY.md](./DEBUGGING_HISTORY.md) for known problems

### For Developers
- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Review [DEBUGGING_HISTORY.md § Lessons Learned](./DEBUGGING_HISTORY.md#lessons-learned) before modifying
- Test changes using [ENHANCED_FEEDBACK.md § Testing](./ENHANCED_FEEDBACK.md#testing)

## 📝 Documentation Maintenance

**Last Updated:** February 24, 2026
**Next Review:** May 24, 2026
**Maintainer:** GitHub Copilot & rdkcentral team

**Change Log:**
- 2026-02-24: Initial comprehensive documentation created
  - All 6 main documents
  - Complete use case coverage
  - Real-world examples from testing

---

**Navigation:**
- [← Back to Main README](../README.md)
- [Architecture →](./ARCHITECTURE.md)
- [Configuration →](./CONFIGURATION.md)
- [Execution Paths →](./EXECUTION_PATHS.md)
