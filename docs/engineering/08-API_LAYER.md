# H. API Layer

> Supabase integration, edge functions, and external APIs

## Supabase Client

### Initialization

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mcmfwlgovubpdcfiqfvk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGci...";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
```

### Database Operations

```typescript
// SELECT with filters
const { data, error } = await supabase
  .from('applications')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// INSERT
const { data, error } = await supabase
  .from('applications')
  .insert({
    user_id: userId,
    formatted_address: address,
    status: 'pending'
  })
  .select()
  .single();

// UPDATE
const { data, error } = await supabase
  .from('applications')
  .update({ status: 'completed' })
  .eq('id', applicationId)
  .select()
  .single();

// DELETE
const { error } = await supabase
  .from('applications')
  .delete()
  .eq('id', applicationId);

// JOIN query
const { data, error } = await supabase
  .from('reports')
  .select(`
    *,
    applications (
      formatted_address,
      geo_lat,
      geo_lng
    )
  `)
  .eq('user_id', userId);
```

### Realtime Subscriptions

```typescript
// Subscribe to changes
const channel = supabase
  .channel('applications_changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'applications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Change received:', payload);
      // Handle INSERT, UPDATE, DELETE
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

---

## Edge Functions

### Function Structure

```typescript
// supabase/functions/{function-name}/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { param1, param2 } = await req.json();
    
    // Validate inputs
    if (!param1) {
      return new Response(
        JSON.stringify({ error: 'param1 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Business logic
    const result = await processData(param1, param2);
    
    // Return success
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Calling Edge Functions

```typescript
// From frontend
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { param1: 'value1', param2: 'value2' }
});

if (error) {
  console.error('Function error:', error);
  throw error;
}

console.log('Result:', data);
```

### Authentication in Edge Functions

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Get auth header
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'No authorization header' }),
      { status: 401, headers: corsHeaders }
    );
  }

  // Create authenticated client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: { headers: { Authorization: authHeader } }
    }
  );

  // Get user from JWT
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    );
  }

  // User is authenticated, proceed...
});
```

---

## Edge Function Catalog

### Orchestration Functions

| Function | Method | Purpose |
|----------|--------|---------|
| `orchestrate-application` | POST | Main state machine for processing |
| `submit-application` | POST | Initial application submission |

### Enrichment Functions

| Function | Method | Purpose |
|----------|--------|---------|
| `enrich-feasibility` | POST | Core data enrichment |
| `enrich-utilities` | POST | Utility infrastructure data |
| `enrich-utilities-osm` | POST | OSM fallback for utilities |
| `enrich-wetlands` | POST | USFWS wetlands data |
| `enrich-epa-echo` | POST | EPA facility data |
| `query-fema-by-point` | POST | FEMA flood zone lookup |

### Report Functions

| Function | Method | Purpose |
|----------|--------|---------|
| `generate-ai-report` | POST | AI analysis generation |
| `generate-pdf` | POST | PDF rendering |
| `generate-quick-check` | POST | QuickCheck report |
| `get-sanitized-report` | POST | Public report view |
| `chat-with-report` | POST | AI chat about report |

### Payment Functions

| Function | Method | Purpose |
|----------|--------|---------|
| `create-checkout-session` | POST | Stripe checkout |
| `create-subscription` | POST | New subscription |
| `stripe-webhook` | POST | Webhook handler |
| `customer-portal` | POST | Billing portal URL |
| `use-credit` | POST | Deduct credits |
| `get-credits` | POST | Check balance |

### GIS Functions

| Function | Method | Purpose |
|----------|--------|---------|
| `fetch-geospatial-layers` | POST | Layer fetching |
| `fetch-hcad-parcels` | POST | Harris County parcels |
| `compute-geospatial-score` | POST | Score calculation |

---

## External API Integrations

### Google Places API

```typescript
// Autocomplete
const { data } = await supabase.functions.invoke('google-places', {
  body: {
    input: 'search query',
    sessionToken: 'unique-session-token'
  }
});

// Place Details
const { data } = await supabase.functions.invoke('google-place-details', {
  body: {
    placeId: 'ChIJ...',
    sessionToken: 'unique-session-token'
  }
});

// Returns:
// - formatted_address
// - geometry (lat/lng)
// - address_components
```

