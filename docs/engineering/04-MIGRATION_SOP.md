# D. Migration SOP

> 14-Step Standard Operating Procedure: Lovable → GitHub

## Overview

This document provides the complete migration procedure for transitioning from Lovable.dev development to GitHub-based development while maintaining bidirectional sync capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                    MIGRATION TIMELINE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Phase 1: Preparation (Steps 1-4)        ~2 hours           │
│  ├─ Repository setup                                         │
│  ├─ Branch protection                                        │
│  └─ Access control                                           │
│                                                              │
│  Phase 2: Configuration (Steps 5-8)      ~3 hours           │
│  ├─ Environment variables                                    │
│  ├─ CI/CD pipelines                                          │
│  └─ Secrets management                                       │
│                                                              │
│  Phase 3: Validation (Steps 9-12)        ~2 hours           │
│  ├─ Build verification                                       │
│  ├─ Integration testing                                      │
│  └─ Sync verification                                        │
│                                                              │
│  Phase 4: Cutover (Steps 13-14)          ~1 hour            │
│  ├─ Team onboarding                                          │
│  └─ Go-live                                                  │
│                                                              │
│  Total Estimated Time: ~8 hours                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Preparation

### Step 1: Connect GitHub Account

**Duration**: 15 minutes

1. In Lovable editor, click **GitHub** → **Connect to GitHub**
2. Authorize the Lovable GitHub App on GitHub
3. Select GitHub account/organization for repository
4. Click **Create Repository** to generate new repo

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    Lovable       │────▶│     GitHub       │────▶│   Repository     │
│    Editor        │     │     OAuth        │     │    Created       │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

**Verification Checklist**:
- [ ] GitHub account connected
- [ ] Repository created with correct name
- [ ] Initial code pushed to `main` branch
- [ ] Bidirectional sync indicator shows green

---

### Step 2: Configure Branch Protection

**Duration**: 20 minutes

Navigate to: `GitHub Repository` → `Settings` → `Branches` → `Add rule`

**Protection Rules for `main`**:

```yaml
# Branch protection settings
branch_protection:
  name: main
  settings:
    require_pull_request_reviews:
      required_approving_review_count: 1
      dismiss_stale_reviews: true
      require_code_owner_reviews: true
    require_status_checks:
      strict: true
      contexts:
        - "build"
        - "lint"
    require_conversation_resolution: true
    require_linear_history: true
    allow_force_pushes: false
    allow_deletions: false
```

**Create CODEOWNERS file**:

```bash
# .github/CODEOWNERS

# Default owners for everything
* @siteintel/core-team

# Frontend
/src/components/ @siteintel/frontend
/src/pages/ @siteintel/frontend

# Backend
/supabase/functions/ @siteintel/backend

# Infrastructure
/.github/ @siteintel/devops
/supabase/migrations/ @siteintel/backend @siteintel/devops
```

**Verification Checklist**:
- [ ] Branch protection rule active on `main`
- [ ] PR reviews required
- [ ] Status checks required
- [ ] CODEOWNERS file created

---

### Step 3: Configure Repository Settings

**Duration**: 15 minutes

**General Settings**:
```yaml
repository_settings:
  features:
    wikis: false
    issues: true
    projects: true
    discussions: false
  
  merge_options:
    allow_merge_commits: false
    allow_squash_merging: true
    allow_rebase_merging: false
    delete_branch_on_merge: true
    
  pull_requests:
    allow_auto_merge: true
    suggest_updating_branches: true
```

**Labels Setup**:

| Label | Color | Description |
|-------|-------|-------------|
| `bug` | `#d73a4a` | Something isn't working |
| `enhancement` | `#a2eeef` | New feature or request |
| `documentation` | `#0075ca` | Documentation improvements |
| `frontend` | `#7057ff` | Frontend related |
| `backend` | `#008672` | Backend related |
| `critical` | `#b60205` | Critical priority |
| `blocked` | `#e99695` | Blocked by dependency |

