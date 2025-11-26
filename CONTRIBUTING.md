# Contributing to SiteIntel™ Feasibility

Thank you for your interest in contributing to SiteIntel™! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. All contributors are expected to:

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other contributors

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Supabase CLI (for edge function development)
- A Supabase project (for testing)

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/siteintel-feasibility.git
   cd siteintel-feasibility
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/description` | `feature/add-wetlands-overlay` |
| Bug Fix | `fix/description` | `fix/geocode-timeout` |
| Documentation | `docs/description` | `docs/api-reference` |
| Refactor | `refactor/description` | `refactor/utility-hooks` |

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(enrichment): add EPA facility proximity check
fix(geocode): handle timeout on slow networks
docs(api): update edge function documentation
```

## Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following coding standards
3. **Test thoroughly** including edge cases
4. **Update documentation** if needed
5. **Submit PR** with clear description

### PR Checklist

- [ ] Code follows project coding standards
- [ ] All tests pass
- [ ] Documentation updated (if applicable)
- [ ] No console errors or warnings
- [ ] Responsive design verified
- [ ] Accessibility considerations addressed

### PR Review Criteria

- Code quality and readability
- Performance implications
- Security considerations
- Test coverage
- Documentation completeness

## Coding Standards

### TypeScript

- Use strict TypeScript (`strict: true`)
- Define explicit types for function parameters and returns
- Avoid `any` type; use `unknown` when type is truly unknown
- Use interfaces for object shapes

```typescript
// ✅ Good
interface ParcelData {
  id: string;
  owner: string;
  acreage: number;
}

function processParcel(data: ParcelData): ProcessedParcel {
  // ...
}

// ❌ Avoid
function processParcel(data: any): any {
  // ...
}
```

### React Components

- Use functional components with hooks
- Keep components focused and small
- Extract reusable logic into custom hooks
- Use semantic HTML elements

```typescript
// ✅ Good - focused component
export function ScoreCircle({ score, label }: ScoreCircleProps) {
  const grade = useScoreGrade(score);
  return (
    <div className="flex flex-col items-center">
      <CircularProgress value={score} />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
```

### Styling

- Use Tailwind CSS utility classes
- Use semantic design tokens from `index.css`
- Never use direct colors; always use theme variables
- Ensure responsive design

```tsx
// ✅ Good - uses semantic tokens
<div className="bg-background text-foreground border-border">

// ❌ Avoid - direct colors
<div className="bg-white text-black border-gray-200">
```

### Edge Functions

- Always include CORS headers
- Validate all inputs
- Use proper error handling
- Add comprehensive logging

```typescript
// Standard CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Always handle OPTIONS
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

## Documentation

### When to Update Documentation

- Adding new features
- Changing API interfaces
- Modifying database schema
- Updating configuration options
- Fixing user-facing bugs

### Documentation Style

- Use clear, concise language
- Include code examples
- Add diagrams for complex flows
- Keep documentation up-to-date with code

## Issue Reporting

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment details
- Screenshots if applicable

### Feature Requests

Include:
- Clear description of the feature
- Use case and motivation
- Proposed implementation (if any)
- Impact on existing functionality

## Questions?

- Open a GitHub issue for questions
- Join our Discord community
- Email: support@siteintel.dev

---

Thank you for contributing to SiteIntel™! 🚀
