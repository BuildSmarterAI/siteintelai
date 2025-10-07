# AI Pipeline & LLM Response Blueprint — BuildSmarter™ Feasibility

## 1. AI Pipeline Overview

**Goal**: Deterministically transform normalized parcel/overlay data into a lender-ready report JSON (strict schema) and PDF narrative, with auditable citations and resilient recovery.

### End-to-End Sequence

1. **Intake** (validated) → `applications` row created; job state = `queued`
2. **Enrichment** (GIS/Open data retrieval) → `applications` scalars + `enrichment_raw` JSONB; job = `enriching`
3. **Context packing** → build inputs (normalized scalars), sources[] (datasets + as-of), features[] (compact snippets)
4. **LLM pass #1** → emit schema-conformant report JSON; job = `ai`
5. **Validation** (JSON Schema 2020-12)
   - **Pass** → PDF compose → Storage → signed URLs; job = `rendering` → `complete`
   - **Fail** → guardrail loop (self-correction) then minimal viable JSON fallback; job = `error` only if fallback also fails
6. **Exposed via OData** (read-only): FeasibilityScore, ScoreBand, AsOf, etc.

### Job States (Idempotent)

`queued` → `enriching` → `ai` → `rendering` → `complete` | `error`

**Idempotency**: Each transition writes a monotonic `status_rev` and hash of prior artifacts; re-invocations short-circuit when the same hash is observed.

## 2. Prompt Stack & Context Packing

### 2.1 System Prompt (Verbatim Template)

```
You are a reliability-focused Feasibility AI. Output MUST be valid JSON matching the provided JSON Schema.

- US customary units (ft, mi, $/SF); include a unit label where ambiguous.
- No fabricated sources, endpoints, or figures. Cite ONLY items provided in sources[].
- If a section lacks evidence, set status:"unknown", add a constraints note, and include empty citations:[]
- Keep prose concise, lender-friendly, and free of marketing claims.
- Never output anything outside of JSON.
```

### 2.2 Instruction Prompt (Verbatim Template)

```
TASK: Produce the feasibility report JSON for the parcel context below.

REQUIREMENTS:

1. Conform EXACTLY to the supplied JSON Schema.
2. Compute feasibility_score using the weights block. Derive score_band by thresholds.
3. Each section (zoning, flood, utilities, environmental, cost_schedule) must contain:
   - status, key_findings[], constraints[], risk_mitigation[], citations[]
4. Citations: use only datasets in sources[]. Include dataset, endpoint, query (plain), as_of timestamp.
5. If a datum is unknown, write "unknown" (not null). Populate data_flags accordingly.
6. Keep executive_summary ≤ 120 words.
7. Include a compact figures[] array with rendering hints.
```

### 2.3 Context JSON (Contract Fed to the Model)

```json
{
  "inputs": {
    "address": "123 Sample Rd, Houston, TX",
    "county": "Harris",
    "geo": { "lat": 29.7, "lng": -95.4, "elev_ft": 82 },
    "lot": { "acreage": 2.35, "frontage_ft": 210, "depth_ft": 487 },
    "zoning": {
      "base": "C-2",
      "overlays": ["airport_overlay"],
      "height_ft_max": 65
    },
    "flood": {
      "zone": "AE",
      "bfe_ft": 112,
      "panel_id": "48201CXXXX"
    },
    "utilities": {
      "water_ft": 185,
      "sewer_ft": 240,
      "storm_ft": 120,
      "notes": "Nearest force main 12in"
    },
    "environmental": {
      "wetlands": "none",
      "epa_sites_within_mi": 1,
      "soils": { "series": "Bernard", "drainage": "moderately well" }
    },
    "traffic": {
      "aadt": 24500,
      "year": 2023,
      "segment_name": "FM-####"
    },
    "market": {
      "median_income_5mi": 84500,
      "pop_5mi": 168000
    },
    "timeline": {
      "jurisdiction_permit_months": "6-9"
    },
    "currency": "USD"
  },
  "weights": {
    "zoning": 0.30,
    "flood": 0.20,
    "utilities": 0.20,
    "environmental": 0.10,
    "schedule": 0.10,
    "market": 0.10
  },
  "sources": [
    {
      "dataset": "HCAD Parcels (ID:4)",
      "endpoint": ".../FeatureServer/4/query",
      "query": "OBJECTID=...",
      "as_of": "2025-10-05T21:37Z"
    },
    {
      "dataset": "Unified Parcels (ID:7)",
      "endpoint": ".../FeatureServer/7/query",
      "query": "point intersect",
      "as_of": "2025-10-05T21:37Z"
    },
    {
      "dataset": "OpenFEMA NFHL",
      "endpoint": "https://hazards.fema.gov/...",
      "query": "panel 48201CXXXX",
      "as_of": "2025-10-05T21:37Z",
      "lastDataSetRefresh": "2025-10-04T05:08Z"
    },
    {
      "dataset": "TxDOT AADT",
      "endpoint": ".../aadt-traffic-counts/api",
      "query": "nearest segment 1mi",
      "as_of": "2025-10-05T21:37Z"
    },
    {
      "dataset": "USFWS Wetlands",
      "endpoint": ".../Wetlands/MapServer/0/query",
      "query": "parcel polygon intersect",
      "as_of": "2025-10-05T21:37Z"
    },
    {
      "dataset": "EPA FRS",
      "endpoint": "https://echo.epa.gov/api/facilities",
      "query": "lat/lon radius=1mi",
      "as_of": "2025-10-05T21:37Z"
    }
  ],
  "features": [
    "Nearest Force Main: Diameter: 12 in, Distance: 240 ft, Owner: City",
    "Permit Risk Notes: airport overlay variance maybe required"
  ]
}
```

