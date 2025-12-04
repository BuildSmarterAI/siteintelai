# G. Design System

> Color tokens, typography, spacing, and shadcn patterns

## Brand Colors

### Primary Palette

```
┌─────────────────────────────────────────────────────────────┐
│                    PRIMARY COLORS                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐  Feasibility Orange                         │
│  │            │  HEX: #FF7A00                                │
│  │  #FF7A00   │  HSL: 27 100% 50%                            │
│  │            │  CSS: hsl(var(--primary))                    │
│  └────────────┘  Usage: CTAs, highlights, accent             │
│                                                              │
│  ┌────────────┐  Midnight Blue                               │
│  │            │  HEX: #0A0F2C                                │
│  │  #0A0F2C   │  HSL: 222.2 84% 4.9%                         │
│  │            │  CSS: hsl(var(--background))                 │
│  └────────────┘  Usage: Background, text on light            │
│                                                              │
│  ┌────────────┐  Data Cyan                                   │
│  │            │  HEX: #06B6D4                                │
│  │  #06B6D4   │  HSL: 187 100% 42%                           │
│  │            │  CSS: hsl(var(--accent))                     │
│  └────────────┘  Usage: Links, data viz, secondary accent    │
│                                                              │
│  ┌────────────┐  Slate Gray                                  │
│  │            │  HEX: #374151                                │
│  │  #374151   │  HSL: 217.2 19.2% 26.5%                      │
│  │            │  CSS: hsl(var(--muted))                      │
│  └────────────┘  Usage: Secondary text, borders              │
│                                                              │
│  ┌────────────┐  Cloud White                                 │
│  │            │  HEX: #F9FAFB                                │
│  │  #F9FAFB   │  HSL: 210 40% 98%                            │
│  │            │  CSS: hsl(var(--foreground))                 │
│  └────────────┘  Usage: Text on dark, light backgrounds      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Semantic Colors

```css
/* In index.css */
:root {
  /* Backgrounds */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  
  /* Cards/Surfaces */
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  
  /* Primary (Orange) */
  --primary: 27 100% 50%;
  --primary-foreground: 222.2 84% 4.9%;
  
  /* Secondary */
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  
  /* Muted */
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  
  /* Accent (Cyan) */
  --accent: 187 100% 42%;
  --accent-foreground: 222.2 84% 4.9%;
  
  /* States */
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  
  /* Borders */
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 27 100% 50%;
}
```

### State Colors

| State | Color | HSL | Usage |
|-------|-------|-----|-------|
| Success | `#10B981` | 160 84% 39% | Confirmations, completed |
| Warning | `#F59E0B` | 38 92% 50% | Alerts, cautions |
| Error | `#EF4444` | 0 84% 60% | Errors, destructive |
| Info | `#06B6D4` | 187 100% 42% | Information, tips |

---

## Typography

### Font Stack

```css
:root {
  --font-heading: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### Type Scale

```
┌─────────────────────────────────────────────────────────────┐
│                    TYPOGRAPHY SCALE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  H1 - Hero Headlines                                         │
│  ├─ Font: Space Grotesk                                      │
│  ├─ Size: text-4xl md:text-5xl lg:text-6xl                  │
│  ├─ Weight: font-bold (700)                                  │
│  ├─ Leading: leading-[1.1]                                   │
│  └─ Tracking: tracking-tight                                 │
│                                                              │
│  H2 - Section Headlines                                      │
│  ├─ Font: Space Grotesk                                      │
│  ├─ Size: text-3xl md:text-4xl lg:text-5xl                  │
│  ├─ Weight: font-bold (700)                                  │
│  └─ Tracking: tracking-tight                                 │
│                                                              │
│  H3 - Subsection Headlines                                   │
│  ├─ Font: Space Grotesk                                      │
│  ├─ Size: text-2xl md:text-3xl                              │
│  ├─ Weight: font-semibold (600)                              │
│  └─ Tracking: tracking-tight                                 │
│                                                              │
│  Body Large                                                  │
│  ├─ Font: Inter                                              │
│  ├─ Size: text-lg md:text-xl                                │
│  ├─ Weight: font-normal (400)                                │
│  └─ Leading: leading-relaxed                                 │
│                                                              │
│  Body Regular                                                │
│  ├─ Font: Inter                                              │
│  ├─ Size: text-base                                          │
│  ├─ Weight: font-normal (400)                                │
│  └─ Leading: leading-normal                                  │
│                                                              │
│  Small / Caption                                             │
│  ├─ Font: Inter                                              │
│  ├─ Size: text-sm                                            │
│  ├─ Weight: font-normal (400)                                │
│  └─ Color: text-muted-foreground                             │
│                                                              │
│  Monospace / Code                                            │
│  ├─ Font: JetBrains Mono                                     │
│  ├─ Size: text-sm                                            │
│  └─ Usage: Code, data, technical                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Usage Examples

