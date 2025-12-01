# System Component Layouts & Developer Handoff Guide — BuildSmarter™ Feasibility

## 1. Purpose & Audience

This document serves as the bridge between design and development for the BuildSmarter™ Feasibility platform. It defines how every Figma frame, visual element, and interaction maps to production-ready React components built with shadcn/ui, TailwindCSS, and Supabase.

**Audience**:
- Frontend developers implementing UI components and pages
- Product designers responsible for maintaining consistency across Figma and production
- QA engineers validating data bindings, layouts, and accessibility compliance

The guide ensures fidelity between Figma, Supabase schema, and Vercel-deployed components by enforcing shared naming conventions, spacing tokens, and accessibility rules.

## 2. Core Technologies & Libraries

- **React**: Primary UI framework
- **TypeScript**: Static typing for component interfaces and data models
- **shadcn/ui**: Reusable UI primitives (buttons, cards, inputs, etc.)
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library
- **Supabase**: Backend-as-a-service (database, auth, storage)

## 3. Naming Conventions

### Component Names
- PascalCase (e.g., `PropertyCard.tsx`, `MapCanvas.tsx`)
- Located in `src/components/`

### Filenames
- kebab-case (e.g., `property-card.tsx`, `map-canvas.tsx`)
- Pages in `src/pages/`

### Route Paths
- kebab-case (e.g., `/application`, `/reports/:id`)

### CSS Class Names
- BEM-style (Block__Element--Modifier)
- Use Tailwind CSS utility classes for styling

### Figma Frame Names
- Same as component names (PascalCase)

### Supabase Table Names
- snake_case (e.g., `applications`, `reports`, `utility_endpoints`)

### Supabase Column Names
- snake_case (e.g., `property_address`, `floodplain_zone`, `traffic_aadt`)

## 4. Spacing & Layout

### Core Grid
12-column system with responsive breakpoints.

| Element | Value |
|---------|-------|
| Columns | 12 |
| Gutters | 80px |
| Margins | 160px |
| Internal Padding | 32px |

### Responsive Breakpoints

| Device | Columns | Margin | Max Width |
|--------|---------|--------|-----------|
| Desktop ≥1440px | 12 | 160px | 1120px |
| Tablet ≤1024px | 8 | 80px | 864px |
| Mobile ≤768px | 4 | 40px | 640px |

### Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Icon offsets |
| `--space-sm` | 8px | Small gaps |
| `--space-md` | 16px | Card padding |
| `--space-lg` | 32px | Section spacing |
| `--space-xl` | 48px | Large section gaps |
| `--space-2xl` | 64px | Hero spacing |

### Tailwind Configuration (`tailwind.config.ts`)

```typescript
module.exports = {
  theme: {
    extend: {
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '32px',
        'xl': '48px',
        '2xl': '64px',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
```

## 5. Color Palette

### Primary Palette

| Role | Color Name | HEX | HSL | Usage |
|------|------------|-----|-----|-------|
| Primary Action | Feasibility Orange | `#FF7A00` | `28 100% 50%` | Primary action, highlights, CTAs |
| Primary Text/BG | Midnight Blue | `#0A0F2C` | `229 64% 11%` | Primary text, dark backgrounds |
| Secondary Text | Slate Gray | `#374151` | `218 14% 27%` | Secondary text, labels |
| Background | Cloud White | `#F9FAFB` | `210 20% 98%` | Light backgrounds |
| Accent | Data Cyan | `#06B6D4` | `189 94% 43%` | Links, accents, data highlights |

### Semantic Colors

| Role | Color Name | HEX | HSL |
|------|------------|-----|-----|
| Success | Success Green | `#10B981` | `158 64% 40%` |
| Warning | Warning Amber | `#F59E0B` | `43 96% 50%` |
| Error | Error Red | `#EF4444` | `0 84% 60%` |
| Neutral Border | Border Gray | `#E5E7EB` | `216 12% 91%` |

### Tailwind Configuration (`tailwind.config.ts`)

```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
      },
    },
  },
}
```

### CSS Variables (`src/index.css`)

```css
:root {
  /* Brand Colors */
  --primary: 28 100% 50%;           /* Feasibility Orange #FF7A00 */
  --primary-foreground: 0 0% 100%;  /* White text on orange */

  --secondary: 229 64% 11%;         /* Midnight Blue #0A0F2C */
  --secondary-foreground: 0 0% 100%;

  --accent: 189 94% 43%;            /* Data Cyan #06B6D4 */
  --accent-foreground: 229 64% 11%;

  /* Backgrounds */
  --background: 210 20% 98%;        /* Cloud White #F9FAFB */
  --foreground: 229 64% 11%;        /* Midnight Blue */

  /* Muted */
  --muted: 218 14% 27%;             /* Slate Gray #374151 */
  --muted-foreground: 210 20% 98%;

  /* Status */
  --destructive: 0 84% 60%;         /* Error Red #EF4444 */
  --success: 158 64% 40%;           /* Success Green #10B981 */
  --warning: 43 96% 50%;            /* Warning Amber #F59E0B */

  /* Layout */
  --radius: 0.75rem;                /* 12px border radius */
}

.dark {
  --background: 229 64% 11%;        /* Midnight Blue */
  --foreground: 210 20% 98%;        /* Cloud White */
}
```

