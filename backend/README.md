# Hospitality Activity Layer (HII) Backend

Ready-to-deploy backend module for the Hospitality Impact Index (HII) — fully compatible with Supabase Edge Functions.

## 📋 Overview

The HII module ingests and analyzes Texas Mixed Beverage Gross Receipts data from the Texas Comptroller's Open Data Portal to provide:

- **HII Score** (0-100): Hospitality vitality index based on year-over-year growth vs. city baseline
- **Establishment Counts**: Number of bars, restaurants, and venues with alcohol sales
- **Receipt Analysis**: Total and per-establishment revenue trends
- **Geospatial Overlay**: Map-ready GeoJSON for visualization
- **Automated Alerts**: Threshold-based notifications for high-growth areas

## 🚀 Quick Start

### Prerequisites

1. Supabase project (already configured in this repo)
2. Texas Open Data API token (optional but recommended): https://data.texas.gov/
3. Google Maps API key (for geocoding): https://console.cloud.google.com/
4. Slack webhook URL (optional, for alerts)

### Environment Variables

Copy `.env.example` and add your keys:

```bash
cp backend/.env.example backend/.env
```

Required variables:
- `SOCRATA_TOKEN`: Texas Open Data API token
- `GOOGLE_MAPS_KEY`: Google Maps Geocoding API key
- `HII_ALERT_WEBHOOK`: Slack webhook URL (optional)

Add these to your Supabase project:
```bash
supabase secrets set SOCRATA_TOKEN=your_token_here
supabase secrets set GOOGLE_MAPS_KEY=your_key_here
supabase secrets set HII_ALERT_WEBHOOK=your_webhook_here
```

### Installation

1. **Run migrations** (create tables and functions):

```bash
# Run each migration file in order
supabase db execute < backend/migrations/001_init_tx_beverage.sql
supabase db execute < backend/migrations/002_fn_hii.sql
supabase db execute < backend/migrations/003_hii_alerts.sql
```

2. **Deploy Edge Functions**:

```bash
# Already done automatically when you push code
# Edge functions are in supabase/functions/:
# - hii-ingest
# - hii-alerts
# - hii-score
# - hii-geojson
```

3. **Set up cron jobs** (optional - for automated ingestion):

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule nightly ingestion (2 AM UTC)
select cron.schedule(
  'hii-ingest-nightly',
  '0 2 * * *',
  $$
  select net.http_post(
      url:='https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/hii-ingest',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) as request_id;
  $$
);

