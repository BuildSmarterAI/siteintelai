import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Municipal cities with their own water service
const MUNICIPAL_WATER_CITIES = ['houston', 'sugar land', 'pearland', 'pasadena', 'baytown', 'league city', 'friendswood', 'missouri city', 'stafford'];

// ArcGIS endpoints for MUD/WCID queries
const MUD_ENDPOINT = 'https://geo.hcad.org/arcgis/rest/services/Boundaries/MUD_Boundaries/FeatureServer/0/query';
const WCID_ENDPOINT = 'https://geo.hcad.org/arcgis/rest/services/Boundaries/WCID_Boundaries/FeatureServer/0/query';

interface UtilityProvider {
  provider_id: string | null;
  provider_name: string;
  provider_type: 'ccn' | 'mud' | 'wcid' | 'municipal' | 'private' | 'unknown';
  ccn_number: string | null;
  resolution_method: string;
  confidence: number;
  capacity_status: string | null;
  contact_phone: string | null;
  district_no: string | null;
}

interface ResolutionResult {
  water_provider: UtilityProvider | null;
  sewer_provider: UtilityProvider | null;
  storm_provider: UtilityProvider | null;
  resolution_confidence: number;
  has_conflicts: boolean;
  conflict_details: any[];
  estimated_costs: {
    water_tap: number | null;
    sewer_tap: number | null;
    impact_fees: number | null;
    total: number | null;
  };
  serviceability: {
    water: string;
    sewer: string;
  };
  special_districts: any[];
  kill_factors: string[];
  cached: boolean;
}

// Generate trace ID
function generateTraceId(): string {
  return crypto.randomUUID().substring(0, 8);
}

// Check cache for existing resolution
async function checkCache(lat: number, lng: number, toleranceMeters: number = 100): Promise<any | null> {
  try {
    const { data, error } = await supabase.rpc('get_cached_utility_assignment', {
      p_lat: lat,
      p_lng: lng,
      p_tolerance_meters: toleranceMeters
    });
    
    if (error) {
      console.log('[cache] RPC error:', error.message);
      return null;
    }
    
    if (data && data.length > 0) {
      const cached = data[0];
      // Check if cache is still valid (not expired)
      if (cached.expires_at && new Date(cached.expires_at) > new Date()) {
        console.log('[cache] Cache hit for location');
        return cached;
      }
    }
    
    return null;
  } catch (err) {
    console.error('[cache] Exception:', err);
    return null;
  }
}

// Query CCN boundaries from utilities_ccn_canonical
async function queryCCNBoundaries(lat: number, lng: number): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc('get_utility_providers_for_point', {
      p_lat: lat,
      p_lng: lng
    });
    
    if (error) {
      console.error('[ccn] RPC error:', error.message);
      return [];
    }
    
    console.log(`[ccn] Found ${data?.length || 0} CCN boundaries`);
    return data || [];
  } catch (err) {
    console.error('[ccn] Exception:', err);
    return [];
  }
}

// Query ArcGIS endpoint for MUD/WCID
async function queryArcGISBoundary(endpoint: string, lat: number, lng: number, type: string): Promise<any | null> {
  try {
    const params = new URLSearchParams({
      geometry: JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 } }),
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: '*',
      returnGeometry: 'false',
      f: 'json'
    });
    
    const url = `${endpoint}?${params.toString()}`;
    console.log(`[${type}] Querying:`, url);
    
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'SiteIntel-Feasibility/1.0',
        'Referer': 'https://siteintel.ai'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!resp.ok) {
      console.error(`[${type}] HTTP ${resp.status}`);
      return null;
    }
    
    const json = await resp.json();
    
    if (json.error) {
      console.error(`[${type}] API error:`, json.error);
      return null;
    }
    
    if (json.features && json.features.length > 0) {
      const feature = json.features[0];
      console.log(`[${type}] Found:`, feature.attributes);
      return {
        type,
        attributes: feature.attributes,
        district_no: feature.attributes.DISTRICT_NO || feature.attributes.MUD_NO || feature.attributes.WCID_NO || null,
        name: feature.attributes.NAME || feature.attributes.DISTRICT_NAME || `${type} District`,
        has_water: feature.attributes.HAS_WATER === 'Y' || feature.attributes.WATER_SERVICE === 'Y' || true,
        has_sewer: feature.attributes.HAS_SEWER === 'Y' || feature.attributes.SEWER_SERVICE === 'Y' || true
      };
    }
    
    console.log(`[${type}] No boundary found at location`);
    return null;
  } catch (err) {
    console.error(`[${type}] Exception:`, err);
    return null;
  }
}

