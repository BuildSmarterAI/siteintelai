# M. Risk Analysis

> Identified risks and mitigation playbooks

## Risk Matrix

```
┌─────────────────────────────────────────────────────────────┐
│                      RISK MATRIX                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Impact                                                      │
│    ▲                                                         │
│    │                                                         │
│  H │  R3 ●──────────────────● R1                            │
│  i │     │                  │                                │
│  g │     │      R5 ●        │                                │
│  h │     │                  │                                │
│    ├─────┼──────────────────┼─────────                       │
│  M │     │        R4 ●      │  R2 ●                         │
│  e │     │                  │                                │
│  d │  R7 ●                  │                                │
│    │                 R6 ●   │                                │
│    ├─────┼──────────────────┼─────────                       │
│  L │     │                  │                                │
│  o │     │                  │                                │
│  w │     │                  │                                │
│    └─────┴──────────────────┴───────────▶                    │
│         Low      Medium      High                            │
│                Probability                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘

R1: API Provider Outage       R5: Security Breach
R2: Database Performance      R6: Deployment Failure
R3: Payment System Failure    R7: Team Knowledge Loss
R4: Data Quality Issues
```

---

## Risk Register

### R1: External API Provider Outage

| Attribute | Value |
|-----------|-------|
| **ID** | R1 |
| **Category** | Technical |
| **Probability** | High |
| **Impact** | High |
| **Risk Score** | Critical |

**Description**: External APIs (Google, FEMA, EPA, ArcGIS) may become unavailable, preventing data enrichment.

**Triggers**:
- API service degradation
- Rate limiting
- Provider maintenance
- Network issues

**Mitigation Strategies**:

1. **Caching Layer**
   ```typescript
   // Implement aggressive caching
   const CACHE_TTL = {
     parcels: 30 * 24 * 60 * 60 * 1000,    // 30 days
     flood_zones: 90 * 24 * 60 * 60 * 1000, // 90 days
     demographics: 365 * 24 * 60 * 60 * 1000, // 1 year
   };
   ```

2. **Fallback Data Sources**
   - Primary: ArcGIS → Fallback: OSM
   - Primary: Google Places → Fallback: OpenStreetMap Nominatim

3. **Circuit Breaker Pattern**
   ```typescript
   const circuitBreaker = {
     state: 'CLOSED',
     failureCount: 0,
     threshold: 5,
     timeout: 60000, // 1 minute
     
     async call(fn) {
       if (this.state === 'OPEN') {
         throw new Error('Circuit breaker open');
       }
       try {
         const result = await fn();
         this.reset();
         return result;
       } catch (error) {
         this.recordFailure();
         throw error;
       }
     }
   };
   ```

**Response Playbook**:
1. Monitor: Check API status dashboards
2. Notify: Alert team via Slack
3. Activate: Enable cached/fallback data
4. Communicate: Update status page
5. Recover: Gradually restore when API returns

---

### R2: Database Performance Degradation

| Attribute | Value |
|-----------|-------|
| **ID** | R2 |
| **Category** | Technical |
| **Probability** | Medium |
| **Impact** | High |
| **Risk Score** | High |

**Description**: PostgreSQL performance may degrade under load, causing slow queries and timeouts.

**Triggers**:
- High concurrent users
- Large data volumes
- Missing indexes
- Complex queries

**Mitigation Strategies**:

1. **Query Optimization**
   ```sql
   -- Add indexes for common queries
   CREATE INDEX idx_applications_user_status 
   ON applications(user_id, status);
   
   CREATE INDEX idx_reports_app_created 
   ON reports(application_id, created_at DESC);
   
   -- Spatial indexes
   CREATE INDEX idx_parcels_geometry 
   ON drawn_parcels USING GIST(geometry);
   ```

2. **Connection Pooling**
   - Supabase handles this automatically
   - Monitor connection count in dashboard

