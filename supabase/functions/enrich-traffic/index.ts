import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// TxDOT FeatureServer endpoints
const TXDOT_AADT_URL = 'https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_AADT/FeatureServer/0';
const TXDOT_ROADWAY_INVENTORY_URL = 'https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Roadway_Inventory/FeatureServer/0';

// K-factor for peak hour estimation (standard 10% for Texas urban areas)
const PEAK_HOUR_K_FACTOR = 0.10;

// Surface type code mapping
const SURFACE_TYPE_MAPPING: Record<string, string> = {
  'A': 'Asphalt',
  'B': 'Brick',
  'C': 'Concrete', 
  'D': 'Composite',
  'E': 'Earth',
  'G': 'Gravel',
  'M': 'Mixed',
  'P': 'Paved',
  'S': 'Surface Treated',
  'U': 'Unpaved',
};

// Route prefix to roadway classification mapping
const ROUTE_PREFIX_CLASSIFICATION: Record<string, string> = {
  // Principal Arterial
  'IH': 'arterial',
  'US': 'arterial',
  'PA': 'arterial',
  // Minor Arterial
  'SH': 'arterial',
  'SA': 'arterial',
  'UA': 'arterial',
  // Major Collector
  'FM': 'collector',
  'RM': 'collector',
  'RR': 'collector',
  // Minor Collector
  'FS': 'collector',
  'RS': 'collector',
  'UP': 'collector',
  // Local
  'CS': 'local',
  'CR': 'local',
  'PV': 'local',
  'PR': 'local',
};

// Functional class code to classification mapping (F_SYSTEM field)
const FUNCTIONAL_CLASS_MAPPING: Record<string, string> = {
  '1': 'arterial',   // Interstate
  '2': 'arterial',   // Principal Arterial - Other Freeways
  '3': 'arterial',   // Principal Arterial - Other
  '4': 'arterial',   // Minor Arterial
  '5': 'collector',  // Major Collector
  '6': 'collector',  // Minor Collector
  '7': 'local',      // Local
};

interface TrafficResult {
  success: boolean;
  traffic_aadt: number | null;
  traffic_road_name: string | null;
  traffic_distance_ft: number | null;
  traffic_year: number | null;
  traffic_segment_id: string | null;
  traffic_direction: string | null;
  road_classification: string | null;
  peak_hour_volume: number | null;
  truck_percent: number | null;
  congestion_level: string | null;
  nearest_signal_distance_ft: number | null;
  speed_limit: number | null;
  surface_type: string | null;
  traffic_data_source: string;
  data_flags: string[];
}

/**
 * Query TxDOT AADT FeatureServer for traffic data near a point
 */
async function queryTxDOTAADT(lat: number, lng: number, bufferFt: number = 2000): Promise<any[]> {
  // Convert buffer from feet to degrees (approximate for Texas)
  const bufferDeg = bufferFt / 364000; // ~1 degree ≈ 364,000 ft at Texas latitude
  
  const envelope = {
    xmin: lng - bufferDeg,
    ymin: lat - bufferDeg,
    xmax: lng + bufferDeg,
    ymax: lat + bufferDeg,
  };
  
  const queryParams = new URLSearchParams({
    where: '1=1',
    geometry: `${envelope.xmin},${envelope.ymin},${envelope.xmax},${envelope.ymax}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'OBJECTID,APTS_NBR,RTE_NM,RTE_ID,RTE_PRFX,F_SYSTEM,AADT_CUR,AADT_SINGL,AADT_COMBN,T_FLAG,K_FLAG,D_FLAG,DHV,T_PCT,YR,BEG_MP,END_MP,DIR_FLAG',
    returnGeometry: 'true',
    f: 'geojson',
  });
  
  const url = `${TXDOT_AADT_URL}/query?${queryParams.toString()}`;
  console.log(`[enrich-traffic] Querying TxDOT AADT: ${url.slice(0, 150)}...`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SiteIntel/1.0 (BuildSmarter Feasibility)',
      },
    });
    
    if (!response.ok) {
      console.error(`[enrich-traffic] TxDOT API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error(`[enrich-traffic] TxDOT API returned error:`, data.error);
      return [];
    }
    
    console.log(`[enrich-traffic] Found ${data.features?.length || 0} traffic segments`);
    return data.features || [];
  } catch (err) {
    console.error(`[enrich-traffic] Failed to query TxDOT:`, err);
    return [];
  }
}

