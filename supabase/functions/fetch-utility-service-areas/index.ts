import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Endpoint configurations for parallel statewide utility service area queries
const SERVICE_AREA_ENDPOINTS = {
  twdb: {
    name: 'TWDB Water Service Boundaries',
    url: 'https://services.arcgis.com/4vCeRHZY3Jv9MQ6n/arcgis/rest/services/Texas_Water_Service_Boundary_Viewer/FeatureServer/0/query',
    outFields: ['PWSID', 'PWS_NAME', 'SYSTEM_TYPE', 'OWNER_TYPE', 'POPULATION_SERVED', 'STATUS', 'PWS_CONTACT_PHONE', 'COUNTY_SERVED'],
    coverage: 'statewide'
  },
  austin_water: {
    name: 'Austin Water Utility Service Area',
    url: 'https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/AWU_Waterlines/FeatureServer/0/query',
    outFields: ['DIAMETER', 'MATERIAL', 'STATUS', 'INSTALL_YEAR'],
    coverage: { lat: [30.0, 30.6], lng: [-98.1, -97.4] }
  },
  saws: {
    name: 'San Antonio Water System Service Area',
    url: 'https://services1.arcgis.com/3xr4u4yoHG7TFfbY/arcgis/rest/services/SAWS_Service_Area/FeatureServer/0/query',
    outFields: ['WATER_SVC', 'SEWER_SVC', 'RECLAIMED_SVC', 'SERVICE_AREA_NAME'],
    coverage: { lat: [29.2, 29.7], lng: [-98.8, -98.2] }
  }
};

interface ServiceAreaResult {
  source: string;
  found: boolean;
  provider_name: string | null;
  service_types: string[];
  pws_id?: string;
  confidence: number;
  raw_attributes: Record<string, any>;
  query_time_ms: number;
  error?: string;
}

// Determine service types from attributes
function determineServiceTypes(attrs: Record<string, any>): string[] {
  const types: string[] = [];
  
  // TWDB/PWS - if we found a record, it's a water provider
  if (attrs.PWSID || attrs.PWS_NAME) {
    types.push('water');
  }
  
  // SAWS specific
  if (attrs.WATER_SVC === 'Y' || attrs.WATER_SVC === 'Yes') types.push('water');
  if (attrs.SEWER_SVC === 'Y' || attrs.SEWER_SVC === 'Yes') types.push('sewer');
  if (attrs.RECLAIMED_SVC === 'Y' || attrs.RECLAIMED_SVC === 'Yes') types.push('reclaimed');
  
  // Austin Water - if lines found, water service available
  if (attrs.DIAMETER || attrs.MATERIAL) types.push('water');
  
  return [...new Set(types)];
}

// Map TWDB owner type to our provider type
function mapTWDBOwnerType(ownerType: string | null): string {
  if (!ownerType) return 'unknown';
  const type = ownerType.toLowerCase();
  if (type.includes('municipal') || type.includes('city')) return 'municipal';
  if (type.includes('private')) return 'private';
  if (type.includes('district') || type.includes('mud') || type.includes('wcid')) return 'district';
  if (type.includes('county')) return 'county';
  return 'unknown';
}

