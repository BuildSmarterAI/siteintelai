# F. Coding Standards

> TypeScript rules, naming conventions, and PR templates

## TypeScript Guidelines

### Type Safety

```typescript
// ✅ GOOD: Explicit types
interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

function getUser(id: string): Promise<UserProfile> {
  // ...
}

// ❌ BAD: Implicit any
function getUser(id) {
  // ...
}
```

### Type Imports

```typescript
// ✅ GOOD: Type-only imports
import type { Database } from '@/integrations/supabase/types';
import type { ComponentProps } from 'react';

// ❌ BAD: Mixed imports when only types needed
import { Database } from '@/integrations/supabase/types';
```

### Strict Null Checks

```typescript
// ✅ GOOD: Handle null/undefined
function formatAddress(address: string | null): string {
  return address ?? 'No address provided';
}

// ✅ GOOD: Optional chaining
const city = user?.address?.city;

// ❌ BAD: Unsafe access
const city = user.address.city; // May throw
```

### Discriminated Unions

```typescript
// ✅ GOOD: Type-safe state
type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function handleState<T>(state: FetchState<T>) {
  switch (state.status) {
    case 'idle':
      return null;
    case 'loading':
      return <Spinner />;
    case 'success':
      return <Data data={state.data} />;
    case 'error':
      return <Error error={state.error} />;
  }
}
```

---

## Naming Conventions

### Files and Folders

| Type | Convention | Example |
|------|------------|---------|
| React Component | PascalCase | `QuickCheckWidget.tsx` |
| UI Primitive | kebab-case | `button.tsx` |
| Page | PascalCase | `Dashboard.tsx` |
| Hook | camelCase + use | `useMapLayers.ts` |
| Utility | camelCase | `utils.ts` |
| Type file | camelCase | `types.ts` |
| Constant file | SCREAMING_SNAKE | `CONSTANTS.ts` |
| Edge Function | kebab-case | `enrich-utilities/` |

### Variables and Functions

```typescript
// Components: PascalCase
function UserProfile() { ... }
const QuickCheckWidget = () => { ... };

// Functions: camelCase, verb prefix
function getUserById(id: string) { ... }
function handleSubmit(e: FormEvent) { ... }
function calculateScore(data: ScoreData) { ... }

// Boolean: is/has/should prefix
const isLoading = true;
const hasPermission = false;
const shouldRefetch = true;

// Constants: SCREAMING_SNAKE
const MAX_RETRIES = 3;
const API_TIMEOUT_MS = 5000;
const DEFAULT_PAGE_SIZE = 20;

// Event handlers: handle prefix
const handleClick = () => { ... };
const handleInputChange = (e) => { ... };
```

### Types and Interfaces

```typescript
// Interfaces: PascalCase, descriptive
interface UserProfile { ... }
interface ApplicationFormData { ... }

// Type aliases: PascalCase
type FeasibilityScore = number;
type StatusType = 'pending' | 'completed' | 'error';

// Generic parameters: T, K, V or descriptive
function transform<TInput, TOutput>(
  input: TInput,
  fn: (i: TInput) => TOutput
): TOutput { ... }

// Props: ComponentNameProps
interface ButtonProps { ... }
interface CardHeaderProps { ... }
```

---

## React Patterns

### Component Structure

```typescript
// Recommended component structure
import { useState, useEffect } from 'react';
import type { ComponentProps } from 'react';

// 1. Types
interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

// 2. Component
export function MyComponent({ title, onAction }: MyComponentProps) {
  // 3. Hooks (in order: state, effects, callbacks)
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    // Side effects
  }, []);
  
  const handleClick = useCallback(() => {
    setIsOpen(true);
    onAction?.();
  }, [onAction]);
  
  // 4. Early returns
  if (!title) return null;
  
  // 5. Render
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick}>Action</button>
    </div>
  );
}

// 6. Display name (optional, for debugging)
MyComponent.displayName = 'MyComponent';
```

### Hooks Rules

