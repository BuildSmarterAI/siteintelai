# K. GitHub Governance

> Branching model, CODEOWNERS, commit conventions

## Branching Strategy

### Git Flow Model

```
┌─────────────────────────────────────────────────────────────┐
│                    BRANCHING MODEL                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  main ─────●─────●─────●─────●─────●─────●─────▶            │
│            │     │     ▲     │     ▲     │                  │
│            │     │     │     │     │     │                  │
│            ▼     │     │     ▼     │     │                  │
│  develop ──●─────●─────●─────●─────●─────●─────▶            │
│            │     │           │     │                        │
│            │     │           │     │                        │
│            ▼     ▼           ▼     │                        │
│  feature/  ●─────●           ●─────●                        │
│  auth-flow                   payment                        │
│                                                              │
│            ▼                       ▼                        │
│  hotfix/   ●───────────────────────●                        │
│  critical-fix                                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Branch Types

| Branch | Purpose | Base | Merges To |
|--------|---------|------|-----------|
| `main` | Production code | - | - |
| `develop` | Integration | main | main |
| `feature/*` | New features | develop | develop |
| `bugfix/*` | Bug fixes | develop | develop |
| `hotfix/*` | Production fixes | main | main, develop |
| `release/*` | Release prep | develop | main, develop |

### Branch Naming Convention

```bash
# Feature branches
feature/add-user-authentication
feature/implement-pdf-export
feature/hii-geojson-layer

# Bug fixes
bugfix/fix-login-redirect
bugfix/correct-score-calculation

# Hotfixes
hotfix/security-patch-auth
hotfix/stripe-webhook-fix

# Releases
release/v1.2.0
release/v2.0.0-beta

# Format
{type}/{description-in-kebab-case}
```

---

## Commit Conventions

### Conventional Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add Google OAuth login` |
| `fix` | Bug fix | `fix(report): correct score calculation` |
| `docs` | Documentation | `docs: update API reference` |
| `style` | Formatting | `style: fix indentation in Button` |
| `refactor` | Code restructure | `refactor(api): simplify error handling` |
| `perf` | Performance | `perf(query): add index for parcels` |
| `test` | Tests | `test(auth): add login flow tests` |
| `chore` | Maintenance | `chore: update dependencies` |
| `ci` | CI/CD | `ci: add deployment workflow` |

### Scopes

| Scope | Area |
|-------|------|
| `auth` | Authentication |
| `api` | API layer |
| `ui` | UI components |
| `report` | Report generation |
| `payment` | Stripe/payments |
| `map` | Map components |
| `hii` | Hospitality module |
| `gis` | GIS functions |

### Examples

```bash
# Feature
feat(map): add parcel selection highlighting

Add visual feedback when user clicks on a parcel in the map.
Includes hover and selected states with brand colors.

Closes #123

# Bug fix
fix(auth): resolve session persistence issue

Users were being logged out on page refresh due to
incorrect token storage configuration.

- Update storage to use localStorage
- Add autoRefreshToken option
- Fix token expiry handling

Fixes #456

# Breaking change
feat(api)!: update report response format

BREAKING CHANGE: The report API now returns a different structure.
Migration guide available in docs/migrations/v2-reports.md
```

---

## CODEOWNERS

```bash
# .github/CODEOWNERS

# Default owners for everything
* @siteintel/core-team

# Frontend
/src/components/ @siteintel/frontend
/src/pages/ @siteintel/frontend
/src/hooks/ @siteintel/frontend
/src/index.css @siteintel/frontend @siteintel/design
/tailwind.config.ts @siteintel/frontend @siteintel/design

# Backend / Edge Functions
/supabase/functions/ @siteintel/backend
/supabase/migrations/ @siteintel/backend @siteintel/devops

# Infrastructure
/.github/ @siteintel/devops
/vite.config.ts @siteintel/devops

# Documentation
/docs/ @siteintel/core-team
*.md @siteintel/core-team

# Security sensitive
/src/integrations/supabase/ @siteintel/backend @siteintel/security
/.env* @siteintel/devops @siteintel/security

# Feature modules
/src/features/hospitality-hii/ @siteintel/hii-team
```

---

## Pull Request Process

### PR Template

```markdown
<!-- .github/PULL_REQUEST_TEMPLATE.md -->

## Description
<!-- Brief description of changes -->

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New feature (non-breaking change adding functionality)
- [ ] 💥 Breaking change (fix or feature causing existing functionality to change)
- [ ] 📝 Documentation update
- [ ] 🎨 Style/UI update
- [ ] ♻️ Refactor (no functional changes)
- [ ] 🔧 Configuration change

## Related Issues
<!-- Link related issues: Fixes #123, Relates to #456 -->

## Testing
<!-- How has this been tested? -->
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots
<!-- If UI changes, add before/after screenshots -->

## Checklist
- [ ] My code follows the coding standards
- [ ] I have performed a self-review
- [ ] I have added/updated documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests proving my fix/feature works
- [ ] All existing tests pass
- [ ] I have checked for security implications

## Deployment Notes
<!-- Any special deployment considerations? -->
```

### Review Requirements

```yaml
# Branch protection rules
main:
  required_reviews: 1
  dismiss_stale_reviews: true
  require_code_owner_reviews: true
  required_status_checks:
    - lint
    - typecheck
    - build
    - test

develop:
  required_reviews: 1
  required_status_checks:
    - lint
    - typecheck
    - build
```

### Review Checklist

```markdown
## Reviewer Checklist

### Code Quality
- [ ] Code is readable and well-documented
- [ ] No unnecessary complexity
- [ ] DRY principle followed
- [ ] Error handling is appropriate

### Type Safety
- [ ] No `any` types without justification
- [ ] Types are accurate and complete
- [ ] Null/undefined properly handled

### Performance
- [ ] No N+1 queries
- [ ] Appropriate memoization
- [ ] No memory leaks

### Security
- [ ] No sensitive data exposed
- [ ] Input validation present
- [ ] Authentication/authorization correct

### Testing
- [ ] Tests cover happy path
- [ ] Tests cover edge cases
- [ ] Tests cover error scenarios
```

---

## Issue Templates

### Bug Report

```markdown
<!-- .github/ISSUE_TEMPLATE/bug_report.md -->
---
name: Bug Report
about: Report a bug
title: '[BUG] '
labels: bug
assignees: ''
---

## Description
<!-- Clear description of the bug -->

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
<!-- What should happen -->

## Actual Behavior
<!-- What actually happens -->

## Screenshots
<!-- If applicable -->

## Environment
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14]
- Version: [e.g., v1.2.0]

## Additional Context
<!-- Any other context -->
```

### Feature Request

```markdown
<!-- .github/ISSUE_TEMPLATE/feature_request.md -->
---
name: Feature Request
about: Suggest a feature
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## Problem
<!-- What problem does this solve? -->

## Proposed Solution
<!-- How should it work? -->

## Alternatives Considered
<!-- Other solutions you've thought about -->

## Additional Context
<!-- Any other context or screenshots -->
```

---

## Release Process

### Versioning

Follow [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes
MINOR: New features (backward compatible)
PATCH: Bug fixes (backward compatible)

Examples:
1.0.0 → Initial release
1.1.0 → New feature
1.1.1 → Bug fix
2.0.0 → Breaking change
```

### Release Checklist

```markdown
## Release v{version} Checklist

### Pre-Release
- [ ] All PRs merged to develop
- [ ] All tests passing
- [ ] Security scan clean
- [ ] Documentation updated
- [ ] CHANGELOG.md updated

### Release
- [ ] Create release branch from develop
- [ ] Update version in package.json
- [ ] Create PR to main
- [ ] Get approval from code owners
- [ ] Merge to main
- [ ] Tag release
- [ ] Deploy to production

### Post-Release
- [ ] Verify production deployment
- [ ] Merge main back to develop
- [ ] Delete release branch
- [ ] Announce release
- [ ] Monitor for issues
```

---

## Labels System

| Label | Color | Description |
|-------|-------|-------------|
| `bug` | `#d73a4a` | Something isn't working |
| `enhancement` | `#a2eeef` | New feature |
| `documentation` | `#0075ca` | Documentation |
| `frontend` | `#7057ff` | Frontend related |
| `backend` | `#008672` | Backend related |
| `critical` | `#b60205` | Critical priority |
| `high` | `#d93f0b` | High priority |
| `medium` | `#fbca04` | Medium priority |
| `low` | `#0e8a16` | Low priority |
| `blocked` | `#e99695` | Blocked |
| `wontfix` | `#ffffff` | Won't be fixed |
| `duplicate` | `#cfd3d7` | Duplicate issue |
| `good first issue` | `#7057ff` | Good for newcomers |