/**
 * Query TxDOT Roadway Inventory for speed limit and surface type
 */
async function queryTxDOTRoadwayInventory(lat: number, lng: number, bufferFt: number = 1000): Promise<any[]> {
  const bufferDeg = bufferFt / 364000;
  
  const envelope = {
    xmin: lng - bufferDeg,
    ymin: lat - bufferDeg,
    xmax: lng + bufferDeg,
    ymax: lat + bufferDeg,
  };
  
  const queryParams = new URLSearchParams({
    where: '1=1',
    geometry: `${envelope.xmin},${envelope.ymin},${envelope.xmax},${envelope.ymax}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'OBJECTID,RTE_NM,RTE_ID,RTE_PRFX,SPD_MAX,SPD_LMT,SURF_TYP,SURF_WD,RDBD_TYP,F_SYSTEM',
    returnGeometry: 'true',
    f: 'geojson',
  });
  
  const url = `${TXDOT_ROADWAY_INVENTORY_URL}/query?${queryParams.toString()}`;
  console.log(`[enrich-traffic] Querying TxDOT Roadway Inventory: ${url.slice(0, 150)}...`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SiteIntel/1.0 (BuildSmarter Feasibility)',
      },
    });
    
    if (!response.ok) {
      console.error(`[enrich-traffic] TxDOT Roadway Inventory API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error(`[enrich-traffic] TxDOT Roadway Inventory returned error:`, data.error);
      return [];
    }
    
    console.log(`[enrich-traffic] Found ${data.features?.length || 0} roadway inventory segments`);
    return data.features || [];
  } catch (err) {
    console.error(`[enrich-traffic] Failed to query TxDOT Roadway Inventory:`, err);
    return [];
  }
}

/**
 * Get surface type description from code
 */
function getSurfaceTypeDescription(code: string | null): string | null {
  if (!code) return null;
  const normalizedCode = String(code).toUpperCase().trim();
  return SURFACE_TYPE_MAPPING[normalizedCode] || normalizedCode;
}

