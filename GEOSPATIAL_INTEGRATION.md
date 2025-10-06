# BuildSmarter™ Geospatial Intelligence Integration

## Overview

The geospatial intelligence system provides structured spatial analysis for parcels, computing feasibility scores based on county boundaries, FEMA flood risk, and traffic exposure.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Ingestion Layer                      │
├─────────────────────────────────────────────────────────────┤
│  fetch-geospatial-layers (Edge Function)                    │
│  ├─ Harris County Boundaries (HCAD)                         │
│  ├─ Fort Bend County Boundaries (FBCAD)                     │
│  ├─ Montgomery County Boundaries (MCAD)                     │
│  ├─ FEMA NFHL Flood Zones (OpenFEMA)                        │
│  └─ TxDOT Traffic Segments (AADT)                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Storage Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Supabase Tables:                                            │
│  ├─ county_boundaries                                        │
│  ├─ fema_flood_zones                                         │
│  └─ txdot_traffic_segments                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Processing Layer                            │
├─────────────────────────────────────────────────────────────┤
│  compute-geospatial-score (Edge Function)                   │
│  ├─ Spatial Point-in-Polygon Tests                          │
│  ├─ Distance Calculations                                    │
│  ├─ Risk Index Computation                                   │
│  └─ Composite Score Generation                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Output Layer                              │
├─────────────────────────────────────────────────────────────┤
│  feasibility_geospatial table                                │
│  └─ Structured JSON following schema                         │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Tables Created

#### 1. `county_boundaries`
Stores county polygon geometries for jurisdictional matching.

```sql
- id (UUID, primary key)
- county_name (TEXT, unique)
- geometry (JSONB, GeoJSON polygon)
- source (TEXT: HCAD, FBCAD, or MCAD)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 2. `fema_flood_zones`
Stores FEMA flood hazard zone polygons.

```sql
- id (UUID, primary key)
- fema_id (TEXT, unique)
- zone (TEXT: AE, VE, X, etc.)
- geometry (JSONB, GeoJSON polygon)
- source (TEXT: OpenFEMA or NFHL)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 3. `txdot_traffic_segments`
Stores TxDOT AADT traffic data as line geometries.

```sql
- id (UUID, primary key)
- segment_id (TEXT, unique)
- aadt (INTEGER: Annual Average Daily Traffic)
- year (INTEGER)
- roadway (TEXT)
- geometry (JSONB, GeoJSON linestring)
- source (TEXT: TxDOT)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 4. `feasibility_geospatial`
Stores computed geospatial intelligence for each parcel.

```sql
- id (UUID, primary key)
- parcel_id (TEXT, unique)
- application_id (UUID, foreign key → applications)
- location (JSONB: {lat, lng})
- county_boundary (JSONB: structured county data)
- fema_flood_risk (JSONB: structured flood data)
- traffic_exposure (JSONB: structured traffic data)
- geospatial_score (JSONB: computed scores)
- created_at, updated_at (TIMESTAMPTZ)
```

## Edge Functions

### 1. `fetch-geospatial-layers`

**Purpose:** Fetch and store county boundaries, FEMA flood zones, and TxDOT traffic data.

**Endpoint:**
```
POST https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/fetch-geospatial-layers
```

**Usage:**
```bash
curl -X POST https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/fetch-geospatial-layers
```

**Response:**
```json
{
  "success": true,
  "message": "All layers fetched and updated successfully.",
  "results": [
    {
      "type": "county",
      "county_name": "Harris County",
      "source": "HCAD",
      "updated_at": "2025-10-06T00:00:00Z"
    },
    {
      "type": "fema",
      "record_count": 1523,
      "source": "OpenFEMA"
    },
    {
      "type": "txdot",
      "record_count": 1847,
      "source": "TxDOT"
    }
  ]
}
```

**Recommended Schedule:** Run daily or weekly to keep geospatial data fresh.

### 2. `compute-geospatial-score`

**Purpose:** Compute structured geospatial intelligence for a specific parcel location.

**Endpoint:**
```
POST https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/compute-geospatial-score
```

**Request Body:**
```json
{
  "application_id": "938cbddb-bd82-4581-a61c-50c59249042c",
  "parcel_id": "HCAD-0812345670001",
  "lat": 29.7633,
  "lng": -95.3633
}
```

**Response:**
```json
{
  "success": true,
  "score": 74.3,
  "data": {
    "id": "...",
    "parcel_id": "HCAD-0812345670001",
    "location": { "lat": 29.7633, "lng": -95.3633 },
    "county_boundary": {
      "county_name": "Harris County",
      "source": "HCAD",
      "geometry_ref": "8b41cf4d-5e90-4a67-b93d-cb97a1e6d58d",
      "updated_at": "2025-10-06T00:00:00Z"
    },
    "fema_flood_risk": {
      "in_flood_zone": true,
      "zone_code": "AE",
      "bfe": null,
      "source": "OpenFEMA",
      "geometry_ref": "2ac54c9f-d2c2-4338-bc0f-98d324c5fe1f",
      "last_refreshed": "2025-10-06T00:00:00Z"
    },
    "traffic_exposure": {
      "nearest_segment_id": 18792,
      "roadway_name": "US 59",
      "aadt": 214000,
      "year": 2024,
      "distance_to_segment_ft": 320,
      "source": "TxDOT",
      "geometry_ref": "c92fd0e9-8f54-4f3b-b5f9-14a3f4c6d1f0",
      "updated_at": "2025-10-06T00:00:00Z"
    },
    "geospatial_score": {
      "jurisdiction_confidence": 0.99,
      "flood_risk_index": 0.65,
      "traffic_visibility_index": 0.88,
      "overall_geospatial_score": 74.3,
      "scoring_notes": "Moderate flood exposure, excellent traffic visibility."
    }
  }
}
```

## Integration with Existing Pipeline

### Option 1: Call from `enrich-feasibility` Edge Function

Add to the end of the enrichment flow:

```typescript
// After all enrichment is complete
const { data: geoScore } = await supabase.functions.invoke('compute-geospatial-score', {
  body: {
    application_id: application_id,
    parcel_id: enrichedData.parcel_id,
    lat: enrichedData.geo_lat,
    lng: enrichedData.geo_lng
  }
});

