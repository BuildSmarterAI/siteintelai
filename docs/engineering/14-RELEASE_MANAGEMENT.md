# N. Release Management

> Versioning, changelog, and rollback procedures

## Versioning Strategy

### Semantic Versioning

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]

Examples:
1.0.0        - Initial release
1.1.0        - New feature (backward compatible)
1.1.1        - Bug fix
2.0.0        - Breaking change
2.0.0-beta.1 - Pre-release
2.0.0+build.123 - Build metadata
```

### Version Increment Rules

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Breaking API change | MAJOR | 1.0.0 → 2.0.0 |
| New feature | MINOR | 1.0.0 → 1.1.0 |
| Bug fix | PATCH | 1.0.0 → 1.0.1 |
| Security fix | PATCH | 1.0.0 → 1.0.1 |
| Performance improvement | PATCH | 1.0.0 → 1.0.1 |
| Documentation | No bump | - |

### Pre-release Versions

```
alpha - Early development, unstable
beta  - Feature complete, testing
rc    - Release candidate, final testing

Examples:
2.0.0-alpha.1
2.0.0-beta.1
2.0.0-rc.1
```

---

## Release Process

### Release Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    RELEASE WORKFLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  develop ─────●─────●─────●─────●                           │
│               │     │     │     │                           │
│               │     │     │     └─── Feature complete       │
│               │     │     │                                 │
│               ▼     ▼     ▼                                 │
│  release/  ───●─────●─────●─────●                           │
│  v1.2.0       │     │     │     │                           │
│               │     │     │     └─── Ready for release      │
│               │     │     │                                 │
│               └─────┴─────┴─────┘                           │
│                                 │                           │
│                                 ▼                           │
│  main ────────●────────────────●─────●                      │
│               │                │     │                      │
│            v1.1.0           v1.2.0  Tag                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Step-by-Step Release

#### 1. Prepare Release

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# Update version
npm version 1.2.0 --no-git-tag-version

# Update CHANGELOG.md
# Add release notes for v1.2.0
```

#### 2. Release Testing

```bash
# Run full test suite
npm run lint
npm run typecheck
npm run build
npm test

# Deploy to staging
# Manual QA testing
```

#### 3. Finalize Release

```bash
# Update CHANGELOG with final notes
# Create PR to main
git push origin release/v1.2.0

# After PR approval, merge to main
git checkout main
git merge release/v1.2.0

# Tag release
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0

# Merge back to develop
git checkout develop
git merge main
git push origin develop

# Delete release branch
git branch -d release/v1.2.0
git push origin --delete release/v1.2.0
```

---

## Changelog Format

### CHANGELOG.md Template

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature description

### Changed
- Changed feature description

### Fixed
- Bug fix description

## [1.2.0] - 2025-12-04

