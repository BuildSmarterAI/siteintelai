# ETL Jobs & Scheduled Tasks

This document describes all scheduled jobs (cron jobs) running in the SiteIntel™ platform.

## Overview

SiteIntel uses `pg_cron` and `pg_net` PostgreSQL extensions to schedule and execute background tasks. Jobs are triggered via HTTP POST requests to Supabase Edge Functions.

## Scheduled Jobs

| Job Name | Schedule | Edge Function | Description |
|----------|----------|---------------|-------------|
| `cron-enrichment` | `*/5 * * * *` | `/functions/v1/cron-enrichment` | Process queued applications for data enrichment |
| `gis-refresh` | `0 3 * * *` | `/functions/v1/gis-refresh-scheduler` | Daily refresh of stale GIS layer data |
| `validate-endpoints` | `0 */6 * * *` | `/functions/v1/validate-gis-endpoints` | Health check external APIs every 6 hours |
| `credit-reset` | `0 0 1 * *` | `/functions/v1/credit-reset` | Monthly reset of subscription credits |
| `cache-cleanup` | `0 4 * * *` | `/functions/v1/cache-cleanup` | Daily cleanup of expired cache entries |
| `alert-check` | `*/15 * * * *` | `/functions/v1/alert-check` | Check system alert conditions every 15 minutes |

## Job Details

### 1. cron-enrichment

**Purpose**: Processes applications in the enrichment queue, orchestrating data fetching from external APIs.

**Frequency**: Every 5 minutes

**What it does**:
- Fetches applications with `status` in ('queued', 'enriching', 'error')
- Calls `enrich-application` for each application
- Updates application status and enrichment metadata
- Records job results in `jobs_enrichment` table

**Monitoring**:
- Check `jobs_enrichment` table for recent runs
- Monitor `applications` table for queue depth

---

### 2. gis-refresh-scheduler

**Purpose**: Refreshes GIS layer data that has expired based on TTL settings.

**Frequency**: Daily at 3:00 AM

**What it does**:
- Checks `gis_layer_versions` for expired layers
- Calls `gis-fetch-with-versioning` for each expired layer
- Updates version timestamps
- Maintains data freshness for parcel, flood, utility layers

**Monitoring**:
- Check `gis_layer_versions` for `expires_at` timestamps
- Review `api_logs` for `gis-refresh-scheduler` entries

---

### 3. validate-gis-endpoints

**Purpose**: Health check for external GIS APIs to detect service outages.

**Frequency**: Every 6 hours

**What it does**:
- Tests connectivity to all configured GIS endpoints
- Measures response times
- Reports operational/warning/down status
- Records results in `api_logs`

**Monitoring**:
- Review endpoint status in admin dashboard
- Check for 'down' status alerts

---

### 4. credit-reset

**Purpose**: Resets subscription credits at the start of each billing cycle.

**Frequency**: Monthly (1st of month at midnight)

**What it does**:
- Fetches all active subscriptions
- Resets `reports_used` and `quickchecks_used` to 0
- Records reset summary in `cron_job_history`
- Creates alerts on failures

**Monitoring**:
- Check `cron_job_history` for `credit-reset` entries
- Verify `user_subscriptions.reports_used` values

---

### 5. cache-cleanup

**Purpose**: Purges expired and stale cache entries to manage storage.

**Frequency**: Daily at 4:00 AM

**What it does**:
- Deletes expired `geocoder_cache` entries (30-day TTL)
- Removes old `api_logs` entries (90-day retention)
- Cleans `cron_job_history` older than 30 days
- Purges old `system_metrics` (7-day retention)
- Removes acknowledged alerts older than 30 days

**Monitoring**:
- Check `cron_job_history` for cleanup totals
- Monitor database size metrics

---

### 6. alert-check

**Purpose**: Monitors system health conditions and creates alerts.

**Frequency**: Every 15 minutes

**What it does**:
- Checks enrichment queue depth (threshold: 50)
- Monitors API failure rate (threshold: 10%)
- Counts failed cron jobs in last 24 hours
- Checks for stale GIS data (48-hour threshold)
- Monitors high API latency (5-second threshold)
- Tracks unacknowledged critical alerts

**Alert Conditions**:

| Condition | Threshold | Severity |
|-----------|-----------|----------|
| `enrichment_queue_depth` | > 50 items | Warning |
| `api_failure_rate` | > 10% | Error |
| `cron_job_failures` | > 3/day | Warning |
| `stale_gis_layers` | > 48 hours | Info |
| `high_api_latency` | > 5 seconds | Warning |
| `unacknowledged_critical` | > 0 | Critical |

---

## Manual Triggering

Jobs can be manually triggered from the Admin System Health dashboard (`/admin/system-health`) or via direct API call:

```bash
# Trigger credit-reset manually
curl -X POST https://your-project.supabase.co/functions/v1/credit-reset \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

## Setting Up Cron Jobs

After enabling `pg_cron` and `pg_net` extensions, schedule jobs using SQL:

```sql
-- Example: Schedule cron-enrichment every 5 minutes
SELECT cron.schedule(
  'process-enrichment-queue',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/cron-enrichment',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
```

---

## Troubleshooting

### Job Not Running

1. Check `pg_cron` extension is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Verify job is scheduled:
   ```sql
   SELECT * FROM cron.job;
   ```

3. Check job run history:
   ```sql
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
   ```

### Job Failing

1. Check `cron_job_history` for error messages:
   ```sql
   SELECT * FROM cron_job_history 
   WHERE status = 'error' 
   ORDER BY started_at DESC LIMIT 10;
   ```

2. Review Edge Function logs in Supabase Dashboard

3. Check `system_alerts` for related alerts

### High Execution Time

1. Review `execution_time_ms` in `cron_job_history`
2. Check external API response times in `api_logs`
3. Consider increasing batch sizes or parallelism

---

## Retention Policies

| Table | Retention | Cleanup Job |
|-------|-----------|-------------|
| `geocoder_cache` | 30 days | `cache-cleanup` |
| `api_logs` | 90 days | `cache-cleanup` |
| `cron_job_history` | 30 days | `cache-cleanup` |
| `system_metrics` | 7 days | `cache-cleanup` |
| `system_alerts` (acknowledged) | 30 days | `cache-cleanup` |

---

## Related Documentation

- [Monitoring Guide](./MONITORING.md)
- [Backend Index](../BACKEND_INDEX.md)
- [Edge Functions Reference](../api/edge-functions.md)