---

### Step 4: Set Up Team Access

**Duration**: 15 minutes

**Team Structure**:

```
┌─────────────────────────────────────────────────────────┐
│                   ORGANIZATION                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Admins    │  │   Core      │  │  External   │      │
│  │   (Admin)   │  │   (Write)   │  │  (Read)     │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  Frontend   │  │   Backend   │  │   DevOps    │      │
│  │  (Write)    │  │   (Write)   │  │  (Maintain) │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Permission Matrix**:

| Team | Repository | Branch Push | PR Merge | Settings |
|------|------------|-------------|----------|----------|
| Admins | Admin | Yes | Yes | Yes |
| Core | Write | No* | Yes | No |
| Frontend | Write | No* | Yes** | No |
| Backend | Write | No* | Yes** | No |
| DevOps | Maintain | Yes*** | Yes | Limited |

*Via PR only, **Own area only, ***Hotfix only

---

## Phase 2: Configuration

### Step 5: Configure Secrets

**Duration**: 30 minutes

Navigate to: `Settings` → `Secrets and variables` → `Actions`

**Required Secrets**:

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# External APIs
GOOGLE_PLACES_API_KEY=AIza...
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Deployment
LOVABLE_API_TOKEN=lov_...
```

**Environment-Specific Variables**:

```yaml
# Repository variables (non-secret)
vars:
  NODE_ENV: production
  VITE_APP_NAME: SiteIntel
  VITE_SUPABASE_URL: https://mcmfwlgovubpdcfiqfvk.supabase.co
```

---

### Step 6: Create CI/CD Workflows

**Duration**: 45 minutes

**Main CI Workflow** (`.github/workflows/ci.yml`):

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck

  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/

  test:
    runs-on: ubuntu-latest
    needs: [build]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
```

---

### Step 7: Configure Environments

**Duration**: 20 minutes

**Create Environments**:

1. **Production** (`production`)
   - Required reviewers: 1
   - Wait timer: 5 minutes
   - Branch: `main` only

2. **Staging** (`staging`)
   - No required reviewers
   - Branch: `develop`, `main`

3. **Preview** (`preview`)
   - No restrictions
   - All branches

```yaml
# Environment protection rules
environments:
  production:
    protection_rules:
      - required_reviewers: ["@siteintel/admins"]
      - wait_timer: 5
    deployment_branch_policy:
      protected_branches: true
      
  staging:
    deployment_branch_policy:
      custom_branches:
        - develop
        - main
```

---

### Step 8: Set Up Notifications

**Duration**: 15 minutes

**GitHub Notifications**:

```yaml
# .github/CODEOWNERS notification settings
notifications:
  pull_requests:
    - team: core-team
      events: [opened, ready_for_review]
  
  deployments:
    - team: devops
      events: [success, failure]
```

**Slack Integration** (Optional):

```yaml
# .github/workflows/notify.yml
name: Notify

