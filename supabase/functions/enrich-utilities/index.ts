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
  }
) => {
  // Helper function to build query URL
  const buildQueryUrl = (useCrs: boolean) => {
    let geometryCoords = `${geo_lng},${geo_lat}`;
    let spatialReference = "4326";
    
    if (useCrs && config.crs === 2278) {
      const wgs84 = "EPSG:4326";
      const epsg2278 = "+proj=lcc +lat_1=30.28333333333333 +lat_2=28.38333333333333 +lat_0=27.83333333333333 +lon_0=-99 +x_0=2296583.333 +y_0=9842500 +datum=NAD83 +units=ft +no_defs";
      const [x2278, y2278] = proj4(wgs84, epsg2278, [geo_lng, geo_lat]);
      geometryCoords = `${x2278},${y2278}`;
      spatialReference = "2278";
      console.log(`${utilityType}: Using EPSG:2278: ${geometryCoords}`);
    } else {
      console.log(`${utilityType}: Using WGS84 (EPSG:4326): ${geometryCoords}`);
    }
    
    const geometryType = config.geometryType || "esriGeometryPoint";
    const spatialRel = config.spatialRel || "esriSpatialRelIntersects";
    
    const params = new URLSearchParams({
      f: "json",
      geometry: geometryCoords,
      geometryType: geometryType,
      inSR: spatialReference,
      outSR: spatialReference,
      spatialRel: spatialRel,
      outFields: fields.join(","),
      returnGeometry: "true",
      where: "1=1"
    });
    
    // Only add distance parameter for non-polygon queries
    if (geometryType !== "esriGeometryPolygon" && config.search_radius_ft) {
      params.append("distance", String(config.search_radius_ft));
      params.append("units", "esriSRUnit_Foot");
    }
    
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
    let flags: string[] = [];
    let apiUnreachable = false;

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
        
        water = await queryArcGIS(eps.water.url, eps.water.outFields, geo_lat, geo_lng, "houston_water", {
          timeout_ms: eps.water.timeout_ms,
          retry_attempts: eps.water.retry_attempts,
          retry_delays_ms: eps.water.retry_delays_ms,
          search_radius_ft: waterRadius,
          crs: eps.water.crs || 2278,
          geometryType: eps.water.geometryType,
          spatialRel: eps.water.spatialRel
        });
        
        // Use urban search radius for sewer
        const sewerRadius = isUrbanArea && eps.sewer.urban_search_radius_ft 
          ? eps.sewer.urban_search_radius_ft 
          : eps.sewer.search_radius_ft;
        
        // Sewer gravity mains (ArcGIS Online)
        const sewerGravity = await queryArcGIS(eps.sewer.url, eps.sewer.outFields, geo_lat, geo_lng, "houston_sewer_gravity", {
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
        }
        
        // Try to get force mains as well
        try {
          if (eps.sewer_force) {
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
            }
          }
        } catch (forceErr) {
          console.log('Force main query failed, continuing with gravity only:', forceErr instanceof Error ? forceErr.message : String(forceErr));
        }
        
        // Combine gravity and force mains
        sewer = [...sewerGravity, ...sewer_force];
        
        // Storm endpoint - try with fallback and graceful degradation
        try {
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
          }
        } catch (stormErr) {
          console.error('Houston storm endpoint failed:', stormErr instanceof Error ? stormErr.message : String(stormErr));
          console.log('Continuing without storm data - water and sewer data will still be available');
          storm = [];
          if (!flags.includes("storm_drainage_unavailable")) {
            flags.push("storm_drainage_unavailable");
          }
        }
        
        // Traffic counts (new integration)
        let traffic: any[] = [];
        if (eps.traffic) {
          try {
            console.log('Querying traffic counts...');
            traffic = await queryArcGIS(eps.traffic.url, eps.traffic.outFields, geo_lat, geo_lng, "houston_traffic", {
              timeout_ms: eps.traffic.timeout_ms || 8000,
              retry_attempts: eps.traffic.retry_attempts || 3,
              retry_delays_ms: eps.traffic.retry_delays_ms || [500, 1000, 2000],
              search_radius_ft: eps.traffic.search_radius_ft,
              crs: eps.traffic.crs || 2278,
              geometryType: eps.traffic.geometryType,
              spatialRel: eps.traffic.spatialRel
            });
            
            if (traffic.length > 0) {
              flags.push("traffic_via_city");
              console.log(`✅ Traffic count found: ${traffic[0].attributes.ADT || 'N/A'} ADT`);
            }
          } catch (trafficErr) {
            console.error('Traffic query failed:', trafficErr instanceof Error ? trafficErr.message : String(trafficErr));
          }
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

    // 3. Determine final flags
    if (apiUnreachable) {
      flags = ["utilities_api_unreachable"];
    } else if (!water.length && !sewer.length && !storm.length && !flags.length) {
      flags.push("utilities_not_found");
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
    const hasStormUnavailableFlag = flags.includes("storm_drainage_unavailable");
    const enrichmentStatus = apiUnreachable ? "failed" : 
                            (water.length || sewer.length || storm.length) ? "complete" :
                            hasStormUnavailableFlag ? "partial" : "partial";
    
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