### Added
- New QuickCheck widget with improved UX (#123)
- Hospitality Intelligence (HII) module (#145)
- PDF export functionality for reports (#156)

### Changed
- Updated design system colors for better contrast
- Improved map performance with layer caching
- Enhanced error messages for API failures

### Fixed
- Fixed login redirect loop on Safari (#134)
- Corrected feasibility score calculation (#142)
- Resolved memory leak in map component (#148)

### Security
- Updated dependencies to patch CVE-2025-xxxx
- Added input validation to prevent XSS

## [1.1.0] - 2025-11-15

### Added
- Stripe payment integration
- Credit-based subscription system
- Customer billing portal

### Changed
- Migrated to TanStack Query v5
- Updated to React 18.3

### Fixed
- Fixed parcel selection on mobile devices

## [1.0.0] - 2025-10-01

### Added
- Initial release
- Core feasibility report generation
- Multi-county parcel support (Harris, Fort Bend, Montgomery)
- FEMA flood zone integration
- Basic authentication system
```

### Changelog Categories

| Category | Description |
|----------|-------------|
| Added | New features |
| Changed | Changes to existing functionality |
| Deprecated | Features that will be removed |
| Removed | Removed features |
| Fixed | Bug fixes |
| Security | Security-related changes |

---

## Rollback Procedures

### Quick Rollback (< 5 minutes)

```bash
# Option 1: Revert commit
git revert HEAD
git push origin main
# Automatic deployment triggers

# Option 2: Deploy previous tag
git checkout v1.1.0
# Trigger manual deployment

# Option 3: Lovable rollback
# In Lovable: Use version history to restore
```

### Full Rollback Procedure

```
┌─────────────────────────────────────────────────────────────┐
│                   ROLLBACK PROCEDURE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: ASSESS                                              │
│  ├─ Confirm issue is deployment-related                      │
│  ├─ Identify affected version                                │
│  └─ Determine scope of impact                                │
│                                                              │
│  Step 2: COMMUNICATE                                         │
│  ├─ Alert team in Slack #incidents                          │
│  ├─ Update status page if needed                             │
│  └─ Notify stakeholders                                      │
│                                                              │
│  Step 3: ROLLBACK                                            │
│  ├─ Identify last known good version                         │
│  ├─ Execute rollback command                                 │
│  └─ Verify deployment succeeded                              │
│                                                              │
│  Step 4: VERIFY                                              │
│  ├─ Check application health                                 │
│  ├─ Run smoke tests                                          │
│  └─ Monitor error rates                                      │
│                                                              │
│  Step 5: DOCUMENT                                            │
│  ├─ Record incident timeline                                 │
│  ├─ Create issue for root cause                              │
│  └─ Schedule postmortem                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Database Rollback

```sql
-- Database changes require special handling

-- Option 1: Backward-compatible migrations only
-- New columns should have defaults
ALTER TABLE applications ADD COLUMN new_field TEXT DEFAULT '';

-- Option 2: Feature flags for schema changes
-- Deploy code that handles both old and new schema
-- Gradually migrate data
-- Remove old schema after verification

-- Option 3: Point-in-time recovery (last resort)
-- Contact Supabase support for PITR
-- This affects ALL data, use with caution
```

### Edge Function Rollback

```bash
# Edge functions deploy immediately
# To rollback, redeploy previous version

# Option 1: Revert and deploy
git revert <commit-hash>
supabase functions deploy <function-name>

# Option 2: Deploy from tag
git checkout v1.1.0
supabase functions deploy <function-name>
```

---

## Release Checklist

### Pre-Release Checklist

```markdown
## Release v{version} Pre-Release Checklist

### Code Quality
- [ ] All PRs merged to release branch
- [ ] No critical/high severity bugs open
- [ ] Code review completed for all changes
- [ ] No TypeScript errors
- [ ] No linting errors

### Testing
- [ ] Unit tests pass (> 80% coverage on new code)
- [ ] Integration tests pass
- [ ] Manual QA completed
- [ ] Performance testing completed
- [ ] Security scan clean

### Documentation
- [ ] CHANGELOG.md updated
- [ ] README.md updated if needed
- [ ] API documentation updated
- [ ] Migration guide (if breaking changes)

### Dependencies
- [ ] No vulnerable dependencies
- [ ] Dependencies up to date
- [ ] Lock file committed
```

### Release Day Checklist

```markdown
## Release Day Checklist

### Preparation
- [ ] Release branch merged to main
- [ ] Version tag created
- [ ] Release notes published

### Deployment
- [ ] Production build successful
- [ ] Edge functions deployed
- [ ] Database migrations applied

### Verification
- [ ] Health checks passing
- [ ] Smoke tests passing
- [ ] No error spike in monitoring
- [ ] Key flows working (login, payment, reports)

### Communication
- [ ] Team notified
- [ ] Status page updated
- [ ] Customer communication (if major release)
```

### Post-Release Checklist

```markdown
## Post-Release Checklist

### Monitoring (First 24 hours)
- [ ] Error rates normal
- [ ] Performance metrics normal
- [ ] No customer complaints
- [ ] Payment processing working

### Cleanup
- [ ] Release branch deleted
- [ ] Develop branch updated
- [ ] Jira/tickets updated
- [ ] Release retrospective scheduled
```

---

## Hotfix Process

### Hotfix Workflow

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# Make fix
# ... changes ...

# Test
npm run lint
npm run typecheck
npm run build

# Merge to main
git checkout main
git merge hotfix/critical-fix

# Tag
git tag -a v1.1.1 -m "Hotfix: critical fix"
git push origin v1.1.1

# Merge to develop
git checkout develop
git merge main

# Cleanup
git branch -d hotfix/critical-fix
```

### Hotfix Criteria

| Severity | Hotfix? | Process |
|----------|---------|---------|
| SEV1 - System down | Yes | Immediate hotfix |
| SEV2 - Major feature broken | Yes | Same-day hotfix |
| SEV3 - Degraded service | Maybe | Evaluate, may wait for next release |
| SEV4 - Minor issue | No | Regular release cycle |