// Resolve water provider using priority rules
function resolveWaterProvider(
  ccnResults: any[],
  mudResult: any | null,
  wcidResult: any | null,
  city: string | null
): UtilityProvider | null {
  // Priority 1: CCN water boundary (highest legal authority)
  const ccnWater = ccnResults.find(c => c.ccn_type?.toLowerCase() === 'water' || c.service_type?.toLowerCase().includes('water'));
  if (ccnWater) {
    return {
      provider_id: ccnWater.id || null,
      provider_name: ccnWater.utility_name || ccnWater.dba_name || 'CCN Water Provider',
      provider_type: 'ccn',
      ccn_number: ccnWater.ccn_number || null,
      resolution_method: 'ccn_spatial_match',
      confidence: 0.95,
      capacity_status: ccnWater.status || 'unknown',
      contact_phone: ccnWater.contact_phone || null,
      district_no: null
    };
  }
  
  // Priority 2: MUD with water service
  if (mudResult && mudResult.has_water) {
    return {
      provider_id: null,
      provider_name: mudResult.name || `Harris County MUD #${mudResult.district_no}`,
      provider_type: 'mud',
      ccn_number: null,
      resolution_method: 'mud_overlay',
      confidence: 0.90,
      capacity_status: 'available',
      contact_phone: null,
      district_no: mudResult.district_no
    };
  }
  
  // Priority 3: WCID with water service
  if (wcidResult && wcidResult.has_water) {
    return {
      provider_id: null,
      provider_name: wcidResult.name || `WCID #${wcidResult.district_no}`,
      provider_type: 'wcid',
      ccn_number: null,
      resolution_method: 'wcid_overlay',
      confidence: 0.85,
      capacity_status: 'available',
      contact_phone: null,
      district_no: wcidResult.district_no
    };
  }
  
  // Priority 4: City municipal water (for known cities)
  if (city && MUNICIPAL_WATER_CITIES.includes(city.toLowerCase())) {
    return {
      provider_id: null,
      provider_name: `City of ${city} Water`,
      provider_type: 'municipal',
      ccn_number: null,
      resolution_method: 'city_default',
      confidence: 0.75,
      capacity_status: 'available',
      contact_phone: null,
      district_no: null
    };
  }
  
  // Unresolved
  return null;
}

// Resolve sewer provider using priority rules
function resolveSewerProvider(
  ccnResults: any[],
  mudResult: any | null,
  wcidResult: any | null,
  city: string | null
): UtilityProvider | null {
  // Priority 1: CCN sewer boundary
  const ccnSewer = ccnResults.find(c => c.ccn_type?.toLowerCase() === 'sewer' || c.service_type?.toLowerCase().includes('sewer'));
  if (ccnSewer) {
    return {
      provider_id: ccnSewer.id || null,
      provider_name: ccnSewer.utility_name || ccnSewer.dba_name || 'CCN Sewer Provider',
      provider_type: 'ccn',
      ccn_number: ccnSewer.ccn_number || null,
      resolution_method: 'ccn_spatial_match',
      confidence: 0.95,
      capacity_status: ccnSewer.status || 'unknown',
      contact_phone: ccnSewer.contact_phone || null,
      district_no: null
    };
  }
  
  // Priority 2: MUD with sewer service
  if (mudResult && mudResult.has_sewer) {
    return {
      provider_id: null,
      provider_name: mudResult.name || `Harris County MUD #${mudResult.district_no}`,
      provider_type: 'mud',
      ccn_number: null,
      resolution_method: 'mud_overlay',
      confidence: 0.90,
      capacity_status: 'available',
      contact_phone: null,
      district_no: mudResult.district_no
    };
  }
  
  // Priority 3: WCID with sewer service
  if (wcidResult && wcidResult.has_sewer) {
    return {
      provider_id: null,
      provider_name: wcidResult.name || `WCID #${wcidResult.district_no}`,
      provider_type: 'wcid',
      ccn_number: null,
      resolution_method: 'wcid_overlay',
      confidence: 0.85,
      capacity_status: 'available',
      contact_phone: null,
      district_no: wcidResult.district_no
    };
  }
  
  // Priority 4: City municipal sewer
  if (city && MUNICIPAL_WATER_CITIES.includes(city.toLowerCase())) {
    return {
      provider_id: null,
      provider_name: `City of ${city} Wastewater`,
      provider_type: 'municipal',
      ccn_number: null,
      resolution_method: 'city_default',
      confidence: 0.75,
      capacity_status: 'available',
      contact_phone: null,
      district_no: null
    };
  }
  
  return null;
}

