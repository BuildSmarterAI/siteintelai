# Quickstart Guide

Get SiteIntel™ Feasibility running locally in 5 minutes.

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- npm or bun package manager
- Git
- A Supabase account ([Sign up](https://supabase.com/))

## Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/siteintel-feasibility.git
cd siteintel-feasibility
```

## Step 2: Install Dependencies

```bash
npm install
# or
bun install
```

## Step 3: Configure Environment

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> **Note**: Get these values from your Supabase project dashboard under Settings → API.

## Step 4: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Step 5: Verify Setup

1. Open the app in your browser
2. You should see the SiteIntel™ homepage
3. Try the QuickCheck feature with a Texas address

## Project Structure

```
siteintel-feasibility/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities
│   └── integrations/   # Supabase client
├── supabase/
│   ├── functions/      # Edge functions
│   └── config.toml     # Supabase config
├── docs/               # Documentation
└── public/             # Static assets
```

## Next Steps

| Task | Guide |
|------|-------|
| Configure all environment variables | [Environment Setup](./environment-setup.md) |
| Understand the architecture | [Architecture Overview](../architecture/overview.md) |
| Work with edge functions | [Edge Functions](../api/edge-functions.md) |
| Deploy to production | [Deployment Guide](./deployment.md) |

## Common Issues

### "Supabase client not configured"

Ensure your `.env` file has the correct Supabase URL and anon key.

### Edge functions not working

Edge functions deploy automatically with the Lovable preview. For local development, see [Environment Setup](./environment-setup.md).

### Map not loading

MapLibre requires a valid map style. Check that the map component has a proper style URL configured.

---

**Next**: [Environment Setup →](./environment-setup.md)