```tsx
// H1 - Hero
<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading tracking-tight leading-[1.1]">
  Instant Feasibility Intelligence
</h1>

// H2 - Section
<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading tracking-tight">
  How It Works
</h2>

// Body
<p className="text-lg text-muted-foreground leading-relaxed">
  Description text goes here...
</p>

// Gradient text
<span className="bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
  Gradient headline
</span>
```

---

## Spacing System

### Spacing Scale

```css
/* Tailwind spacing tokens */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Section Spacing

```tsx
// Page sections
<section className="py-16 md:py-24 lg:py-32">
  {/* Content */}
</section>

// Container
<div className="container mx-auto px-4 md:px-6 lg:px-8">
  {/* Content */}
</div>

// Card padding
<Card className="p-6 md:p-8">
  {/* Content */}
</Card>
```

---

## Component Patterns

### Button Variants

```tsx
// Primary (default)
<Button>Get Started</Button>
// → bg-primary text-primary-foreground

// Secondary
<Button variant="secondary">Learn More</Button>
// → bg-secondary text-secondary-foreground

// Outline
<Button variant="outline">Contact</Button>
// → border border-input bg-background

// Ghost
<Button variant="ghost">Menu Item</Button>
// → hover:bg-accent hover:text-accent-foreground

// Destructive
<Button variant="destructive">Delete</Button>
// → bg-destructive text-destructive-foreground
```

### Card Patterns

```tsx
// Standard card
<Card className="bg-card border-border">
  <CardHeader>
    <CardTitle className="text-card-foreground">Title</CardTitle>
    <CardDescription className="text-muted-foreground">
      Description
    </CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Glassmorphism card
<Card className="bg-white/5 backdrop-blur-sm border-white/10">
  {/* Content */}
</Card>

// Highlighted card
<Card className="bg-primary/10 border-primary/20">
  {/* Content */}
</Card>
```

### Form Patterns

```tsx
// Input field
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="you@example.com"
    className="bg-background border-input"
  />
</div>

// Select field
<div className="space-y-2">
  <Label>Project Type</Label>
  <Select>
    <SelectTrigger className="bg-background border-input">
      <SelectValue placeholder="Select type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="commercial">Commercial</SelectItem>
      <SelectItem value="residential">Residential</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

## Animation Guidelines

### Principles

1. **Purposeful**: Every animation should communicate state change
2. **Fast**: Keep under 400ms for responsiveness
3. **Subtle**: Don't distract from content
4. **Accessible**: Respect reduced motion preferences

### Timing Standards

| Animation Type | Duration | Easing |
|----------------|----------|--------|
| Micro (hover) | 150ms | ease-out |
| Small (expand) | 200ms | ease-in-out |
| Medium (modal) | 300ms | ease-in-out |
| Large (page) | 400ms | ease-in-out |

### Framer Motion Patterns

```tsx
// Fade in
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 }
};

// Slide up
const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" }
};

// Stagger children
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Usage
<motion.div variants={fadeIn} initial="initial" animate="animate">
  Content
</motion.div>
```

### Reduced Motion

```tsx
// Always check for reduced motion preference
import { useReducedMotion } from 'framer-motion';

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      animate={prefersReducedMotion ? {} : { x: 100 }}
    >
      Content
    </motion.div>
  );
}
```

---

## Responsive Breakpoints

### Tailwind Breakpoints

| Breakpoint | Min Width | Target |
|------------|-----------|--------|
| (default) | 0px | Mobile |
| `sm` | 640px | Large mobile |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large |

### Responsive Patterns

```tsx
// Typography
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
  Responsive Headline
</h1>

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {items.map(item => <Card key={item.id} />)}
</div>

// Show/Hide
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>

// Padding/Margin
<section className="px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-24">
  Content
</section>
```

---

## Accessibility

### Color Contrast

All text must meet WCAG 2.1 AA contrast requirements:
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum

### Focus States

```tsx
// All interactive elements need visible focus
<Button className="focus:ring-2 focus:ring-ring focus:ring-offset-2">
  Focusable
</Button>

// Custom focus styles
<input className="focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
```

### Screen Reader Support

```tsx
// Hidden labels
<Label className="sr-only">Search</Label>
<Input type="search" placeholder="Search..." />

// ARIA labels
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// Live regions
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```