## 3. Feasibility Report Schema

### Top-Level Properties

| Property         | Type   | Required | Additional Properties |
|------------------|--------|----------|-----------------------|
| summary          | object | Yes      | No                    |
| zoning           | object | Yes      | No                    |
| flood            | object | Yes      | No                    |
| utilities        | object | Yes      | No                    |
| environmental    | object | Yes      | No                    |
| cost_schedule    | object | Yes      | No                    |
| data_sources     | array  | Yes      | No                    |
| figures          | array  | Yes      | No                    |

### Summary Properties

| Property            | Type   | Required | Constraints |
|---------------------|--------|----------|-------------|
| feasibility_score   | number | Yes      | 0-100       |
| score_band          | string | Yes      | A, B, or C  |
| executive_summary   | string | Yes      | ≤ 120 words |

### Score Band Rules

| Feasibility Score Range | Score Band |
|-------------------------|------------|
| 80 and above            | A          |
| 60 to 79.999            | B          |
| Below 60                | C          |

### Section Schema Definition

```json
{
  "$defs": {
    "section": {
      "type": "object",
      "required": ["status", "key_findings", "constraints", "risk_mitigation", "citations"],
      "additionalProperties": false,
      "properties": {
        "status": {
          "type": "string",
          "enum": ["ok", "warning", "critical", "unknown"]
        },
        "key_findings": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 }
        },
        "constraints": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 }
        },
        "risk_mitigation": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 }
        },
        "citations": {
          "type": "array",
          "items": { "$ref": "#/$defs/citation" }
        }
      }
    },
    "citation": {
      "type": "object",
      "required": ["dataset", "endpoint", "query", "as_of"],
      "additionalProperties": false,
      "properties": {
        "dataset": { "type": "string", "minLength": 1 },
        "endpoint": { "type": "string", "minLength": 1 },
        "query": { "type": "string", "minLength": 1 },
        "as_of": { "type": "string", "format": "date-time" },
        "lastDataSetRefresh": { "type": "string", "format": "date-time" }
      }
    },
    "figure": {
      "type": "object",
      "required": ["id", "title", "kind", "source_ref"],
      "additionalProperties": false,
      "properties": {
        "id": { "type": "string", "minLength": 1 },
        "title": { "type": "string", "minLength": 1, "maxLength": 120 },
        "kind": {
          "type": "string",
          "enum": ["parcel_outline", "map_flood_overlay", "nearest_force_main", "utilities_summary"]
        },
        "legend": {
          "type": "array",
          "items": { "type": "string" }
        },
        "source_ref": { "$ref": "#/$defs/citation" }
      }
    }
  }
}
```

## 4. Scoring Function (Deterministic)

### Weights (Configurable Server-Side)

- **Zoning**: 0.30
- **Flood**: 0.20
- **Utilities**: 0.20
- **Environmental**: 0.10
- **Schedule**: 0.10
- **Market**: 0.10

### Component Score Mapping (Each 0–100)

#### Zoning Fit
- Base: 100
- Subtract 30 if use not permitted by right
- Subtract 15 if overlay variance likely
- Subtract 10 if height/setback conflict
- Floor: 0

#### Flood Exposure
- Zone X (outside SFHA): 100
- AE with BFE < site_elev_ft → 70
- AE with BFE ≥ site_elev_ft → 40
- VE/Coastal → 20
- Add +10 if mitigations feasible (detention/FF elevation)

#### Utilities
- Start at 100
- Subtract 5 per 100 ft to nearest available main beyond first 100 ft (cap 40)
- Subtract 20 if any core utility absent

#### Environmental
- Base: 100
- If wetlands intersect → 40
- Each EPA site within 1 mi subtract 10 (min 20)

#### Schedule
- Base: 100
- Reduce by 10 for each gating risk (rezoning, major variance, floodplain dev permit, major off-site utility extension)
- Map to min 30 when ≥4 risks