on:
  deployment_status:

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Deployment ${{ github.event.deployment_status.state }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Phase 3: Validation

### Step 9: Verify Build Pipeline

**Duration**: 30 minutes

**Test Matrix**:

```bash
# Local verification
npm ci                    # Install dependencies
npm run lint              # Run linter
npm run typecheck         # Type checking
npm run build             # Production build
npm run preview           # Preview build
```

**Expected Outputs**:

| Command | Success Criteria |
|---------|------------------|
| `npm ci` | Exit code 0, no warnings |
| `npm run lint` | Exit code 0, no errors |
| `npm run typecheck` | Exit code 0, no errors |
| `npm run build` | `dist/` folder created |

---

### Step 10: Test Bidirectional Sync

**Duration**: 20 minutes

**Test Procedure**:

```
┌─────────────────────────────────────────────────────────────┐
│                    SYNC TEST MATRIX                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Test 1: Lovable → GitHub                                    │
│  ├─ Make change in Lovable                                   │
│  ├─ Verify commit appears in GitHub                          │
│  └─ Expected: < 30 seconds                                   │
│                                                              │
│  Test 2: GitHub → Lovable                                    │
│  ├─ Push commit to main                                      │
│  ├─ Verify change appears in Lovable                         │
│  └─ Expected: < 60 seconds                                   │
│                                                              │
│  Test 3: Conflict Resolution                                 │
│  ├─ Make simultaneous changes                                │
│  ├─ Verify conflict detection                                │
│  └─ Resolve in favor of most recent                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### Step 11: Validate Edge Functions

**Duration**: 30 minutes

**Deployment Verification**:

```bash
# List deployed functions
supabase functions list

# Test health check
curl -X POST https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/v2_health_check

# Expected response:
# {"status": "ok", "timestamp": "..."}
```

**Function Test Matrix**:

| Function | Test Command | Expected |
|----------|--------------|----------|
| `v2_health_check` | POST | `{"status": "ok"}` |
| `get-credits` | POST (auth) | `{"credits": {...}}` |
| `google-places` | POST | Autocomplete results |

---

### Step 12: Security Audit

**Duration**: 30 minutes

**Checklist**:

- [ ] No secrets in repository
- [ ] `.env` in `.gitignore`
- [ ] Service role key not exposed
- [ ] RLS policies active
- [ ] HTTPS enforced
- [ ] Branch protection active

**Run Secret Scan**:

```bash
# Using GitHub's secret scanning
# Navigate to: Security → Secret scanning alerts

# Or use trufflehog locally:
trufflehog git file://. --only-verified
```

---

## Phase 4: Cutover

### Step 13: Team Onboarding

**Duration**: 45 minutes

**Onboarding Checklist per Developer**:

```markdown
## New Developer Setup

- [ ] GitHub account added to organization
- [ ] Added to appropriate team(s)
- [ ] SSH key configured
- [ ] GPG key configured (optional)
- [ ] Local environment setup completed
- [ ] First PR merged (test change)
- [ ] Read required documentation:
  - [ ] CONTRIBUTING.md
  - [ ] Coding Standards
  - [ ] PR Template
```

**Quick Start Commands**:

```bash
# Clone repository
git clone git@github.com:siteintel/siteintel.git
cd siteintel

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with required values

# Start development
npm run dev
```

---

### Step 14: Go-Live Verification

**Duration**: 15 minutes

**Final Checklist**:

```
┌─────────────────────────────────────────────────────────────┐
│                    GO-LIVE CHECKLIST                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Infrastructure                                              │
│  ☐ GitHub repository public/private as intended              │
│  ☐ Branch protection rules active                            │
│  ☐ Secrets configured in all environments                    │
│  ☐ CI/CD pipelines passing                                   │
│                                                              │
│  Access Control                                              │
│  ☐ All team members have appropriate access                  │
│  ☐ CODEOWNERS file accurate                                  │
│  ☐ External collaborators removed/limited                    │
│                                                              │
│  Documentation                                               │
│  ☐ README.md updated                                         │
│  ☐ CONTRIBUTING.md created                                   │
│  ☐ All engineering docs committed                            │
│                                                              │
│  Monitoring                                                  │
│  ☐ Error tracking configured                                 │
│  ☐ Deployment notifications active                           │
│  ☐ Uptime monitoring configured                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Rollback Procedure

If issues occur during migration:

```bash
# 1. Disconnect GitHub from Lovable
# In Lovable: GitHub → Disconnect

# 2. Continue development in Lovable only

# 3. Diagnose and fix issues

# 4. Reconnect when ready
# In Lovable: GitHub → Connect to GitHub
```

---

## Post-Migration Tasks

| Task | Timeline | Owner |
|------|----------|-------|
| Monitor sync stability | 1 week | DevOps |
| Collect team feedback | 2 weeks | Tech Lead |
| Optimize CI/CD times | 1 month | DevOps |
| Document lessons learned | 1 month | All |