```typescript
// ✅ GOOD: Hooks at top level
function MyComponent() {
  const [state, setState] = useState(null);
  const { data } = useQuery({ ... });
  
  // ...
}

// ❌ BAD: Conditional hooks
function MyComponent({ shouldFetch }) {
  if (shouldFetch) {
    const { data } = useQuery({ ... }); // NEVER DO THIS
  }
}

// ✅ GOOD: Conditional inside hook
function MyComponent({ shouldFetch }) {
  const { data } = useQuery({
    enabled: shouldFetch, // Use enabled option
  });
}
```

### Custom Hook Pattern

```typescript
// src/hooks/useMyFeature.ts
import { useState, useCallback } from 'react';

interface UseMyFeatureOptions {
  initialValue?: string;
  onSuccess?: (result: string) => void;
}

interface UseMyFeatureReturn {
  value: string;
  setValue: (v: string) => void;
  submit: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useMyFeature({
  initialValue = '',
  onSuccess,
}: UseMyFeatureOptions = {}): UseMyFeatureReturn {
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const submit = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await someAsyncOperation(value);
      onSuccess?.(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [value, onSuccess]);
  
  return { value, setValue, submit, isLoading, error };
}
```

---

## Styling Guidelines

### Tailwind Usage

```typescript
// ✅ GOOD: Use semantic tokens
<div className="bg-background text-foreground">
<button className="bg-primary text-primary-foreground">

// ❌ BAD: Direct colors
<div className="bg-white text-black">
<button className="bg-orange-500 text-white">

// ✅ GOOD: Use cn() for conditional classes
import { cn } from '@/lib/utils';

<div className={cn(
  "p-4 rounded-lg",
  isActive && "bg-primary",
  className
)}>

// ❌ BAD: String concatenation
<div className={`p-4 rounded-lg ${isActive ? 'bg-primary' : ''}`}>
```

### Responsive Design

```typescript
// Mobile-first approach
<div className="
  p-4           // Mobile
  md:p-6        // Tablet
  lg:p-8        // Desktop
  xl:p-12       // Large screens
">

// Grid layouts
<div className="
  grid
  grid-cols-1   // Mobile: 1 column
  md:grid-cols-2 // Tablet: 2 columns
  lg:grid-cols-3 // Desktop: 3 columns
  gap-4
">
```

---

## Error Handling

### Try-Catch Pattern

```typescript
// ✅ GOOD: Specific error handling
async function fetchData() {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      // Network error
      console.error('Network error:', error);
      throw new Error('Unable to connect. Please check your connection.');
    }
    // Re-throw other errors
    throw error;
  }
}
```

### Edge Function Error Pattern

```typescript
// Standard error response format
return new Response(
  JSON.stringify({
    success: false,
    error: 'Human-readable error message',
    code: 'ERROR_CODE',
    details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
  }),
  {
    status: 400, // or appropriate status code
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  }
);
```

---

## Pull Request Template

```markdown
## Description
<!-- Brief description of changes -->

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Testing
<!-- How has this been tested? -->
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots
<!-- If UI changes, add screenshots -->

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review
- [ ] I have added/updated documentation as needed
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] All existing tests pass

## Related Issues
<!-- Link related issues: Fixes #123, Relates to #456 -->
```

---

## Code Review Checklist

### Reviewer Checklist

```markdown
## Code Quality
- [ ] Code is readable and self-documenting
- [ ] No unnecessary complexity
- [ ] DRY principle followed
- [ ] No hardcoded values that should be constants

## Type Safety
- [ ] No `any` types without justification
- [ ] Proper null handling
- [ ] Types are accurate and complete

## Performance
- [ ] No unnecessary re-renders
- [ ] Proper memoization where needed
- [ ] No N+1 queries

## Security
- [ ] No sensitive data exposed
- [ ] Input validation present
- [ ] Proper authentication checks

## Testing
- [ ] Tests cover happy path
- [ ] Tests cover edge cases
- [ ] Tests cover error scenarios
```