-- Schedule hourly alert checks
select cron.schedule(
  'hii-alerts-hourly',
  '0 * * * *',
  $$
  select net.http_post(
      url:='https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/hii-alerts',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

Replace `YOUR_ANON_KEY` with your actual Supabase anon key.

## 📡 API Endpoints

### 1. Calculate HII Score

**Endpoint**: `POST /functions/v1/hii-score`

Calculates the Hospitality Impact Index for a specific location.

```typescript
const response = await fetch('https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/hii-score', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  },
  body: JSON.stringify({
    lat: 29.7604,
    lon: -95.3698,
    radius_m: 1609,  // 1 mile (optional, default: 1609)
    months_back: 12  // lookback period (optional, default: 12)
  })
});

const result = await response.json();
console.log(result.data);
```

**Response**:
```json
{
  "success": true,
  "data": {
    "hii_score": 67.5,
    "establishment_count": 42,
    "total_receipts": 8450000,
    "avg_receipts_per_establishment": 201190.48,
    "city": "Houston",
    "city_avg_receipts": 180000,
    "yoy_vs_city_avg": 11.77,
    "radius_meters": 1609,
    "months_analyzed": 12,
    "top_establishments": [
      {
        "name": "Downtown Sports Bar",
        "address": "123 Main St",
        "receipts": 450000,
        "distance_meters": 250
      }
    ]
  }
}
```

### 2. Get GeoJSON Data

**Endpoint**: `POST /functions/v1/hii-geojson`

Returns hospitality establishments as GeoJSON for map visualization.

```typescript
const response = await fetch('https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/hii-geojson', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  },
  body: JSON.stringify({
    minLng: -95.5,
    minLat: 29.6,
    maxLng: -95.2,
    maxLat: 29.9,
    months_back: 12  // optional, default: 12
  })
});

const geojson = await response.json();
// Use with MapLibre, Leaflet, etc.
```

### 3. Trigger Data Ingestion (Admin Only)

**Endpoint**: `POST /functions/v1/hii-ingest`

Manually trigger data ingestion from Texas Open Data Portal.

```bash
curl -X POST https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/hii-ingest \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### 4. Trigger Alert Check (Admin Only)

**Endpoint**: `POST /functions/v1/hii-alerts`

Check for threshold breaches and send alerts.

```bash
curl -X POST https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/hii-alerts \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## 🧩 Integration Examples

### Using the TypeScript Service

```typescript
import { HIIService } from './backend/services/hii-service';

const hiiService = new HIIService(
  'https://mcmfwlgovubpdcfiqfvk.supabase.co',
  'your-anon-key'
);

// Calculate score
const score = await hiiService.calculateScore(29.7604, -95.3698);
console.log(`HII Score: ${score.hii_score}/100`);
console.log(`${score.establishment_count} establishments within 1 mile`);

// Get map data
const geoJson = await hiiService.getGeoJSON(-95.5, 29.6, -95.2, 29.9);
```

### Integration with Existing SiteIntel Pipeline

Add HII scoring to your feasibility reports by calling from `enrich-application`:

```typescript
// In supabase/functions/enrich-application/index.ts
const { data: hiiData } = await supabase.functions.invoke('hii-score', {
  body: {
    lat: application.latitude,
    lon: application.longitude
  }
});

// Add to application enrichment
await supabase
  .from('applications')
  .update({
    hii_score: hiiData.data.hii_score,
    hii_establishment_count: hiiData.data.establishment_count
  })
  .eq('id', applicationId);
```

## 🗃️ Database Schema

### Tables

- **tx_mixed_beverage_activity**: Raw data from Texas Comptroller
- **hii_alerts**: Historical record of threshold breach alerts
- **hii_watchlist**: Locations to monitor for activity changes

### Functions

- **fn_hii(lat, lon, radius_m, months_back)**: Calculate HII score
- **hii_check_threshold()**: Find cities with >15% YoY growth

## 📊 Scoring Algorithm

```
HII Score = 50 + (YoY Growth vs City Avg / 2)

Where:
- YoY Growth = ((Area Avg - City Avg) / City Avg) × 100
- Area Avg = Total receipts / Establishment count (within radius)
- City Avg = Mean receipts across all city establishments
- Result clamped to [0, 100]
```

**Interpretation**:
- **80-100**: Exceptional growth, high hospitality vitality
- **60-79**: Above-average activity, positive momentum
- **40-59**: Average/baseline performance
- **20-39**: Below average, declining activity
- **0-19**: Significantly underperforming

## 🔧 Maintenance

### Refresh Data

Run ingestion manually:
```bash
curl -X POST https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/hii-ingest \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

Or set up automated nightly ingestion via cron (see Installation step 3).

### Monitor Logs

```bash
supabase functions logs hii-ingest
supabase functions logs hii-alerts
supabase functions logs hii-score
```

## 📝 Data Source

Texas Mixed Beverage Gross Receipts  
**Source**: Texas Comptroller of Public Accounts  
**Dataset**: `naix-2893`  
**Portal**: https://data.texas.gov/  
**Update Frequency**: Monthly  
**License**: Public Domain (Texas Open Data)

## 🔒 Security

- All tables have Row Level Security (RLS) enabled
- Public read access for authenticated users
- Write operations require service role
- Edge functions use JWT verification where appropriate

## 📦 Deliverables Checklist

- ✅ PostGIS-enabled Supabase schema
- ✅ RPC function `fn_hii` for scoring
- ✅ Edge Functions: `hii-ingest`, `hii-alerts`, `hii-score`, `hii-geojson`
- ✅ TypeScript service module
- ✅ Setup automation script
- ✅ SQL migrations with RLS policies
- ✅ Documentation and integration examples

## 📞 Support

For issues or questions:
1. Check edge function logs: `supabase functions logs <function-name>`
2. Verify environment variables are set correctly
3. Ensure migrations have been run in order
4. Confirm API tokens are valid and have proper permissions
