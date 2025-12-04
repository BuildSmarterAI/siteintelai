# L. Developer Onboarding

> Setup guide and first PR walkthrough

## Welcome to SiteIntel™

This guide will help you set up your development environment and make your first contribution.

```
┌─────────────────────────────────────────────────────────────┐
│                  ONBOARDING TIMELINE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Day 1: Environment Setup                                    │
│  ├─ Install prerequisites                                    │
│  ├─ Clone repository                                         │
│  ├─ Configure environment                                    │
│  └─ Run locally                                              │
│                                                              │
│  Day 2: Codebase Orientation                                 │
│  ├─ Read architecture docs                                   │
│  ├─ Explore key files                                        │
│  ├─ Understand data flow                                     │
│  └─ Review coding standards                                  │
│                                                              │
│  Day 3: First Contribution                                   │
│  ├─ Pick starter issue                                       │
│  ├─ Create feature branch                                    │
│  ├─ Make changes                                             │
│  └─ Submit PR                                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Node.js | 20.x LTS | [nodejs.org](https://nodejs.org) |
| npm | 10.x | Included with Node.js |
| Git | 2.40+ | [git-scm.com](https://git-scm.com) |
| VS Code | Latest | [code.visualstudio.com](https://code.visualstudio.com) |

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    "formulahendry.auto-rename-tag",
    "usernamehw.errorlens",
    "christian-kohler.path-intellisense",
    "prisma.prisma"
  ]
}
```

### VS Code Settings

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

---

## Environment Setup

### Step 1: Clone Repository

```bash
# Clone via SSH (recommended)
git clone git@github.com:siteintel/siteintel.git

# Or via HTTPS
git clone https://github.com/siteintel/siteintel.git

# Navigate to project
cd siteintel
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm run --version
node --version
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
# Request development credentials from tech lead
```

**Required Environment Variables:**

```bash
# Supabase (Development)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google (Development)
GOOGLE_PLACES_API_KEY=your-api-key

# Optional for local development
STRIPE_SECRET_KEY=sk_test_xxx
```

### Step 4: Start Development Server

```bash
# Start Vite dev server
npm run dev

# Open in browser
# http://localhost:5173
```

### Step 5: Verify Setup

Run these commands to verify everything works:

```bash
# Run linter
npm run lint
# Expected: No errors

# Run type check
npm run typecheck
# Expected: No errors

# Run build
npm run build
# Expected: Successful build in dist/

# Run tests (if available)
npm test
```

---

## Codebase Orientation

### Key Files to Explore

```bash
# Start here - understand the entry points
src/main.tsx           # React entry
src/App.tsx            # Routes and providers
src/index.css          # Design system tokens

# Core components
src/components/ui/     # shadcn primitives
src/components/navigation/ # Header, Footer

# Pages
src/pages/Index.tsx    # Homepage
src/pages/Dashboard.tsx # User dashboard

# Hooks
src/hooks/use-toast.ts # Toast notifications

# Supabase
src/integrations/supabase/client.ts # DB client
src/integrations/supabase/types.ts  # Generated types

# Edge Functions
supabase/functions/    # Backend functions
```

### Architecture Documents to Read

1. [02-ARCHITECTURE.md](./02-ARCHITECTURE.md) - System diagrams
2. [03-REPOSITORY_STRUCTURE.md](./03-REPOSITORY_STRUCTURE.md) - Folder layout
3. [06-CODING_STANDARDS.md](./06-CODING_STANDARDS.md) - Code conventions
4. [07-DESIGN_SYSTEM.md](./07-DESIGN_SYSTEM.md) - UI patterns

### Understanding Data Flow

```
User Action → React Component → Hook (useQuery/Mutation)
     ↓
Supabase Client → Edge Function → Database/External API
     ↓
Response → Cache Update → UI Re-render
```

---

## First Contribution Guide

### Step 1: Find an Issue

Look for issues labeled:
- `good first issue` - Beginner-friendly
- `help wanted` - Needs contribution
- `documentation` - Doc improvements

### Step 2: Create Branch

```bash
# Update main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b bugfix/fix-description
```

### Step 3: Make Changes

Follow the coding standards:

```typescript
// Example: Adding a new component
// src/components/MyComponent.tsx

import { cn } from '@/lib/utils';

interface MyComponentProps {
  title: string;
  className?: string;
}

export function MyComponent({ title, className }: MyComponentProps) {
  return (
    <div className={cn("p-4 bg-card rounded-lg", className)}>
      <h2 className="text-lg font-heading">{title}</h2>
    </div>
  );
}
```

### Step 4: Test Locally

```bash
# Run linter
npm run lint

# Run type check
npm run typecheck

# Build to verify
npm run build

# Test in browser
npm run dev
```

### Step 5: Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional format
git commit -m "feat(ui): add MyComponent for dashboard"

# Push to remote
git push origin feature/your-feature-name
```

### Step 6: Create Pull Request

1. Go to GitHub repository
2. Click "Compare & pull request"
3. Fill out PR template
4. Request review from code owners
5. Address feedback
6. Merge when approved

---

## Development Workflow

### Daily Workflow

```bash
# Start of day - update from main
git checkout main
git pull origin main
git checkout your-branch
git rebase main

# During development
npm run dev              # Start dev server
# Make changes...
npm run lint            # Check for issues
git commit -m "..."     # Commit often

# End of day
git push origin your-branch
```

### Debugging Tips

```typescript
// Console logging
console.log('[Component] State:', state);

// React Query devtools
// Already included - check browser devtools

// Network requests
// Check Supabase Dashboard → Logs

// Edge function logs
// Check Supabase Dashboard → Edge Functions → Logs
```

### Common Issues

| Issue | Solution |
|-------|----------|
| `npm install` fails | Delete `node_modules` and `package-lock.json`, retry |
| TypeScript errors | Run `npm run typecheck` for details |
| Supabase errors | Check `.env` configuration |
| Build fails | Check for import errors, run `npm run lint` |

---

## Resources

### Internal Documentation

- [Engineering Index](./00-INDEX.md) - This documentation suite
- [Backend Index](../BACKEND_INDEX.md) - Edge functions reference
- [Brand Guidelines](../brand/BRAND_GUIDELINES.md) - Design system

### External Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query)
- [Supabase Docs](https://supabase.com/docs)

### Getting Help

1. **Slack**: #dev-help channel
2. **GitHub Issues**: For bugs and features
3. **Code Reviews**: Ask questions in PRs
4. **Tech Lead**: For architecture questions

---

## Onboarding Checklist

```markdown
## New Developer Checklist

### Day 1
- [ ] Received GitHub access
- [ ] Added to Slack channels
- [ ] Cloned repository
- [ ] Set up environment
- [ ] Ran application locally

### Day 2
- [ ] Read architecture documentation
- [ ] Explored codebase structure
- [ ] Understood data flow
- [ ] Reviewed coding standards

### Day 3
- [ ] Picked first issue
- [ ] Created feature branch
- [ ] Made changes
- [ ] Submitted first PR
- [ ] Received code review

### Week 1
- [ ] Merged first PR
- [ ] Participated in code review
- [ ] Attended team standup
- [ ] Completed onboarding feedback
```
