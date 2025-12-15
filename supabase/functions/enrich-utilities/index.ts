import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import proj4 from "https://esm.sh/proj4@2.9.0";

// Import observability logging
const logExternalCall = async (
  supabase: any,
  source: string,
  endpoint: string,
  durationMs: number,
  success: boolean,
  applicationId: string | null = null,
  errorMessage: string | null = null
) => {
  try {
    const logEntry = {
      source,
      endpoint,
      duration_ms: durationMs,
      success,
      application_id: applicationId,
      error_message: errorMessage,
    };
    
    const { error } = await supabase.from('api_logs').insert(logEntry);
    if (error) {
      console.error('[observability] Failed to insert API log:', error);
    }
  } catch (e) {
    console.error('[observability] Error in logExternalCall:', e);
  }
};

// Define EPSG:2278 (Texas South Central, US survey feet) projection
// Authoritative definition from epsg.io - false easting/northing in meters, converted internally by proj4
const EPSG_2278_DEF = "+proj=lcc +lat_0=27.8333333333333 +lon_0=-99 +lat_1=30.2833333333333 +lat_2=28.3833333333333 +x_0=600000 +y_0=3999999.9998984 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs";
proj4.defs('EPSG:2278', EPSG_2278_DEF);

// Houston bounding box for sanity checks (WGS84)
const HOUSTON_BBOX = {
  lng: { min: -96.5, max: -94.5 },  // Longitude range
  lat: { min: 28.5, max: 30.5 }      // Latitude range
};

// Harris County Municipal Boundaries for geographic routing (WGS84 bounding boxes)
// These define approximate city limits for automatic endpoint selection
const MUNICIPAL_BOUNDS: Record<string, { minLng: number; maxLng: number; minLat: number; maxLat: number }> = {
  baytown: { minLng: -95.05, maxLng: -94.85, minLat: 29.68, maxLat: 29.82 },
  pearland: { minLng: -95.38, maxLng: -95.20, minLat: 29.50, maxLat: 29.60 },
  league_city: { minLng: -95.15, maxLng: -94.95, minLat: 29.45, maxLat: 29.55 },
  la_porte: { minLng: -95.05, maxLng: -94.90, minLat: 29.62, maxLat: 29.72 },
  webster: { minLng: -95.15, maxLng: -95.08, minLat: 29.52, maxLat: 29.56 },
  seabrook: { minLng: -95.05, maxLng: -94.95, minLat: 29.55, maxLat: 29.60 },
};

// Detect municipality from coordinates for automatic endpoint routing
function detectMunicipality(lat: number, lng: number): string | null {
  for (const [city, bounds] of Object.entries(MUNICIPAL_BOUNDS)) {
    if (lng >= bounds.minLng && lng <= bounds.maxLng && 
        lat >= bounds.minLat && lat <= bounds.maxLat) {
      return city;
    }
  }
  return null;
}

// Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Load endpoint catalog
import endpointCatalog from "./endpoint_catalog.json" assert { type: "json" };

// API metadata tracker
interface ApiMetadata {
  api: string;
  url: string;
  status: number;
  elapsed_ms: number;
  timestamp: string;
  error?: string;
}

const apiMeta: ApiMetadata[] = [];

// Distance calculator (ft) between lat/lng
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 3.28084; // meters → feet
}

// Compute min distance from point to polyline
function minDistanceToLine(lat: number, lng: number, paths: any[][], crs?: number) {
  let minDist = Infinity;
  
  // Detect if coordinates are actually in State Plane by checking magnitude
  // State Plane coords in Texas are typically > 1000 (feet), WGS84 coords are < 180 (degrees)
  const firstCoord = paths[0]?.[0];
  const isStatePlane = crs === 2278 || (firstCoord && Math.abs(firstCoord[0]) > 360);
  
  if (isStatePlane) {
    console.log(`🔧 Detected State Plane coordinates (first coord: [${firstCoord?.[0]}, ${firstCoord?.[1]}]), converting to WGS84...`);
  }
  
  // If geometry is in State Plane, convert to WGS84 first
  const convertedPaths = isStatePlane
    ? paths.map((path, pathIdx) => 
        path.map(([x, y], coordIdx) => {
          // Convert State Plane feet → WGS84 degrees using canonical EPSG:2278
          const [lng_wgs, lat_wgs] = proj4('EPSG:2278', 'EPSG:4326', [x, y]);
          
          // 🔍 DIAGNOSTIC: Log first conversion of each path to verify it's working
          if (pathIdx === 0 && coordIdx === 0) {
            console.log(`📍 PROJ4 Conversion Result: [${x}, ${y}] → [${lng_wgs}, ${lat_wgs}]`);
            console.log(`   Expected for Houston: lng ≈ -95.x, lat ≈ 29.x`);
            
            // ⚠️ SANITY CHECK: Verify coordinates are in Houston area
            if (lng_wgs < HOUSTON_BBOX.lng.min || lng_wgs > HOUSTON_BBOX.lng.max ||
                lat_wgs < HOUSTON_BBOX.lat.min || lat_wgs > HOUSTON_BBOX.lat.max) {
              console.warn(`⚠️ CONVERSION SANITY CHECK FAILED!`);
              console.warn(`   Converted coords [${lng_wgs}, ${lat_wgs}] outside Houston bounding box`);
              console.warn(`   Expected: lng ∈ [${HOUSTON_BBOX.lng.min}, ${HOUSTON_BBOX.lng.max}], lat ∈ [${HOUSTON_BBOX.lat.min}, ${HOUSTON_BBOX.lat.max}]`);
              console.warn(`   Using EPSG:2278 with definition: ${EPSG_2278_DEF}`);
            }
          }
          
          return [lng_wgs, lat_wgs];
        })
      )
    : paths;  // Already in WGS84, use as-is
  
  for (const path of convertedPaths) {
    for (let i = 0; i < path.length - 1; i++) {
      const [x1, y1] = path[i]; // lon, lat (now guaranteed WGS84)
      const [x2, y2] = path[i + 1];
      const d1 = haversineDistance(lat, lng, y1, x1);
      const d2 = haversineDistance(lat, lng, y2, x2);
      minDist = Math.min(minDist, d1, d2);
    }
  }
  return Math.round(minDist);
}