3. **Query Monitoring**
   ```sql
   -- Find slow queries
   SELECT query, calls, mean_time, total_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 20;
   ```

**Response Playbook**:
1. Identify: Check slow query logs
2. Analyze: Run EXPLAIN ANALYZE
3. Optimize: Add indexes or rewrite query
4. Scale: Upgrade Supabase instance if needed
5. Monitor: Set up alerts for query duration

---

### R3: Payment System Failure

| Attribute | Value |
|-----------|-------|
| **ID** | R3 |
| **Category** | Business |
| **Probability** | Low |
| **Impact** | High |
| **Risk Score** | High |

**Description**: Stripe integration failure could prevent payments and affect revenue.

**Triggers**:
- Stripe API outage
- Webhook misconfiguration
- Authentication issues
- Network failures

**Mitigation Strategies**:

1. **Webhook Resilience**
   ```typescript
   // Idempotent webhook handling
   async function handleWebhook(event: Stripe.Event) {
     // Check if already processed
     const existing = await supabase
       .from('payment_history')
       .select('id')
       .eq('stripe_session_id', event.id)
       .single();
     
     if (existing.data) {
       console.log('Event already processed');
       return;
     }
     
     // Process event...
   }
   ```

2. **Retry Logic**
   - Stripe retries webhooks automatically
   - Log failed webhooks for manual review

3. **Status Monitoring**
   - Monitor Stripe status page
   - Set up alerts for webhook failures

**Response Playbook**:
1. Detect: Monitor webhook success rate
2. Diagnose: Check Stripe dashboard for failures
3. Retry: Use Stripe's retry webhook feature
4. Manual: Process critical payments manually
5. Communicate: Notify affected customers

---

### R4: Data Quality Issues

| Attribute | Value |
|-----------|-------|
| **ID** | R4 |
| **Category** | Data |
| **Probability** | Medium |
| **Impact** | Medium |
| **Risk Score** | Medium |

**Description**: Incorrect or outdated data from external sources could lead to inaccurate reports.

**Triggers**:
- Stale cached data
- API response changes
- Data source errors
- Parsing failures

**Mitigation Strategies**:

1. **Data Validation**
   ```typescript
   function validateParcelData(data: unknown): ParcelData {
     const schema = z.object({
       owner_name: z.string().min(1),
       acreage: z.number().positive(),
       geo_lat: z.number().min(-90).max(90),
       geo_lng: z.number().min(-180).max(180),
     });
     
     return schema.parse(data);
   }
   ```

2. **Data Freshness Tracking**
   ```typescript
   interface DataWithMetadata {
     data: unknown;
     fetchedAt: Date;
     source: string;
     confidence: 'high' | 'medium' | 'low';
   }
   ```

3. **Human Review for Critical Data**
   - Flag unusual values for manual review
   - Require confirmation for high-stakes reports

**Response Playbook**:
1. Detect: User reports inaccuracy
2. Investigate: Trace data source
3. Correct: Update cached data
4. Notify: Alert affected users
5. Prevent: Add validation rule

---

### R5: Security Breach

| Attribute | Value |
|-----------|-------|
| **ID** | R5 |
| **Category** | Security |
| **Probability** | Low |
| **Impact** | Critical |
| **Risk Score** | High |

**Description**: Unauthorized access to user data or system compromise.

**Triggers**:
- SQL injection
- XSS attacks
- Credential theft
- Misconfigured permissions

**Mitigation Strategies**:

1. **Input Validation**
   ```typescript
   // Validate all user inputs
   function sanitizeInput(input: string): string {
     // Remove potential SQL injection
     if (/['";--]/.test(input)) {
       throw new Error('Invalid characters in input');
     }
     // Limit length
     return input.slice(0, 1000);
   }
   ```

2. **Row Level Security**
   ```sql
   -- Users can only see their own data
   CREATE POLICY "Users can view own applications"
   ON applications FOR SELECT
   USING (auth.uid() = user_id);
   ```

