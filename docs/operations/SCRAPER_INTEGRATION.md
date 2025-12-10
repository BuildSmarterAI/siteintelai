# ScraperAPI Integration Guide

SiteIntel utilizes ScraperAPI to provide reliable data ingestion from GIS endpoints and non-REST data sources that may be unreliable or protected.

## Architecture

### Tiered Fetch Strategy

The system uses a tiered approach based on endpoint reliability:

| Tier | Mode | Description | Endpoints |
|------|------|-------------|-----------|
| **Tier 1** | `disabled` | Direct fetch only (reliable endpoints) | FEMA, TxDOT, USFWS Wetlands |
| **Tier 2** | `fallback` | Try direct first, fallback to ScraperAPI on failure | HCAD, FBCAD, Harris County GIS |
| **Tier 3** | `primary` | Use ScraperAPI as primary method | Houston Water GIS, Permit Portals, Tax Offices |

### Configuration

Each `map_server` record includes:
- `scraper_mode`: 'disabled' | 'fallback' | 'primary'
- `scraper_config`: JSON object with ScraperAPI options

```sql
-- Example: Set Houston Water GIS to use scraper primary
UPDATE map_servers 
SET scraper_mode = 'primary',
    scraper_config = '{"render": false, "premium": true}'
WHERE server_key = 'houston_water_gis';
```

## Edge Functions

### `scraper-gis-fetch`
ScraperAPI-powered GIS layer fetch with smart routing.

```bash
curl -X POST https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/scraper-gis-fetch \
  -H "Content-Type: application/json" \
  -d '{
    "layer_key": "houston_water_lines",
    "bbox": "-95.5,29.5,-95.3,29.8",
    "max_records": 500
  }'
```

### `scrape-permits`
Scrapes Houston Permitting Center for building permit data.

```bash
curl -X POST https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/scrape-permits \
  -H "Content-Type: application/json" \
  -d '{
    "address": "123 Main St, Houston, TX"
  }'
```

### `scrape-tax-records`
Scrapes Harris County Tax Office for tax delinquency data.

```bash
curl -X POST https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/scrape-tax-records \
  -H "Content-Type: application/json" \
  -d '{
    "account_number": "1234567890123"
  }'
```

## Database Tables

### `scraper_cache`
Caches scraper responses to reduce API costs.

| Column | Type | Description |
|--------|------|-------------|
| `url_hash` | text | SHA-256 hash of URL (unique) |
| `url` | text | Original URL |
| `response_body` | text | Cached response |
| `expires_at` | timestamptz | Cache expiration |
| `api_credits_used` | int | Credits consumed |

### `scraper_usage_log`
Tracks ScraperAPI usage for cost monitoring.

| Column | Type | Description |
|--------|------|-------------|
| `url` | text | Requested URL |
| `map_server_id` | uuid | Associated map server |
| `scraper_mode` | text | Mode used |
| `api_credits_used` | int | Credits consumed |
| `cache_hit` | boolean | Whether cache was used |

## Cost Optimization

1. **Caching**: All responses cached for 24-48 hours
2. **Direct First**: Tier 2 endpoints try direct fetch before scraper
3. **Batch Processing**: Use `batchSmartFetch()` for multiple URLs
4. **Monitoring**: Track usage via `scraper_usage_log` table

## Shared Client Usage

```typescript
import { smartFetch, batchSmartFetch } from '../_shared/scraper-client.ts';

// Single URL fetch
const result = await smartFetch(url, {
  scraperMode: 'fallback',
  scraperConfig: { render: true },
  cacheTtlHours: 24
});

// Batch fetch
const results = await batchSmartFetch(urls, {
  scraperMode: 'primary'
}, 3); // concurrency of 3
```

## Environment Variables

Required secret:
- `SCRAPERAPI_KEY`: Your ScraperAPI API key

## Monitoring

Query usage statistics:
```sql
SELECT 
  date_trunc('day', created_at) as day,
  scraper_mode,
  SUM(api_credits_used) as total_credits,
  COUNT(*) as requests,
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits
FROM scraper_usage_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY 1, 2
ORDER BY 1 DESC;
```