// Calculate polygon area in square feet from ring coordinates (Texas South Central EPSG:2278)
function calculatePolygonArea(ring: number[][]): number {
  if (!ring || ring.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    area += ring[i][0] * ring[i + 1][1];
    area -= ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(area / 2); // Returns area in square feet (when coords are in feet)
}

// Format ArcGIS features → JSON with distance
function formatLines(features: any[], geo_lat: number, geo_lng: number, utilityType?: string, crs?: number) {
  return features.map((f) => {
    const attrs = f.attributes || {};
    const geom = f.geometry || {};
    
    // Detect CRS from geometry spatialReference if available, otherwise use passed crs
    const geomCrs = geom.spatialReference?.wkid || crs;
    
    const distance_ft = geom.paths
      ? minDistanceToLine(geo_lat, geo_lng, geom.paths, geomCrs)
      : null;
    
    // Handle different diameter field names (sewer service lines use SIZECD)
    let diameter = attrs.DIAMETER || attrs.SIZECD || attrs.PIPEDIAMETER || null;
    const width = attrs.WIDTH || attrs.PIPEWIDTH || null;
    const height = attrs.HEIGHT || attrs.PIPEHEIGHT || null;
    const shape = attrs.MAINSHAPE || attrs.SHAPE || null;
    
    // Calculate equivalent diameter for non-circular pipes
    if (!diameter && (width || height)) {
      if (shape === "RND" && width) {
        diameter = width;
      } else if (width && height) {
        diameter = Math.round(Math.sqrt((4 * width * height) / Math.PI));
      } else if (width) {
        diameter = width;
      }
    }
    
    // Enhanced storm drain fields (FACILITYID priority, INSTALL_YEAR, CONDITION)
    const isStorm = utilityType?.toLowerCase().includes('storm');
    const isSewer = utilityType?.toLowerCase().includes('sewer');
    const facility_id = isStorm ? (attrs.FACILITYID || attrs.PIPEID || null) : null;
    
    // Handle install year/date conversion (supports both INSTALL_YEAR and INSERVICEDATE/INSTALLDATE)
    let install_year = null;
    if (isStorm) {
      install_year = attrs.INSTALL_YEAR || 
        (attrs.INSTALLDATE ? new Date(attrs.INSTALLDATE).getFullYear() : null);
    } else if (isSewer) {
      // Sewer lines use INSERVICEDATE (epoch ms) or INSTALLDATE
      if (attrs.INSERVICEDATE && typeof attrs.INSERVICEDATE === 'number') {
        install_year = new Date(attrs.INSERVICEDATE).getFullYear();
      } else if (attrs.INSTALLDATE) {
        install_year = new Date(attrs.INSTALLDATE).getFullYear();
      }
    }
    
    const condition = isStorm ? (attrs.CONDITION || null) : null;
    
    return {
      ...(isStorm && facility_id && { facility_id }),
      diameter,
      material: attrs.MATERIAL || null,
      status: attrs.STATUS || attrs.LIFECYCLESTATUS || null,
      owner: attrs.OWNER || null,
      ...(install_year && { install_year }),
      ...(isStorm && condition && { condition }),
      distance_ft,
      geometry: geom
    };
  }).filter((line: any) => {
    // For storm lines, keep only if we have facility_id OR diameter (data quality)
    if (utilityType?.toLowerCase().includes('storm')) {
      return line.facility_id || line.diameter;
    }
    return true;
  });
}

// Generic ArcGIS query with retry logic, fallback CRS, and metadata tracking
const queryArcGIS = async (
  url: string, 
  fields: string[], 
  geo_lat: number, 
  geo_lng: number, 
  utilityType: string,
  config: {
    timeout_ms: number;
    retry_attempts?: number; // Optional, defaults to 3
    retry_delays_ms: number[];
    search_radius_ft?: number; // Optional for polygon queries
    crs?: number; // Optional CRS (e.g., 2278 for Texas South Central, 4326 for WGS84)
    geometryType?: string; // e.g., esriGeometryPolygon, esriGeometryPolyline
    spatialRel?: string; // e.g., esriSpatialRelIntersects
    returnGeometry?: boolean; // Whether to return geometry (default: true)
  }
) => {
  // Helper function to build query URL
  const buildQueryUrl = (useCrs: boolean) => {
    let geometryObj: any;
    let spatialReference: number;
    const isHoustonWater = utilityType?.includes('houston_water');
    
    // For Houston water with CRS 4326, always use WGS84
    if (config.crs === 4326 || (!useCrs && isHoustonWater)) {
      geometryObj = {
        x: geo_lng,
        y: geo_lat,
        spatialReference: { wkid: 4326 }
      };
      spatialReference = 4326;
      console.log(`${utilityType}: Using WGS84 (EPSG:4326): ${JSON.stringify(geometryObj)}`);
    } else if (useCrs && config.crs === 2278) {
      // Convert WGS84 to EPSG:2278 using canonical definition
      const [x2278, y2278] = proj4('EPSG:4326', 'EPSG:2278', [geo_lng, geo_lat]);
      
      geometryObj = {
        x: x2278,
        y: y2278,
        spatialReference: { wkid: 2278 }
      };
      spatialReference = 2278;
      console.log(`${utilityType}: Using EPSG:2278: ${JSON.stringify(geometryObj)}`);
    } else {
      geometryObj = {
        x: geo_lng,
        y: geo_lat,
        spatialReference: { wkid: 4326 }
      };
      spatialReference = 4326;
      console.log(`${utilityType}: Using WGS84 (EPSG:4326) as fallback: ${JSON.stringify(geometryObj)}`);
    }
    
    const geometryType = config.geometryType || "esriGeometryPoint";
    const spatialRel = config.spatialRel || "esriSpatialRelIntersects";
    
  // Always use JSON format with spatialReference for proper CRS handling
  const geometryParam = JSON.stringify(geometryObj);
    
    // Build params object in exact order as working URL
    const paramsObj: Record<string, string> = {
      geometry: geometryParam,
      geometryType: geometryType,
      inSR: String(spatialReference),
      spatialRel: spatialRel,
    };

    // Add distance parameters if needed (BEFORE other params)
    if (geometryType !== "esriGeometryPolygon" && config.search_radius_ft) {
      paramsObj.distance = String(config.search_radius_ft);
      paramsObj.units = "esriSRUnit_Foot";
    }

    // Add remaining params
    paramsObj.outFields = fields.join(",");
    paramsObj.returnGeometry = config.returnGeometry !== undefined ? String(config.returnGeometry) : "true";
    paramsObj.f = "json"; // f=json goes LAST

    const params = new URLSearchParams(paramsObj);
    const finalUrl = `${url}?${params.toString()}`;
    
    // Log ALL utility URLs with detailed parameter breakdown
    console.log(`🔗 [${utilityType}] Final Query URL:`, finalUrl);
    console.log(`📋 [${utilityType}] Query Parameters:`, {
      geometry: geometryParam,
      geometryType: geometryType,
      inSR: spatialReference,
      spatialRel: spatialRel,
      distance: paramsObj.distance || 'N/A',
      units: paramsObj.units || 'N/A',
      outFields: paramsObj.outFields,
      returnGeometry: paramsObj.returnGeometry,
      crs_strategy: useCrs ? `EPSG:${config.crs}` : 'WGS84'
    });
    
    return finalUrl;
  };
  
  // Try with configured CRS first, then fallback to WGS84 if 400 error
  const crsStrategies = config.crs ? [true, false] : [false];
  
  for (const useCrs of crsStrategies) {
    const queryUrl = buildQueryUrl(useCrs);
    console.log(`Querying ${utilityType}:`, queryUrl);
    
    let lastError: Error | null = null;
    const retryAttempts = config.retry_attempts ?? 3;
  
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      const startTime = Date.now();
      let status = 0;
      
      try {
        const requestHeaders = {
          'User-Agent': 'BuildSmarter-Feasibility/1.0',
          'Referer': 'https://buildsmarter.app'
        };

        console.log(`📤 [${utilityType}] Sending request with headers:`, requestHeaders);

        const resp = await fetch(queryUrl, {
          headers: requestHeaders,
          signal: AbortSignal.timeout(config.timeout_ms)
        });

        // Log response headers for debugging
        console.log(`📥 [${utilityType}] Response headers:`, {
          'content-type': resp.headers.get('content-type'),
          'content-length': resp.headers.get('content-length'),
          'server': resp.headers.get('server')
        });
        
        status = resp.status;
        const elapsed_ms = Date.now() - startTime;
        
        if (!resp.ok) {
          console.error(`❌ [${utilityType}] HTTP ${status} Error`);
          
          // **NEW**: Capture full error response body for debugging
          let errorBody = null;
          let errorText = '';
          try {
            errorText = await resp.text();
            errorBody = JSON.parse(errorText);
            console.error(`❌ [${utilityType}] Error Response Body:`, JSON.stringify(errorBody, null, 2));
          } catch (parseErr) {
            console.error(`❌ [${utilityType}] Error Response (raw text):`, errorText);
          }
          
          // **NEW**: Log request details for comparison
          console.error(`❌ [${utilityType}] Failed Request Details:`, {
            url: queryUrl,
            status: status,
            crs_strategy: useCrs ? `EPSG:${config.crs}` : 'WGS84',
            geometry_type: config.geometryType,
            spatial_rel: config.spatialRel,
            search_radius_ft: config.search_radius_ft,
            coordinates: { lat: geo_lat, lng: geo_lng }
          });
          
          const errorDetail = errorBody?.error?.message || errorBody?.message || `HTTP ${status} (CRS: ${useCrs ? 'EPSG:' + config.crs : 'WGS84'})`;
          
          apiMeta.push({
            api: utilityType,
            url: queryUrl,
            status,
            elapsed_ms,
            timestamp: new Date().toISOString(),
            error: errorDetail,
            error_body: errorBody // Store full error for later analysis
          });
          
          // If 400 error and we haven't tried fallback yet, break to try WGS84
          if (status === 400 && useCrs && crsStrategies.length > 1) {
            console.log(`🔄 [${utilityType}] Got 400 with CRS ${config.crs}, attempting WGS84 fallback...`);
            throw new Error("HTTP_400_FALLBACK");
          }
          
          throw new Error(errorDetail);
        }
        
        const json = await resp.json();
        console.log(`${utilityType} features found:`, json.features?.length || 0);
        
        // **NEW**: Log successful request details for comparison
        console.log(`✅ [${utilityType}] Successful Query Details:`, {
          features_found: json.features?.length || 0,
          status: status,
          elapsed_ms: elapsed_ms,
          crs_strategy: useCrs ? `EPSG:${config.crs}` : 'WGS84',
          geometry_type: config.geometryType,
          spatial_rel: config.spatialRel,
          search_radius_ft: config.search_radius_ft,
          url_length: queryUrl.length
        });
        
        if (json.error) {
          console.error(`${utilityType} API error:`, json.error);
          console.error(`${utilityType} Full error details:`, JSON.stringify(json.error, null, 2));
          
          const errorDetail = json.error.message || json.error.code || "ArcGIS API error";
          
          apiMeta.push({
            api: utilityType,
            url: queryUrl,
            status,
            elapsed_ms,
            timestamp: new Date().toISOString(),
            error: errorDetail
          });
          
          // If error code 400 and we haven't tried fallback yet, break to try WGS84
          if (json.error.code === 400 && useCrs && crsStrategies.length > 1) {
            console.log(`${utilityType}: Got API error 400 with CRS ${config.crs}, will try WGS84 fallback...`);
            throw new Error("HTTP_400_FALLBACK");
          }
          
          throw new Error(errorDetail);
        }
        
        // Success - log metadata
        apiMeta.push({
          api: utilityType,
          url: queryUrl,
          status,
          elapsed_ms,
          timestamp: new Date().toISOString()
        });
        
        return json.features ?? [];
        
      } catch (err) {
        const elapsed_ms = Date.now() - startTime;
        const errorMsg = err instanceof Error ? err.message : String(err);
        lastError = err instanceof Error ? err : new Error(String(err));
        
        console.error(`${utilityType} attempt ${attempt + 1}/${retryAttempts + 1} failed:`, errorMsg);
        
        // If fallback error, break to try next CRS strategy
        if (errorMsg === "HTTP_400_FALLBACK") {
          break; // Exit retry loop to try WGS84
        }
        
        // Check if API is unreachable
        if (errorMsg.includes('dns error') || 
            errorMsg.includes('failed to lookup') ||
            errorMsg.includes('Connection refused') ||
            errorMsg.includes('timeout')) {
          
          apiMeta.push({
            api: utilityType,
            url: queryUrl,
            status: status || 0,
            elapsed_ms,
            timestamp: new Date().toISOString(),
            error: "api_unreachable"
          });
          
          throw new Error("api_unreachable");
        }
        
        // If we have more attempts, wait before retrying
        if (attempt < retryAttempts && config.retry_delays_ms[attempt]) {
          console.log(`Retrying ${utilityType} in ${config.retry_delays_ms[attempt]}ms...`);
          await new Promise(resolve => setTimeout(resolve, config.retry_delays_ms[attempt]));
        }
      }
    }
    
    // If we got here and it's not the last CRS strategy, continue to next CRS
    if (useCrs !== crsStrategies[crsStrategies.length - 1]) {
      console.log(`${utilityType}: Trying WGS84 fallback after CRS ${config.crs} failed...`);
      continue;
    }
    
    // All retries exhausted for this CRS
    throw lastError || new Error(`Failed after ${retryAttempts + 1} attempts`);
  }
  
  // All CRS strategies exhausted
  throw new Error(`All CRS strategies exhausted`);
};