console.log('Geospatial score computed:', geoScore?.score);
```

### Option 2: Call from Frontend After Submission

```typescript
// After successful application submission
const response = await supabase.functions.invoke('compute-geospatial-score', {
  body: {
    application_id: result.id,
    parcel_id: formData.parcel_id,
    lat: formData.geoLat,
    lng: formData.geoLng
  }
});
```

### Option 3: Background Job (Recommended)

Use Supabase background tasks to compute scores asynchronously:

```typescript
// In enrich-feasibility function
EdgeRuntime.waitUntil(
  supabase.functions.invoke('compute-geospatial-score', {
    body: { application_id, parcel_id, lat, lng }
  })
);
```

## Scoring Algorithm

### Composite Score Calculation

```
Overall Score = (Jurisdiction × 10%) + ((1 - FloodRisk) × 40%) + (Traffic × 50%)
```

#### Components:

1. **Jurisdiction Confidence** (10% weight)
   - 0.99 if parcel is within a known county boundary
   - 0.50 if no county match found

2. **Flood Risk Index** (40% weight, inverse)
   - 0.8 for high-risk zones (AE, VE, A, AO, AH)
   - 0.5 for moderate zones
   - 0.2 for minimal risk zones (X, 0.2% annual chance)
   - Note: Score uses (1 - flood_risk) so lower risk = higher score

3. **Traffic Visibility Index** (50% weight)
   - Normalized based on AADT:
     - 100k+ AADT = 1.0 (excellent visibility)
     - 50k AADT = 0.5 (moderate visibility)
     - 10k AADT = 0.1 (low visibility)
   - Must be within 5000 ft of parcel

### Example Scores

- **Urban Commercial (High Traffic, Flood Zone):** ~65-75
- **Suburban Residential (Moderate Traffic, No Flood):** ~70-85
- **Rural Development (Low Traffic, No Flood):** ~45-60

## Refresh Strategy

### Daily Updates (Recommended)
```bash
# Cron job or scheduled task
curl -X POST https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/fetch-geospatial-layers
```

### Selective Refresh
- **County boundaries:** Weekly (rarely change)
- **FEMA flood zones:** Monthly (updated periodically)
- **TxDOT traffic:** Daily (counts update frequently)

## Visualization

The geospatial data can be visualized using Mapbox, Leaflet, or other mapping libraries:

```typescript
// Example: Display flood zones on map
const { data: floodZones } = await supabase
  .from('fema_flood_zones')
  .select('zone, geometry');

floodZones.forEach(zone => {
  map.addLayer({
    id: `flood-${zone.id}`,
    type: 'fill',
    source: {
      type: 'geojson',
      data: zone.geometry
    },
    paint: {
      'fill-color': zone.zone === 'AE' ? '#ff0000' : '#ffff00',
      'fill-opacity': 0.3
    }
  });
});
```

## Troubleshooting

### No County Match
- Verify coordinates are within Texas
- Check that `fetch-geospatial-layers` has run successfully
- Inspect `county_boundaries` table for data

### No Traffic Data
- TxDOT data may not cover rural areas
- Increase search radius (currently 5000 ft)
- Check `txdot_traffic_segments` table for coverage

### FEMA Data Missing
- OpenFEMA API may have rate limits
- Some locations may not have mapped flood zones
- Check API response in logs

## API Documentation

See `geospatial_layers.schema.json` for the complete JSON schema definition.

## Support

For issues or questions, check the edge function logs:
- [fetch-geospatial-layers logs](https://supabase.com/dashboard/project/mcmfwlgovubpdcfiqfvk/functions/fetch-geospatial-layers/logs)
- [compute-geospatial-score logs](https://supabase.com/dashboard/project/mcmfwlgovubpdcfiqfvk/functions/compute-geospatial-score/logs)