// Resolve storm provider (typically city or county)
function resolveStormProvider(
  city: string | null,
  mudResult: any | null,
  wcidResult: any | null,
  county: string | null
): UtilityProvider | null {
  // Storm drainage is typically handled by city, MUD/WCID, or county
  if (mudResult) {
    return {
      provider_id: null,
      provider_name: mudResult.name || `MUD #${mudResult.district_no}`,
      provider_type: 'mud',
      ccn_number: null,
      resolution_method: 'mud_overlay',
      confidence: 0.85,
      capacity_status: 'available',
      contact_phone: null,
      district_no: mudResult.district_no
    };
  }
  
  if (wcidResult) {
    return {
      provider_id: null,
      provider_name: wcidResult.name || `WCID #${wcidResult.district_no}`,
      provider_type: 'wcid',
      ccn_number: null,
      resolution_method: 'wcid_overlay',
      confidence: 0.80,
      capacity_status: 'available',
      contact_phone: null,
      district_no: wcidResult.district_no
    };
  }
  
  if (city) {
    return {
      provider_id: null,
      provider_name: `City of ${city} Stormwater`,
      provider_type: 'municipal',
      ccn_number: null,
      resolution_method: 'city_default',
      confidence: 0.70,
      capacity_status: 'available',
      contact_phone: null,
      district_no: null
    };
  }
  
  if (county) {
    return {
      provider_id: null,
      provider_name: `${county} County Flood Control`,
      provider_type: 'municipal',
      ccn_number: null,
      resolution_method: 'county_default',
      confidence: 0.60,
      capacity_status: 'unknown',
      contact_phone: null,
      district_no: null
    };
  }
  
  return null;
}

// Detect conflicts between providers
function detectConflicts(providers: (UtilityProvider | null)[]): any[] {
  const conflicts: any[] = [];
  
  // Check for overlapping claims (not implemented in simple version)
  // Could add logic to detect when multiple CCNs claim same service type
  
  return conflicts;
}

// Calculate estimated costs from provider fee schedules
async function calculateEstimatedCosts(
  waterProvider: UtilityProvider | null,
  sewerProvider: UtilityProvider | null
): Promise<{ water_tap: number | null; sewer_tap: number | null; impact_fees: number | null; total: number | null }> {
  // Default cost estimates for Houston area (2024 rates)
  const defaultCosts = {
    municipal_water_tap: 2500,
    municipal_sewer_tap: 3500,
    mud_water_tap: 3000,
    mud_sewer_tap: 4000,
    mud_impact_fee: 8000,
    wcid_water_tap: 2800,
    wcid_sewer_tap: 3800,
    wcid_impact_fee: 7500
  };
  
  let water_tap: number | null = null;
  let sewer_tap: number | null = null;
  let impact_fees: number | null = null;
  
  if (waterProvider) {
    switch (waterProvider.provider_type) {
      case 'municipal':
        water_tap = defaultCosts.municipal_water_tap;
        break;
      case 'mud':
        water_tap = defaultCosts.mud_water_tap;
        impact_fees = (impact_fees || 0) + defaultCosts.mud_impact_fee / 2;
        break;
      case 'wcid':
        water_tap = defaultCosts.wcid_water_tap;
        impact_fees = (impact_fees || 0) + defaultCosts.wcid_impact_fee / 2;
        break;
      default:
        water_tap = defaultCosts.municipal_water_tap;
    }
  }
  
  if (sewerProvider) {
    switch (sewerProvider.provider_type) {
      case 'municipal':
        sewer_tap = defaultCosts.municipal_sewer_tap;
        break;
      case 'mud':
        sewer_tap = defaultCosts.mud_sewer_tap;
        impact_fees = (impact_fees || 0) + defaultCosts.mud_impact_fee / 2;
        break;
      case 'wcid':
        sewer_tap = defaultCosts.wcid_sewer_tap;
        impact_fees = (impact_fees || 0) + defaultCosts.wcid_impact_fee / 2;
        break;
      default:
        sewer_tap = defaultCosts.municipal_sewer_tap;
    }
  }
  
  const total = (water_tap || 0) + (sewer_tap || 0) + (impact_fees || 0);
  
  return {
    water_tap,
    sewer_tap,
    impact_fees,
    total: total > 0 ? total : null
  };
}