### ArcGIS Parcel Services

```typescript
// HCAD (Harris County)
const url = 'https://gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query';
const params = new URLSearchParams({
  geometry: `${lng},${lat}`,
  geometryType: 'esriGeometryPoint',
  spatialRel: 'esriSpatialRelWithin',
  outFields: 'owner_name_1,acreage_1,tot_market_val',
  returnGeometry: 'true',
  f: 'geojson'
});

const response = await fetch(`${url}?${params}`);
const data = await response.json();

// FBCAD (Fort Bend County)
const fbcadUrl = 'https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0/query';
```

### FEMA OpenFEMA API

```typescript
// Flood zone lookup
const url = 'https://www.fema.gov/api/open/v2/FimaNfipClaims';
const params = new URLSearchParams({
  '$filter': `state eq 'TX' and county eq '${county}'`,
  '$select': 'yearOfLoss,amountPaid,latitude,longitude',
  '$top': '1000'
});

const response = await fetch(`${url}?${params}`);
const data = await response.json();
```

### EPA ECHO API

```typescript
// Facility search
const url = 'https://echo.epa.gov/tools/web-services/facility_search';
const params = new URLSearchParams({
  output: 'JSON',
  p_lat: lat.toString(),
  p_long: lng.toString(),
  p_radius: '1',
  p_program: 'all'
});

const response = await fetch(`${url}?${params}`);
const data = await response.json();
```

### TxDOT AADT

```typescript
// Traffic data
const url = 'https://services.arcgis.com/.../AADT_Traffic_Counts/FeatureServer/0/query';
const params = new URLSearchParams({
  geometry: `${xmin},${ymin},${xmax},${ymax}`,
  geometryType: 'esriGeometryEnvelope',
  spatialRel: 'esriSpatialRelIntersects',
  outFields: 'TRFC_STATN_ID,AADT_RPT_QTY,AADT_RPT_YEAR',
  returnGeometry: 'true',
  f: 'json'
});

const response = await fetch(`${url}?${params}`);
const data = await response.json();
```

---

## Error Handling

### Standard Error Response

```typescript
interface APIError {
  success: false;
  error: string;        // Human-readable message
  code?: string;        // Error code for programmatic handling
  details?: unknown;    // Additional details (dev only)
}

// Example error responses
{ success: false, error: 'Invalid address', code: 'INVALID_ADDRESS' }
{ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }
{ success: false, error: 'Rate limit exceeded', code: 'RATE_LIMITED' }
```

### Error Handling Pattern

```typescript
// In React component
try {
  const { data, error } = await supabase.functions.invoke('my-function', {
    body: { ... }
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Unknown error');
  }

  // Success
  toast.success('Operation completed');
  return data.data;
  
} catch (error) {
  console.error('Operation failed:', error);
  toast.error(error instanceof Error ? error.message : 'Operation failed');
  throw error;
}
```

### Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, delayMs * Math.pow(2, attempt - 1))
        );
      }
    }
  }
  
  throw lastError!;
}

// Usage
const data = await withRetry(() => 
  supabase.functions.invoke('flaky-endpoint', { body: {} })
);
```

---

## Rate Limiting

### External API Limits

| API | Rate Limit | Strategy |
|-----|------------|----------|
| Google Places | 100 QPS | Client-side throttle |
| FEMA OpenFEMA | ~5 QPS | Server-side queue |
| EPA ECHO | Not published | Conservative delays |
| ArcGIS | Varies | Cache responses |

### Caching Strategy

```typescript
// Check cache first
const cacheKey = `parcel:${lat}:${lng}`;
const cached = await supabase
  .from('api_logs')
  .select('*')
  .eq('cache_key', cacheKey)
  .gt('expires_at', new Date().toISOString())
  .single();

if (cached.data) {
  return cached.data;
}

// Make API call
const result = await fetchFromAPI();

// Store in cache
await supabase.from('api_logs').insert({
  cache_key: cacheKey,
  source: 'arcgis',
  endpoint: '/parcels',
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  success: true,
  duration_ms: 150
});

return result;
```