async function queryServiceArea(
  key: string,
  endpoint: typeof SERVICE_AREA_ENDPOINTS[keyof typeof SERVICE_AREA_ENDPOINTS],
  lat: number,
  lng: number
): Promise<ServiceAreaResult> {
  const startTime = Date.now();
  
  try {
    // Check geographic coverage for regional endpoints
    if (typeof endpoint.coverage === 'object') {
      const { lat: latRange, lng: lngRange } = endpoint.coverage;
      if (lat < latRange[0] || lat > latRange[1] || lng < lngRange[0] || lng > lngRange[1]) {
        return {
          source: endpoint.name,
          found: false,
          provider_name: null,
          service_types: [],
          confidence: 0,
          raw_attributes: { skipped: 'outside_coverage_area' },
          query_time_ms: Date.now() - startTime
        };
      }
    }

    const params = new URLSearchParams({
      geometry: JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 } }),
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: endpoint.outFields.join(','),
      returnGeometry: 'false',
      f: 'json'
    });

    // For line layers (Austin Water), add distance buffer
    if (key === 'austin_water') {
      params.set('distance', '500');
      params.set('units', 'esriSRUnit_Foot');
    }

    const response = await fetch(`${endpoint.url}?${params}`, {
      headers: { 'User-Agent': 'SiteIntel-Feasibility/1.0' },
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    const queryTime = Date.now() - startTime;

    if (json.error) {
      throw new Error(json.error.message || 'ArcGIS error');
    }

    if (json.features && json.features.length > 0) {
      const attrs = json.features[0].attributes;
      const serviceTypes = determineServiceTypes(attrs);
      
      return {
        source: endpoint.name,
        found: true,
        provider_name: attrs.PWS_NAME || attrs.SERVICE_AREA_NAME || attrs.UTILITY_NAME || 'Unknown Provider',
        service_types: serviceTypes,
        pws_id: attrs.PWSID,
        confidence: key === 'twdb' ? 0.92 : 0.88,
        raw_attributes: attrs,
        query_time_ms: queryTime
      };
    }

    return {
      source: endpoint.name,
      found: false,
      provider_name: null,
      service_types: [],
      confidence: 0,
      raw_attributes: {},
      query_time_ms: queryTime
    };
  } catch (error) {
    console.error(`[${key}] Query error:`, error);
    return {
      source: endpoint.name,
      found: false,
      provider_name: null,
      service_types: [],
      confidence: 0,
      raw_attributes: {},
      query_time_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const traceId = crypto.randomUUID().substring(0, 8);
  console.log(`[${traceId}] fetch-utility-service-areas START`);

  try {
    const { lat, lng, sources } = await req.json();

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'lat and lng are required and must be numbers' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${traceId}] Query location: lat=${lat}, lng=${lng}`);

    // Determine which endpoints to query
    const endpointsToQuery: [string, typeof SERVICE_AREA_ENDPOINTS[keyof typeof SERVICE_AREA_ENDPOINTS]][] = 
      sources && Array.isArray(sources)
        ? Object.entries(SERVICE_AREA_ENDPOINTS).filter(([key]) => sources.includes(key))
        : Object.entries(SERVICE_AREA_ENDPOINTS);

    console.log(`[${traceId}] Querying ${endpointsToQuery.length} endpoints: ${endpointsToQuery.map(([k]) => k).join(', ')}`);

    // Query all endpoints in parallel
    const results = await Promise.all(
      endpointsToQuery.map(([key, endpoint]) => 
        queryServiceArea(key, endpoint, lat, lng).then(result => ({ key, ...result }))
      )
    );

    // Find primary provider (prefer TWDB as regulatory truth anchor)
    const twdbResult = results.find(r => r.key === 'twdb' && r.found);
    const anyFound = results.find(r => r.found);
    const primaryProvider = twdbResult || anyFound;

    // Build consolidated response
    const response = {
      success: true,
      location: { lat, lng },
      results: Object.fromEntries(results.map(r => [r.key, {
        source: r.source,
        found: r.found,
        provider_name: r.provider_name,
        service_types: r.service_types,
        pws_id: r.pws_id,
        confidence: r.confidence,
        query_time_ms: r.query_time_ms,
        error: r.error
      }])),
      primary_provider: primaryProvider?.provider_name || null,
      primary_pws_id: primaryProvider?.pws_id || null,
      has_water: results.some(r => r.found && r.service_types.includes('water')),
      has_sewer: results.some(r => r.found && r.service_types.includes('sewer')),
      has_reclaimed: results.some(r => r.found && r.service_types.includes('reclaimed')),
      sources_queried: results.length,
      sources_matched: results.filter(r => r.found).length,
      total_query_time_ms: Date.now() - startTime
    };

    console.log(`[${traceId}] Complete: ${response.sources_matched}/${response.sources_queried} sources matched in ${response.total_query_time_ms}ms`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[${traceId}] Error:`, errorMsg);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMsg,
      duration_ms: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
