# Data Flow Documentation

Detailed documentation of data pipelines in SiteIntel™ Feasibility.

## Overview

Data flows through three main pipelines:
1. **Application Intake** → Data collection and validation
2. **Enrichment Pipeline** → External API data aggregation
3. **Report Generation** → AI analysis and PDF creation

## 1. Application Intake Flow

### User Submission

```mermaid
flowchart LR
    A[User Form] --> B[Validation]
    B --> C{Valid?}
    C -->|Yes| D[Create Application]
    C -->|No| E[Show Errors]
    D --> F[Queue Enrichment]
    F --> G[Return Application ID]
```

### Data Model

```typescript
interface ApplicationInput {
  // Contact Information
  full_name: string;
  email: string;
  phone: string;
  company: string;
  
  // Property Details
  property_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  lot_size_value: number;
  lot_size_unit: 'acres' | 'sqft';
  existing_improvements: string;
  ownership_status: 'own' | 'contract' | 'looking';
  
  // Project Intent
  project_type: string[];
  intent_type: 'build' | 'buy' | 'sell';
  quality_level: 'standard' | 'professional' | 'premium';
}
```

### Processing Steps

1. **Frontend Validation**
   - Required fields check
   - Format validation (email, phone)
   - Address completeness

2. **Edge Function Processing**
   ```typescript
   // submit-application/index.ts
   const { data: application } = await supabase
     .from('applications')
     .insert({
       ...input,
       status: 'pending',
       enrichment_status: 'queued',
       user_id: user.id,
     })
     .select()
     .single();
   ```

3. **Orchestration Trigger**
   ```typescript
   await supabase.functions.invoke('orchestrate-application', {
     body: { applicationId: application.id }
   });
   ```

## 2. Enrichment Pipeline

### Pipeline Architecture

```mermaid
flowchart TB
    subgraph Stage1["Stage 1: Geocoding"]
        G1[Google Geocoding]
        G2[Place Details]
    end
    
    subgraph Stage2["Stage 2: Parcel Data"]
        P1[HCAD Query]
        P2[FBCAD Query]
        P3[Unified Parcels]
    end
    
    subgraph Stage3["Stage 3: Overlays"]
        O1[FEMA Flood]
        O2[Wetlands]
        O3[EPA ECHO]
        O4[TxDOT AADT]
    end
    
    subgraph Stage4["Stage 4: Context"]
        C1[Demographics]
        C2[Nearby Places]
        C3[Utilities]
    end
    
    Stage1 --> Stage2
    Stage2 --> Stage3
    Stage3 --> Stage4
```

### Enrichment Functions

| Function | Data Source | Output Fields |
|----------|-------------|---------------|
| `geocode-intersection` | Google Geocoding | `geo_lat`, `geo_lng`, `formatted_address` |
| `fetch-hcad-parcels` | HCAD/FBCAD ArcGIS | `parcel_id`, `acreage_cad`, `parcel_owner` |
| `query-fema-by-point` | OpenFEMA | `floodplain_zone`, `base_flood_elevation` |
| `enrich-wetlands` | USFWS NWI | `wetlands_type`, `wetlands_area_pct` |
| `enrich-epa-echo` | EPA ECHO | `epa_facilities_count`, `nearest_facility_dist` |
| `enrich-utilities` | City GIS | `water_lines`, `sewer_lines`, `storm_lines` |
| `fetch-drivetimes` | Google Distance | `drivetimes`, `drive_time_*_population` |

### Error Handling Strategy

```mermaid
flowchart TD
    A[API Call] --> B{Success?}
    B -->|Yes| C[Store Data]
    B -->|No| D{Retries < 3?}
    D -->|Yes| E[Wait & Retry]
    E --> A
    D -->|No| F[Log Warning]
    F --> G[Continue Pipeline]
    G --> H[Add Data Flag]
```

### Data Flags

When data sources fail, flags are added for transparency:

```typescript
interface DataFlags {
  FEMA_API_UNAVAILABLE?: boolean;
  EPA_TIMEOUT?: boolean;
  PARCEL_NOT_FOUND?: boolean;
  WETLANDS_QUERY_FAILED?: boolean;
  // ...
}
```

## 3. Report Generation Flow

### AI Report Pipeline

```mermaid
sequenceDiagram
    participant Orchestrator
    participant AI as generate-ai-report
    participant OpenAI
    participant PDF as generate-pdf
    participant Storage
    participant DB
    
    Orchestrator->>AI: Generate report
    AI->>DB: Fetch application data
    AI->>OpenAI: Generate narratives
    OpenAI-->>AI: Return content
    AI->>DB: Store report JSON
    AI->>PDF: Trigger PDF generation
    PDF->>Storage: Upload PDF
    PDF->>DB: Update report URL
```

### Report Sections

```typescript
interface ReportOutput {
  executive_summary_output: string;
  property_overview_output: string;
  zoning_output: string;
  utilities_output: string;
  traffic_output: string;
  market_output: string;
  costs_output: string;
  schedule_output: string;
  highest_best_use_output: string;
  conclusion_output: string;
}
```

### Scoring Algorithm

```mermaid
flowchart LR
    subgraph Inputs
        Z[Zoning Compatibility]
        F[Flood Risk]
        U[Utility Access]
        T[Traffic Exposure]
        M[Market Conditions]
    end
    
    subgraph Weights
        W1[25%]
        W2[20%]
        W3[20%]
        W4[15%]
        W5[20%]
    end
    
    subgraph Output
        S[Feasibility Score]
        G[Letter Grade]
    end
    
    Z --> W1 --> S
    F --> W2 --> S
    U --> W3 --> S
    T --> W4 --> S
    M --> W5 --> S
    S --> G
```

### Grade Mapping

| Score Range | Grade | Interpretation |
|-------------|-------|----------------|
| 90-100 | A | Excellent feasibility |
| 80-89 | B | Good feasibility |
| 70-79 | C | Moderate feasibility |
| 60-69 | D | Limited feasibility |
| 0-59 | F | Poor feasibility |

## 4. Real-time Updates

### Status Broadcasting

```typescript
// Using Supabase Realtime
const channel = supabase
  .channel('application-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'applications',
      filter: `id=eq.${applicationId}`,
    },
    (payload) => {
      setStatus(payload.new.status);
      setProgress(payload.new.status_percent);
    }
  )
  .subscribe();
```

### Status Transitions

```mermaid
stateDiagram-v2
    [*] --> pending: Created
    pending --> processing: Enrichment started
    processing --> enriched: Data complete
    enriched --> generating: AI started
    generating --> completed: Report ready
    processing --> error: Enrichment failed
    generating --> error: AI failed
    error --> processing: Retry
```

## 5. Caching Strategy

### Cache Layers

| Layer | Implementation | TTL |
|-------|----------------|-----|
| Browser | TanStack Query | 5 min |
| Application | Supabase `cache_expires_at` | Variable |
| Database | Materialized views | On demand |

### Cache Invalidation

```typescript
// Invalidate on data update
await queryClient.invalidateQueries({
  queryKey: ['application', applicationId],
});

// Prefetch related data
await queryClient.prefetchQuery({
  queryKey: ['report', applicationId],
  queryFn: () => fetchReport(applicationId),
});
```

---

**Next**: [Database Schema →](./database-schema.md)