## 6. Typography

### Primary Typeface
**IBM Plex Sans** — chosen for its engineering precision and accessibility across web and PDF systems.

### Typography Hierarchy

| Style | Size (px/line-height) | Weight | Usage |
|-------|----------------------|--------|-------|
| H1 | 48/56 | 600 (Semibold) | Hero headlines |
| H2 | 32/40 | 600 (Semibold) | Section titles |
| H3 | 24/32 | 500 (Medium) | Subheadings |
| Body L | 18/28 | 400 (Regular) | Reports, UI text |
| Body S | 14/22 | 400 (Regular) | Tables, labels, captions |

### Tailwind Configuration (`tailwind.config.ts`)

```typescript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', ...defaultTheme.fontFamily.sans],
        mono: ['IBM Plex Mono', ...defaultTheme.fontFamily.mono],
      },
    },
  },
}
```

### CSS Classes

```html
<h1 className="text-4xl font-semibold">Hero Headline</h1>
<h2 className="text-3xl font-semibold">Section Title</h2>
<h3 className="text-2xl font-medium">Subheading</h3>
<p className="text-lg">Body Large</p>
<p className="text-sm">Body Small</p>
```

## 7. Iconography

### Icon Style
- **Type**: Outline-based, geometric icons
- **Stroke Width**: 1.5px consistent
- **Corners**: Rounded for approachability
- **Fills**: No heavy fills

### Icon Library
**Lucide React** — Primary icon library with custom SiteIntel line icons for proprietary categories.

### Usage

```typescript
import { MapPin } from "lucide-react";

<MapPin className="w-6 h-6" />
```

## 8. Component Examples

### Button

```typescript
import { Button } from "@/components/ui/button"

function MyComponent() {
  return (
    <Button variant="primary">
      Click Me
    </Button>
  )
}
```

### Card

```typescript
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        Content goes here
      </CardContent>
      <CardFooter>
        Footer content
      </CardFooter>
    </Card>
  )
}
```

### Input

```typescript
import { Input } from "@/components/ui/input"

function MyComponent() {
  return (
    <Input type="text" placeholder="Enter text" />
  )
}
```

## 9. Accessibility Guidelines

### ARIA Attributes
Use ARIA attributes to provide semantic information to assistive technologies.

```html
<button aria-label="Close dialog">
  <XIcon />
</button>
```

### Keyboard Navigation
Ensure all interactive elements are keyboard accessible.

```html
<button tabIndex="0">Click Me</button>
```

### Color Contrast
Maintain sufficient color contrast between text and background.

### Focus Indicators
Provide clear focus indicators for keyboard users.

## 10. Component Directory Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── sections/     # Page sections
│   │   ├── Hero.tsx
│   │   ├── Problem.tsx
│   │   └── ...
│   ├── PropertyCard.tsx
│   ├── MapCanvas.tsx
│   └── ...
```

## 11. Data Binding

### Supabase Data
Fetch data from Supabase using `supabase-js`.

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function getData() {
  const { data, error } = await supabase
    .from('applications')
    .select('*')

  if (error) {
    console.error(error)
    return []
  }

  return data
}
```

### React Query
Use React Query for data fetching and caching.

```typescript
import { useQuery } from '@tanstack/react-query'

function MyComponent() {
  const { data, isLoading, isError } = useQuery('applications', getData)

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error</div>

  return (
    <ul>
      {data.map(item => (
        <li key={item.id}>{item.property_address}</li>
      ))}
    </ul>
  )
}
```

## 12. Testing

### Unit Tests
Write unit tests for individual components using Jest and React Testing Library.

### Integration Tests
Write integration tests to verify interactions between components.

### End-to-End Tests
Write end-to-end tests to simulate user flows.

## 13. Deployment

### Vercel
Deploy the application to Vercel for production.

### Environment Variables
Configure environment variables for Supabase credentials and API keys.

## 14. Figma Handoff Checklist

- [ ] Component names match Figma frame names
- [ ] Spacing tokens are consistent
- [ ] Color palette is accurate
- [ ] Typography styles are applied correctly
- [ ] Accessibility guidelines are followed
- [ ] Data bindings are implemented
- [ ] Tests are written
- [ ] Environment variables are configured
- [ ] Application is deployed to Vercel

*Document Version 1.0 — Last Updated: November 2024*
*For questions, contact the BuildSmarter™ Product Architecture Team*