// Detect kill factors
function detectKillFactors(
  waterProvider: UtilityProvider | null,
  sewerProvider: UtilityProvider | null
): string[] {
  const killFactors: string[] = [];
  
  if (!waterProvider) {
    killFactors.push('NO_WATER_PROVIDER');
  }
  
  if (!sewerProvider) {
    killFactors.push('NO_SEWER_PROVIDER');
  }
  
  // Check for capacity moratoriums
  if (waterProvider?.capacity_status === 'moratorium') {
    killFactors.push('WATER_CAPACITY_MORATORIUM');
  }
  
  if (sewerProvider?.capacity_status === 'moratorium') {
    killFactors.push('SEWER_CAPACITY_MORATORIUM');
  }
  
  return killFactors;
}

// Cache resolution result
async function cacheResolution(
  result: ResolutionResult,
  lat: number,
  lng: number,
  parcelId: string | null,
  applicationId: string | null
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day TTL
    
    const { error } = await supabase.from('parcel_utility_assignments').insert({
      parcel_id: parcelId,
      application_id: applicationId,
      centroid: `POINT(${lng} ${lat})`,
      water_provider_id: result.water_provider?.provider_id,
      sewer_provider_id: result.sewer_provider?.provider_id,
      storm_provider_id: result.storm_provider?.provider_id,
      water_resolution_method: result.water_provider?.resolution_method || 'unresolved',
      sewer_resolution_method: result.sewer_provider?.resolution_method || 'unresolved',
      storm_resolution_method: result.storm_provider?.resolution_method || 'unresolved',
      resolution_confidence: result.resolution_confidence,
      has_conflicts: result.has_conflicts,
      conflict_details: result.conflict_details,
      estimated_water_tap_cost: result.estimated_costs.water_tap,
      estimated_sewer_tap_cost: result.estimated_costs.sewer_tap,
      estimated_impact_fees: result.estimated_costs.impact_fees,
      water_serviceability: result.serviceability.water,
      sewer_serviceability: result.serviceability.sewer,
      is_kill_factor: result.kill_factors.length > 0,
      kill_factor_reason: result.kill_factors.length > 0 ? result.kill_factors.join(', ') : null,
      resolved_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    });
    
    if (error) {
      console.error('[cache] Failed to cache result:', error.message);
    } else {
      console.log('[cache] Resolution cached successfully');
    }
  } catch (err) {
    console.error('[cache] Cache exception:', err);
  }
}

