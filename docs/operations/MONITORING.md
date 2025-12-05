# System Monitoring Guide

This document describes the monitoring infrastructure for the SiteIntel™ platform.

## Overview

SiteIntel implements a multi-layer monitoring system:

1. **Cron Job Monitoring** - Track scheduled task execution
2. **System Alerts** - Automated condition-based alerting
3. **Metrics Collection** - Operational metrics tracking
4. **Admin Dashboard** - Visual monitoring interface

---

## Admin Dashboard

Access the System Health dashboard at `/admin/system-health` (admin role required).

### Dashboard Features

1. **Summary Cards**
   - Active alerts count
   - Jobs executed today
   - Average execution time
   - Success rate percentage

2. **Cron Jobs Tab**
   - List of all scheduled jobs
   - Last run status and time
   - Manual trigger buttons
   - Schedule information

3. **Alerts Tab**
   - Active and historical alerts
   - Severity badges (Critical/Error/Warning/Info)
   - Acknowledge button for active alerts
   - Alert details and timestamps

4. **Job History Tab**
   - Execution history table
   - Status, duration, records processed
   - Error messages for failed jobs

---

## Database Tables

### cron_job_history

Tracks all cron job executions.

```sql
CREATE TABLE cron_job_history (
  id UUID PRIMARY KEY,
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  status TEXT, -- 'running', 'success', 'error'
  records_processed INTEGER,
  execution_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB
);
```

**Useful Queries**:

```sql
-- Recent job failures
SELECT * FROM cron_job_history 
WHERE status = 'error' 
ORDER BY started_at DESC LIMIT 20;

-- Job success rate by name
SELECT 
  job_name,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successes,
  ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 1) as success_rate
FROM cron_job_history
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY job_name;

-- Average execution time by job
SELECT 
  job_name,
  AVG(execution_time_ms) as avg_ms,
  MAX(execution_time_ms) as max_ms
FROM cron_job_history
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY job_name;
```

### system_alerts

Stores generated system alerts.

```sql
CREATE TABLE system_alerts (
  id UUID PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT, -- 'info', 'warning', 'error', 'critical'
  message TEXT NOT NULL,
  source TEXT,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  metadata JSONB
);
```

**Useful Queries**:

```sql
-- Active alerts by severity
SELECT severity, COUNT(*) 
FROM system_alerts 
WHERE acknowledged = false 
GROUP BY severity;

-- Alert frequency by type
SELECT 
  alert_type,
  COUNT(*) as count,
  MAX(created_at) as last_occurrence
FROM system_alerts
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY alert_type
ORDER BY count DESC;
```

### system_metrics

Stores operational metrics.

```sql
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metric_unit TEXT,
  recorded_at TIMESTAMPTZ,
  dimensions JSONB
);
```

**Useful Queries**:

```sql
-- Recent metric values
SELECT * FROM system_metrics
WHERE metric_name = 'api_failure_rate'
ORDER BY recorded_at DESC LIMIT 100;

-- Metric trends
SELECT 
  DATE_TRUNC('hour', recorded_at) as hour,
  AVG(metric_value) as avg_value
FROM system_metrics
WHERE metric_name = 'enrichment_queue_depth'
  AND recorded_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', recorded_at)
ORDER BY hour;
```

---

## Alert Conditions

The `alert-check` function monitors these conditions:

| Alert Type | Description | Threshold | Severity |
|------------|-------------|-----------|----------|
| `enrichment_queue_depth` | Applications waiting for enrichment | > 50 | Warning |
| `api_failure_rate` | External API call failure percentage | > 10% | Error |
| `cron_job_failures` | Failed cron jobs in 24 hours | > 3 | Warning |
| `stale_gis_layers` | Time since last GIS refresh | > 48 hours | Info |
| `high_api_latency` | Slow API calls (> 5 seconds) | > 10/hour | Warning |
| `unacknowledged_critical` | Critical alerts requiring attention | > 0 | Critical |

---

## Alert Response Procedures

### Critical Alerts

**Priority**: Immediate (< 15 minutes response)

1. **unacknowledged_critical**
   - Review all critical alerts in dashboard
   - Identify root cause
   - Take corrective action
   - Acknowledge alerts when resolved

### Error Alerts

**Priority**: High (< 1 hour response)

1. **api_failure_rate > 10%**
   - Check `api_logs` for failing endpoints
   - Verify external API availability
   - Check rate limits and quotas
   - Implement circuit breaker if needed

### Warning Alerts

**Priority**: Medium (< 4 hours response)

1. **enrichment_queue_depth > 50**
   - Check `cron-enrichment` job status
   - Review application processing errors
   - Scale up if needed

2. **cron_job_failures > 3**
   - Review failed jobs in history
   - Check error messages
   - Fix and re-run if needed

3. **high_api_latency**
   - Identify slow endpoints
   - Check external service status
   - Consider caching or optimization

### Info Alerts

**Priority**: Low (< 24 hours response)

1. **stale_gis_layers**
   - Manually trigger GIS refresh
   - Check scheduler job status

---

## Metrics Reference

| Metric Name | Unit | Description |
|-------------|------|-------------|
| `credit_reset_count` | subscriptions | Number of subscriptions reset |
| `credit_reset_duration` | ms | Credit reset job duration |
| `cache_cleanup_total` | records | Total records cleaned up |
| `cache_cleanup_duration` | ms | Cleanup job duration |
| `enrichment_queue_depth` | count | Pending applications |
| `api_failure_rate` | percent | API call failure rate |
| `api_latency_p95` | ms | 95th percentile latency |

---

## Escalation Matrix

| Level | Condition | Action |
|-------|-----------|--------|
| L1 | Warning alerts | On-call engineer reviews |
| L2 | Error alerts | Senior engineer notified |
| L3 | Critical alerts | Team lead + incident response |

---

## SLA Definitions

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Uptime | 99.5% | Monthly |
| Enrichment Latency | < 5 minutes | P95 |
| Alert Response | < 15 min (critical) | Mean |
| Job Success Rate | > 95% | Weekly |

---

## Related Documentation

- [ETL Jobs Guide](./ETL_JOBS.md)
- [Backend Index](../BACKEND_INDEX.md)
- [Security Overview](../security/SECURITY_OVERVIEW.md)