function calculateDistanceFt(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 20902231; // Earth radius in feet
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get centroid of a geometry
 */
function getGeometryCentroid(geometry: any): { lat: number; lng: number } | null {
  if (!geometry) return null;
  
  if (geometry.type === 'Point') {
    return { lng: geometry.coordinates[0], lat: geometry.coordinates[1] };
  }
  
  if (geometry.type === 'LineString') {
    const coords = geometry.coordinates;
    const mid = Math.floor(coords.length / 2);
    return { lng: coords[mid][0], lat: coords[mid][1] };
  }
  
  if (geometry.type === 'MultiLineString') {
    const firstLine = geometry.coordinates[0];
    const mid = Math.floor(firstLine.length / 2);
    return { lng: firstLine[mid][0], lat: firstLine[mid][1] };
  }
  
  return null;
}

/**
 * Determine roadway classification from route prefix or functional class
 */
function getRoadwayClassification(props: any): string | null {
  // Try route prefix first (more specific)
  if (props.RTE_PRFX) {
    const prefix = String(props.RTE_PRFX).toUpperCase().trim();
    if (ROUTE_PREFIX_CLASSIFICATION[prefix]) {
      return ROUTE_PREFIX_CLASSIFICATION[prefix];
    }
  }
  
  // Fall back to functional class
  if (props.F_SYSTEM) {
    const fSystem = String(props.F_SYSTEM).trim();
    if (FUNCTIONAL_CLASS_MAPPING[fSystem]) {
      return FUNCTIONAL_CLASS_MAPPING[fSystem];
    }
  }
  
  // Default based on AADT if available
  const aadt = props.AADT_CUR || props.T_FLAG;
  if (aadt) {
    if (aadt >= 20000) return 'arterial';
    if (aadt >= 5000) return 'collector';
    return 'local';
  }
  
  return null;
}

/**
 * Estimate congestion level based on AADT and road classification
 */
function estimateCongestionLevel(aadt: number | null, classification: string | null): string | null {
  if (!aadt) return null;
  
  // Capacity estimates by classification (LOS D threshold)
  const capacityThresholds: Record<string, number> = {
    'arterial': 40000,
    'collector': 15000,
    'local': 5000,
  };
  
  const threshold = capacityThresholds[classification || 'collector'] || 15000;
  const ratio = aadt / threshold;
  
  if (ratio < 0.5) return 'low';
  if (ratio < 0.8) return 'moderate';
  if (ratio < 1.0) return 'high';
  return 'severe';
}

/**
 * Find the nearest traffic segment to the parcel
 */
function findNearestSegment(features: any[], parcelLat: number, parcelLng: number): { feature: any; distance: number } | null {
  if (!features.length) return null;
  
  let nearest: { feature: any; distance: number } | null = null;
  
  for (const feature of features) {
    const centroid = getGeometryCentroid(feature.geometry);
    if (!centroid) continue;
    
    const distance = calculateDistanceFt(parcelLat, parcelLng, centroid.lat, centroid.lng);
    
    if (!nearest || distance < nearest.distance) {
      nearest = { feature, distance };
    }
  }
  
  return nearest;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { application_id, trace_id } = await req.json();
    const tracePrefix = trace_id ? `[TRACE:${trace_id}]` : '';
    
    console.log(`${tracePrefix} [enrich-traffic] Starting for application ${application_id}`);
    
    if (!application_id) {
      return new Response(JSON.stringify({ error: 'application_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Fetch application coordinates
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select('id, geo_lat, geo_lng, county, city, data_flags')
      .eq('id', application_id)
      .single();
    
    if (appError || !app) {
      console.error(`${tracePrefix} [enrich-traffic] Failed to fetch application:`, appError);
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!app.geo_lat || !app.geo_lng) {
      console.warn(`${tracePrefix} [enrich-traffic] Missing coordinates`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing coordinates',
        data_flags: ['traffic_no_coords']
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const result: TrafficResult = {
      success: false,
      traffic_aadt: null,
      traffic_road_name: null,
      traffic_distance_ft: null,
      traffic_year: null,
      traffic_segment_id: null,
      traffic_direction: null,
      road_classification: null,
      peak_hour_volume: null,
      truck_percent: null,
      congestion_level: null,
      nearest_signal_distance_ft: null,
      speed_limit: null,
      surface_type: null,
      traffic_data_source: 'TxDOT_AADT',
      data_flags: [],
    };
    
    // Query TxDOT AADT within 2000 ft buffer
    const features = await queryTxDOTAADT(app.geo_lat, app.geo_lng, 2000);
    
    if (!features.length) {
      // Try larger buffer (1 mile)
      console.log(`${tracePrefix} [enrich-traffic] No segments in 2000ft, trying 1 mile buffer`);
      const widerFeatures = await queryTxDOTAADT(app.geo_lat, app.geo_lng, 5280);
      
      if (!widerFeatures.length) {
        console.warn(`${tracePrefix} [enrich-traffic] No traffic data found within 1 mile`);
        result.data_flags.push('traffic_no_data_1mi');
        
        // Update application with empty traffic data
        await supabase
          .from('applications')
          .update({
            data_flags: [...(app.data_flags || []), 'traffic_no_data_1mi'],
            traffic_data_source: 'TxDOT_AADT',
          })
          .eq('id', application_id);
        
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      features.push(...widerFeatures);
    }
    
    // Find nearest segment
    const nearest = findNearestSegment(features, app.geo_lat, app.geo_lng);
    
    if (nearest) {
      const props = nearest.feature.properties || {};
      
      // Extract AADT (prefer AADT_CUR, fall back to T_FLAG)
      const aadt = props.AADT_CUR || props.T_FLAG || null;
      
      result.traffic_aadt = aadt ? Math.round(aadt) : null;
      result.traffic_road_name = props.RTE_NM || props.RTE_ID || null;
      result.traffic_distance_ft = Math.round(nearest.distance);
      result.traffic_year = props.YR || null;
      result.traffic_segment_id = props.OBJECTID ? String(props.OBJECTID) : null;
      result.traffic_direction = props.DIR_FLAG || null;
      result.road_classification = getRoadwayClassification(props);
      result.truck_percent = props.T_PCT || null;
      
      // Calculate peak hour volume (K-factor estimation)
      if (aadt) {
        // Use actual K_FLAG if available, otherwise use standard 10%
        const kFactor = props.K_FLAG ? props.K_FLAG / 100 : PEAK_HOUR_K_FACTOR;
        result.peak_hour_volume = Math.round(aadt * kFactor);
      }
      
      // Estimate congestion level
      result.congestion_level = estimateCongestionLevel(result.traffic_aadt, result.road_classification);
      
      result.success = true;
      
      console.log(`${tracePrefix} [enrich-traffic] Found traffic data:`, {
        aadt: result.traffic_aadt,
        road: result.traffic_road_name,
        distance_ft: result.traffic_distance_ft,
        classification: result.road_classification,
        peak_hour: result.peak_hour_volume,
        truck_pct: result.truck_percent,
      });
    }
    
    // Query TxDOT Roadway Inventory for speed limit and surface type
    console.log(`${tracePrefix} [enrich-traffic] Querying roadway inventory for speed/surface data`);
    const roadwayFeatures = await queryTxDOTRoadwayInventory(app.geo_lat, app.geo_lng, 1500);
    
    if (roadwayFeatures.length > 0) {
      const nearestRoadway = findNearestSegment(roadwayFeatures, app.geo_lat, app.geo_lng);
      
      if (nearestRoadway) {
        const roadwayProps = nearestRoadway.feature.properties || {};
        
        // Extract speed limit (prefer SPD_MAX, fall back to SPD_LMT)
        const speedLimit = roadwayProps.SPD_MAX || roadwayProps.SPD_LMT || null;
        if (speedLimit && speedLimit > 0 && speedLimit <= 85) {
          result.speed_limit = Math.round(speedLimit);
        }
        
        // Extract surface type
        const surfaceCode = roadwayProps.SURF_TYP || null;
        result.surface_type = getSurfaceTypeDescription(surfaceCode);
        
        console.log(`${tracePrefix} [enrich-traffic] Found roadway inventory:`, {
          speed_limit: result.speed_limit,
          surface_type: result.surface_type,
          distance_ft: Math.round(nearestRoadway.distance),
        });
        
        // Use road name from roadway inventory if not already set
        if (!result.traffic_road_name && (roadwayProps.RTE_NM || roadwayProps.RTE_ID)) {
          result.traffic_road_name = roadwayProps.RTE_NM || roadwayProps.RTE_ID;
        }
      }
    } else {
      console.log(`${tracePrefix} [enrich-traffic] No roadway inventory data found nearby`);
      result.data_flags.push('no_roadway_inventory');
    }
    
    // Update application with traffic data
    const updateFields: Record<string, any> = {
      traffic_aadt: result.traffic_aadt,
      traffic_road_name: result.traffic_road_name,
      traffic_distance_ft: result.traffic_distance_ft,
      traffic_year: result.traffic_year,
      traffic_segment_id: result.traffic_segment_id,
      traffic_direction: result.traffic_direction,
      road_classification: result.road_classification,
      peak_hour_volume: result.peak_hour_volume,
      truck_percent: result.truck_percent,
      congestion_level: result.congestion_level,
      nearest_signal_distance_ft: result.nearest_signal_distance_ft,
      speed_limit: result.speed_limit,
      surface_type: result.surface_type,
      traffic_data_source: result.traffic_data_source,
      // Also update legacy fields for backward compatibility
      aadt_near: result.traffic_aadt,
      aadt_road_name: result.traffic_road_name,
    };
    
    // Merge data_flags
    if (result.data_flags.length > 0) {
      updateFields.data_flags = [...new Set([...(app.data_flags || []), ...result.data_flags])];
    }
    
    const { error: updateError } = await supabase
      .from('applications')
      .update(updateFields)
      .eq('id', application_id);
    
    if (updateError) {
      console.error(`${tracePrefix} [enrich-traffic] Failed to update application:`, updateError);
      result.data_flags.push('traffic_update_failed');
    }
    
    console.log(`${tracePrefix} [enrich-traffic] Completed successfully`);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (err) {
    console.error('[enrich-traffic] Error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(err),
      data_flags: ['traffic_exception']
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