// Build special districts list
function buildSpecialDistricts(mudResult: any | null, wcidResult: any | null): any[] {
  const districts: any[] = [];
  
  if (mudResult) {
    districts.push({
      type: 'MUD',
      name: mudResult.name,
      district_no: mudResult.district_no
    });
  }
  
  if (wcidResult) {
    districts.push({
      type: 'WCID',
      name: wcidResult.name,
      district_no: wcidResult.district_no
    });
  }
  
  return districts;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const traceId = generateTraceId();
  const startTime = Date.now();
  console.log(`[${traceId}] resolve-utility-ownership START`);
  
  try {
    const body = await req.json();
    const { lat, lng, parcel_id, application_id, city, county, skip_cache } = body;
    
    if (!lat || !lng) {
      return new Response(JSON.stringify({
        success: false,
        error: 'lat and lng are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`[${traceId}] Input: lat=${lat}, lng=${lng}, city=${city}, county=${county}`);
    
    // Step 1: Check cache (unless skip_cache is true)
    if (!skip_cache) {
      const cached = await checkCache(lat, lng);
      if (cached) {
        console.log(`[${traceId}] Returning cached result`);
        
        // Transform cached data to response format
        const cachedResult: ResolutionResult = {
          water_provider: cached.water_provider_id ? {
            provider_id: cached.water_provider_id,
            provider_name: 'Cached Provider',
            provider_type: 'unknown',
            ccn_number: null,
            resolution_method: cached.water_resolution_method,
            confidence: cached.resolution_confidence,
            capacity_status: null,
            contact_phone: null,
            district_no: null
          } : null,
          sewer_provider: cached.sewer_provider_id ? {
            provider_id: cached.sewer_provider_id,
            provider_name: 'Cached Provider',
            provider_type: 'unknown',
            ccn_number: null,
            resolution_method: cached.sewer_resolution_method,
            confidence: cached.resolution_confidence,
            capacity_status: null,
            contact_phone: null,
            district_no: null
          } : null,
          storm_provider: cached.storm_provider_id ? {
            provider_id: cached.storm_provider_id,
            provider_name: 'Cached Provider',
            provider_type: 'unknown',
            ccn_number: null,
            resolution_method: cached.storm_resolution_method,
            confidence: cached.resolution_confidence,
            capacity_status: null,
            contact_phone: null,
            district_no: null
          } : null,
          resolution_confidence: cached.resolution_confidence,
          has_conflicts: cached.has_conflicts,
          conflict_details: cached.conflict_details || [],
          estimated_costs: {
            water_tap: cached.estimated_water_tap_cost,
            sewer_tap: cached.estimated_sewer_tap_cost,
            impact_fees: cached.estimated_impact_fees,
            total: (cached.estimated_water_tap_cost || 0) + (cached.estimated_sewer_tap_cost || 0) + (cached.estimated_impact_fees || 0)
          },
          serviceability: {
            water: cached.water_serviceability || 'unknown',
            sewer: cached.sewer_serviceability || 'unknown'
          },
          special_districts: [],
          kill_factors: cached.kill_factor_reason ? cached.kill_factor_reason.split(', ') : [],
          cached: true
        };
        
        return new Response(JSON.stringify({
          success: true,
          data: cachedResult,
          meta: {
            trace_id: traceId,
            duration_ms: Date.now() - startTime,
            sources_queried: ['cache']
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Step 2: Query all sources in parallel
    console.log(`[${traceId}] Querying CCN, MUD, and WCID sources...`);
    
    const [ccnResults, mudResult, wcidResult] = await Promise.all([
      queryCCNBoundaries(lat, lng),
      queryArcGISBoundary(MUD_ENDPOINT, lat, lng, 'MUD'),
      queryArcGISBoundary(WCID_ENDPOINT, lat, lng, 'WCID')
    ]);
    
    console.log(`[${traceId}] CCN: ${ccnResults.length}, MUD: ${mudResult ? 'found' : 'none'}, WCID: ${wcidResult ? 'found' : 'none'}`);
    
    // Step 3: Apply priority-based resolution
    const waterProvider = resolveWaterProvider(ccnResults, mudResult, wcidResult, city);
    const sewerProvider = resolveSewerProvider(ccnResults, mudResult, wcidResult, city);
    const stormProvider = resolveStormProvider(city, mudResult, wcidResult, county);
    
    // Step 4: Detect conflicts
    const conflicts = detectConflicts([waterProvider, sewerProvider, stormProvider]);
    
    // Step 5: Calculate costs
    const estimatedCosts = await calculateEstimatedCosts(waterProvider, sewerProvider);
    
    // Step 6: Detect kill factors
    const killFactors = detectKillFactors(waterProvider, sewerProvider);
    
    // Step 7: Calculate overall confidence
    const confidences = [
      waterProvider?.confidence || 0,
      sewerProvider?.confidence || 0,
      stormProvider?.confidence || 0
    ].filter(c => c > 0);
    
    const overallConfidence = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0.5;
    
    // Step 8: Build special districts list
    const specialDistricts = buildSpecialDistricts(mudResult, wcidResult);
    
    // Step 9: Determine serviceability
    const waterServiceability = waterProvider ? 'available' : 'unavailable';
    const sewerServiceability = sewerProvider ? 'gravity_available' : 'septic_required';
    
    // Build result
    const result: ResolutionResult = {
      water_provider: waterProvider,
      sewer_provider: sewerProvider,
      storm_provider: stormProvider,
      resolution_confidence: Math.round(overallConfidence * 100) / 100,
      has_conflicts: conflicts.length > 0,
      conflict_details: conflicts,
      estimated_costs: estimatedCosts,
      serviceability: {
        water: waterServiceability,
        sewer: sewerServiceability
      },
      special_districts: specialDistricts,
      kill_factors: killFactors,
      cached: false
    };
    
    // Step 10: Cache result (async, don't await)
    cacheResolution(result, lat, lng, parcel_id, application_id);
    
    const durationMs = Date.now() - startTime;
    console.log(`[${traceId}] resolve-utility-ownership COMPLETE in ${durationMs}ms`);
    
    return new Response(JSON.stringify({
      success: true,
      data: result,
      meta: {
        trace_id: traceId,
        duration_ms: durationMs,
        sources_queried: ['ccn_canonical', 'mud_arcgis', 'wcid_arcgis']
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[${traceId}] Error:`, errorMsg);
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMsg,
      meta: {
        trace_id: traceId,
        duration_ms: Date.now() - startTime
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
