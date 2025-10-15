import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import proj4 from "https://cdn.skypack.dev/proj4@2.8.0";

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
function minDistanceToLine(lat: number, lng: number, paths: any[][]) {
  let minDist = Infinity;
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const [x1, y1] = path[i]; // lon, lat
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
function formatLines(features: any[], geo_lat: number, geo_lng: number, utilityType?: string) {
  return features.map((f) => {
    const attrs = f.attributes || {};
    const geom = f.geometry || {};
    const distance_ft = geom.paths
      ? minDistanceToLine(geo_lat, geo_lng, geom.paths)
      : null;
    
    // Handle storm drainage with PIPEWIDTH/PIPEHEIGHT/PIPEDIAMETER
    let diameter = attrs.DIAMETER || attrs.PIPEDIAMETER || null;
    if (!diameter && (attrs.WIDTH || attrs.HEIGHT || attrs.PIPEWIDTH || attrs.PIPEHEIGHT)) {
      // For storm drains with width/height, use the larger dimension
      diameter = Math.max(
        attrs.WIDTH || 0, 
        attrs.HEIGHT || 0, 
        attrs.PIPEWIDTH || 0, 
        attrs.PIPEHEIGHT || 0
      ) || null;
    }
    
    return {
      diameter,
      material: attrs.MATERIAL || null,
      status: attrs.STATUS || attrs.LIFECYCLESTATUS || null,
      owner: attrs.OWNER || null,
      distance_ft
    };
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
    crs?: number; // Optional CRS (e.g., 2278 for Texas South Central)
    geometryType?: string; // e.g., esriGeometryPolygon, esriGeometryPolyline
    spatialRel?: string; // e.g., esriSpatialRelIntersects
    returnGeometry?: boolean; // Whether to return geometry (default: true)
  }
) => {
  // Helper function to build query URL
  const buildQueryUrl = (useCrs: boolean) => {
    let geometryObj: any;
    let spatialReference: number;
    
    if (useCrs && config.crs === 2278) {
      const wgs84 = "EPSG:4326";
      const epsg2278 = "+proj=lcc +lat_1=30.28333333333333 +lat_2=28.38333333333333 +lat_0=27.83333333333333 +lon_0=-99 +x_0=2296583.333 +y_0=9842500 +datum=NAD83 +units=ft +no_defs";
      const [x2278, y2278] = proj4(wgs84, epsg2278, [geo_lng, geo_lat]);
      
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
      console.log(`${utilityType}: Using WGS84 (EPSG:4326): ${JSON.stringify(geometryObj)}`);
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
    
    return `${url}?${params.toString()}`;
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
        const resp = await fetch(queryUrl, {
          signal: AbortSignal.timeout(config.timeout_ms)
        });
        
        status = resp.status;
        const elapsed_ms = Date.now() - startTime;
        
        if (!resp.ok) {
          console.error(`${utilityType} API returned status:`, status);
          
          const errorDetail = `HTTP ${status} (CRS: ${useCrs ? 'EPSG:' + config.crs : 'WGS84'})`;
          
          apiMeta.push({
            api: utilityType,
            url: queryUrl,
            status,
            elapsed_ms,
            timestamp: new Date().toISOString(),
            error: errorDetail
          });
          
          // If 400 error and we haven't tried fallback yet, break to try WGS84
          if (status === 400 && useCrs && crsStrategies.length > 1) {
            console.log(`${utilityType}: Got 400 with CRS ${config.crs}, will try WGS84 fallback...`);
            throw new Error("HTTP_400_FALLBACK");
          }
          
          throw new Error(`HTTP ${status}`);
        }
        
        const json = await resp.json();
        console.log(`${utilityType} features found:`, json.features?.length || 0);
        
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

  try {
    const { application_id } = await req.json();
    console.log('Enriching utilities for application:', application_id);

    // 1. Get application info
    const { data: app, error: fetchErr } = await supabase
      .from("applications")
      .select("geo_lat, geo_lng, county, city")
      .eq("id", application_id)
      .maybeSingle();

    if (fetchErr) {
      console.error('Fetch error:', fetchErr);
      throw new Error("Error fetching application");
    }

    if (!app) {
      console.error('Application not found:', application_id);
      throw new Error("Application not found");
    }

    const { geo_lat, geo_lng, county, city } = app;

    if (!geo_lat || !geo_lng) {
      console.error('Missing coordinates for application:', application_id);
      throw new Error("Missing coordinates");
    }

    let water: any[] = [];
    let sewer: any[] = [];
    let storm: any[] = [];
    let sewer_force: any[] = [];
    let water_laterals: any[] = [];
    let water_fittings: any[] = [];
    let address_points: any[] = [];
    let traffic: any[] = [];
    let flags: string[] = [];
    let apiUnreachable = false;
    let failedServices = 0;
    const totalServices = 6; // water mains, water laterals, water fittings, sewer gravity, sewer force, storm

    // 2. Decide which catalog entry to use
    const cityLower = city?.toLowerCase() || '';
    
    try {
      if (cityLower.includes("houston")) {
        console.log('Using Houston endpoints');
        const eps = endpointCatalog.houston;
        const isUrbanArea = endpointCatalog.config.urban_cities.some((c: string) => 
          cityLower.includes(c.toLowerCase())
        );
        
        // Use urban search radius if available
        const waterRadius = isUrbanArea && eps.water.urban_search_radius_ft 
          ? eps.water.urban_search_radius_ft 
          : eps.water.search_radius_ft;
        
        // 1. Water Distribution Mains (Layer 3) - GRACEFUL DEGRADATION
        try {
          console.log('🔵 Querying Water Distribution Mains (Layer 3)...');
          water = await queryArcGIS(eps.water.url, eps.water.outFields, geo_lat, geo_lng, "houston_water", {
            timeout_ms: eps.water.timeout_ms,
            retry_attempts: eps.water.retry_attempts,
            retry_delays_ms: eps.water.retry_delays_ms,
            search_radius_ft: waterRadius,
            crs: eps.water.crs || 2278,
            geometryType: eps.water.geometryType,
            spatialRel: eps.water.spatialRel
          });
          
          if (water.length > 0) {
            flags.push("water_via_houston_gis");
            console.log(`✅ Water Mains: ${water.length} lines found`);
          } else {
            console.log('ℹ️ Water Mains: No lines found in search radius');
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
        let hcad_parcels: any[] = [];
        let parcel_geometry: any = null;
        let calculated_acreage: number | null = null;
        
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
        let sewerGravity: any[] = [];
        const sewerRadius = isUrbanArea && eps.sewer.urban_search_radius_ft 
          ? eps.sewer.urban_search_radius_ft 
          : eps.sewer.search_radius_ft;
        
        try {
          console.log('🔵 Querying Sewer Gravity Mains...');
          sewerGravity = await queryArcGIS(eps.sewer.url, eps.sewer.outFields, geo_lat, geo_lng, "houston_sewer_gravity", {
            timeout_ms: eps.sewer.timeout_ms,
            retry_attempts: eps.sewer.retry_attempts,
            retry_delays_ms: eps.sewer.retry_delays_ms,
            search_radius_ft: sewerRadius,
            crs: eps.sewer.crs || 2278,
            geometryType: eps.sewer.geometryType,
            spatialRel: eps.sewer.spatialRel
          });
          
          if (sewerGravity.length > 0) {
            flags.push("sewer_via_arcgis_online");
            console.log(`✅ Sewer Gravity: ${sewerGravity.length} lines found`);
          } else {
            console.log('ℹ️ Sewer Gravity: No lines found in search radius');
          }
        } catch (err) {
          console.warn('⚠️ Sewer Gravity Mains query failed:', err instanceof Error ? err.message : String(err));
          flags.push('utilities_sewer_gravity_unavailable');
          failedServices++;
        }
        
        // 5. Sewer Force Mains - GRACEFUL DEGRADATION
        if (eps.sewer_force) {
          try {
            console.log('🔵 Querying Sewer Force Mains...');
            const forceRadius = isUrbanArea && eps.sewer_force.urban_search_radius_ft 
              ? eps.sewer_force.urban_search_radius_ft 
              : eps.sewer_force.search_radius_ft;
            
            sewer_force = await queryArcGIS(eps.sewer_force.url, eps.sewer_force.outFields, geo_lat, geo_lng, "houston_sewer_force", {
              timeout_ms: eps.sewer_force.timeout_ms,
              retry_attempts: eps.sewer_force.retry_attempts,
              retry_delays_ms: eps.sewer_force.retry_delays_ms,
              search_radius_ft: forceRadius,
              crs: eps.sewer_force.crs || 2278,
              geometryType: eps.sewer_force.geometryType,
              spatialRel: eps.sewer_force.spatialRel
            });
            
            if (sewer_force.length > 0) {
              flags.push("sewer_force_via_arcgis_online");
              console.log(`✅ Sewer Force: ${sewer_force.length} lines found`);
            } else {
              console.log('ℹ️ Sewer Force: No lines found in search radius');
            }
          } catch (err) {
            console.warn('⚠️ Sewer Force Mains query failed:', err instanceof Error ? err.message : String(err));
            flags.push('utilities_sewer_force_unavailable');
            failedServices++;
          }
        }
        
        // Combine gravity and force mains
        sewer = [...sewerGravity, ...sewer_force];
        
        // 6. Storm Drainage - GRACEFUL DEGRADATION
        try {
          console.log('🔵 Querying Storm Drainage...');
          const stormRadius = isUrbanArea && eps.storm.urban_search_radius_ft 
            ? eps.storm.urban_search_radius_ft 
            : eps.storm.search_radius_ft;
          
          storm = await queryArcGIS(eps.storm.url, eps.storm.outFields, geo_lat, geo_lng, "houston_storm", {
            timeout_ms: eps.storm.timeout_ms,
            retry_attempts: eps.storm.retry_attempts,
            retry_delays_ms: eps.storm.retry_delays_ms,
            search_radius_ft: stormRadius,
            crs: eps.storm.crs || 2278,
            geometryType: eps.storm.geometryType,
            spatialRel: eps.storm.spatialRel
          });
          
          if (storm.length > 0) {
            flags.push("storm_via_production_server");
            console.log(`✅ Storm Drainage: ${storm.length} lines found`);
          } else {
            console.log('ℹ️ Storm Drainage: No lines found in search radius');
          }
        } catch (err) {
          console.warn('⚠️ Storm Drainage query failed:', err instanceof Error ? err.message : String(err));
          flags.push('utilities_storm_unavailable');
          failedServices++;
        }
        
        // Log summary of utility query results
        const allWaterLines = [...water, ...water_laterals];
        const allSewerLines = [...sewerGravity, ...sewer_force];
        const allStormLines = [...storm];
        console.log(`📊 Utility query summary - Water: ${allWaterLines.length}, Sewer: ${allSewerLines.length}, Storm: ${allStormLines.length}, Failed Services: ${failedServices}/${totalServices}`);
        
        // Traffic counts (disabled - endpoint unavailable)
        traffic = [];
        if (eps.traffic && eps.traffic.enabled !== false) {
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
        const eps = endpointCatalog.austin;
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
      } else if (county?.toLowerCase().includes("harris")) {
        console.log('Harris County - checking MUD districts');
        
        // Try to find MUD district
        const mudEp = endpointCatalog.harris_county_etj.mud;
        let mudFound = false;
        
        try {
          const mudHits = await queryPolygon(mudEp.url, mudEp.outFields, geo_lat, geo_lng);
          
          if (mudHits.length > 0) {
            const mudAttrs = mudHits[0].attributes;
            const mudDistrict = mudAttrs.DISTRICT_NA || mudAttrs.DISTRICT_NO || null;
            console.log('MUD district found:', mudDistrict);
            
            // Update with MUD info
            await supabase.from("applications").update({
              mud_district: mudDistrict,
              etj_provider: mudAttrs.AGENCY || "MUD"
            }).eq("id", application_id);
            
            mudFound = true;
            flags.push("etj_provider_boundary_only");
          }
        } catch (mudErr) {
          console.error("MUD lookup failed:", mudErr instanceof Error ? mudErr.message : String(mudErr));
        }
        
    // If no MUD found, check WCID
    if (!mudFound) {
      console.log('No MUD found - checking WCID districts');
      
      const wcidEp = endpointCatalog.harris_county_etj.wcid;
      let wcidFound = false;
      
      try {
        const wcidHits = await queryPolygon(wcidEp.url, wcidEp.outFields, geo_lat, geo_lng);
        
        if (wcidHits.length > 0) {
          const wcidAttrs = wcidHits[0].attributes;
          const wcidDistrict = wcidAttrs.DISTRICT_NA || wcidAttrs.DISTRICT_NO || null;
          console.log('✅ WCID district found:', wcidDistrict);
          
          // Update with WCID info
          await supabase.from("applications").update({
            wcid_district: wcidDistrict,
            etj_provider: "WCID"
          }).eq("id", application_id);
          
          wcidFound = true;
          flags.push("etj_provider_wcid");
        }
      } catch (wcidErr) {
        console.error("❌ WCID lookup failed:", wcidErr instanceof Error ? wcidErr.message : String(wcidErr));
      }
      
      // If neither MUD nor WCID found, mark as Harris ETJ
      if (!wcidFound) {
        console.log('No MUD or WCID found - marking as Harris ETJ');
        await supabase.from("applications").update({
          mud_district: null,
          etj_provider: "Harris_ETJ"
        }).eq("id", application_id);
        
        flags.push("etj_provider_boundary_only");
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

    // 2.6. Check for MUD district if Houston property has no utilities
    const allUtilitiesEmpty = !water.length && !sewer.length && !sewer_force.length && !storm.length;
    const isUrbanArea = endpointCatalog.config.urban_cities.some((c: string) => 
      cityLower.includes(c.toLowerCase())
    );
    
    if (allUtilitiesEmpty && cityLower.includes("houston") && !apiUnreachable) {
      console.log('⚠️ Houston property with 0 utilities - checking for MUD district...');
      
      try {
        const mudEp = endpointCatalog.harris_county_etj.mud;
        const mudHits = await queryPolygon(mudEp.url, mudEp.outFields, geo_lat, geo_lng);
        
        if (mudHits.length > 0) {
          const mudAttrs = mudHits[0].attributes;
          const mudDistrict = mudAttrs.DISTRICT_NA || mudAttrs.DISTRICT_NO || null;
          console.log('✅ MUD district found:', mudDistrict);
          
          // Update application with MUD info
          await supabase.from("applications").update({
            mud_district: mudDistrict,
            etj_provider: mudAttrs.AGENCY || "MUD"
          }).eq("id", application_id);
          
          flags.push("served_by_mud_district");
          console.log(`Property is in ${mudDistrict} - utilities managed by MUD, not HPW`);
        } else {
          console.log('No MUD district found - triggering OSM fallback...');
        }
      } catch (mudErr) {
        console.error('MUD lookup failed:', mudErr instanceof Error ? mudErr.message : String(mudErr));
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

    // Build water summary with special handling for service area proxy
    const waterSummary = water.length > 0 && water[0].attributes.PROVIDER_NAME
      ? {
          has_service: true,
          service_provider: water[0].attributes.PROVIDER_NAME,
          service_url: "TCEQ Water Service Area (Proxy)",
          last_verified: new Date().toISOString(),
          note: "Service area proxy - not line-specific data"
        }
      : {
          has_service: false,
          min_distance_ft: null,
          service_url: null,
          last_verified: new Date().toISOString()
        };

    const utilitiesSummary = {
      water: waterSummary,
      sewer: buildUtilitySummary(
        sewer, 
        "sewer",
        cityLower.includes("houston") ? "https://services.arcgis.com/04HiymDgLlsbhaV4/ArcGIS/rest/services/Sewer_Water_Pipe_Network_-_Gravity_Main/FeatureServer/0" :
        cityLower.includes("austin") ? "https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/AWU_Wastewaterlines/FeatureServer/0" :
        null
      ),
      force_main: buildUtilitySummary(
        sewer.filter(s => {
          const formatted = formatLines([s], geo_lat, geo_lng)[0];
          return formatted.diameter && formatted.diameter > 18; // Force mains typically larger
        }),
        "force_main",
        cityLower.includes("houston") ? "https://services.arcgis.com/04HiymDgLlsbhaV4/ArcGIS/rest/services/Sewer_Water_Pipe_Network_-_Force_Main/FeatureServer/0" : null
      ),
      storm: buildUtilitySummary(
        storm,
        "storm",
        cityLower.includes("houston") ? "https://mapsop1.houstontx.gov/arcgis/rest/services/TDO/StormDrainageUtilityAssets/FeatureServer/7" :
        cityLower.includes("austin") ? "https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/AWU_ReclaimedWaterlines/FeatureServer/0" :
        null
      )
    };

    // 5. Save results with api_meta, enrichment_status, and utilities_summary
    const { error: updateError } = await supabase.from("applications").update({
      water_lines: formatLines(water, geo_lat, geo_lng),
      sewer_lines: formatLines(sewer, geo_lat, geo_lng),
      storm_lines: formatLines(storm, geo_lat, geo_lng),
      utilities_summary: utilitiesSummary,
      data_flags: flags,
      api_meta: apiMeta,
      enrichment_status: enrichmentStatus,
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
        
        // Water laterals data (Layer 0)
        ...(water_laterals.length > 0 && {
          water_laterals_count: water_laterals.length,
          water_laterals_data: formatLines(water_laterals, geo_lat, geo_lng)
        }),
        
        // Water fittings data (Layer 1 - valves, hydrants, meters)
        ...(water_fittings.length > 0 && {
          water_fittings_count: water_fittings.length,
          water_fittings_data: formatLines(water_fittings, geo_lat, geo_lng).map((f, idx) => ({
            ...f,
            fitting_type: water_fittings[idx].attributes.FITTING_TYPE || null
          })),
          fire_hydrants_count: water_fittings.filter(f => 
            f.attributes.FITTING_TYPE?.toLowerCase().includes('hydrant')
          ).length
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
    }).eq("id", application_id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Failed to update application: ${updateError.message}`);
    }

    console.log('Utilities enriched successfully:', {
      water: water.length,
      sewer: sewer.length,
      storm: storm.length,
      flags
    });

    return new Response(
      JSON.stringify({ 
        status: "ok",
        data: {
          water_lines: water.length,
          sewer_lines: sewer.length,
          storm_lines: storm.length
        }
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in enrich-utilities:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
