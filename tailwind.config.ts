import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      spacing: {
        '18': '4.5rem',
        '112': '28rem',
        '128': '32rem',
        // Design System Spacing Tokens
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '32px',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'strong': '0 8px 24px rgba(0, 0, 0, 0.16)',
        'inner-focus': 'inset 0 0 0 2px hsl(var(--ring))',
        'elev': '0 4px 16px rgba(0, 0, 0, 0.08)', // Design System elevation
      },
      transitionDuration: {
        '100': '100ms',  // Design System: Hover states
        '180': '180ms',  // Design System: Min standard animation
        '250': '250ms',  // Design System: Max standard animation
        '350': '350ms',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        /* BuildSmarter Official Brand Colors */
        "feasibility-orange": {
          DEFAULT: "hsl(var(--feasibility-orange))",
          foreground: "hsl(var(--cloud-white))",
        },
        "midnight-blue": {
          DEFAULT: "hsl(var(--midnight-blue))",
          foreground: "hsl(var(--cloud-white))",
        },
        "slate-gray": {
          DEFAULT: "hsl(var(--slate-gray))",
          foreground: "hsl(var(--cloud-white))",
        },
        "cloud-white": {
          DEFAULT: "hsl(var(--cloud-white))",
          foreground: "hsl(var(--slate-gray))",
        },
        "data-cyan": {
          DEFAULT: "hsl(var(--data-cyan))",
          foreground: "hsl(var(--cloud-white))",
        },
        
        /* Legacy Aliases */
        charcoal: {
          DEFAULT: "hsl(var(--charcoal))",
          foreground: "hsl(var(--charcoal-foreground))",
        },
        navy: {
          DEFAULT: "hsl(var(--navy))",
          foreground: "hsl(var(--navy-foreground))",
        },
        "maxx-red": {
          DEFAULT: "hsl(var(--maxx-red))",
          foreground: "hsl(var(--maxx-red-foreground))",
        },
        "light-gray": "hsl(var(--light-gray))",
        "mid-gray": "hsl(var(--mid-gray))",
        
        /* Semantic tokens */
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Status colors - WCAG 2.2 compliant (Design System Functional UI)
        status: {
          success: "hsl(var(--status-success))",  // Feasibility "A" band
          warning: "hsl(var(--status-warning))",  // Feasibility "B" band
          error: "hsl(var(--status-error))",      // Feasibility "C" band
          info: "hsl(var(--status-info))",        // Neutral data annotations
          pending: "hsl(var(--status-pending))",
        },
        // Hospitality Intelligence (HII) Module Colors
        hii: {
          high: "hsl(var(--hii-high))",      // High activity/score (green)
          medium: "hsl(var(--hii-medium))",  // Medium activity/score (yellow)
          low: "hsl(var(--hii-low))",        // Low activity/score (red)
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          "0%": { 
            opacity: "0", 
            transform: "translateY(4px)" 
          },
          "100%": { 
            opacity: "1", 
            transform: "translateY(0)" 
          }
        },
        "dataPulseExpand": {
          "0%": { 
            transform: "scale(0.5)", 
            opacity: "1",
            borderWidth: "4px"
          },
          "100%": { 
            transform: "scale(3)", 
            opacity: "0",
            borderWidth: "1px"
          }
        },
        "aiScanLine": {
          "0%, 100%": { transform: "translateY(-100%)" },
          "50%": { transform: "translateY(100%)" }
        },
        "shimmer": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        },
        "marquee": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.8s ease-out",
        "data-pulse": "dataPulseExpand 800ms ease-out",
        "ai-scan": "aiScanLine 2s ease-in-out infinite",
        "shimmer": "shimmer 2.5s ease-in-out infinite",
        "marquee": "marquee 25s linear infinite",
      },
      fontFamily: {
        heading: ['Space Grotesk', 'system-ui', 'sans-serif'],      /* Headlines, titles, section headers */
        body: ['Inter', 'system-ui', 'sans-serif'],                 /* Body text, paragraphs */
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],       /* Code, numbers, technical data */
        sans: ['Inter', 'system-ui', 'sans-serif'],                 /* Default sans-serif fallback */
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
