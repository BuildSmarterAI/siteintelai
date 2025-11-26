# Environment Setup

Complete guide to configuring your SiteIntel™ development environment.

## Required Environment Variables

### Frontend Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://mcmfwlgovubpdcfiqfvk.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Edge Function Secrets

Configure these in Supabase Dashboard → Settings → Edge Functions:

| Secret | Description | Required |
|--------|-------------|----------|
| `GOOGLE_MAPS_API_KEY` | Google Geocoding, Places, Static Maps | ✅ |
| `OPENAI_API_KEY` | GPT-4 for AI narrative generation | ✅ |
| `STRIPE_SECRET_KEY` | Stripe payment processing | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | ✅ |

## Supabase Project Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/)
2. Create a new project
3. Note your project URL and anon key

### 2. Run Database Migrations

Migrations are located in `supabase/migrations/`. They run automatically when deployed via Lovable.

For manual setup, apply migrations in order:

```sql
-- See /supabase/migrations/ for migration files
```

### 3. Enable PostGIS

PostGIS is required for spatial queries:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 4. Configure Authentication

1. Go to Authentication → Providers
2. Enable Email authentication
3. (Optional) Enable Google OAuth

## External API Configuration

### Google Cloud Platform

Required APIs:
- Geocoding API
- Places API
- Static Maps API

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the required APIs
3. Create an API key with appropriate restrictions
4. Add the key as `GOOGLE_MAPS_API_KEY` secret

### Stripe

1. Create a [Stripe account](https://stripe.com/)
2. Get your secret key from Developers → API Keys
3. Set up webhook endpoint:
   - URL: `https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.*`
4. Add secrets to Supabase:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

### OpenAI

1. Create an [OpenAI account](https://platform.openai.com/)
2. Generate an API key
3. Add as `OPENAI_API_KEY` secret

## Development Tools

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Supabase CLI (Optional)

For local edge function development:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref mcmfwlgovubpdcfiqfvk

# Serve functions locally
supabase functions serve
```

## Verifying Your Setup

### 1. Check Frontend Connection

```typescript
import { supabase } from "@/integrations/supabase/client";

// Should not throw an error
const { data, error } = await supabase.from('applications').select('id').limit(1);
console.log('Supabase connected:', !error);
```

### 2. Test Edge Functions

```bash
curl -X POST https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/v2_health_check
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-26T..."
}
```

### 3. Verify API Keys

Test Google Geocoding:
```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Houston,TX&key=YOUR_KEY"
```

## Environment-Specific Configurations

### Development

```env
# .env.development
VITE_SUPABASE_URL=https://mcmfwlgovubpdcfiqfvk.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Production

Production environment variables are configured in:
- Lovable project settings
- Supabase Edge Function secrets

## Troubleshooting

### "Invalid API key"

- Verify the key is correctly copied (no extra spaces)
- Check the key hasn't been rotated/revoked
- Ensure the key has proper permissions

### "CORS error"

Edge functions must include CORS headers:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### "Database connection failed"

- Check Supabase project is active (not paused)
- Verify the project URL is correct
- Ensure RLS policies allow the operation

---

**Next**: [Deployment Guide →](./deployment.md)