#### Market/Access
- AADT ≥ 20k → 90
- AADT 10–20k → 75
- AADT <10k → 60
- Adjust ±10 by income vs metro median

### Final Score Calculation

```
score = Σ(weight_i * component_i) → round to nearest integer
```

**Banding**: A ≥ 80, B ≥ 60, else C

### Example Calculation

Given component scores:
- Zoning: 85
- Flood: 70
- Utilities: 80
- Environmental: 80
- Schedule: 70
- Market: 85

```
0.30*85 + 0.20*70 + 0.20*80 + 0.10*80 + 0.10*70 + 0.10*85
= 25.5 + 14 + 16 + 8 + 7 + 8.5
= 79 → Band B
```

## 5. Citation Policy

- **Only cite items present in sources[]**
- Each section must include ≥1 citation or an explicit `"citations":[]` with a constraint note
- Prefer precise dataset naming + layer IDs + the human-readable query basis
- Include `as_of` timestamps and `lastDataSetRefresh` when provided by upstream
- If multiple sources inform a single bullet, list the most authoritative first (e.g., NFHL before third-party tiles)

## 6. Retry / Fallback Orchestration

### Guardrail Loop

1. **Pass 1**: Model emits JSON
2. **Validate** against schema:
   - On fail → compute a diff report (missing/extra keys, type errors, band rule mismatch)
3. **Pass 2** (self-correction): Re-prompt with validator diff and a hard token ceiling
4. **Fallback (MVJ)**: Build Minimal Viable JSON:
   - Populate all sections with `status:"unknown"` where evidence is missing
   - Preserve all citations available
   - Set `data_flags` (e.g., `["schema_retry_1_failed","mvj_fallback_used"]`)

### Error Taxonomy → data_flags

- `zoning_missing`
- `nfhl_unavailable`
- `utilities_unknown`
- `wetlands_query_failed`
- `txdot_aadt_missing`
- `schema_retry_1_failed`
- `schema_retry_2_failed`
- `mvj_fallback_used`

## 7. Hallucination & Token Controls

### Token Control

- Hard limits per section (e.g., `key_findings` ≤ 6 entries; each ≤ 160 chars)
- `executive_summary` ≤ 120 words; strip markdown/HTML

### Do

- State numeric values with units and cite (e.g., "BFE 112 ft — NFHL, as_of …")
- Use "unknown" for unavailable scalars; keep structure intact

### Don't

- Invent zoning codes, flood panels, utilities, or endpoints
- Output external links not provided in `sources[]`
- Expand beyond schema or add narrative outside JSON

### Rounding

- Integers for distances in ft
- 1 decimal for miles
- Currency to nearest whole dollar unless cost banding requires ranges

## 8. Section Templates (Per-Tab Emission)

### 8.1 Zoning (Example)

```json
{
  "status": "warning",
  "key_findings": [
    "Base district C-2 allows intended retail use by-right.",
    "Airport overlay may constrain height to 65 ft; planned 70 ft requires variance."
  ],
  "constraints": [
    "Height variance coordination with airport authority required."
  ],
  "risk_mitigation": [
    "Engage airport planning early; design alternative within 65 ft envelope."
  ],
  "citations": [
    {
      "dataset": "HCAD Parcels (ID:4)",
      "endpoint": ".../FeatureServer/4/query",
      "query": "parcel attrs",
      "as_of": "2025-10-05T21:37Z"
    }
  ]
}
```

### 8.2 Flood (Example)

```json
{
  "status": "warning",
  "key_findings": [
    "FEMA Zone AE on panel 48201CXXXX.",
    "Site elev 82 ft vs BFE 112 ft → FF elevation lift required."
  ],
  "constraints": [
    "No build below BFE; provide detention and FF elevation ≥ BFE."
  ],
  "risk_mitigation": [
    "Elevate finished floor by 36–48 in; integrate compensatory storage."
  ],
  "citations": [
    {
      "dataset": "OpenFEMA NFHL",
      "endpoint": "https://hazards.fema.gov/...",
      "query": "panel lookup",
      "as_of": "2025-10-05T21:37Z",
      "lastDataSetRefresh": "2025-10-04T05:08Z"
    }
  ]
}
```

### 8.3 Utilities (Example)

```json
{
  "status": "ok",
  "key_findings": [
    "Water main ~185 ft; sewer ~240 ft; storm ~120 ft.",
    "Nearest force main 12 in (city owned)."
  ],
  "constraints": [
    "Off-site extension cost if tie-in exceeds 200–300 ft."
  ],
  "risk_mitigation": [
    "Coordinate bore under ROW to reduce restoration."
  ],
  "citations": [
    {
      "dataset": "StormwaterUtilities",
      "endpoint": ".../MapServer",
      "query": "nearest lines",
      "as_of": "2025-10-05T21:37Z"
    },
    {
      "dataset": "Force Main (ID:24)",
      "endpoint": ".../MapServer/24/query",
      "query": "prox within 500 ft",
      "as_of": "2025-10-05T21:37Z"
    }
  ]
}
```

