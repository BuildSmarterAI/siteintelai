# Deployment Guide

Deploy SiteIntel™ Feasibility to production.

## Deployment Options

| Platform | Best For | Complexity |
|----------|----------|------------|
| Lovable | Default, easiest | ⭐ |
| Vercel | Custom domains, CI/CD | ⭐⭐ |
| Netlify | Static hosting | ⭐⭐ |
| Self-hosted | Full control | ⭐⭐⭐ |

## Lovable Deployment (Recommended)

### Automatic Deployment

Lovable automatically deploys your app when changes are made:

1. Make changes in the Lovable editor
2. Preview updates automatically
3. Click **Publish** → **Update** to deploy to production

### Custom Domain

1. Go to Project → Settings → Domains
2. Add your custom domain
3. Configure DNS:
   ```
   Type: CNAME
   Name: www (or @)
   Value: your-project.lovable.app
   ```
4. Wait for SSL certificate provisioning

## Vercel Deployment

### Prerequisites

- GitHub repository connected
- Vercel account

### Setup

1. **Import Project**
   ```bash
   # Connect GitHub repo to Vercel
   vercel
   ```

2. **Configure Environment Variables**
   
   In Vercel Dashboard → Settings → Environment Variables:
   
   | Variable | Value |
   |----------|-------|
   | `VITE_SUPABASE_URL` | Your Supabase URL |
   | `VITE_SUPABASE_ANON_KEY` | Your anon key |

3. **Configure Build Settings**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite"
   }
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

## Edge Function Deployment

Edge functions deploy automatically with Lovable. For manual deployment:

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link
supabase login
supabase link --project-ref mcmfwlgovubpdcfiqfvk

# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy generate-ai-report
```

## Production Checklist

### Security

- [ ] All edge functions validate JWT tokens
- [ ] RLS policies enabled on all tables
- [ ] Secrets not exposed in client code
- [ ] HTTPS enforced
- [ ] CORS configured correctly

### Performance

- [ ] Images optimized
- [ ] Code splitting enabled (automatic with Vite)
- [ ] API responses cached where appropriate
- [ ] Database indexes on frequently queried columns

### Monitoring

- [ ] Error tracking configured
- [ ] API logs accessible
- [ ] Performance monitoring enabled
- [ ] Uptime alerts configured

### Configuration

- [ ] Environment variables set
- [ ] Stripe webhook URL updated
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active

## Database Migrations

### Running Migrations

Migrations run automatically via Lovable. For manual execution:

1. Go to Supabase Dashboard → SQL Editor
2. Execute migration files in order from `/supabase/migrations/`

### Rolling Back

```sql
-- Example: Drop a table if needed
DROP TABLE IF EXISTS table_name;
```

> **Warning**: Always backup data before running destructive migrations.

## Stripe Webhook Configuration

Update your Stripe webhook for production:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint:
   - **URL**: `https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/stripe-webhook`
   - **Events**:
     - `checkout.session.completed`
     - `invoice.paid`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
3. Copy the webhook signing secret
4. Update `STRIPE_WEBHOOK_SECRET` in Supabase

## Monitoring & Logs

### Edge Function Logs

View logs in Supabase Dashboard:
1. Go to Edge Functions
2. Select function
3. Click "Logs" tab

Or via CLI:
```bash
supabase functions logs function-name
```

### Application Logs

- Browser console for frontend errors
- Network tab for API issues
- Supabase Dashboard → Logs for database queries

## Rollback Procedures

### Frontend Rollback

In Lovable:
1. Open version history
2. Select previous working version
3. Click "Restore"

Via Git:
```bash
git revert HEAD
git push
```

### Edge Function Rollback

```bash
# Revert to previous commit
git checkout HEAD~1 -- supabase/functions/function-name/

# Redeploy
supabase functions deploy function-name
```

## Scaling Considerations

### Database

- Upgrade Supabase instance for higher traffic
- Add read replicas for read-heavy workloads
- Implement connection pooling

### Edge Functions

- Edge functions scale automatically
- Consider caching for expensive operations
- Monitor function execution times

### Storage

- Use CDN for static assets
- Implement signed URLs for private files
- Set appropriate cache headers

---

**Next**: [Architecture Overview →](../architecture/overview.md)