// Query for polygon features (MUD boundaries, ETJ, etc.)
const queryPolygon = async (url: string, fields: string[], geo_lat: number, geo_lng: number) => {
  const params = new URLSearchParams({
    f: "json",
    geometry: `${geo_lng},${geo_lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: fields.join(","),
    returnGeometry: "false",
    where: "1=1"
  });
  
  const queryUrl = `${url}?${params.toString()}`;
  console.log('Querying polygon:', queryUrl);
  
  const resp = await fetch(queryUrl, {
    signal: AbortSignal.timeout(15000)
  });
  
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}`);
  }
  
  const json = await resp.json();
  console.log('Polygon features found:', json.features?.length || 0);
  
  return json.features ?? [];
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Declare variables outside try block so they're accessible in catch
  let application_id: string | undefined;
  let latitude: number | undefined;
  let longitude: number | undefined;
  let traceId: string = 'no-trace';

  try {
    const requestBody = await req.json();
    const parsedBody = requestBody as { application_id?: string; latitude?: number; longitude?: number; city?: string; trace_id?: string };
    application_id = parsedBody.application_id;
    latitude = parsedBody.latitude;
    longitude = parsedBody.longitude;
    const cityHint = parsedBody.city;
    traceId = parsedBody.trace_id || crypto.randomUUID().slice(0, 8);
    
    // PHASE 0: Entry Point Logging
    console.log(`🔌 [TRACE:${traceId}] [ENRICH-UTILITIES] ================== ENTRY ==================`);
    console.log(`🔌 [TRACE:${traceId}] [ENRICH-UTILITIES] Input:`, JSON.stringify({
      application_id: application_id || 'NOT PROVIDED',
      has_direct_coords: !!(latitude && longitude),
      latitude,
      longitude,
      city_hint: cityHint || 'not_provided',
      timestamp: new Date().toISOString()
    }, null, 2));
    
    let geo_lat: number;
    let geo_lng: number;
    let county: string | null = null;
    let city: string | null = cityHint || null;
    
    // Support both direct coordinate calls and application_id lookups
    if (latitude !== undefined && longitude !== undefined) {
      console.log(`🎯 [TRACE:${traceId}] Direct coordinate enrichment:`, { latitude, longitude, city: cityHint });
      geo_lat = latitude;
      geo_lng = longitude;
    } else if (application_id) {
      console.log(`📋 [TRACE:${traceId}] Enriching utilities for application:`, application_id);
      
      // 1. Get application info
      const { data: app, error: fetchErr } = await supabase
        .from("applications")
        .select("geo_lat, geo_lng, county, city")
        .eq("id", application_id)
        .maybeSingle();

      // Log the raw DB lookup result
      console.log(`📍 [TRACE:${traceId}] [ENRICH-UTILITIES] DB Lookup Result:`, {
        application_found: !!app,
        geo_lat: app?.geo_lat,
        geo_lng: app?.geo_lng,
        has_coords: !!(app?.geo_lat && app?.geo_lng),
        county: app?.county,
        city: app?.city,
        fetch_error: fetchErr?.message || null
      });

      if (fetchErr) {
        console.error(`❌ [TRACE:${traceId}] [ENRICH-UTILITIES] Fetch error:`, fetchErr);
        throw new Error("Error fetching application");
      }

      if (!app) {
        console.error(`❌ [TRACE:${traceId}] [ENRICH-UTILITIES] Application not found:`, application_id);
        throw new Error("Application not found");
      }

      geo_lat = app.geo_lat;
      geo_lng = app.geo_lng;
      county = app.county;
      city = app.city;
      
      if (!geo_lat || !geo_lng) {
        console.error(`❌ [TRACE:${traceId}] [ENRICH-UTILITIES] CRITICAL: Missing coordinates`, {
          application_id,
          app_data: app,
          expected: 'geo_lat and geo_lng should be populated by enrich-feasibility'
        });
        throw new Error("Missing coordinates - enrich-feasibility may not have completed");
      }
    } else {
      console.error(`❌ [TRACE:${traceId}] [ENRICH-UTILITIES] No application_id or coordinates provided`);
      throw new Error("Must provide either application_id or latitude/longitude");
    }
    
    // FALLBACK: Detect county from coordinates if not set
    if (!county && geo_lat && geo_lng) {
      const COUNTY_BOUNDS: Record<string, { minLng: number; maxLng: number; minLat: number; maxLat: number }> = {
        'Harris County': { minLng: -95.91, maxLng: -94.91, minLat: 29.49, maxLat: 30.17 },
        'Montgomery County': { minLng: -95.72, maxLng: -95.03, minLat: 30.05, maxLat: 30.7 },
        'Fort Bend County': { minLng: -96.18, maxLng: -95.44, minLat: 29.26, maxLat: 29.74 },
        'Travis County': { minLng: -98.17, maxLng: -97.37, minLat: 30.07, maxLat: 30.63 },
        'Bexar County': { minLng: -98.81, maxLng: -98.21, minLat: 29.17, maxLat: 29.73 },
      };
      
      for (const [countyName, bounds] of Object.entries(COUNTY_BOUNDS)) {
        if (geo_lng >= bounds.minLng && geo_lng <= bounds.maxLng && 
            geo_lat >= bounds.minLat && geo_lat <= bounds.maxLat) {
          county = countyName;
          console.log(`📍 [TRACE:${traceId}] County detected from coordinates: ${county}`);
          break;
        }
      }
      
      if (!county) {
        console.log(`⚠️ [TRACE:${traceId}] Could not detect county from coordinates (${geo_lat}, ${geo_lng})`);
      }
    }
    
    // PHASE 1: Coordinates Resolved
    console.log(`✅ [TRACE:${traceId}] [ENRICH-UTILITIES] Coordinates resolved:`, {
      geo_lat,
      geo_lng,
      county: county || 'not_set',
      city: city || 'not_set',
      source: application_id ? 'database' : 'direct'
    });
    
    console.log('📍 [enrich-utilities] Coordinates resolved:', {
      geo_lat,
      geo_lng,
      county: county || 'not_set',
      city: city || 'not_set',
      source: application_id ? 'database' : 'direct'
    });

    // PHASE 7: Performance Monitoring - Start timer
    const perfStart = Date.now();
    const perfMarkers: Record<string, number> = {};
    
    let water: any[] = [];
    let sewer: any[] = [];
    let storm: any[] = [];
    let sewer_force: any[] = [];
    let sewerGravity: any[] = [];
    let sewerService: any[] = [];
    let water_laterals: any[] = [];
    let water_fittings: any[] = [];
    let stormManholes: any[] = [];
    let address_points: any[] = [];
    let traffic: any[] = [];
    let hcad_parcels: any[] = [];
    let parcel_geometry: any = null;
    let calculated_acreage: number | null = null;
    let flags: string[] = [];
    let apiUnreachable = false;
    let failedServices = 0;
    const totalServices = 6; // water mains, water laterals, water fittings, sewer gravity, sewer force, storm
    
    // CRS values for distance calculations (default to WGS84)
    let waterCrs: number | undefined = 4326;
    let sewerCrs: number | undefined = 4326;
    let stormCrs: number | undefined = 4326;
    let waterLateralsCrs: number | undefined = 4326;
    let waterFittingsCrs: number | undefined = 4326;

    // PHASE 0.5: Resolve Utility Ownership (MUD/WCID/Municipal) FIRST
    // This determines the utility provider before we query utility lines
    let utilityOwnership: any = null;
    let mud_district: string | null = null;
    let wcid_district: string | null = null;
    let etj_provider: string | null = null;
    let utility_resolution_confidence: number | null = null;
    let estimated_utility_costs: any = null;
    
    try {
      console.log(`🏛️ [TRACE:${traceId}] Resolving utility ownership for ${county || 'unknown county'}...`);
      
      const ownershipResponse = await fetch(`${supabaseUrl}/functions/v1/resolve-utility-ownership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          lat: geo_lat,
          lng: geo_lng,
          city: city,
          county: county,
          application_id: application_id,
          skip_cache: false
        })
      });
      
      if (ownershipResponse.ok) {
        const ownershipData = await ownershipResponse.json();
        
        if (ownershipData.success && ownershipData.data) {
          utilityOwnership = ownershipData.data;
          
          // Extract MUD/WCID/ETJ info from resolution
          const waterProvider = utilityOwnership.water_provider;
          const sewerProvider = utilityOwnership.sewer_provider;
          
          // Set MUD district if found
          if (waterProvider?.provider_type === 'mud' || sewerProvider?.provider_type === 'mud') {
            const mudProvider = waterProvider?.provider_type === 'mud' ? waterProvider : sewerProvider;
            mud_district = mudProvider?.provider_name || null;
            etj_provider = 'MUD';
            flags.push('served_by_mud_district');
            console.log(`✅ [TRACE:${traceId}] MUD district resolved: ${mud_district}`);
          }
          // Set WCID district if found
          else if (waterProvider?.provider_type === 'wcid' || sewerProvider?.provider_type === 'wcid') {
            const wcidProvider = waterProvider?.provider_type === 'wcid' ? waterProvider : sewerProvider;
            wcid_district = wcidProvider?.provider_name || null;
            etj_provider = 'WCID';
            flags.push('served_by_wcid_district');
            console.log(`✅ [TRACE:${traceId}] WCID district resolved: ${wcid_district}`);
          }
          // Municipal provider
          else if (waterProvider?.provider_type === 'municipal') {
            etj_provider = waterProvider?.provider_name || `City of ${city}`;
            flags.push('served_by_municipal');
            console.log(`✅ [TRACE:${traceId}] Municipal provider: ${etj_provider}`);
          }
          // CCN provider
          else if (waterProvider?.provider_type === 'ccn') {
            etj_provider = waterProvider?.provider_name || 'CCN Provider';
            flags.push('served_by_ccn');
            console.log(`✅ [TRACE:${traceId}] CCN provider: ${etj_provider}`);
          }
          // Unresolved
          else {
            etj_provider = county ? `${county}_ETJ` : 'Unknown_ETJ';
            flags.push('utility_provider_unresolved');
            console.log(`⚠️ [TRACE:${traceId}] Utility provider unresolved, setting to: ${etj_provider}`);
          }
          
          utility_resolution_confidence = utilityOwnership.resolution_confidence;
          estimated_utility_costs = utilityOwnership.estimated_costs;
          
          // Check for kill factors
          if (utilityOwnership.kill_factors?.length > 0) {
            flags.push(...utilityOwnership.kill_factors.map((kf: string) => `kill_factor_${kf.toLowerCase()}`));
            console.log(`⚠️ [TRACE:${traceId}] Kill factors detected:`, utilityOwnership.kill_factors);
          }
          
          console.log(`✅ [TRACE:${traceId}] Utility ownership resolved:`, {
            mud_district,
            wcid_district,
            etj_provider,
            confidence: utility_resolution_confidence,
            kill_factors: utilityOwnership.kill_factors
          });
        }
      } else {
        console.warn(`⚠️ [TRACE:${traceId}] resolve-utility-ownership returned non-OK status: ${ownershipResponse.status}`);
        flags.push('utility_ownership_resolution_failed');
      }
    } catch (ownershipErr) {
      console.error(`❌ [TRACE:${traceId}] resolve-utility-ownership error:`, ownershipErr instanceof Error ? ownershipErr.message : String(ownershipErr));
      flags.push('utility_ownership_resolution_error');
    }

    // 2. Decide which catalog entry to use
    const cityLower = city?.toLowerCase() || '';
    
    // Hoist eps declaration outside city-specific blocks for proper scope
    let eps: any = null;
    
    try {
      if (cityLower.includes("houston")) {
        console.log('Using Houston endpoints');
        eps = endpointCatalog.houston;
        
        // Set CRS values for Houston (override defaults)
        waterCrs = eps.water?.crs || 4326;
        sewerCrs = eps.sewer?.crs || 4326;
        stormCrs = eps.storm?.crs || 4326;
        waterLateralsCrs = eps.water_laterals?.crs || 4326;
        waterFittingsCrs = eps.water_fittings?.crs || 4326;
        
        const isUrbanArea = endpointCatalog.config.urban_cities.some((c: string) => 
          cityLower.includes(c.toLowerCase())
        );
        
        // Use urban search radius if available
        const waterRadius = isUrbanArea && eps.water.urban_search_radius_ft 
          ? eps.water.urban_search_radius_ft 
          : eps.water.search_radius_ft;
        
        // 1. Water Distribution Mains (Layer 3) - GRACEFUL DEGRADATION
        try {
          // PHASE 1-2: Detailed Query Debugging
          console.log('💧 [QUERY DEBUG] Water Distribution Query Configuration:', {
            endpoint_url: eps.water.url,
            endpoint_layer: eps.water.url.split('/').pop()?.replace('/query', ''),
            outFields: eps.water.outFields,
            search_radius_ft: waterRadius,
            crs: eps.water.crs,
            geometryType: eps.water.geometryType,
            spatialRel: eps.water.spatialRel,
            timeout_ms: eps.water.timeout_ms,
            coordinates: { geo_lat, geo_lng },
            catalog_last_validated: eps.water.last_validated
          });
          water = await queryArcGIS(eps.water.url, eps.water.outFields, geo_lat, geo_lng, "houston_water", {
            timeout_ms: eps.water.timeout_ms,
            retry_attempts: eps.water.retry_attempts,
            retry_delays_ms: eps.water.retry_delays_ms,
            search_radius_ft: waterRadius,
            crs: eps.water.crs || 4326,
            geometryType: eps.water.geometryType,
            spatialRel: eps.water.spatialRel
          });
          
          perfMarkers.water_complete = Date.now() - perfStart;
          
          if (water.length > 0) {
            flags.push("water_via_houston_gis");
            const closestDistance = Math.min(...water.map(f => {
              const formatted = formatLines([f], geo_lat, geo_lng, 'water', waterCrs);
              return formatted[0]?.distance_ft || Infinity;
            }));
            
            console.log('✓ [enrich-utilities] Water mains query complete:', {
              features_found: water.length,
              elapsed_ms: perfMarkers.water_complete,
              closest_distance_ft: closestDistance !== Infinity ? Math.round(closestDistance) : null
            });
          } else {
            console.log('⚠️ [enrich-utilities] Water mains: No lines found in search radius');
          }
        } catch (err) {
          console.warn('⚠️ Water Distribution Mains (Layer 3) query failed:', err instanceof Error ? err.message : String(err));
          flags.push('utilities_water_mains_unavailable');
          failedServices++;
        }
        
        // 2. Water Laterals (Layer 0) - GRACEFUL DEGRADATION
        if (eps.water_laterals) {
          try {
            console.log('🔵 Querying Water Laterals (Layer 0)...');
            water_laterals = await queryArcGIS(
              eps.water_laterals.url, 
              eps.water_laterals.outFields, 
              geo_lat, 
              geo_lng, 
              "houston_water_laterals", 
              {
                timeout_ms: eps.water_laterals.timeout_ms,
                retry_attempts: eps.water_laterals.retry_attempts,
                retry_delays_ms: eps.water_laterals.retry_delays_ms,
                search_radius_ft: eps.water_laterals.search_radius_ft,
                crs: eps.water_laterals.crs,
                geometryType: eps.water_laterals.geometryType,
                spatialRel: eps.water_laterals.spatialRel
              }
            );
            if (water_laterals.length > 0) {
              flags.push("water_lateral_found");
              console.log(`✅ Water Laterals: ${water_laterals.length} service lines found`);
            } else {
              console.log('ℹ️ Water Laterals: No lines found in search radius');
            }
          } catch (err) {
            console.warn('⚠️ Water Laterals (Layer 0) query failed:', err instanceof Error ? err.message : String(err));
            flags.push('utilities_water_laterals_unavailable');
            failedServices++;
          }
        }
        
        // 3. Water Fittings (Layer 1) - GRACEFUL DEGRADATION
        if (eps.water_fittings) {
          try {
            console.log('🔵 Querying Water Fittings (Layer 1)...');
            water_fittings = await queryArcGIS(
              eps.water_fittings.url,
              eps.water_fittings.outFields,
              geo_lat,
              geo_lng,
              "houston_water_fittings",
              {
                timeout_ms: eps.water_fittings.timeout_ms,
                retry_attempts: eps.water_fittings.retry_attempts,
                retry_delays_ms: eps.water_fittings.retry_delays_ms,
                search_radius_ft: eps.water_fittings.search_radius_ft,
                crs: eps.water_fittings.crs,
                geometryType: eps.water_fittings.geometryType,
                spatialRel: eps.water_fittings.spatialRel
              }
            );
            if (water_fittings.length > 0) {
              flags.push("water_fittings_detected");
              console.log(`✅ Water Fittings: ${water_fittings.length} fittings found (valves/hydrants/meters)`);
              
              // Count hydrants for fire protection analysis
              const hydrants = water_fittings.filter(f => 
                f.attributes.FITTING_TYPE?.toLowerCase().includes('hydrant')
              );
              if (hydrants.length > 0) {
                flags.push("fire_hydrant_nearby");
                console.log(`✅ Fire hydrants nearby: ${hydrants.length}`);
              }
            } else {
              console.log('ℹ️ Water Fittings: No fittings found in search radius');
            }
          } catch (err) {
            console.warn('⚠️ Water Fittings (Layer 1) query failed:', err instanceof Error ? err.message : String(err));
            flags.push('utilities_water_fittings_unavailable');
            failedServices++;
          }
        }
        
        // Query address points for validation
        if (eps.address_points) {
          try {
            address_points = await queryArcGIS(
              eps.address_points.url,
              eps.address_points.outFields,
              geo_lat,
              geo_lng,
              "houston_address_points",
              {
                timeout_ms: eps.address_points.timeout_ms,
                retry_attempts: eps.address_points.retry_attempts,
                retry_delays_ms: eps.address_points.retry_delays_ms,
                search_radius_ft: eps.address_points.search_radius_ft,
                crs: eps.address_points.crs,
                geometryType: eps.address_points.geometryType,
                spatialRel: eps.address_points.spatialRel
              }
            );
            if (address_points.length > 0) {
              flags.push("address_validated");
              console.log(`✅ Address validated: ${address_points[0].attributes.FULL_ADDRESS || 'N/A'}`);
            }
          } catch (err) {
            console.error('Address validation query failed:', err instanceof Error ? err.message : String(err));
          }
        }
        
        // Query HCAD Parcels (official parcel boundaries and ownership)
        if (eps.parcels_hcad) {
          try {
            hcad_parcels = await queryArcGIS(
              eps.parcels_hcad.url,
              eps.parcels_hcad.outFields,
              geo_lat,
              geo_lng,
              "houston_parcels_hcad",
              {
                timeout_ms: eps.parcels_hcad.timeout_ms,
                retry_attempts: eps.parcels_hcad.retry_attempts,
                retry_delays_ms: eps.parcels_hcad.retry_delays_ms,
                search_radius_ft: eps.parcels_hcad.search_radius_ft,
                crs: eps.parcels_hcad.crs,
                geometryType: eps.parcels_hcad.geometryType,
                spatialRel: eps.parcels_hcad.spatialRel,
                returnGeometry: true
              }
            );
            
            if (hcad_parcels.length > 0) {
              const parcel = hcad_parcels[0];
              flags.push("hcad_parcel_verified");
              console.log(`✅ HCAD Parcel found: ${parcel.attributes.LOWPARCELI || 'N/A'}`);
              
              // Store parcel geometry for visualization
              parcel_geometry = parcel.geometry;
              
              // Calculate exact acreage from polygon geometry
              if (parcel_geometry && parcel_geometry.rings && parcel_geometry.rings.length > 0) {
                const area_sqft = calculatePolygonArea(parcel_geometry.rings[0]);
                calculated_acreage = area_sqft / 43560; // Convert sqft to acres
                console.log(`✅ Calculated acreage: ${calculated_acreage.toFixed(2)} acres (stated: ${parcel.attributes.StatedArea || 'N/A'})`);
              }
              
              // Flag out-of-state ownership
              if (parcel.attributes.Mail_State && parcel.attributes.Mail_State !== 'TX') {
                flags.push("out_of_state_owner");
                console.log(`⚠️ Out-of-state owner detected: ${parcel.attributes.Mail_State}`);
              }
            }
          } catch (err) {
            console.error('HCAD parcels query failed:', err instanceof Error ? err.message : String(err));
          }
        }
        
        // 4. Sewer Gravity Mains - GRACEFUL DEGRADATION
        // Variables declared at top of function (lines 618-619)
        const sewerRadius = isUrbanArea && eps.sewer.urban_search_radius_ft
          ? eps.sewer.urban_search_radius_ft 
          : eps.sewer.search_radius_ft;
        
        try {
          // PHASE 1-2: Detailed Query Debugging
          console.log('🚽 [QUERY DEBUG] Sewer Gravity Query Configuration:', {
            endpoint_url: eps.sewer.url,
            endpoint_layer: eps.sewer.url.split('/').pop()?.replace('/query', ''),
            outFields: eps.sewer.outFields,
            search_radius_ft: sewerRadius,
            crs: eps.sewer.crs,
            geometryType: eps.sewer.geometryType,
            spatialRel: eps.sewer.spatialRel,
            timeout_ms: eps.sewer.timeout_ms,
            coordinates: { geo_lat, geo_lng },
            catalog_last_validated: eps.sewer.last_validated
          });
          sewerGravity = await queryArcGIS(eps.sewer.url, eps.sewer.outFields, geo_lat, geo_lng, "houston_sewer_gravity", {
            timeout_ms: eps.sewer.timeout_ms,
            retry_attempts: eps.sewer.retry_attempts,
            retry_delays_ms: eps.sewer.retry_delays_ms,
            search_radius_ft: sewerRadius,
            crs: eps.sewer.crs || 2278,
            geometryType: eps.sewer.geometryType,
            spatialRel: eps.sewer.spatialRel
          });
          
          perfMarkers.sewer_gravity_complete = Date.now() - perfStart;
          
          if (sewerGravity.length > 0) {
            flags.push("sewer_via_arcgis_online");
            console.log('✓ [enrich-utilities] Sewer gravity query complete:', {
              features_found: sewerGravity.length,
              elapsed_ms: perfMarkers.sewer_gravity_complete - (perfMarkers.water_complete || 0)
            });
          } else {
            console.log('⚠️ [enrich-utilities] Sewer gravity: No lines found in search radius');
          }
        } catch (err) {
          console.warn('⚠️ Sewer Gravity Mains query failed:', err instanceof Error ? err.message : String(err));
          flags.push('utilities_sewer_gravity_unavailable');
          failedServices++;
        }
        
        // 4B. Sewer Service Lines - GRACEFUL DEGRADATION (Layer 1)
        if (eps.sewer_service) {
          try {
            const serviceRadius = isUrbanArea && eps.sewer_service.urban_search_radius_ft 
              ? eps.sewer_service.urban_search_radius_ft 
              : eps.sewer_service.search_radius_ft;
            
            console.log('🔧 [enrich-utilities] Querying sewer service lines (Layer 1)...', {
              endpoint: eps.sewer_service.url,
              search_radius_ft: serviceRadius,
              coordinates: { geo_lat, geo_lng }
            });
            
            sewerService = await queryArcGIS(eps.sewer_service.url, eps.sewer_service.outFields, geo_lat, geo_lng, "houston_sewer_service", {
              timeout_ms: eps.sewer_service.timeout_ms,
              retry_attempts: eps.sewer_service.retry_attempts,
              retry_delays_ms: eps.sewer_service.retry_delays_ms,
              search_radius_ft: serviceRadius,
              crs: eps.sewer_service.crs || 2278,
              geometryType: eps.sewer_service.geometryType,
              spatialRel: eps.sewer_service.spatialRel
            });
            
            if (sewerService.length > 0) {
              flags.push("sewer_service_lines_found");
              console.log('✓ [enrich-utilities] Sewer service lines query complete:', {
                features_found: sewerService.length
              });
            } else {
              console.log('⚠️ [enrich-utilities] Sewer service lines: No lines found in search radius');
            }
          } catch (err) {
            console.warn('⚠️ Sewer Service Lines query failed:', err instanceof Error ? err.message : String(err));
            flags.push('utilities_sewer_service_unavailable');
          }
        } else {
          console.log('ℹ️ [enrich-utilities] Sewer service lines endpoint not configured');
        }
        
        // 5. Sewer Force Mains - GRACEFUL DEGRADATION
        if (eps.sewer_force) {
          try {
            // PHASE 2: Query Execution Tracking
            const forceRadius = isUrbanArea && eps.sewer_force.urban_search_radius_ft 
              ? eps.sewer_force.urban_search_radius_ft 
              : eps.sewer_force.search_radius_ft;
            
            console.log('🚽 [enrich-utilities] Querying sewer force mains...', {
              endpoint_force: eps.sewer_force.url,
              search_radius_ft: forceRadius,
              coordinates: { geo_lat, geo_lng },
              crs: eps.sewer_force.crs || 2278
            });
            
            sewer_force = await queryArcGIS(eps.sewer_force.url, eps.sewer_force.outFields, geo_lat, geo_lng, "houston_sewer_force", {
              timeout_ms: eps.sewer_force.timeout_ms,
              retry_attempts: eps.sewer_force.retry_attempts,
              retry_delays_ms: eps.sewer_force.retry_delays_ms,
              search_radius_ft: forceRadius,
              crs: eps.sewer_force.crs || 2278,
              geometryType: eps.sewer_force.geometryType,
              spatialRel: eps.sewer_force.spatialRel
            });
            
            perfMarkers.sewer_force_complete = Date.now() - perfStart;
            
            if (sewer_force.length > 0) {
              flags.push("sewer_force_via_arcgis_online");
              console.log('✓ [enrich-utilities] Sewer force mains query complete:', {
                features_found: sewer_force.length,
                elapsed_ms: perfMarkers.sewer_force_complete - (perfMarkers.sewer_gravity_complete || 0)
              });
            } else {
              console.log('⚠️ [enrich-utilities] Sewer force mains: No lines found in search radius');
            }
          } catch (err) {
            console.warn('⚠️ Sewer Force Mains query failed:', err instanceof Error ? err.message : String(err));
            flags.push('utilities_sewer_force_unavailable');
            failedServices++;
          }
        } else {
          // PHASE 3: Conditional Logic Visibility
          console.warn('⚠️ [enrich-utilities] Sewer force mains endpoint not configured for this location');
          flags.push('sewer_force_not_configured');
        }
        
        // Combine gravity mains, service lines, and force mains (sorted by distance)
        const allSewerFeatures = [
          ...sewerGravity.map(f => ({ ...f, source: "gravity_main" })),
          ...sewerService.map(f => ({ ...f, source: "service_line" })),
          ...sewer_force.map(f => ({ ...f, source: "force_main" }))
        ];
        
        // Sort by distance (closest first) - this ensures service lines (usually closest) appear first
        sewer = allSewerFeatures.sort((a, b) => 
          (a.distance_ft || Infinity) - (b.distance_ft || Infinity)
        );
        
        // 6. Storm Drainage - GRACEFUL DEGRADATION
        try {
          // PHASE 1-2: Detailed Query Debugging
          const stormRadius = isUrbanArea && eps.storm.urban_search_radius_ft 
            ? eps.storm.urban_search_radius_ft 
            : eps.storm.search_radius_ft;
          
          console.log('🌧️ [QUERY DEBUG] Storm Drain Query Configuration:', {
            endpoint_url: eps.storm.url,
            endpoint_layer: eps.storm.url.split('/').pop()?.replace('/query', ''),
            outFields: eps.storm.outFields,
            search_radius_ft: stormRadius,
            crs: eps.storm.crs,
            geometryType: eps.storm.geometryType,
            spatialRel: eps.storm.spatialRel,
            timeout_ms: eps.storm.timeout_ms,
            coordinates: { geo_lat, geo_lng },
            catalog_last_validated: eps.storm.last_validated
          });
          
          storm = await queryArcGIS(eps.storm.url, eps.storm.outFields, geo_lat, geo_lng, "houston_storm", {
            timeout_ms: eps.storm.timeout_ms,
            retry_attempts: eps.storm.retry_attempts,
            retry_delays_ms: eps.storm.retry_delays_ms,
            search_radius_ft: stormRadius,
            crs: eps.storm.crs ?? 4326,
            geometryType: eps.storm.geometryType,
            spatialRel: eps.storm.spatialRel
          });
          
          perfMarkers.storm_complete = Date.now() - perfStart;
          
          if (storm.length > 0) {
            flags.push("storm_via_production_server");
            console.log('✓ [enrich-utilities] Storm drains query complete:', {
              features_found: storm.length,
              elapsed_ms: perfMarkers.storm_complete - (perfMarkers.sewer_force_complete || perfMarkers.sewer_gravity_complete || 0)
            });
          } else {
            console.log('⚠️ [enrich-utilities] Storm drains: No lines found in search radius');
          }
        } catch (err) {
          console.warn('⚠️ Storm Drainage query failed:', err instanceof Error ? err.message : String(err));
          flags.push('utilities_storm_unavailable');
          failedServices++;
        }

        // 6B. Storm Manholes - GRACEFUL ERROR HANDLING
        if (eps.storm_manholes) {
          try {
            const manholeRadius = isUrbanArea && eps.storm_manholes.urban_search_radius_ft 
              ? eps.storm_manholes.urban_search_radius_ft 
              : eps.storm_manholes.search_radius_ft;
            
            console.log('🌧️ [enrich-utilities] Querying storm manholes...', {
              endpoint: eps.storm_manholes.url,
              search_radius_ft: manholeRadius,
              coordinates: { geo_lat, geo_lng },
              outFields: eps.storm_manholes.outFields
            });
            
            stormManholes = await queryArcGIS(
              eps.storm_manholes.url, 
              eps.storm_manholes.outFields, 
              geo_lat, 
              geo_lng, 
              "houston_storm_manholes", 
              {
                timeout_ms: eps.storm_manholes.timeout_ms,
                retry_attempts: eps.storm_manholes.retry_attempts,
                retry_delays_ms: eps.storm_manholes.retry_delays_ms,
                search_radius_ft: manholeRadius,
                crs: eps.storm_manholes.crs ?? 4326,
                geometryType: eps.storm_manholes.geometryType,
                spatialRel: eps.storm_manholes.spatialRel
              }
            );
            
            if (stormManholes.length > 0) {
              flags.push("storm_manholes_found");
              console.log('✓ [enrich-utilities] Storm manholes query complete:', {
                features_found: stormManholes.length
              });
            } else {
              console.log('ℹ️ [enrich-utilities] Storm manholes: No manholes found in search radius');
            }
          } catch (err) {
            // CRITICAL: Don't let storm manholes failure crash entire enrichment
            console.error('⚠️ [GRACEFUL DEGRADATION] Storm Manholes query failed - continuing with other utilities:', {
              error: err instanceof Error ? err.message : String(err),
              stack: err instanceof Error ? err.stack : undefined,
              endpoint: eps.storm_manholes?.url,
              outFields: eps.storm_manholes?.outFields
            });
            stormManholes = []; // Ensure empty array instead of undefined
            flags.push('utilities_storm_manholes_unavailable');
            // Add detailed error metadata for debugging
            apiMeta.storm_manholes_error = {
              message: err instanceof Error ? err.message : String(err),
              timestamp: new Date().toISOString(),
              attempted_fields: eps?.storm_manholes?.outFields
            };
          }
        } else {
          console.log('ℹ️ [enrich-utilities] Storm manholes endpoint not configured for this location');
          stormManholes = [];
        }

        
        // Log summary of utility query results
        const allWaterLines = [...water, ...water_laterals];
        const allSewerLines = [...sewerGravity, ...sewerService, ...sewer_force];
        const allStormLines = [...storm];
    const allStormFeatures = [...storm, ...stormManholes];
    console.log(`📊 Utility query summary - Water: ${allWaterLines.length}, Sewer: ${allSewerLines.length} (Gravity: ${sewerGravity.length}, Service: ${sewerService.length}, Force: ${sewer_force.length}), Storm: ${allStormFeatures.length} (Lines: ${storm.length}, Manholes: ${stormManholes.length}), Failed Services: ${failedServices}/${totalServices}`);
        
        // Traffic counts (disabled - endpoint unavailable)
        traffic = [];
        if (eps?.traffic && eps.traffic.enabled !== false) {
          try {
            console.log('Querying traffic counts...');
            traffic = await queryArcGIS(eps.traffic.url, eps.traffic.outFields, geo_lat, geo_lng, "houston_traffic", {
              timeout_ms: eps.traffic.timeout_ms || 8000,
              retry_attempts: eps.traffic.retry_attempts || 3,
              retry_delays_ms: eps.traffic.retry_delays_ms || [500, 1000, 2000],
              search_radius_ft: eps.traffic.search_radius_ft,
              crs: eps.traffic.crs || 4326,
              geometryType: eps.traffic.geometryType,
              spatialRel: eps.traffic.spatialRel
            });
            
            if (traffic.length > 0) {
              flags.push("traffic_via_city");
              console.log(`✅ Traffic count found: ${traffic[0].attributes.ADT || 'N/A'} ADT`);
            }
          } catch (trafficErr) {
            console.error('Traffic query failed (endpoint disabled):', trafficErr instanceof Error ? trafficErr.message : String(trafficErr));
          }
        } else {
          console.log('⚠️ Traffic counts endpoint disabled - will rely on OSM highway tags');
        }
      } else if (cityLower.includes("austin")) {
        console.log('Using Austin endpoints');
        eps = endpointCatalog.austin;
        
        // Set CRS values for Austin (override defaults)
        waterCrs = eps.water?.crs || 4326;
        sewerCrs = eps.sewer?.crs || 4326;
        stormCrs = eps.storm?.crs || 4326;
        
        water = await queryArcGIS(eps.water.url, eps.water.outFields, geo_lat, geo_lng, "austin_water", {
          timeout_ms: eps.water.timeout_ms,
          retry_attempts: eps.water.retry_attempts,
          retry_delays_ms: eps.water.retry_delays_ms,
          search_radius_ft: eps.water.search_radius_ft,
          crs: eps.water.crs, // Austin uses WGS84 (4326) by default
          geometryType: eps.water.geometryType,
          spatialRel: eps.water.spatialRel
        });
        sewer = await queryArcGIS(eps.sewer.url, eps.sewer.outFields, geo_lat, geo_lng, "austin_sewer", {
          timeout_ms: eps.sewer.timeout_ms,
          retry_attempts: eps.sewer.retry_attempts,
          retry_delays_ms: eps.sewer.retry_delays_ms,
          search_radius_ft: eps.sewer.search_radius_ft,
          crs: eps.sewer.crs,
          geometryType: eps.sewer.geometryType,
          spatialRel: eps.sewer.spatialRel
        });
        if (eps.reclaimed) {
          storm = await queryArcGIS(eps.reclaimed.url, eps.reclaimed.outFields, geo_lat, geo_lng, "austin_reclaimed", {
            timeout_ms: eps.reclaimed.timeout_ms,
            retry_attempts: eps.reclaimed.retry_attempts,
            retry_delays_ms: eps.reclaimed.retry_delays_ms,
            search_radius_ft: eps.reclaimed.search_radius_ft,
            crs: eps.reclaimed.crs,
            geometryType: eps.reclaimed.geometryType,
            spatialRel: eps.reclaimed.spatialRel
          });
        }
      } else if (county?.toLowerCase().includes("harris") || county?.toLowerCase().includes("montgomery") || county?.toLowerCase().includes("fort bend")) {
        // MUD/WCID already resolved by resolve-utility-ownership at the beginning
        console.log(`${county} County (outside city limits) - utility ownership resolved: MUD=${mud_district || 'none'}, WCID=${wcid_district || 'none'}, ETJ=${etj_provider || 'unknown'}`);
        flags.push("etj_provider_resolved_early");
        
        // MUNICIPAL ENDPOINT ROUTING: Check if parcel is within a known municipality with utility data
        const detectedMunicipality = detectMunicipality(geo_lat, geo_lng);
        const municipalEps = endpointCatalog.harris_county_municipalities;
        
        if (detectedMunicipality && municipalEps?.[detectedMunicipality]) {
          console.log(`🏛️ [Municipal] Detected municipality: ${detectedMunicipality.toUpperCase()}`);
          flags.push(`municipality_${detectedMunicipality}`);
          const cityEps = municipalEps[detectedMunicipality];
          
          // Query municipal water endpoint
          if (cityEps.water) {
            try {
              console.log(`💧 [${detectedMunicipality}] Querying municipal water lines...`);
              const municipalWater = await queryArcGIS(
                cityEps.water.url,
                cityEps.water.outFields,
                geo_lat,
                geo_lng,
                `${detectedMunicipality}_water`,
                {
                  timeout_ms: cityEps.water.timeout_ms,
                  retry_attempts: cityEps.water.retry_attempts,
                  retry_delays_ms: cityEps.water.retry_delays_ms,
                  search_radius_ft: cityEps.water.search_radius_ft,
                  crs: cityEps.water.crs,
                  geometryType: cityEps.water.geometryType,
                  spatialRel: cityEps.water.spatialRel
                }
              );
              
              if (municipalWater.length > 0) {
                // Normalize municipal water fields to canonical format
                water = municipalWater.map((f: any) => ({
                  attributes: {
                    DIAMETER: f.attributes.DIAMETER || f.attributes.PIPE_SIZE || f.attributes.SIZE || null,
                    MATERIAL: f.attributes.MATERIAL || f.attributes.PIPE_MATERIAL || null,
                    STATUS: f.attributes.STATUS || f.attributes.LIFECYCLE_STATUS || 'ACTIVE',
                    OWNER: f.attributes.OWNER || f.attributes.OWNERSHIP || f.attributes.AUTHORITY || detectedMunicipality.toUpperCase(),
                    FACILITYID: f.attributes.FACILITYID || null,
                    INSTALL_YEAR: f.attributes.YEAR_INSTALLED || (f.attributes.INSTALL_DATE ? new Date(f.attributes.INSTALL_DATE).getFullYear() : null)
                  },
                  geometry: f.geometry
                }));
                flags.push(`water_via_${detectedMunicipality}`);
                waterCrs = cityEps.water.crs || 4326;
                console.log(`✅ [${detectedMunicipality}] Municipal water lines found: ${municipalWater.length}`);
              }
            } catch (err) {
              console.warn(`⚠️ [${detectedMunicipality}] Municipal water query failed:`, err instanceof Error ? err.message : String(err));
              flags.push(`${detectedMunicipality}_water_unavailable`);
            }
          }
          
          // Query municipal sewer endpoint(s)
          const sewerEndpoints = [
            cityEps.sewer,
            cityEps.sewer_gravity,
            cityEps.sewer_pressure
          ].filter(Boolean);
          
          for (const sewerEp of sewerEndpoints) {
            try {
              const sewerType = sewerEp === cityEps.sewer_pressure ? 'pressure' : sewerEp === cityEps.sewer_gravity ? 'gravity' : 'main';
              console.log(`🚽 [${detectedMunicipality}] Querying municipal sewer (${sewerType})...`);
              const municipalSewer = await queryArcGIS(
                sewerEp.url,
                sewerEp.outFields,
                geo_lat,
                geo_lng,
                `${detectedMunicipality}_sewer_${sewerType}`,
                {
                  timeout_ms: sewerEp.timeout_ms,
                  retry_attempts: sewerEp.retry_attempts,
                  retry_delays_ms: sewerEp.retry_delays_ms,
                  search_radius_ft: sewerEp.search_radius_ft,
                  crs: sewerEp.crs,
                  geometryType: sewerEp.geometryType,
                  spatialRel: sewerEp.spatialRel
                }
              );
              
              if (municipalSewer.length > 0) {
                const normalizedSewer = municipalSewer.map((f: any) => ({
                  attributes: {
                    DIAMETER: f.attributes.DIAMETER || f.attributes.SIZE || null,
                    MATERIAL: f.attributes.MATERIAL || null,
                    STATUS: f.attributes.STATUS || f.attributes.LIFECYCLE_STATUS || 'ACTIVE',
                    OWNER: f.attributes.OWNER || f.attributes.OWNERSHIP || detectedMunicipality.toUpperCase(),
                    FACILITYID: f.attributes.FACILITYID || f.attributes.SEGMENT_ID || null,
                    PIPE_TYPE: f.attributes.PIPE_TYPE || (f.attributes.FORCED_MAI === 'Y' ? 'FORCE_MAIN' : 'GRAVITY_MAIN'),
                    INSTALL_YEAR: f.attributes.YEAR_INSTALLED || (f.attributes.INSTALL_DATE ? new Date(f.attributes.INSTALL_DATE).getFullYear() : null)
                  },
                  geometry: f.geometry,
                  source: sewerType === 'pressure' ? 'force_main' : sewerType === 'gravity' ? 'gravity_main' : 'main'
                }));
                sewer = [...sewer, ...normalizedSewer];
                flags.push(`sewer_via_${detectedMunicipality}_${sewerType}`);
                sewerCrs = sewerEp.crs || 4326;
                console.log(`✅ [${detectedMunicipality}] Municipal sewer (${sewerType}) found: ${municipalSewer.length}`);
              }
            } catch (err) {
              console.warn(`⚠️ [${detectedMunicipality}] Municipal sewer query failed:`, err instanceof Error ? err.message : String(err));
            }
          }
          
          // Query municipal storm endpoint(s)
          const stormEndpoints = [
            cityEps.storm,
            cityEps.storm_city,
            cityEps.storm_non_city,
            cityEps.storm_channels
          ].filter(Boolean);
          
          for (const stormEp of stormEndpoints) {
            try {
              const stormType = stormEp === cityEps.storm_channels ? 'channels' : stormEp === cityEps.storm_city ? 'city' : stormEp === cityEps.storm_non_city ? 'non_city' : 'main';
              console.log(`🌧️ [${detectedMunicipality}] Querying municipal storm (${stormType})...`);
              const municipalStorm = await queryArcGIS(
                stormEp.url,
                stormEp.outFields,
                geo_lat,
                geo_lng,
                `${detectedMunicipality}_storm_${stormType}`,
                {
                  timeout_ms: stormEp.timeout_ms,
                  retry_attempts: stormEp.retry_attempts,
                  retry_delays_ms: stormEp.retry_delays_ms,
                  search_radius_ft: stormEp.search_radius_ft,
                  crs: stormEp.crs,
                  geometryType: stormEp.geometryType,
                  spatialRel: stormEp.spatialRel
                }
              );
              
              if (municipalStorm.length > 0) {
                const normalizedStorm = municipalStorm.map((f: any) => ({
                  attributes: {
                    FACILITYID: f.attributes.FACILITYID || null,
                    DIAMETER: f.attributes.DIAMETER || f.attributes.PIPE_SIZE || f.attributes.SIZE_NUMBER || null,
                    MATERIAL: f.attributes.MATERIAL || null,
                    STATUS: f.attributes.STATUS || f.attributes.LIFECYCLE_STATUS || 'ACTIVE',
                    OWNER: f.attributes.OWNER || f.attributes.MAINT_OWNER || f.attributes.MAINT_RESPONSIBILITY || detectedMunicipality.toUpperCase(),
                    TYPE: f.attributes.TYPE || f.attributes.PIPE_TYPE || f.attributes.CULVERT_TYPE || f.attributes.CHANNEL_TYPE || 'PIPE',
                    CONDITION: f.attributes.CONDITION || null,
                    FLOW_DIR: f.attributes.FLOW_DIR || f.attributes.FLOW_DIRECTION || null,
                    CHANNEL_NAME: f.attributes.CHANNEL_NAME || null
                  },
                  geometry: f.geometry
                }));
                storm = [...storm, ...normalizedStorm];
                flags.push(`storm_via_${detectedMunicipality}_${stormType}`);
                stormCrs = stormEp.crs || 4326;
                console.log(`✅ [${detectedMunicipality}] Municipal storm (${stormType}) found: ${municipalStorm.length}`);
              }
            } catch (err) {
              console.warn(`⚠️ [${detectedMunicipality}] Municipal storm query failed:`, err instanceof Error ? err.message : String(err));
            }
          }
          
          console.log(`📊 [${detectedMunicipality}] Municipal utility summary - Water: ${water.length}, Sewer: ${sewer.length}, Storm: ${storm.length}`);
        }
        
        // FALLBACK: Query HCRWA regional water authority if no municipal water found
        if (water.length === 0 && county?.toLowerCase().includes("harris") && endpointCatalog.harris_county?.hcrwa_water) {
          try {
            console.log('💧 [Harris County] Querying HCRWA regional water authority...');
            const hcrwaWater = await queryArcGIS(
              endpointCatalog.harris_county.hcrwa_water.url,
              endpointCatalog.harris_county.hcrwa_water.outFields,
              geo_lat,
              geo_lng,
              "harris_hcrwa_water",
              {
                timeout_ms: endpointCatalog.harris_county.hcrwa_water.timeout_ms,
                retry_attempts: endpointCatalog.harris_county.hcrwa_water.retry_attempts,
                retry_delays_ms: endpointCatalog.harris_county.hcrwa_water.retry_delays_ms,
                search_radius_ft: endpointCatalog.harris_county.hcrwa_water.search_radius_ft,
                crs: endpointCatalog.harris_county.hcrwa_water.crs,
                geometryType: endpointCatalog.harris_county.hcrwa_water.geometryType,
                spatialRel: endpointCatalog.harris_county.hcrwa_water.spatialRel
              }
            );
            
            if (hcrwaWater.length > 0) {
              water = hcrwaWater.map((f: any) => ({
                attributes: {
                  DIAMETER: f.attributes.PIPE_DIAM || null,
                  MATERIAL: null,
                  STATUS: f.attributes.PIPE_STATUS || 'ACTIVE',
                  OWNER: 'HCRWA',
                  PROJECT_NAME: f.attributes.PROJECT_NAME || null,
                  PHASE: f.attributes.PHASE || null
                },
                geometry: f.geometry
              }));
              flags.push("water_via_hcrwa");
              waterCrs = endpointCatalog.harris_county.hcrwa_water.crs || 2278;
              console.log(`✅ HCRWA water lines found: ${hcrwaWater.length}`);
            }
          } catch (err) {
            console.warn('⚠️ HCRWA water query failed:', err instanceof Error ? err.message : String(err));
          }
        }
        
        // Query county-wide storm drainage (HCFCD) for Harris County
        if (county?.toLowerCase().includes("harris") && endpointCatalog.harris_county) {
          const harrisEps = endpointCatalog.harris_county;
          
          // 1. HCFCD Storm Channels (county-wide drainage)
          if (harrisEps.hcfcd_channels) {
            try {
              console.log('🌊 [Harris County] Querying HCFCD storm drainage channels...');
              const hcfcdChannels = await queryArcGIS(
                harrisEps.hcfcd_channels.url,
                harrisEps.hcfcd_channels.outFields,
                geo_lat,
                geo_lng,
                "harris_hcfcd_channels",
                {
                  timeout_ms: harrisEps.hcfcd_channels.timeout_ms,
                  retry_attempts: harrisEps.hcfcd_channels.retry_attempts,
                  retry_delays_ms: harrisEps.hcfcd_channels.retry_delays_ms,
                  search_radius_ft: harrisEps.hcfcd_channels.search_radius_ft,
                  crs: harrisEps.hcfcd_channels.crs,
                  geometryType: harrisEps.hcfcd_channels.geometryType,
                  spatialRel: harrisEps.hcfcd_channels.spatialRel
                }
              );
              
              if (hcfcdChannels.length > 0) {
                // Map HCFCD channels to storm line format
                storm = hcfcdChannels.map((f: any) => ({
                  attributes: {
                    FACILITYID: f.attributes.UNIT_NO || null,
                    DIAMETER: null, // Channels don't have diameter
                    MATERIAL: 'CHANNEL',
                    STATUS: 'ACTIVE',
                    OWNER: f.attributes.MAINT_RESP || 'HCFCD',
                    CHAN_NAME: f.attributes.CHAN_NAME || null,
                    LENGTH_FT: f.attributes.LENGTH_FT || null,
                    TYPE: f.attributes.TYPE || 'CHANNEL'
                  },
                  geometry: f.geometry
                }));
                flags.push("storm_via_hcfcd_channels");
                stormCrs = harrisEps.hcfcd_channels.crs || 2278;
                console.log(`✅ HCFCD channels found: ${hcfcdChannels.length}`);
              } else {
                console.log('⚠️ HCFCD channels: No channels found in search radius');
              }
            } catch (err) {
              console.warn('⚠️ HCFCD channels query failed:', err instanceof Error ? err.message : String(err));
              flags.push('hcfcd_channels_unavailable');
            }
          }
          
          // 2. HCFCD Outfalls (stormwater discharge points)
          if (harrisEps.hcfcd_outfalls) {
            try {
              console.log('🌊 [Harris County] Querying HCFCD storm outfalls...');
              const hcfcdOutfalls = await queryArcGIS(
                harrisEps.hcfcd_outfalls.url,
                harrisEps.hcfcd_outfalls.outFields,
                geo_lat,
                geo_lng,
                "harris_hcfcd_outfalls",
                {
                  timeout_ms: harrisEps.hcfcd_outfalls.timeout_ms,
                  retry_attempts: harrisEps.hcfcd_outfalls.retry_attempts,
                  retry_delays_ms: harrisEps.hcfcd_outfalls.retry_delays_ms,
                  search_radius_ft: harrisEps.hcfcd_outfalls.search_radius_ft,
                  crs: harrisEps.hcfcd_outfalls.crs,
                  geometryType: harrisEps.hcfcd_outfalls.geometryType,
                  spatialRel: harrisEps.hcfcd_outfalls.spatialRel
                }
              );
              
              if (hcfcdOutfalls.length > 0) {
                // Add outfalls as storm manholes equivalent
                stormManholes = hcfcdOutfalls.map((f: any) => ({
                  attributes: {
                    FACILITYID: f.attributes.OUTFALL_ID || null,
                    DIAMETER: f.attributes.DIAMETER || null,
                    MATERIAL: f.attributes.MATERIAL || null,
                    OWNER: 'HCFCD',
                    OUTFALL_TYPE: f.attributes.OUTFALL_TYPE || null,
                    UNIT_NO: f.attributes.UNIT_NO || null
                  },
                  geometry: f.geometry
                }));
                flags.push("hcfcd_outfalls_found");
                console.log(`✅ HCFCD outfalls found: ${hcfcdOutfalls.length}`);
              }
            } catch (err) {
              console.warn('⚠️ HCFCD outfalls query failed:', err instanceof Error ? err.message : String(err));
            }
          }
          
          // 3. HCFCD Detention Basins (regional flood control)
          if (harrisEps.hcfcd_detention) {
            try {
              console.log('🌊 [Harris County] Querying HCFCD detention basins...');
              const hcfcdDetention = await queryArcGIS(
                harrisEps.hcfcd_detention.url,
                harrisEps.hcfcd_detention.outFields,
                geo_lat,
                geo_lng,
                "harris_hcfcd_detention",
                {
                  timeout_ms: harrisEps.hcfcd_detention.timeout_ms,
                  retry_attempts: harrisEps.hcfcd_detention.retry_attempts,
                  retry_delays_ms: harrisEps.hcfcd_detention.retry_delays_ms,
                  search_radius_ft: harrisEps.hcfcd_detention.search_radius_ft,
                  crs: harrisEps.hcfcd_detention.crs,
                  geometryType: harrisEps.hcfcd_detention.geometryType,
                  spatialRel: harrisEps.hcfcd_detention.spatialRel
                }
              );
              
              if (hcfcdDetention.length > 0) {
                flags.push("hcfcd_detention_nearby");
                console.log(`✅ HCFCD detention basins nearby: ${hcfcdDetention.length}`);
                // Store detention basin info in api_meta for reference
                apiMeta.push({
                  api: 'harris_hcfcd_detention',
                  url: harrisEps.hcfcd_detention.url,
                  status: 200,
                  elapsed_ms: 0,
                  timestamp: new Date().toISOString(),
                  detention_basins: hcfcdDetention.map((f: any) => ({
                    name: f.attributes.BASIN_NAME,
                    storage_af: f.attributes.STORAGE_AF,
                    status: f.attributes.STATUS
                  }))
                });
              }
            } catch (err) {
              console.warn('⚠️ HCFCD detention basins query failed:', err instanceof Error ? err.message : String(err));
            }
          }
        }
        
        // Query PUC CCN service areas for water/sewer jurisdiction (statewide)
        if (endpointCatalog.texas_statewide?.puc_ccn_water_areas) {
          try {
            console.log('🏛️ [Statewide] Querying PUC CCN water service areas...');
            const ccnWater = await queryPolygon(
              endpointCatalog.texas_statewide.puc_ccn_water_areas.url,
              endpointCatalog.texas_statewide.puc_ccn_water_areas.outFields,
              geo_lat,
              geo_lng
            );
            
            if (ccnWater.length > 0) {
              const ccnName = ccnWater[0].attributes.CCN_NAME || ccnWater[0].attributes.CCN_NO;
              if (ccnName && !etj_provider) {
                etj_provider = ccnName;
              }
              flags.push("ccn_water_service_area");
              console.log(`✅ PUC CCN Water provider: ${ccnName}`);
            }
          } catch (err) {
            console.warn('⚠️ PUC CCN water areas query failed:', err instanceof Error ? err.message : String(err));
          }
        }
        
        if (endpointCatalog.texas_statewide?.puc_ccn_sewer_areas) {
          try {
            console.log('🏛️ [Statewide] Querying PUC CCN sewer service areas...');
            const ccnSewer = await queryPolygon(
              endpointCatalog.texas_statewide.puc_ccn_sewer_areas.url,
              endpointCatalog.texas_statewide.puc_ccn_sewer_areas.outFields,
              geo_lat,
              geo_lng
            );
            
            if (ccnSewer.length > 0) {
              const ccnName = ccnSewer[0].attributes.CCN_NAME || ccnSewer[0].attributes.CCN_NO;
              flags.push("ccn_sewer_service_area");
              console.log(`✅ PUC CCN Sewer provider: ${ccnName}`);
            }
          } catch (err) {
            console.warn('⚠️ PUC CCN sewer areas query failed:', err instanceof Error ? err.message : String(err));
          }
        }
      } else {
        console.log('No city-specific endpoints, using statewide fallback');
        flags.push("texas_statewide_tceq");
      }
    } catch (err) {
      if (err instanceof Error && err.message === "api_unreachable") {
        console.log('⚠️ Utility APIs are unreachable (DNS/network error)');
        apiUnreachable = true;
        flags.push("utilities_api_unreachable");
      } else {
        throw err;
      }
    }

    // 2.6. MUD district already resolved by resolve-utility-ownership - skip redundant checks
    const allUtilitiesEmpty = !water.length && !sewer.length && !sewer_force.length && !storm.length;
    const isUrbanArea = endpointCatalog.config.urban_cities.some((c: string) => 
      cityLower.includes(c.toLowerCase())
    );
    
    if (allUtilitiesEmpty && !apiUnreachable && mud_district) {
      console.log(`⚠️ Property with 0 utility lines but MUD resolved: ${mud_district}`);
      if (!flags.includes("served_by_mud_district")) {
        flags.push("served_by_mud_district");
      }
    }
    
    if (allUtilitiesEmpty && isUrbanArea && !apiUnreachable) {
      console.log('⚠️ All utilities returned 0 features, triggering OSM fallback...');
      
      try {
        const osmResult = await supabase.functions.invoke('enrich-utilities-osm', {
          body: { lat: geo_lat, lng: geo_lng, radius_ft: 800 }
        });
        
        if (osmResult.data && !osmResult.error) {
          console.log('✅ OSM fallback succeeded:', osmResult.data);
          
          // Store OSM data as utility summaries (will be used later in buildUtilitySummary)
          if (osmResult.data.water?.has_service) {
            water = [{ 
              attributes: { DIAMETER: null, MATERIAL: 'OSM_DATA', OWNER: 'OpenStreetMap' },
              geometry: null,
              _osmSource: true
            }];
          }
          if (osmResult.data.sewer?.has_service) {
            sewer = [{ 
              attributes: { DIAMETER: null, MATERIAL: 'OSM_DATA', OWNER: 'OpenStreetMap' },
              geometry: null,
              _osmSource: true
            }];
          }
          if (osmResult.data.storm?.has_service) {
            storm = [{ 
              attributes: { DIAMETER: null, MATERIAL: 'OSM_DATA', OWNER: 'OpenStreetMap' },
              geometry: null,
              _osmSource: true
            }];
          }
          
          // Add flag to indicate OSM was used
          if (!flags.includes("utilities_from_osm")) {
            flags.push("utilities_from_osm");
          }
        } else {
          console.error('OSM fallback failed:', osmResult.error);
        }
      } catch (osmErr) {
        console.error('OSM fallback error:', osmErr instanceof Error ? osmErr.message : String(osmErr));
      }
    }

    // 3. Determine final flags and enrichment status
    let enrichmentStatus: 'complete' | 'partial' | 'failed';
    
    if (apiUnreachable) {
      flags = ["utilities_api_unreachable"];
      enrichmentStatus = 'failed';
    } else if (failedServices === totalServices) {
      // All utility services failed
      flags.push("utilities_not_found");
      enrichmentStatus = 'failed';
      console.error('❌ All utility services failed');
    } else if (failedServices > 0) {
      // Some services failed, but we got partial data
      enrichmentStatus = 'partial';
      console.warn(`⚠️ Partial utility data: ${failedServices}/${totalServices} services unavailable`);
    } else {
      // All services succeeded
      enrichmentStatus = 'complete';
      console.log('✅ All utility services queried successfully');
    }
    
    // Add general "not found" flag if no data returned (even if APIs succeeded)
    if (!water.length && !sewer.length && !storm.length && !water_laterals.length) {
      if (!flags.includes("utilities_not_found")) {
        flags.push("utilities_not_found");
      }
      // If we got no data at all but also had no failures, mark as partial (might be rural area)
      if (enrichmentStatus === 'complete' && failedServices === 0) {
        enrichmentStatus = 'partial';
      }
    }

    // 4. Build utilities_summary structure
    const buildUtilitySummary = (features: any[], utilityType: string, serviceUrl: string) => {
      if (!features || features.length === 0) {
        return {
          has_service: false,
          min_distance_ft: null,
          service_url: serviceUrl,
          last_verified: new Date().toISOString()
        };
      }

      // Find closest feature
      let minDistance = Infinity;
      for (const feature of features) {
        const formatted = formatLines([feature], geo_lat, geo_lng, utilityType)[0];
        if (formatted.distance_ft && formatted.distance_ft < minDistance) {
          minDistance = formatted.distance_ft;
        }
      }

      return {
        has_service: true,
        min_distance_ft: minDistance !== Infinity ? Math.round(minDistance) : null,
        service_url: serviceUrl,
        last_verified: new Date().toISOString()
      };
    };

    const utilitiesSummary = {
      water: buildUtilitySummary(
        water,
        "water",
        cityLower.includes("houston") ? eps.water.url :
        cityLower.includes("austin") ? "https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/AWU_Waterlines/FeatureServer/0" :
        null
      ),
      sewer: buildUtilitySummary(
        sewer, 
        "sewer",
        cityLower.includes("houston") ? eps.sewer.url :
        cityLower.includes("austin") ? "https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/AWU_Wastewaterlines/FeatureServer/0" :
        null
      ),
      force_main: buildUtilitySummary(
        sewer_force,
        "force_main",
        cityLower.includes("houston") ? eps.sewer_force?.url : null
      ),
      storm: buildUtilitySummary(
        storm,
        "storm",
        cityLower.includes("houston") ? eps.storm.url :
        cityLower.includes("austin") ? "https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/AWU_ReclaimedWaterlines/FeatureServer/0" :
        null
      )
    };

    // 5. Save results with api_meta, enrichment_status, and utilities_summary
    // Only update database if we have an application_id
    if (application_id) {
      // PHASE 4: Database Update Diagnostics
      console.log('💾 [enrich-utilities] Preparing database update:', {
        application_id,
        water_features: water.length,
        sewer_features: sewer.length + sewer_force.length,
        storm_features: storm.length,
        flags: flags,
        enrichment_status: enrichmentStatus
      });
      
      // **NEW**: Comparative API Call Summary for debugging
      console.log('═══════════════════════════════════════════════════');
      console.log('📊 API CALL SUMMARY (for debugging storm/sewer issues)');
      console.log('═══════════════════════════════════════════════════');

      const apiSummary = {
        successful: apiMeta.filter(m => m.status >= 200 && m.status < 300),
        failed: apiMeta.filter(m => m.status >= 400 || m.error),
        http_400_errors: apiMeta.filter(m => m.status === 400)
      };

      console.log(`✅ Successful APIs: ${apiSummary.successful.length}`);
      apiSummary.successful.forEach(api => {
        console.log(`  - ${api.api}: ${api.status} (${api.elapsed_ms}ms)`);
      });

      console.log(`❌ Failed APIs: ${apiSummary.failed.length}`);
      apiSummary.failed.forEach(api => {
        console.log(`  - ${api.api}: ${api.status} - ${api.error}`);
        if ((api as any).error_body) {
          console.log(`    Full error: ${JSON.stringify((api as any).error_body)}`);
        }
      });

      if (apiSummary.http_400_errors.length > 0) {
        console.log('');
        console.log('🔍 HTTP 400 ERRORS - DETAILED ANALYSIS:');
        apiSummary.http_400_errors.forEach(api => {
          console.log(`  API: ${api.api}`);
          console.log(`  URL: ${api.url}`);
          console.log(`  Error: ${JSON.stringify((api as any).error_body || api.error, null, 2)}`);
          console.log('  ---');
        });
      }

      // **NEW**: Compare successful water vs failed storm/sewer
      const waterSuccess = apiSummary.successful.find(a => a.api?.includes('water'));
      const stormFailed = apiSummary.failed.find(a => a.api?.includes('storm'));
      const sewerFailed = apiSummary.failed.find(a => a.api?.includes('sewer'));

      if (waterSuccess && (stormFailed || sewerFailed)) {
        console.log('');
        console.log('🔬 COMPARATIVE ANALYSIS: Water (✅) vs Storm/Sewer (❌)');
        console.log('Water API (SUCCESS):');
        console.log(`  URL: ${waterSuccess.url}`);
        console.log(`  Status: ${waterSuccess.status}`);
        
        if (stormFailed) {
          console.log('');
          console.log('Storm API (FAILED):');
          console.log(`  URL: ${stormFailed.url}`);
          console.log(`  Status: ${stormFailed.status}`);
          console.log(`  Error: ${stormFailed.error}`);
          
          // URL comparison
          try {
            const waterUrl = new URL(waterSuccess.url);
            const stormUrl = new URL(stormFailed.url);
            console.log('');
            console.log('URL Differences:');
            console.log(`  Water host: ${waterUrl.host}`);
            console.log(`  Storm host: ${stormUrl.host}`);
            console.log(`  Water path: ${waterUrl.pathname}`);
            console.log(`  Storm path: ${stormUrl.pathname}`);
          } catch (e) {
            console.log('Could not parse URLs for comparison');
          }
        }
        
        if (sewerFailed) {
          console.log('');
          console.log('Sewer API (FAILED):');
          console.log(`  URL: ${sewerFailed.url}`);
          console.log(`  Status: ${sewerFailed.status}`);
          console.log(`  Error: ${sewerFailed.error}`);
        }
      }

      console.log('═══════════════════════════════════════════════════');
      
      // PHASE 4: Add Observability for Database Update
      const dbUpdateStart = Date.now();
      
      // Prepare the full update payload
      const updatePayload = {
        water_lines: formatLines(water, geo_lat, geo_lng, 'water', waterCrs).map(({ geometry, ...rest }: any) => rest),
        sewer_lines: formatLines(sewer, geo_lat, geo_lng, 'sewer', sewerCrs).map(({ geometry, ...rest }: any) => rest),
        storm_lines: formatLines(storm, geo_lat, geo_lng, 'storm', stormCrs).map(({ geometry, ...rest }: any) => rest),
        utilities_summary: utilitiesSummary,
        data_flags: flags,
        api_meta: apiMeta,
        enrichment_status: enrichmentStatus,
        // Add utility ownership resolution results
        mud_district: mud_district,
        wcid_district: wcid_district,
        etj_provider: etj_provider,
        // Add traffic data if available
        ...(traffic && traffic.length > 0 && {
          traffic_aadt: traffic[0].attributes.ADT || null,
          traffic_road_name: traffic[0].attributes.LOCATION || null,
          traffic_year: traffic[0].attributes.ADT_YEAR || null
        }),
        // Build single merged enrichment_metadata object (FIX: prevents data loss from overwriting)
        enrichment_metadata: {
          // Preserve existing city/county/state
          city: city || null,
          county: county || null,
          enriched_at: new Date().toISOString(),
          // Utility ownership resolution
          utility_ownership: utilityOwnership,
          utility_resolution_confidence: utility_resolution_confidence,
          estimated_utility_costs: estimated_utility_costs,
          
          // Water laterals data (Layer 0)
          ...(water_laterals.length > 0 && {
            water_laterals_count: water_laterals.length,
            water_laterals_data: formatLines(water_laterals, geo_lat, geo_lng, 'water_laterals', waterLateralsCrs)
          }),
          
          // Water fittings data (Layer 1 - valves, hydrants, meters)
          ...(water_fittings.length > 0 && {
            water_fittings_count: water_fittings.length,
            water_fittings_data: formatLines(water_fittings, geo_lat, geo_lng, 'water_fittings', waterFittingsCrs).map((f, idx) => ({
              ...f,
              fitting_type: water_fittings[idx].attributes.FITTING_TYPE || null
            })),
            fire_hydrants_count: water_fittings.filter(f => 
              f.attributes.FITTING_TYPE?.toLowerCase().includes('hydrant')
            ).length
          }),

          // Storm manholes data (NEW - point features, gracefully handles API failures)
          ...(stormManholes.length > 0 && {
            storm_manholes_count: stormManholes.length,
            storm_manholes_data: stormManholes.map(m => ({
              facility_id: m.attributes.FACILITYID || null,
              diameter: m.attributes.DIAMETER || null,
              rim_elevation: m.attributes.RIM_ELEVATION || null,
              invert_elevation: m.attributes.INVERT_ELEVATION || null,
              material: m.attributes.MATERIAL || null,
              owner: m.attributes.OWNER || null,
              status: m.attributes.STATUS || null,
              distance_ft: m.distance_ft || null,
              geometry: m.geometry || null
            })),
            // Aggregated metrics for AI scoring
            nearest_storm_manhole_ft: Math.min(...stormManholes.map(m => m.distance_ft || Infinity)),
            avg_rim_elev_ft: stormManholes.reduce((sum, m) => sum + (m.attributes.RIM_ELEVATION || 0), 0) / stormManholes.length,
            avg_invert_elev_ft: stormManholes.reduce((sum, m) => sum + (m.attributes.INVERT_ELEVATION || 0), 0) / stormManholes.length,
            elevation_difference_ft: (() => {
              const avgRim = stormManholes.reduce((sum, m) => sum + (m.attributes.RIM_ELEVATION || 0), 0) / stormManholes.length;
              const avgInvert = stormManholes.reduce((sum, m) => sum + (m.attributes.INVERT_ELEVATION || 0), 0) / stormManholes.length;
              return avgRim - avgInvert;
            })()
          }),
          // Flag for absence or API failure
          ...(stormManholes.length === 0 && {
            storm_manholes_count: 0,
            nearest_storm_manhole_ft: null,
            storm_manholes_unavailable: flags.includes('utilities_storm_manholes_unavailable')
          }),
          
          // Address validation data
          ...(address_points.length > 0 && {
            address_validated: true,
            validated_address: address_points[0].attributes.FULL_ADDRESS || null,
            address_match_distance_ft: address_points[0].distance_ft || null
          }),
          
          // HCAD Parcel data (official boundaries and ownership)
          ...(hcad_parcels.length > 0 && {
            hcad_parcel_id: hcad_parcels[0].attributes.LOWPARCELI || null,
            hcad_number: hcad_parcels[0].attributes.HCAD_NUM || null,
            parcel_type: hcad_parcels[0].attributes.parcel_typ || null,
            stated_area_acres: hcad_parcels[0].attributes.StatedArea || null,
            calculated_area_acres: calculated_acreage,
            mill_code: hcad_parcels[0].attributes.mill_cd || null,
            tax_year: hcad_parcels[0].attributes.Tax_Year || null,
            owner_mail_state: hcad_parcels[0].attributes.Mail_State || null,
            parcel_geometry: parcel_geometry
          })
        },
        // Update top-level parcel columns with HCAD official data
        ...(hcad_parcels.length > 0 && {
          parcel_id: hcad_parcels[0].attributes.LOWPARCELI || null,
          parcel_owner: hcad_parcels[0].attributes.CurrOwner || null,
          acreage_cad: calculated_acreage || hcad_parcels[0].attributes.StatedArea || null
        })
      };

      // PHASE 1: Log payload size before update
      console.log('📊 [enrich-utilities] Database update payload size:', {
        water_lines_count: water.length,
        sewer_lines_count: sewer.length,
        storm_lines_count: storm.length,
        water_laterals_count: water_laterals.length,
        water_fittings_count: water_fittings.length,
        hcad_parcels_count: hcad_parcels.length,
        payload_json_size_kb: (JSON.stringify(updatePayload).length / 1024).toFixed(2)
      });
      
      // PHASE 3: Resilient Database Update (only if application_id provided)
      let updateError = null;
      let dbUpdateDuration = 0;
      
      if (application_id) {
        const { error } = await supabase
          .from("applications")
          .update(updatePayload)
          .eq("id", application_id);
        
        updateError = error;
        dbUpdateDuration = Date.now() - dbUpdateStart;
      } else {
        console.log('ℹ️ [enrich-utilities] Direct coordinate call - skipping database update');
      }

      // PHASE 4: Log database operation to observability (only if application_id exists)
      if (application_id) {
        await logExternalCall(
          supabase,
          'supabase_database',
          'applications.update',
          dbUpdateDuration,
          !updateError,
          application_id,
          updateError?.message || null
        );
      }

      // PHASE 1: Granular Error Logging (Don't throw - return partial success)
      if (updateError) {
        console.error('❌ [enrich-utilities] Database update failed - GRANULAR ERROR DETAILS:', {
          error_code: updateError.code,
          error_message: updateError.message,
          error_details: updateError.details,
          error_hint: updateError.hint,
          application_id: application_id || null,
          payload_summary: {
            water_lines: water.length,
            sewer_lines: sewer.length,
            storm_lines: storm.length,
            water_laterals: water_laterals.length,
            water_fittings: water_fittings.length,
            hcad_parcels: hcad_parcels.length,
            payload_size_bytes: JSON.stringify(updatePayload).length
          },
          timestamp: new Date().toISOString()
        });
        
        // PHASE 3: Retry with minimal payload (just counts and flags)
        console.log('🔄 [enrich-utilities] Retrying with minimal payload...');
        
        const minimalPayload = {
          // Core utility arrays - these are what populate the report tables
          water_lines: formatLines(water, geo_lat, geo_lng, "water").map(({ geometry, ...rest }: any) => rest),
          sewer_lines: formatLines(sewer, geo_lat, geo_lng, "sewer").map(({ geometry, ...rest }: any) => rest),
          storm_lines: formatLines(storm, geo_lat, geo_lng, "storm").map(({ geometry, ...rest }: any) => rest),
          
          // Summary stats (small footprint)
          utilities_summary: utilitiesSummary,
          
          // Flags indicating what succeeded/failed
          data_flags: [...flags, 'database_update_partial_failure', 'enrichment_metadata_excluded'],
          
          enrichment_status: 'partial'
        };
        
        let retryError: any = null;
        if (application_id) {
          const { error } = await supabase
            .from("applications")
            .update(minimalPayload)
            .eq("id", application_id);
          retryError = error;
          
          if (retryError) {
            console.error('❌ [enrich-utilities] Minimal payload retry also failed:', retryError);
            flags.push('database_update_complete_failure');
          }
        }
        
        if (retryError) {
          console.error('❌ [enrich-utilities] Minimal payload retry also failed:', retryError);
          flags.push('database_update_complete_failure');
          
          // Still return partial success with the data we collected
          return new Response(
            JSON.stringify({ 
              success: true, // Data was collected successfully
              warning: 'Data collected but could not be saved to database',
              database_error: updateError.message,
              retry_error: retryError.message,
              utilities: {
                water: water.length,
                sewer: sewer.length,
                storm: storm.length,
                water_laterals: water_laterals.length,
                water_fittings: water_fittings.length
              },
              flags 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log('⚠️ [enrich-utilities] Minimal payload saved successfully');
        flags.push('database_update_minimal_success');
        
        // Return partial success
        return new Response(
          JSON.stringify({ 
            success: true,
            warning: 'Data collected but only summary saved to database',
            database_error: updateError.message,
            utilities: {
              water: water.length,
              sewer: sewer.length,
              storm: storm.length,
              water_laterals: water_laterals.length,
              water_fittings: water_fittings.length
            },
            flags 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // PHASE 4: Database Update Success
      console.log('✅ [enrich-utilities] Database update successful:', {
        application_id,
        rows_affected: 1,
        enrichment_metadata_size: JSON.stringify({
          water_laterals: water_laterals.length,
          water_fittings: water_fittings.length,
          hcad_parcels: hcad_parcels.length
        }).length,
        utilities_summary_sources: Object.keys(utilitiesSummary).filter(k => utilitiesSummary[k as keyof typeof utilitiesSummary]?.has_service)
      });
    }

    // PHASE 7: Performance Breakdown
    perfMarkers.total = Date.now() - perfStart;
    const totalFeatures = water.length + sewer.length + storm.length + water_laterals.length + water_fittings.length;
    
    console.log('⏱️ [enrich-utilities] Performance breakdown:', {
      total_ms: perfMarkers.total,
      breakdown: perfMarkers,
      features_per_second: totalFeatures > 0 ? ((totalFeatures / (perfMarkers.total / 1000)).toFixed(2)) : '0'
    });
    
    console.log('✅ [enrich-utilities] Utilities enriched successfully:', {
      water: water.length,
      sewer: sewer.length,
      storm: storm.length,
      water_laterals: water_laterals.length,
      water_fittings: water_fittings.length,
      flags
    });

    // 🛡️ FAULT-TOLERANT VALIDATION: Save partial results even if some services fail
    // ONLY return 500 if ALL services fail or no data at all
    const hasAnyData = water.length > 0 || water_laterals.length > 0 || 
                       sewerGravity.length > 0 || sewerService.length > 0 || sewer_force.length > 0 ||
                       storm.length > 0 || stormManholes.length > 0;
    
    if (!hasAnyData && failedServices === totalServices) {
      flags.push('utilities_enrichment_total_failure');
      console.error('❌ [enrich-utilities] CRITICAL: All utility services failed completely');
      
      // Mark enrichment as failed in the database (only if application_id provided)
      if (application_id) {
        await supabase
          .from('applications')
          .update({
            water_lines: [],
            sewer_lines: [],
            storm_lines: [],
            utilities_summary: {
              has_water: false,
              has_sewer: false,
              has_storm: false,
              nearest_water_ft: null,
              nearest_sewer_ft: null,
              nearest_storm_ft: null
            },
            enrichment_status: 'failed',
            data_flags: flags,
            updated_at: new Date().toISOString()
          })
          .eq('id', application_id);
      }

      return new Response(
        JSON.stringify({ 
          error: 'All utility services failed', 
          details: 'Could not retrieve any utility data from any service',
          flags 
        }), 
        { status: 500, headers: corsHeaders }
      );
    }

    // Log partial success scenario
    if (failedServices > 0 && hasAnyData) {
      console.warn(`⚠️ [enrich-utilities] PARTIAL SUCCESS: ${failedServices}/${totalServices} services failed, but saving available data`);
      flags.push('utilities_enrichment_partial');
    }

    // Log what data we successfully got
    console.log('✅ [enrich-utilities] Data collection complete (fault-tolerant):', {
      water: water.length,
      sewer: sewerGravity.length + sewerService.length + sewer_force.length,
      storm: storm.length + stormManholes.length,
      water_laterals: water_laterals.length,
      water_fittings: water_fittings.length,
      partial: failedServices > 0,
      failed_services: failedServices
    });

    console.log(`✅ [TRACE:${traceId}] [ENRICH-UTILITIES] ================== EXIT ==================`);
    console.log(`✅ [TRACE:${traceId}] [ENRICH-UTILITIES] Final Summary:`, JSON.stringify({
      application_id: application_id || null,
      water_count: water.length,
      sewer_count: sewer.length,
      storm_count: storm.length,
      water_laterals_count: water_laterals.length,
      water_fittings_count: water_fittings.length,
      total_flags: flags.length,
      flags,
      enrichment_status: enrichmentStatus
    }, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true,
        application_id: application_id || null,
        utilities: {
          water: water.length,
          sewer: sewer.length + sewer_force.length,
          storm: storm.length,
          water_laterals: water_laterals.length,
          water_fittings: water_fittings.length
        },
        flags,
        enrichment_status: enrichmentStatus,
        trace_id: traceId
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    // PHASE 5: Enhanced Error Handling
    console.error(`❌ [TRACE:${traceId}] [ENRICH-UTILITIES] FATAL ERROR:`, {
      error_type: err instanceof Error ? err.constructor.name : typeof err,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      application_id: application_id || 'not_provided',
      coordinates_received: { latitude, longitude },
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: err instanceof Error ? err.message : String(err),
        application_id: application_id || null,
        timestamp: new Date().toISOString(),
        trace_id: traceId
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