### 8.4 Environmental (Example)

```json
{
  "status": "ok",
  "key_findings": [
    "No wetlands intersect parcel.",
    "One EPA FRS site within 1 mi (no direct impact)."
  ],
  "constraints": [],
  "risk_mitigation": [
    "Phase I ESA prior to close; expand to Phase II only if REC identified."
  ],
  "citations": [
    {
      "dataset": "USFWS Wetlands",
      "endpoint": ".../Wetlands/MapServer/0/query",
      "query": "intersect=false",
      "as_of": "2025-10-05T21:37Z"
    },
    {
      "dataset": "EPA FRS",
      "endpoint": "https://echo.epa.gov/api/facilities",
      "query": "radius=1mi",
      "as_of": "2025-10-05T21:37Z"
    }
  ]
}
```

### 8.5 Cost & Schedule (Example)

```json
{
  "status": "warning",
  "key_findings": [
    "Permit timeline estimated 6–9 months due to overlay coordination.",
    "Floodplain FF elevation lift increases sitework budget."
  ],
  "constraints": [
    "Variance and floodplain approvals extend critical path."
  ],
  "risk_mitigation": [
    "Parallel path variance prep with civil DD; pre-application meeting."
  ],
  "citations": []
}
```

### 8.6 Summary (Exec + Figures) (Example)

```json
{
  "feasibility_score": 79,
  "score_band": "B",
  "executive_summary": "The site is generally feasible for retail use. Zoning permits the use with a probable height adjustment in the airport overlay. Zone AE conditions require elevating finished floor and detention. Utilities are proximate, enabling standard tie-ins. Schedule risk is moderate (6–9 months) due to overlay coordination. Proceed with schematic design and variance screening."
}
```

### Figures Array Example

```json
{
  "figures": [
    {
      "id": "fig_flood_overlay",
      "title": "Parcel with FEMA AE Overlay",
      "kind": "map_flood_overlay",
      "legend": ["Parcel outline", "FEMA AE"],
      "source_ref": {
        "dataset": "OpenFEMA NFHL",
        "endpoint": "https://hazards.fema.gov/...",
        "query": "panel overlay",
        "as_of": "2025-10-05T21:37Z"
      }
    },
    {
      "id": "fig_force_main",
      "title": "Nearest Force Main (12 in) and Storm Line",
      "kind": "nearest_force_main",
      "legend": ["Force main", "Storm drain"],
      "source_ref": {
        "dataset": "Force Main (ID:24)",
        "endpoint": ".../MapServer/24/query",
        "query": "nearest 500 ft",
        "as_of": "2025-10-05T21:37Z"
      }
    }
  ]
}
```

## 10. OData Mapping

### Exposed Fields (Read-Only)

- `FeasibilityScore` (int)
- `ScoreBand` (A/B/C)
- `AsOf` (report created_ts)
- `County`
- `ParcelId`

### Query Examples

```
$select=id,FeasibilityScore,ScoreBand,County&$orderby=FeasibilityScore desc&$top=100

$filter=County eq 'Harris' and ScoreBand eq 'A'

$compute=BandNum as case(ScoreBand eq 'A',3,ScoreBand eq 'B',2,1)
```

### Indexes

- `created_at`
- `county`
- `FeasibilityScore`

## 11. Examples & Golden Tests

### 11.1 Golden Input → Output (Compact)

**Input**: See §2.3 Context JSON

**Expected**:
- Valid JSON per schema
- `feasibility_score = 79`; `score_band = "B"`
- Flood section mentions AE & BFE; cites NFHL
- Utilities distances present; cites Force Main layer
- At least one figure for flood overlay

### 11.2 Validator Pass Log (Example)

- **Pass 1**: fail — `summary.score_band` mismatched vs score
- **Pass 2**: success — corrected band derivation

### 11.3 Fallback Test

- Remove NFHL from `sources[]`
- Flood section → `status:"unknown"`, constraints note, `citations:[]`, add `nfhl_unavailable` to `data_flags`
- Overall JSON remains valid; PDF renders with section header and "evidence unavailable" banner

## Implementation Notes (Runnable Tips)

- Keep the schema co-located with the worker and import for validation; cache the compiled validator
- Store the weights server-side; never embed weights in the prompt
- Log the serialized prompt (minus secrets) and the validator diff for QA replayability
- Cap model temperature ≤ 0.2; enable JSON response mode if available
- Use `google/gemini-2.5-flash` as the default model unless higher reasoning is required
- Implement proper error handling with retry logic and exponential backoff
- Always validate JSON output against schema before PDF generation
- Store raw LLM responses in `enrichment_raw` for audit trail