3. **Security Headers**
   ```typescript
   const securityHeaders = {
     'X-Content-Type-Options': 'nosniff',
     'X-Frame-Options': 'DENY',
     'X-XSS-Protection': '1; mode=block',
     'Strict-Transport-Security': 'max-age=31536000',
   };
   ```

**Response Playbook**:
1. Detect: Security monitoring alert
2. Contain: Disable affected accounts/endpoints
3. Investigate: Review logs, identify scope
4. Eradicate: Patch vulnerability
5. Recover: Restore from clean backup
6. Report: Notify affected users if required

---

### R6: Deployment Failure

| Attribute | Value |
|-----------|-------|
| **ID** | R6 |
| **Category** | Operations |
| **Probability** | Medium |
| **Impact** | Low |
| **Risk Score** | Low |

**Description**: Failed deployments causing downtime or broken features.

**Triggers**:
- Build failures
- Configuration errors
- Dependency issues
- Network timeouts

**Mitigation Strategies**:

1. **CI/CD Pipeline**
   - All changes go through CI
   - Required status checks before merge

2. **Rollback Capability**
   ```bash
   # Quick rollback procedure
   git revert HEAD
   git push origin main
   # Automatic deployment triggers
   ```

3. **Feature Flags**
   ```typescript
   const isFeatureEnabled = await checkFeatureFlag('new-report-format');
   if (isFeatureEnabled) {
     return <NewReportFormat />;
   }
   return <LegacyReportFormat />;
   ```

**Response Playbook**:
1. Detect: Deployment notification failure
2. Assess: Check if production is affected
3. Rollback: Revert to previous version
4. Fix: Address build issue
5. Redeploy: Careful staged rollout

---

### R7: Team Knowledge Loss

| Attribute | Value |
|-----------|-------|
| **ID** | R7 |
| **Category** | Organizational |
| **Probability** | Low |
| **Impact** | Medium |
| **Risk Score** | Medium |

**Description**: Key team members leaving without knowledge transfer.

**Triggers**:
- Employee departure
- Sudden unavailability
- Poor documentation

**Mitigation Strategies**:

1. **Comprehensive Documentation**
   - This documentation suite
   - Code comments for complex logic
   - Decision records (ADRs)

2. **Code Reviews**
   - All changes reviewed by 2+ people
   - Knowledge sharing through reviews

3. **Pair Programming**
   - Critical systems built in pairs
   - Regular knowledge sharing sessions

**Response Playbook**:
1. Document: Ensure exit documentation
2. Transfer: Pair with remaining team
3. Hire: Prioritize replacement
4. Review: Update bus factor analysis

---

## Risk Monitoring Dashboard

| Risk | Status | Last Review | Owner |
|------|--------|-------------|-------|
| R1: API Outage | 🟢 Normal | 2025-12-01 | DevOps |
| R2: DB Performance | 🟢 Normal | 2025-12-01 | Backend |
| R3: Payment | 🟢 Normal | 2025-12-01 | Backend |
| R4: Data Quality | 🟡 Monitor | 2025-12-01 | QA |
| R5: Security | 🟢 Normal | 2025-12-01 | Security |
| R6: Deployment | 🟢 Normal | 2025-12-01 | DevOps |
| R7: Knowledge | 🟡 Monitor | 2025-12-01 | Management |

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| SEV1 | Critical - System down | 15 minutes | Complete outage |
| SEV2 | High - Major feature broken | 1 hour | Payments failing |
| SEV3 | Medium - Degraded service | 4 hours | Slow queries |
| SEV4 | Low - Minor issue | 24 hours | UI bug |

### Incident Workflow

```
Detection → Triage → Response → Resolution → Postmortem
    │          │         │          │            │
    ▼          ▼         ▼          ▼            ▼
 Alert    Severity   Mitigation   Fix &     Document
 Fired    Assigned   Applied     Deploy     Learnings
```
