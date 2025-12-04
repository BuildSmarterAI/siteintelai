# E. Codebase Reference

> File-by-file documentation of critical modules

## Entry Points

### `index.html`

```html
<!-- HTML entry point for Vite -->
- Loads Google Fonts (Space Grotesk, Inter, JetBrains Mono)
- Sets viewport and meta tags
- Mounts React app to #root
```

### `src/main.tsx`

```typescript
// React entry point
- Initializes React 18 with createRoot
- Wraps App in StrictMode
- Imports global CSS
```

### `src/App.tsx`

```typescript
// Root component with routing
- Configures React Router
- Sets up TanStack Query provider
- Initializes Sonner toaster
- Defines all application routes
```

---

## Core Configuration Files

### `src/index.css`

**Purpose**: Global styles and CSS custom properties

**Key Sections**:

```css
/* Design System Tokens */
:root {
  /* Colors - HSL format */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 27 100% 50%;        /* Feasibility Orange */
  --primary-foreground: 222.2 84% 4.9%;
  --secondary: 217.2 32.6% 17.5%;
  --accent: 187 100% 42%;        /* Data Cyan */
  
  /* Typography */
  --font-heading: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Spacing */
  --radius: 0.5rem;
}

/* Dark mode adjustments */
.dark { ... }

/* Animation keyframes */
@keyframes accordion-down { ... }
@keyframes accordion-up { ... }
```

### `tailwind.config.ts`

**Purpose**: Tailwind CSS configuration

**Key Extensions**:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "..." },
        // ... all design tokens
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: { ... },
      animation: { ... },
    }
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## Component Documentation

### UI Primitives (`src/components/ui/`)

#### `button.tsx`

```typescript
// Shadcn button with variants
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Usage:
<Button variant="default" size="lg">Click me</Button>
```

#### `card.tsx`

```typescript
// Card component structure
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

#### `dialog.tsx`

```typescript
// Modal dialog
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button>Action</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Navigation Components

#### `src/components/navigation/Header.tsx`

```typescript
// Main site header
- Logo with link to home
- Desktop navigation menu
- Mobile hamburger menu
- Auth button (login/logout)
- Responsive breakpoints

Key sections:
- Products dropdown (FaaS, Cost Intel, Survey Upload)
- Industries dropdown (Developers, Lenders)
- Resources dropdown (Blog, Demo)
- Pricing link
- Auth controls
```

#### `src/components/navigation/Footer.tsx`

```typescript
// Site footer
- Logo and tagline
- Navigation links (Products, Company, Legal)
- Social links
- Copyright notice
```

#### `src/components/navigation/DashboardSidebar.tsx`

```typescript
// Dashboard sidebar navigation
- Dashboard link
- Applications list
- Reports section
- Settings
- Help/Support
- Logout
```

---

### Feature Components

#### `src/components/QuickCheckWidget.tsx`

```typescript
// Address input for QuickCheck
- Google Places Autocomplete
- Address validation
- Coordinates extraction
- Submit to generate-quick-check
```

#### `src/components/MapLibreCanvas.tsx`

```typescript
// MapLibre GL map component
- Parcel visualization
- Layer management
- Click handlers for parcel selection
- Popup displays
- Drawing tools integration
```

#### `src/components/ReportChatAssistant.tsx`

```typescript
// AI chat for report Q&A
- Chat interface
- Message history
- AI responses via chat-with-report function
- Context-aware answers
```

---

## Page Documentation

### `src/pages/Index.tsx`

```typescript
// Homepage
Sections (in order):
1. Hero - Main headline, CTA
2. PlatformOverview - Feature overview
3. InteractiveProcess - Workflow steps
4. Solution - Value proposition
5. WhoWeServe - Target audiences
6. PackagesPricing - Pricing tiers
7. FAQ - Common questions
8. FinalCTA - Bottom conversion
```

### `src/pages/Dashboard.tsx`

```typescript
// User dashboard
- Auth required
- Applications list
- Reports list
- Quick actions
- Usage statistics
- Subscription status
```

### `src/pages/Application.tsx`

```typescript
// Multi-step application form
Steps:
1. Contact - User info
2. Property - Address, parcel
3. Intent - Development type
4. Review - Confirm details
5. Submit - Create application

State management: useApplicationForm hook
```

### `src/pages/ReportViewer.tsx`

```typescript
// Report display page
- Fetch report by ID
- Display feasibility score
- Show all sections (Zoning, Flood, etc.)
- PDF download button
- Chat assistant integration
```

---

## Hooks Documentation

### `src/hooks/useMapLayers.ts`

```typescript
// Map layer management
interface UseMapLayersReturn {
  layers: MapLayer[];
  toggleLayer: (id: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  resetLayers: () => void;
}

// Manages:
- Parcel layers
- Flood zone overlays
- Utility infrastructure
- Traffic data
```

### `src/hooks/useApplicationForm.ts`

```typescript
// Multi-step form state
interface ApplicationFormState {
  step: number;
  data: ApplicationData;
  errors: ValidationErrors;
}

// Provides:
- nextStep / prevStep navigation
- Field validation
- Draft saving
- Submit handling
```

### `src/hooks/useAdminRole.ts`

```typescript
// Admin role detection
const { isAdmin, isLoading } = useAdminRole();

// Checks user_roles table for admin role
// Used to gate admin-only features
```

---

## Feature Module: HII

### `src/features/hospitality-hii/types.ts`

```typescript
export interface HIIScoreResult {
  score: number;
  components: {
    demand: number;
    supply: number;
    growth: number;
  };
  nearby_establishments: number;
  total_receipts: number;
}

export interface HIIAlert {
  id: string;
  city: string;
  yoy: number;
  establishment_count: number;
  total_receipts: number;
  sent_at: string;
}

export interface HIIGeoJSON {
  type: "FeatureCollection";
  features: HIIFeature[];
}
```

### `src/features/hospitality-hii/hooks/useHiiScore.ts`

```typescript
// Fetch HII score for location
const { data, isLoading, error } = useHiiScore({
  lat: 29.7604,
  lon: -95.3698,
  radius_m: 1609,
  months_back: 12,
});

// Calls hii-score edge function
// Caches for 10 minutes
```

### `src/features/hospitality-hii/store/useHiiStore.ts`

```typescript
// Zustand store for HII state
interface HIIStore {
  selectedLocation: Coordinates | null;
  setSelectedLocation: (coords: Coordinates) => void;
  filters: HIIFilters;
  setFilters: (filters: HIIFilters) => void;
}
```

---

## Integration Files

### `src/integrations/supabase/client.ts`

```typescript
// Supabase client initialization
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
```

### `src/integrations/supabase/types.ts`

```typescript
// Auto-generated database types
// DO NOT EDIT MANUALLY

export type Database = {
  public: {
    Tables: {
      applications: { ... },
      reports: { ... },
      profiles: { ... },
      // ... all tables
    },
    Views: { ... },
    Functions: { ... },
    Enums: { ... },
  }
}
```

---

## Utility Files

### `src/lib/utils.ts`

```typescript
// Tailwind class merge utility
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage:
cn("px-4 py-2", conditional && "bg-primary", className)
```

### `src/lib/fieldTooltips.ts`

```typescript
// Field descriptions for UI
export const fieldTooltips = {
  floodplain_zone: "FEMA flood zone designation...",
  zoning_code: "Municipal zoning classification...",
  // ... all field explanations
};
```
