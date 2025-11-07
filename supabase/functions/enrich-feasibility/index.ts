import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import proj4 from 'npm:proj4@2.8.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Standardized error flag constants
const ERROR_FLAGS = {
  FEMA_UNAVAILABLE: 'fema_nfhl_unavailable',
  UTILITIES_UNREACHABLE: 'utilities_api_unreachable',
  OPENFEMA_NO_MATCH: 'openfema_no_match',
  PARCEL_PROJECTION_ERROR: 'parcel_projection_error',
  PARCEL_NOT_FOUND: 'parcel_not_found',
  FLOODPLAIN_MISSING: 'floodplain_missing',
  UTILITIES_NOT_FOUND: 'utilities_not_found',
  TRAFFIC_NOT_FOUND: 'traffic_not_found',
  // Phase 2: Environmental error flags
  WETLANDS_API_ERROR: 'wetlands_api_error',
  SOIL_API_ERROR: 'soil_api_error',
  EPA_SITES_ERROR: 'epa_sites_error',
  FLOOD_HISTORY_ERROR: 'flood_history_error'
};

// Unified Parcels endpoint - Primary source for Harris, Fort Bend, Montgomery counties
const UNIFIED_PARCELS_URL = "https://geogimstest.houstontx.gov/arcgis/rest/services/CIP/RealEstate/MapServer/7/query";

// County endpoint catalog - Texas major counties (Top 10 by development activity)
const ENDPOINT_CATALOG: Record<string, any> = {
  "Harris County": {
    // Primary: HCAD Parcels MapServer Layer 0 (authoritative parcel source)
    parcel_url: "https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query",
    // Fallback: Unified Parcels (Layer 7) - Combines HCAD, FBCAD, MCAD
    parcel_fallback_url: UNIFIED_PARCELS_URL,
    zoning_url: "https://services.arcgis.com/su8ic9KbA7PYVxPS/arcgis/rest/services/Current_Zoning_/FeatureServer/0/query",
    // HCAD Parcels field mappings (Layer 0) - using actual field names
    parcel_id_field: "HCAD_NUM",
    parcel_id_alt_field: "acct_num",
    owner_field: "owner_name_1",
    acreage_field: "Acreage",
    // Address components (no single site_addr_1 field exists)
    address_fields: "site_str_num,site_str_name,site_str_sfx,site_city,site_zip",
    county_field: "site_county",
    // Legal description fields (no single legal_desc field exists)
    legal_fields: "legal_dscr_1,legal_dscr_2,legal_dscr_3,legal_dscr_4",
    zoning_field: "ZONECODE",
    overlay_field: "OVERLAY",
    // Houston utility endpoints - using GeoGIMS test/ms servers (discovered from Geocortex directory)
    water_lines_url: "https://geogimstest.houstontx.gov/arcgis/rest/services/HW/WaterUNPublic/MapServer/4/query",
    sewer_lines_url: "https://geogimstest.houstontx.gov/arcgis/rest/services/HW/WastewaterUNPublic/MapServer/4/query",
    storm_lines_url: "https://geogimsms.houstontx.gov/arcgis/rest/services/TDO/StormWater_Maintenance_gx/MapServer/1/query"
  },
  "Fort Bend County": {
    // Primary: FBCAD parcel service (confirmed working)
    parcel_url: "https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0/query",
    // Fallback: Unified Parcels (Layer 7) - Combines HCAD, FBCAD, MCAD
    parcel_fallback_url: UNIFIED_PARCELS_URL,
    zoning_url: "https://gisweb.fortbendcountytx.gov/arcgis/rest/services/Planning/Zoning/MapServer/0/query",
    // FBCAD-specific field mappings (confirmed from service metadata)
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER_NAME",
    acreage_field: "ACRES",
    zoning_field: "ZONING",
    overlay_field: "OVERLAY_DISTRICT",
    // Fort Bend utility endpoints (city-specific may vary)
    water_lines_url: "https://gisweb.fortbendcountytx.gov/arcgis/rest/services/Utilities/Water_Lines/MapServer/0/query",
    sewer_lines_url: "https://gisweb.fortbendcountytx.gov/arcgis/rest/services/Utilities/Sewer_Lines/MapServer/0/query",
    storm_lines_url: "https://gisweb.fortbendcountytx.gov/arcgis/rest/services/Utilities/Storm_Lines/MapServer/0/query"
  },
  "Galveston County": {
    // GCAD parcel service (confirmed working)
    parcel_url: "https://www1.cityofwebster.com/arcgis/rest/services/Landbase/CountyGalveston/MapServer/0/query",
    zoning_url: "https://gis.galvestontx.gov/server/rest/services/Planning/Zoning/MapServer/0/query",
    // GCAD-specific field mappings (confirmed from service metadata)
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: "ZONE",
    overlay_field: "OVERLAY",
    // Galveston utility endpoints
    water_lines_url: "https://gis.galvestontx.gov/server/rest/services/Utilities/Water_Lines/MapServer/0/query",
    sewer_lines_url: "https://gis.galvestontx.gov/server/rest/services/Utilities/Wastewater_Lines/MapServer/0/query",
    storm_lines_url: "https://gis.galvestontx.gov/server/rest/services/Utilities/Storm_Lines/MapServer/0/query"
  },
  "Montgomery County": {
    parcel_url: "https://mcad-tx.maps.arcgis.com/arcgis/rest/services/MCAD_Parcels/FeatureServer/0/query",
    zoning_url: null,
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null,
    // Montgomery County utility endpoints (varies by city)
    water_lines_url: "https://gis.mctx.org/arcgis/rest/services/Utilities/Water_System/MapServer/0/query",
    sewer_lines_url: "https://gis.mctx.org/arcgis/rest/services/Utilities/Wastewater_System/MapServer/0/query",
    storm_lines_url: "https://gis.mctx.org/arcgis/rest/services/Utilities/Storm_System/MapServer/0/query"
  },
  "Brazoria County": {
    parcel_url: "https://gis.brazoriacad.org/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: null,
    parcel_id_field: "PARCEL",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null,
    // Brazoria County utility endpoints (city-specific)
    water_lines_url: "https://gis.brazoriacounty.com/arcgis/rest/services/Utilities/Water_Lines/MapServer/0/query",
    sewer_lines_url: "https://gis.brazoriacounty.com/arcgis/rest/services/Utilities/Sewer_Lines/MapServer/0/query",
    storm_lines_url: "https://gis.brazoriacounty.com/arcgis/rest/services/Utilities/Storm_Lines/MapServer/0/query"
  },
  "Dallas County": {
    // DCAD parcel service (confirmed working)
    parcel_url: "https://gisservices.dallasopendata.com/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: "https://gis.dallascityhall.com/arcgis/rest/services/Zoning/MapServer/0/query",
    // DCAD-specific field mappings (confirmed from service metadata)
    parcel_id_field: "PARCEL",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: "ZONE_CODE",
    overlay_field: "OVERLAY",
    // Dallas utility endpoints
    water_lines_url: "https://gis.dallascityhall.com/arcgis/rest/services/Utilities/Water/MapServer/0/query",
    sewer_lines_url: "https://gis.dallascityhall.com/arcgis/rest/services/Utilities/Wastewater/MapServer/0/query"
  },
  "Tarrant County": {
    // TAD parcel service (confirmed working)
    parcel_url: "https://gis.tad.org/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: null,
    // TAD-specific field mappings (confirmed from service metadata)
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER_NAME",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null,
    // Fort Worth utility endpoints
    water_lines_url: "https://gis.fortworthtexas.gov/arcgis/rest/services/Utilities/Water_Lines/MapServer/0/query",
    sewer_lines_url: "https://gis.fortworthtexas.gov/arcgis/rest/services/Utilities/Wastewater_Lines/MapServer/0/query",
    storm_lines_url: "https://gis.fortworthtexas.gov/arcgis/rest/services/Utilities/Storm_Lines/MapServer/0/query"
  },
  "Collin County": {
    // CCAD parcel service (confirmed working)
    parcel_url: "https://ccad-tx.maps.arcgis.com/arcgis/rest/services/Parcels/FeatureServer/0/query",
    zoning_url: null,
    // CCAD-specific field mappings (confirmed from service metadata)
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null,
    // Plano/Frisco utility endpoints (major cities)
    water_lines_url: "https://gis.planotx.org/arcgis/rest/services/Utilities/Water_Lines/MapServer/0/query",
    sewer_lines_url: "https://gis.planotx.org/arcgis/rest/services/Utilities/Wastewater_Lines/MapServer/0/query",
    storm_lines_url: "https://gis.planotx.org/arcgis/rest/services/Utilities/Storm_Lines/MapServer/0/query"
  },
  "Denton County": {
    // Denton CAD parcel service (confirmed working)
    parcel_url: "https://gis.dentoncad.com/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: null,
    // Denton CAD-specific field mappings (confirmed from service metadata)
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null,
    // Denton city utility endpoints
    water_lines_url: "https://gis.cityofdenton.com/arcgis/rest/services/Utilities/Water_Lines/MapServer/0/query",
    sewer_lines_url: "https://gis.cityofdenton.com/arcgis/rest/services/Utilities/Wastewater_Lines/MapServer/0/query",
    storm_lines_url: "https://gis.cityofdenton.com/arcgis/rest/services/Utilities/Storm_Lines/MapServer/0/query"
  },
  "Travis County": {
    // Travis CAD parcel service (Austin area, confirmed working)
    parcel_url: "https://gis.traviscad.org/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: "https://maps.austintexas.gov/arcgis/rest/services/Shared/Zoning_1/MapServer/0/query",
    // Travis CAD-specific field mappings (confirmed from service metadata)
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: "ZONE",
    overlay_field: "OVERLAY",
    // Austin Water Utility (AWU) endpoints - official city services
    water_lines_url: "https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/WATER_water_line/FeatureServer/0/query",
    sewer_lines_url: "https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/WATER_wastewater_line/FeatureServer/0/query",
    storm_lines_url: "https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/WATER_storm_line/FeatureServer/0/query"
  },
  "Williamson County": {
    // WCAD parcel service (confirmed working)
    parcel_url: "https://gis.wcad.org/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: null,
    // WCAD-specific field mappings (confirmed from service metadata)
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null,
    // Round Rock utility endpoints (major city)
    water_lines_url: "https://gis.roundrocktexas.gov/arcgis/rest/services/Utilities/Water_Lines/MapServer/0/query",
    sewer_lines_url: "https://gis.roundrocktexas.gov/arcgis/rest/services/Utilities/Wastewater_Lines/MapServer/0/query",
    storm_lines_url: "https://gis.roundrocktexas.gov/arcgis/rest/services/Utilities/Storm_Lines/MapServer/0/query"
  },
  "Hays County": {
    parcel_url: "https://gis.hayscad.com/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: null,
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null,
    // San Marcos utility endpoints (major city)
    water_lines_url: "https://gis.sanmarcostx.gov/arcgis/rest/services/Utilities/Water_Lines/MapServer/0/query",
    sewer_lines_url: "https://gis.sanmarcostx.gov/arcgis/rest/services/Utilities/Wastewater_Lines/MapServer/0/query",
    storm_lines_url: "https://gis.sanmarcostx.gov/arcgis/rest/services/Utilities/Storm_Lines/MapServer/0/query"
  },
  "Bexar County": {
    // BCAD parcel service (San Antonio area, confirmed working)
    parcel_url: "https://gis.bcad.org/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: null, // San Antonio has zoning but needs different API approach
    // BCAD-specific field mappings (confirmed from service metadata)
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null,
    // San Antonio utility endpoints
    water_lines_url: "https://gis.sanantonio.gov/arcgis/rest/services/Utilities/Water/MapServer/0/query",
    sewer_lines_url: "https://gis.sanantonio.gov/arcgis/rest/services/Utilities/Wastewater/MapServer/0/query"
  }
};

// API Endpoints - Official Sources
const FEMA_NFHL_ZONES_URL = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/0/query"; // Flood Hazard Zones (Layer 0 - official NFHL flood zones per research document)
const OPENFEMA_DISASTERS_URL = "https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries"; // Historical flood events

// Cache Time-To-Live (TTL) in milliseconds - per research document recommendations
const CACHE_TTL = {
  PARCEL: 30 * 24 * 60 * 60 * 1000,    // 30 days (bi-weekly HCAD updates)
  ZONING: 90 * 24 * 60 * 60 * 1000,    // 90 days (quarterly changes)
  FEMA: 180 * 24 * 60 * 60 * 1000,     // 180 days (semi-annual NFHL updates)
  UTILITIES: 0,                         // No cache (real-time data)
  TRAFFIC: 365 * 24 * 60 * 60 * 1000,  // 365 days (annual AADT updates)
  EPA_ECHO: 90 * 24 * 60 * 60 * 1000,  // 90 days (EPA facility data relatively stable)
  WETLANDS: 180 * 24 * 60 * 60 * 1000  // 180 days (NWI updates bi-annually)
};

/**
 * Check if cached data exists and is still valid
 * Returns cached data if valid, null if expired/missing
 */
async function getCachedData(
  supabase: any,
  cacheKey: string,
  ttlMs: number
): Promise<any | null> {
  if (ttlMs === 0) return null; // Skip cache for zero TTL
  
  try {
    const { data: cached } = await supabase
      .from('api_logs')
      .select('*')
      .eq('cache_key', cacheKey)
      .gte('expires_at', new Date().toISOString())
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached && cached.success && cached.response_data) {
      console.log(`✅ Cache HIT for ${cacheKey} (expires ${cached.expires_at})`);
      return JSON.parse(cached.response_data);
    }
    
    console.log(`❌ Cache MISS for ${cacheKey}`);
    return null;
  } catch (error) {
    console.warn('Cache lookup failed:', error.message);
    return null;
  }
}

/**
 * Store API response in cache with TTL
 */
async function setCacheData(
  supabase: any,
  cacheKey: string,
  data: any,
  ttlMs: number,
  applicationId?: string
): Promise<void> {
  if (ttlMs === 0) return; // Skip cache for zero TTL
  
  try {
    const expiresAt = new Date(Date.now() + ttlMs);
    
    await supabase.from('api_logs').insert({
      cache_key: cacheKey,
      endpoint: cacheKey.split('_')[0], // e.g., "parcel" from "parcel_12345"
      success: true,
      duration_ms: 0, // Cached data, no API call made
      response_data: JSON.stringify(data),
      expires_at: expiresAt.toISOString(),
      application_id: applicationId,
      timestamp: new Date().toISOString()
    });
    
    console.log(`💾 Cached ${cacheKey} until ${expiresAt.toISOString()}`);
  } catch (error) {
    console.warn('Cache write failed:', error.message);
  }
}

/**
 * Retry helper with exponential backoff for flaky APIs
 * FEMA endpoints occasionally return 404 or timeout - retry 3 times with backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  backoffMs: number[] = [500, 1000, 2000],
  context: string = 'API call'
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === retries - 1;
      
      if (isLastAttempt) {
        console.error(`${context} failed after ${retries} attempts:`, error.message);
        throw error;
      }
      
      const delay = backoffMs[attempt] || backoffMs[backoffMs.length - 1];
      console.log(`${context} attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`${context} exhausted all retries`);
}

/**
 * Houston Locator_Parcels GeocodeServer
 * Converts a single-line address into parcel coordinates and bounding box geometry
 * Returns X, Y coordinates and Xmin, Xmax, Ymin, Ymax in EPSG:2278 (Texas South Central Feet)
 */
async function geocodeHoustonParcel(address: string): Promise<{
  match_addr: string;
  score: number;
  x: number;
  y: number;
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
} | null> {
  try {
    const baseUrl = "https://www.gis.hctx.net/arcgis/rest/services/Locator_Parcels/GeocodeServer/findAddressCandidates";
    const params = new URLSearchParams({
      SingleLine: address,
      f: 'json',
      outSR: '2278'  // Texas South Central Feet
    });
    
    const url = `${baseUrl}?${params}`;
    console.log(`Geocoding Houston parcel address: ${address}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      // Filter by score >= 80 per Locator properties
      const bestMatch = data.candidates.find((c: any) => c.score >= 80);
      
      if (bestMatch) {
        const result = {
          match_addr: bestMatch.address,
          score: bestMatch.score,
          x: bestMatch.location.x,
          y: bestMatch.location.y,
          xmin: bestMatch.extent.xmin,
          xmax: bestMatch.extent.xmax,
          ymin: bestMatch.extent.ymin,
          ymax: bestMatch.extent.ymax
        };
        
        console.log('Houston parcel geocode result:', {
          match_addr: result.match_addr,
          score: result.score,
          x: result.x,
          y: result.y
        });
        
        return result;
      } else {
        console.log('No Houston parcel match with score >= 80');
        return null;
      }
    }
    
    console.log('No Houston parcel geocoding candidates found');
    return null;
  } catch (error) {
    console.error('Houston parcel geocoding error:', error);
    return null;
  }
}
const USGS_ELEVATION_URL = "https://nationalmap.gov/epqs/pqs.php";
const USFWS_WETLANDS_URL = "https://www.fws.gov/wetlands/arcgis/rest/services/Wetlands/MapServer/0/query";
const USDA_SOIL_URL = "https://SDMDataAccess.sc.egov.usda.gov/Tabular/post.rest";
const EPA_FRS_URL = "https://enviro.epa.gov/frs/frs_rest_services";
const NOAA_STORM_URL = "https://www.ncdc.noaa.gov/stormevents/csv";
const FCC_BROADBAND_URL = "https://broadbandmap.fcc.gov/api/nationwide";
// TxDOT Official Traffic Data Endpoints
const TXDOT_AADT_URL_LEGACY = "https://services.arcgis.com/KTcxiTD9dsQwVSFh/arcgis/rest/services/AADT/FeatureServer/0/query";
const TXDOT_ROADWAYS_URL = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Roadways/FeatureServer/0/query";
const TXDOT_CONGESTION_URL = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Congestion/FeatureServer/0/query";
const TXDOT_TRUCK_URL = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/ArcGIS/rest/services/TxDOT_Truck_Percent_SRD/FeatureServer/0/query";

// Houston-specific traffic endpoint
const HOUSTON_TRAFFIC_URL = "https://cohgis.houstontx.gov/arcgis/rest/services/PW/Traffic_Volumes/MapServer/0/query";
const CENSUS_ACS_BASE = "https://api.census.gov/data/2022/acs/acs5";
const BLS_QCEW_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/";
const OPPORTUNITY_ZONES_URL = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/Opportunity_Zones/FeatureServer/0/query";
const TEXAS_ENTERPRISE_ZONES_URL = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Texas_Enterprise_Zones/FeatureServer/0/query";
const US_FTZ_URL = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/Foreign_Trade_Zones/FeatureServer/0/query";

// Helper function to fetch elevation with multiple fallback sources
async function fetchElevation(lat: number, lng: number): Promise<number | null> {
  const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
  
  // Try Google Elevation API first (most reliable)
  if (GOOGLE_API_KEY) {
    try {
      const googleUrl = `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${GOOGLE_API_KEY}`;
      const googleResponse = await fetch(googleUrl);
      const googleData = await googleResponse.json();
      
      if (googleData?.results?.[0]?.elevation) {
        const elevationMeters = googleData.results[0].elevation;
        const elevationFeet = elevationMeters * 3.28084; // Convert to feet
        console.log('Elevation from Google:', elevationFeet);
        return elevationFeet;
      }
    } catch (error) {
      console.error('Google Elevation API error:', error);
    }
  }
  
  // Try Open-Elevation as fallback (free, no API key)
  try {
    const openElevUrl = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`;
    const openElevResponse = await fetch(openElevUrl);
    const openElevData = await openElevResponse.json();
    
    if (openElevData?.results?.[0]?.elevation) {
      const elevationMeters = openElevData.results[0].elevation;
      const elevationFeet = elevationMeters * 3.28084; // Convert to feet
      console.log('Elevation from Open-Elevation:', elevationFeet);
      return elevationFeet;
    }
  } catch (error) {
    console.error('Open-Elevation API error:', error);
  }
  
  // Try USGS as final fallback
  try {
    const url = `${USGS_ELEVATION_URL}?x=${lng}&y=${lat}&units=Feet&output=json`;
    const response = await fetch(url);
    const text = await response.text();
    
    if (!text || text.trim() === '') {
      console.error('USGS Elevation API returned empty response');
      return null;
    }
    
    const data = JSON.parse(text);
    const elevation = data?.USGS_Elevation_Point_Query_Service?.Elevation_Query?.Elevation;
    if (elevation) {
      console.log('Elevation from USGS:', elevation);
      return elevation;
    }
  } catch (error) {
    console.error('USGS Elevation fetch error:', error);
  }
  
  console.log('All elevation sources failed');
  return null;
}

// Helper function to fetch wetlands data from USFWS National Wetlands Inventory
// PRIORITY: Wetlands have HIGH regulatory impact - Section 404 permits required
async function fetchWetlands(lat: number, lng: number): Promise<{ 
  type: string; 
  regulatory_impact: 'high' | 'moderate' | 'low' | 'none';
  permit_required: boolean;
  raw: any 
} | null> {
  try {
    // Create 100-foot buffer (expanded from 50ft for regulatory compliance)
    // Section 404 Clean Water Act requires permits for filling wetlands
    const bufferDegrees = 100 / 364000; // 1 degree ≈ 364,000 feet at 29°N
    
    const minLat = lat - bufferDegrees;
    const maxLat = lat + bufferDegrees;
    const minLon = lng - bufferDegrees;
    const maxLon = lng + bufferDegrees;
    
    // Build polygon geometry for 100ft buffer
    const polygonGeometry = JSON.stringify({
      rings: [[
        [minLon, minLat],
        [maxLon, minLat],
        [maxLon, maxLat],
        [minLon, maxLat],
        [minLon, minLat]
      ]],
      spatialReference: { wkid: 4326 }
    });
    
    const params = new URLSearchParams({
      geometry: polygonGeometry,
      geometryType: 'esriGeometryPolygon',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'WETLAND_TYPE,ATTRIBUTE,ACRES,WETLAND_CODE,SYSTEM,SUBSYSTEM,CLASS',
      returnGeometry: 'true',
      f: 'json'
    });
    
    const response = await retryWithBackoff(
      () => fetch(`${USFWS_WETLANDS_URL}?${params}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000) // 15 second timeout
      }),
      3, // 3 retries
      1000 // 1 second base delay
    );
    
    if (!response.ok) {
      console.error('USFWS Wetlands API error:', response.status, response.statusText);
      return null;
    }
    
    const text = await response.text();
    
    if (!text || text.trim().startsWith('<')) {
      console.log('Wetlands API returned HTML/invalid response');
      return null;
    }
    
    const data = JSON.parse(text);
    
    if (data?.features && data.features.length > 0) {
      const feature = data.features[0];
      const attrs = feature.attributes;
      
      // Determine wetland type and regulatory classification
      const wetlandType = attrs.WETLAND_TYPE || attrs.ATTRIBUTE || attrs.WETLAND_CODE || 'Unknown';
      const wetlandSystem = attrs.SYSTEM || '';
      const acres = attrs.ACRES || 0;
      
      // Assess regulatory impact based on wetland characteristics
      let regulatoryImpact: 'high' | 'moderate' | 'low' | 'none' = 'moderate';
      let permitRequired = true;
      
      // High regulatory impact: Palustrine/Estuarine wetlands, >0.5 acres
      if ((wetlandSystem.toLowerCase().includes('palustrine') || 
           wetlandSystem.toLowerCase().includes('estuarine')) && acres > 0.5) {
        regulatoryImpact = 'high';
        permitRequired = true;
      } 
      // Moderate: Smaller wetlands or temporary/seasonal
      else if (acres > 0.1 || wetlandType.toLowerCase().includes('temporary')) {
        regulatoryImpact = 'moderate';
        permitRequired = true;
      }
      // Low: Very small isolated wetlands
      else if (acres < 0.1) {
        regulatoryImpact = 'low';
        permitRequired = true; // Still technically require permit
      }
      
      console.log('⚠️ WETLANDS DETECTED - HIGH REGULATORY IMPACT', { 
        type: wetlandType,
        system: wetlandSystem,
        acres: acres,
        featureCount: data.features.length,
        regulatoryImpact,
        permitRequired
      });
      
      return {
        type: `${wetlandType}${wetlandSystem ? ` (${wetlandSystem})` : ''}`,
        regulatory_impact: regulatoryImpact,
        permit_required: permitRequired,
        raw: {
          queried_at: new Date().toISOString(),
          features_found: data.features.length,
          buffer_ft: 100,
          endpoint: USFWS_WETLANDS_URL,
          total_acres: acres,
          wetland_code: attrs.WETLAND_CODE,
          system: wetlandSystem,
          subsystem: attrs.SUBSYSTEM,
          class: attrs.CLASS,
          regulatory_notes: permitRequired 
            ? 'Section 404 Clean Water Act permit likely required. Consult wetland delineation specialist.'
            : 'Low impact wetland - verify with local authorities',
          response: {
            feature_count: data.features.length,
            primary_wetland: {
              type: wetlandType,
              acres: acres,
              system: wetlandSystem
            }
          }
        }
      };
    }
    
    console.log('✅ No wetlands detected within 100ft buffer');
    return {
      type: 'None detected',
      regulatory_impact: 'none',
      permit_required: false,
      raw: {
        queried_at: new Date().toISOString(),
        features_found: 0,
        buffer_ft: 100,
        endpoint: USFWS_WETLANDS_URL
      }
    };
  } catch (error) {
    console.error('❌ Wetlands fetch critical error:', error);
    return null;
  }
}

// Helper function to fetch soil data from USDA NRCS
async function fetchSoilData(lat: number, lng: number): Promise<any> {
  try {
    // Try USDA Soil Data Access API first
    const sdaUrl = `https://SDMDataAccess.sc.egov.usda.gov/Tabular/post.rest`;
    const query = `SELECT TOP 1 m.muname, c.slope_r, c.drainagecl 
                   FROM mapunit m 
                   INNER JOIN component c ON m.mukey = c.mukey
                   WHERE m.mukey IN (
                     SELECT * FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('POINT(${lng} ${lat})')
                   )`;
    
    const sdaResponse = await fetch(sdaUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: `query=${encodeURIComponent(query)}&format=JSON`
    });
    
    const text = await sdaResponse.text();
    
    if (text && !text.trim().startsWith('<')) {
      try {
        const data = JSON.parse(text);
        
        if (data?.Table?.[0]) {
          const soilData = {
            soil_series: data.Table[0][0] || null,
            soil_slope_percent: data.Table[0][1] ? Number(data.Table[0][1]) : null,
            soil_drainage_class: data.Table[0][2] || null
          };
          console.log('Soil data from USDA SDA:', soilData);
          return soilData;
        }
      } catch (parseError) {
        console.error('Failed to parse USDA SDA response:', parseError);
      }
    }
    
    // Fallback: Try NRCS Soil Survey Geographic (SSURGO) WFS service
    console.log('Trying NRCS SSURGO WFS service fallback for drainage class');
    const ssurgoUrl = `https://sdmdataaccess.nrcs.usda.gov/Spatial/SDMWGS84Geographic.wfs`;
    const ssurgoParams = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: 'MapunitPoly',
      outputFormat: 'application/json',
      srsname: 'EPSG:4326',
      bbox: `${lng-0.001},${lat-0.001},${lng+0.001},${lat+0.001},EPSG:4326`
    });
    
    const ssurgoResponse = await fetch(`${ssurgoUrl}?${ssurgoParams}`, {
      headers: { 'Accept': 'application/json' }
    });
    const ssurgoText = await ssurgoResponse.text();
    
    if (ssurgoText && !ssurgoText.trim().startsWith('<')) {
      try {
        const ssurgoData = JSON.parse(ssurgoText);
        if (ssurgoData?.features?.[0]?.properties) {
          const props = ssurgoData.features[0].properties;
          const soilData = {
            soil_series: props.muname || props.MapUnitName || null,
            soil_slope_percent: props.slope_r || props.slopegradwta || null,
            soil_drainage_class: props.drainagecl || props.drclassdcd || props.drainagecl_r || null
          };
          console.log('✅ Soil data from SSURGO WFS fallback:', soilData);
          return soilData;
        }
      } catch (parseError) {
        console.error('Failed to parse SSURGO WFS response:', parseError);
      }
    }
    
    console.log('No soil data available from any source');
    return {};
  } catch (error) {
    console.error('Soil data fetch error:', error);
    return {};
  }
}

// Helper function to infer soil drainage class from soil series name
function inferDrainageFromSoilSeries(soilSeries: string | null): string | null {
  if (!soilSeries) return null;
  
  const seriesLower = soilSeries.toLowerCase();
  
  // Common Texas soil drainage patterns
  const drainagePatterns: Record<string, string[]> = {
    'somewhat poorly drained': ['cyfair', 'lake charles', 'edna', 'hockley'],
    'well drained': ['houston black', 'laredo', 'olton', 'pullman'],
    'moderately well drained': ['denton', 'ellis', 'austin'],
    'poorly drained': ['beaumont', 'harris', 'league', 'tracy'],
    'excessively drained': ['springer', 'eufaula', 'bastrop', 'windthorst']
  };
  
  // Check for urban land complex (common in developed areas)
  if (seriesLower.includes('urban land')) {
    return 'Variable - Urban land complex (estimated: moderately well to somewhat poorly drained)';
  }
  
  // Match against known patterns
  for (const [drainage, patterns] of Object.entries(drainagePatterns)) {
    if (patterns.some(pattern => seriesLower.includes(pattern))) {
      return `${drainage.charAt(0).toUpperCase() + drainage.slice(1)} (estimated from soil series)`;
    }
  }
  
  return null;
}

// ============================================
// PHASE 3D: Texas Property Classification Lookup Functions
// ============================================

// Maps state_class to broad property categories
function getPropertyCategory(stateClass: string | null): string | null {
  if (!stateClass) return null;
  
  const categoryMap: Record<string, string> = {
    // A-series: Real Property (Residential)
    'A1': 'Residential', 'A2': 'Residential', 'A3': 'Residential',
    
    // B-series: Multi-Family Residential
    'B1': 'Multi-Family', 'B2': 'Multi-Family', 'B3': 'Multi-Family', 'B4': 'Multi-Family',
    
    // C-series: Vacant Lots/Tracts
    'C1': 'Vacant Land', 'C2': 'Vacant Land',
    
    // D-series: Rural/Agricultural
    'D1': 'Rural Land', 'D2': 'Farm/Ranch',
    
    // E-series: Non-Qualified Agricultural
    'E1': 'Rural Land', 'E2': 'Rural Land', 'E3': 'Rural Land', 'E4': 'Rural Land',
    
    // F-series: Commercial Real Property
    'F1': 'Commercial', 'F2': 'Commercial',
    
    // G-series: Oil/Gas/Minerals
    'G': 'Industrial',
    
    // J-series: Utilities
    'J1': 'Utilities', 'J2': 'Utilities', 'J3': 'Utilities', 'J4': 'Utilities',
    'J5': 'Utilities', 'J6': 'Utilities', 'J7': 'Utilities', 'J8': 'Utilities',
    
    // L-series: Personal Property
    'L1': 'Personal Property', 'L2': 'Personal Property',
    
    // M-series: Mobile Homes/Industrial Property
    'M1': 'Mobile Home', 'M2': 'Industrial', 'M3': 'Industrial',
    
    // O-series: Residential Inventory
    'O': 'Residential Inventory',
    
    // S-series: Special Inventory
    'S': 'Special Inventory',
    
    // X-series: Exempt Properties
    'XA': 'Exempt', 'XB': 'Exempt', 'XC': 'Exempt', 'XD': 'Exempt', 'XE': 'Exempt',
    'XF': 'Exempt', 'XG': 'Exempt', 'XL': 'Exempt', 'XN': 'Exempt', 'XR': 'Exempt',
    'XS': 'Exempt', 'XV': 'Exempt', 'XX': 'Exempt'
  };
  
  return categoryMap[stateClass.toUpperCase()] || null;
}

// Maps state_class + land_use_code to detailed descriptions
function getLandUseDescription(stateClass: string | null, landUseCode: string | null): string | null {
  if (!stateClass) return null;
  
  const stateClassUpper = stateClass.toUpperCase();
  
  // Base descriptions for each state class
  const baseDescriptions: Record<string, string> = {
    'A1': 'Single Family Residence',
    'A2': 'Single Family Residence with Nominal Acreage (1-10 acres)',
    'A3': 'Single Family Residence with Acreage (10+ acres)',
    'B1': 'Multi-Family - Apartments/Condos (2-4 units)',
    'B2': 'Multi-Family - Apartments/Condos (5+ units)',
    'B3': 'Multi-Family - Apartments/Condos (High-Density)',
    'B4': 'Multi-Family - Timeshare/Condominium Hotels',
    'C1': 'Vacant Lot/Tract (Platted)',
    'C2': 'Vacant Lot/Tract (Unplatted)',
    'D1': 'Qualified Agricultural Land (Open Space)',
    'D2': 'Qualified Agricultural Land (Timber)',
    'E1': 'Non-Qualified Agricultural Land (Rural)',
    'E2': 'Non-Qualified Agricultural Land (Farm/Ranch)',
    'E3': 'Non-Qualified Agricultural Land (Recreational)',
    'E4': 'Non-Qualified Agricultural Land (Transition)',
    'F1': 'Commercial Vacant Land',
    'F2': 'Commercial Improved Property',
    'G': 'Oil, Gas, and Other Mineral Reserves',
    'J1': 'Utility Real Property (Electric)',
    'J2': 'Utility Real Property (Gas)',
    'J3': 'Utility Real Property (Telephone/Telegraph)',
    'J4': 'Utility Real Property (Water)',
    'J5': 'Utility Real Property (Railroad)',
    'J6': 'Utility Real Property (Pipeline)',
    'J7': 'Utility Real Property (Cable TV)',
    'J8': 'Utility Real Property (Other)',
    'L1': 'Personal Property - Tangible',
    'L2': 'Personal Property - Intangible',
    'M1': 'Mobile Home - Owner-Occupied',
    'M2': 'Industrial Personal Property',
    'M3': 'Industrial Real Property (Manufacturing)',
    'O': 'Residential Inventory (Developer-Owned)',
    'S': 'Special Inventory (Business)',
    'XA': 'Exempt - Cemeteries',
    'XB': 'Exempt - Youth Development',
    'XC': 'Exempt - Religious Organization',
    'XD': 'Exempt - Public Property',
    'XE': 'Exempt - Charitable/Educational',
    'XF': 'Exempt - Water/Wastewater',
    'XG': 'Exempt - Pollution Control',
    'XL': 'Exempt - Public Health',
    'XN': 'Exempt - Income-Producing Exempt',
    'XR': 'Exempt - Recreational/Park',
    'XS': 'Exempt - Fraternal Organization',
    'XV': 'Exempt - Government/Religious',
    'XX': 'Exempt - Other'
  };
  
  let description = baseDescriptions[stateClassUpper] || `Property Class: ${stateClass}`;
  
  // Append land use code details if available (for F1/F2 commercial properties)
  if (landUseCode && (stateClassUpper === 'F1' || stateClassUpper === 'F2')) {
    const codeNum = parseInt(landUseCode);
    
    if (codeNum >= 8000 && codeNum <= 8099) {
      description += ' - Neighborhood Section 1';
    } else if (codeNum >= 8100 && codeNum <= 8199) {
      description += ' - Community Section 2';
    } else if (codeNum >= 8200 && codeNum <= 8299) {
      description += ' - Regional Section 3';
    } else if (codeNum >= 8300 && codeNum <= 8399) {
      description += ' - Office/Showroom';
    } else if (codeNum >= 8400 && codeNum <= 8499) {
      description += ' - Warehouse/Industrial';
    } else if (codeNum >= 8500 && codeNum <= 8599) {
      description += ' - Special Purpose';
    }
  }
  
  return description;
}

// Maps state_class + land_use_code to business-friendly prop_type
function getPropType(stateClass: string | null, landUseCode: string | null): string | null {
  if (!stateClass) return null;
  
  const stateClassUpper = stateClass.toUpperCase();
  
  // Map to business-friendly types
  const propTypeMap: Record<string, string> = {
    'A1': 'Single Family', 'A2': 'Single Family', 'A3': 'Single Family',
    'B1': 'Multi-Family', 'B2': 'Multi-Family', 'B3': 'Multi-Family', 'B4': 'Multi-Family',
    'C1': 'Land', 'C2': 'Land',
    'D1': 'Land', 'D2': 'Land',
    'E1': 'Land', 'E2': 'Land', 'E3': 'Land', 'E4': 'Land',
    'F1': 'Land',
    'F2': 'Commercial',
    'G': 'Industrial',
    'M3': 'Industrial',
    'O': 'Residential',
    'S': 'Commercial'
  };
  
  // For F2 (improved commercial), refine based on land_use_code
  if (stateClassUpper === 'F2' && landUseCode) {
    const codeNum = parseInt(landUseCode);
    if (codeNum >= 8000 && codeNum <= 8299) return 'Retail';
    if (codeNum >= 8300 && codeNum <= 8399) return 'Office';
    if (codeNum >= 8400 && codeNum <= 8499) return 'Warehouse';
    if (codeNum >= 8500 && codeNum <= 8599) return 'Special Purpose';
  }
  
  return propTypeMap[stateClassUpper] || null;
}

// Extracts exemption code from state_class (X-series)
function getExemptionCode(stateClass: string | null): string | null {
  if (!stateClass) return null;
  
  const stateClassUpper = stateClass.toUpperCase();
  
  // If it starts with X, it's an exemption
  if (stateClassUpper.startsWith('X')) {
    return stateClassUpper;
  }
  
  return null;
}

// Helper function to calculate distance in miles using haversine
function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function to fetch EPA environmental sites
async function fetchEnvironmentalSites(lat: number, lng: number, county: string): Promise<any[]> {
  try {
    const sites: any[] = [];
    
    // 1. Fetch EPA Superfund sites (CERCLIS) within 5-mile radius
    try {
      const superfundUrl = `https://enviro.epa.gov/enviro/efservice/CERCLIS_SITE_LISTING/JSON`;
      const superfundResponse = await fetch(superfundUrl, {
        headers: { 'Accept': 'application/json' }
      });
      const superfundData = await safeJsonParse(superfundResponse, 'EPA Superfund sites query');
      
      if (superfundData && Array.isArray(superfundData)) {
        superfundData.forEach((site: any) => {
          if (site.LATITUDE_MEASURE && site.LONGITUDE_MEASURE) {
            const distance = haversineMiles(lat, lng, 
              parseFloat(site.LATITUDE_MEASURE), 
              parseFloat(site.LONGITUDE_MEASURE)
            );
            if (distance <= 5) {
              sites.push({
                site_name: site.SITE_NAME || 'Unknown Superfund Site',
                program: 'CERCLIS/Superfund',
                status: site.NPL_STATUS || site.SITE_STATUS,
                distance_mi: Math.round(distance * 10) / 10
              });
            }
          }
        });
      }
    } catch (superfundError) {
      console.error('Superfund API error:', superfundError);
    }
    
    // 2. Fetch EPA Brownfields within 2-mile radius
    try {
      const brownfieldsParams = new URLSearchParams({
        geometry: JSON.stringify({ 
          x: lng, 
          y: lat, 
          spatialReference: { wkid: 4326 } 
        }),
        geometryType: 'esriGeometryPoint',
        distance: '2',
        units: 'esriSRUnit_StatuteMile',
        outFields: 'SITE_NAME,STATUS,ASSESSMENT_TYPE,LATITUDE,LONGITUDE',
        returnGeometry: 'true',
        f: 'json'
      });
      
      const brownfieldsUrl = `https://geopub.epa.gov/arcgis/rest/services/OSWER/brownfields/MapServer/0/query?${brownfieldsParams}`;
      const brownfieldsResponse = await fetch(brownfieldsUrl);
      const brownfieldsData = await safeJsonParse(brownfieldsResponse, 'EPA Brownfields query');
      
      if (brownfieldsData?.features) {
        brownfieldsData.features.forEach((feature: any) => {
          const attrs = feature.attributes;
          const siteLat = attrs.LATITUDE || feature.geometry?.y;
          const siteLng = attrs.LONGITUDE || feature.geometry?.x;
          const distance = siteLat && siteLng 
            ? haversineMiles(lat, lng, siteLat, siteLng)
            : null;
          
          sites.push({
            site_name: attrs.SITE_NAME || 'Unknown Brownfield Site',
            program: 'EPA Brownfields',
            status: attrs.STATUS || attrs.ASSESSMENT_TYPE,
            distance_mi: distance ? Math.round(distance * 10) / 10 : null
          });
        });
      }
    } catch (brownfieldsError) {
      console.error('Brownfields API error:', brownfieldsError);
    }
    
    // 3. Fallback: Try FRS (Facility Registry Service) for exact point
    if (sites.length === 0) {
      try {
        const frsResponse = await fetch(
          `https://enviro.epa.gov/efservice/FRS_INTEREST/latitude/${lat}/longitude/${lng}/JSON`,
          { headers: { 'Accept': 'application/json' } }
        );
        const frsData = await safeJsonParse(frsResponse, 'EPA FRS query');
        
        if (frsData && Array.isArray(frsData)) {
          frsData.slice(0, 5).forEach((site: any) => {
            sites.push({
              site_name: site.REGISTRY_NAME || site.SITE_NAME,
              program: site.PROGRAM_SYSTEM_ACRONYM || 'EPA FRS',
              status: site.FACILITY_STATUS
            });
          });
        }
      } catch (frsError) {
        console.error('FRS API error:', frsError);
      }
    }
    
    // Sort by distance (closest first) and limit to 10 sites
    return sites
      .sort((a, b) => {
        if (a.distance_mi === null) return 1;
        if (b.distance_mi === null) return -1;
        return a.distance_mi - b.distance_mi;
      })
      .slice(0, 10);
      
  } catch (error) {
    console.error('Environmental sites fetch error:', error);
    return [];
  }
}

// Helper function to fetch FCC broadband data
async function fetchBroadband(lat: number, lng: number): Promise<any> {
  try {
    // FCC Broadband Map API - nationwide dataset with HTTP/1.1 fallback
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(
      `${FCC_BROADBAND_URL}?latitude=${lat}&longitude=${lng}`,
      { 
        signal: controller.signal,
        headers: { 
          'Accept': 'application/json',
          'Connection': 'keep-alive' // Force HTTP/1.1 to avoid HTTP/2 stream errors
        }
      }
    );
    clearTimeout(timeoutId);
    
    const text = await response.text();
    
    if (!text || text.trim().startsWith('<')) {
      console.log('Broadband API returned HTML/invalid response');
      return { fiber_available: false, broadband_providers: [] };
    }
    
    const data = JSON.parse(text);
    console.log('Broadband API response:', { hasResults: !!data?.results, count: data?.results?.length });
    
    const providers = (data?.results || []).map((p: any) => ({
      provider: p.provider_name || p.holding_company_name,
      technology: p.technology_code,
      max_download: p.max_advertised_download_speed,
      max_upload: p.max_advertised_upload_speed
    }));
    
    const hasFiber = providers.some((p: any) => 
      p.technology === '50' || p.technology === 'Fiber' || p.technology?.toString() === '50'
    );
    
    console.log('Broadband data:', { fiber_available: hasFiber, provider_count: providers.length });
    
    return {
      fiber_available: hasFiber,
      broadband_providers: providers
    };
  } catch (error) {
    console.error('Broadband fetch error:', error);
    return { fiber_available: false, broadband_providers: [] };
  }
}

// TxDOT AADT REST Endpoint (correct point layer)
const TXDOT_AADT_URL = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_AADT/FeatureServer/0/query";

// Helper function to calculate distance in feet between two lat/lng points
function distanceFeet(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 20925656.2; // Earth radius in feet
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Query traffic data from TxDOT AADT using Turf.js for accurate distance calculations
 */
async function queryTrafficData(lat: number, lng: number, city?: string, supabase?: any, appId?: string): Promise<any> {
  console.log(`🚗 Starting TxDOT AADT query at ${lat}, ${lng}`);
  
  // 💾 Check cache first (365-day TTL - annual AADT updates)
  const trafficCacheKey = `traffic_${lat.toFixed(5)}_${lng.toFixed(5)}`;
  const cachedTraffic = supabase ? await getCachedData(supabase, trafficCacheKey, CACHE_TTL.TRAFFIC) : null;
  
  if (cachedTraffic) {
    console.log('✅ Using cached traffic data');
    return { ...cachedTraffic, cached: true };
  }
  
  // Import only the Turf.js functions we need (avoids esm.sh parsing issues with full package)
  const { point } = await import('https://esm.sh/@turf/helpers@7.1.0');
  const { lineString } = await import('https://esm.sh/@turf/helpers@7.1.0');
  const { default: nearestPointOnLine } = await import('https://esm.sh/@turf/nearest-point-on-line@7.1.0');
  const { default: distance } = await import('https://esm.sh/@turf/distance@7.1.0');
  
  try {
    // Build a small envelope buffer around the parcel point (in degrees)
    const bufferDeg = 0.015; // ~1 mile radius
    const envelope = {
      xmin: lng - bufferDeg,
      ymin: lat - bufferDeg,
      xmax: lng + bufferDeg,
      ymax: lat + bufferDeg
    };
    
    console.log(`📦 Query envelope:`, JSON.stringify(envelope));

    // Build query URL
    const params = new URLSearchParams({
      geometry: JSON.stringify(envelope),
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'OBJECTID,RTE_NM,AADT_CUR,EXT_DATE',
      outSR: '4326',
      returnGeometry: 'true',
      f: 'json'
    });
    const queryUrl = `${TXDOT_AADT_URL}?${params.toString()}`;
    console.log(`🌐 Query URL length: ${queryUrl.length} chars`);

    // Fetch from TxDOT
    const resp = await fetch(queryUrl);
    if (!resp.ok) {
      console.error(`❌ TxDOT HTTP ${resp.status}: ${resp.statusText}`);
      return null;
    }
    
    const json = await resp.json();
    const features = json.features || [];
    console.log(`📊 TxDOT returned ${features.length} features`);

    if (features.length === 0) {
      console.log('⚠️ No features returned; consider expanding envelope');
      return null;
    }

    // Choose best / nearest feature using Turf.js
    const parcelPoint = point([lng, lat]);
    let best = null;
    let bestDist = Infinity;

    for (const feat of features) {
      if (!feat.geometry || !feat.geometry.paths || !feat.geometry.paths[0]) {
        continue;
      }
      
      // Geometry is polyline; compute nearest point on that line to parcel point
      const line = lineString(feat.geometry.paths[0].map((pt: number[]) => [pt[0], pt[1]]));
      const nearest = nearestPointOnLine(line, parcelPoint);
      const dist = distance(parcelPoint, nearest, { units: 'meters' });
      
      if (dist < bestDist) {
        bestDist = dist;
        best = { feat, dist };
      }
    }

    if (!best) {
      console.log('❌ No valid line geometries found');
      return null;
    }

    const { feat, dist } = best;
    const attrs = feat.attributes;

    // Parse year from EXT_DATE (if present)
    let year = null;
    if (attrs.EXT_DATE) {
      const dt = new Date(attrs.EXT_DATE);
      if (!isNaN(dt.getFullYear())) {
        year = dt.getFullYear();
      }
    }

    const distFeet = dist * 3.28084; // meters → feet
    const aadt = attrs.AADT_CUR ?? null;
    
    console.log(`✅ Matched nearest segment: ${aadt} AADT (${year}) at ${Math.round(distFeet)}ft on ${attrs.RTE_NM || 'unknown'}`);

    const result = {
      aadt,
      year,
      stationId: attrs.OBJECTID ?? null,
      distance: distFeet,
      roadName: attrs.RTE_NM ?? null
    };
    
    // 💾 Cache successful traffic data
    if (supabase && result.aadt) {
      await setCacheData(supabase, trafficCacheKey, result, CACHE_TTL.TRAFFIC, appId);
    }
    
    return result;
    
  } catch (error) {
    console.error(`💥 TxDOT error:`, error.message || String(error));
    console.error(`Stack:`, error.stack);
    return null;
  }
}

// Helper function to fetch historical flood events from OpenFEMA
async function fetchHistoricalFloodEvents(lat: number, lng: number): Promise<any> {
  try {
    // Query OpenFEMA Disaster Declarations API
    const point = `POINT(${lng} ${lat})`;
    const filterParam = `geo.intersects(geometry,geography'${point}')`;
    
    const url = `${OPENFEMA_DISASTERS_URL}?$filter=${encodeURIComponent(filterParam)}&$select=state,incidentType,declarationDate,placeCode&$top=200&$format=json`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      console.log(`OpenFEMA API returned ${response.status}`);
      return { total_events: 0, by_type: {} };
    }
    
    const data = await response.json();
    const disasters = data?.DisasterDeclarationsSummaries || [];
    
    // Aggregate by incident type
    const byType: Record<string, { count: number, latest_date: string }> = {};
    
    disasters.forEach((d: any) => {
      const type = d.incidentType || 'Unknown';
      if (!byType[type]) {
        byType[type] = { count: 0, latest_date: d.declarationDate };
      }
      byType[type].count++;
      
      // Track latest date
      if (d.declarationDate > byType[type].latest_date) {
        byType[type].latest_date = d.declarationDate;
      }
    });
    
    console.log(`OpenFEMA: Found ${disasters.length} disaster events`);
    
    // Build detailed flood events array
    const floodEvents = disasters
      .filter((d: any) => d.incidentType === 'Flood')
      .map((d: any) => ({
        declaration_date: d.declarationDate,
        incident_type: d.incidentType,
        disaster_number: d.disasterNumber,
        title: d.declarationTitle || `Flood Event ${d.disasterNumber}`,
        county: d.placeCode || county
      }))
      .sort((a: any, b: any) => 
        new Date(b.declaration_date).getTime() - new Date(a.declaration_date).getTime()
      )
      .slice(0, 20); // Limit to most recent 20 flood events
    
    return {
      total_events: disasters.length,
      by_type: byType,
      flood_events: floodEvents // Now returns array instead of count
    };
  } catch (error) {
    console.error('OpenFEMA fetch error:', error);
    return { total_events: 0, by_type: {}, flood_events: 0 };
  }
}

// Helper function to fetch Google Maps highway/transit data
async function fetchMobilityData(lat: number, lng: number, googleApiKey: string): Promise<any> {
  try {
    const mobilityData: any = {};
    
    // Find nearest highway via Google Places Text Search
    const textUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=highway&location=${lat},${lng}&radius=5000&key=${googleApiKey}`;
    const textResp = await fetch(textUrl);
    const textData = await textResp.json();
    
    if (textData?.results?.[0]) {
      const highway = textData.results[0];
      mobilityData.nearest_highway = highway.name;
      const hwLat = highway.geometry.location.lat;
      const hwLng = highway.geometry.location.lng;
      mobilityData.distance_highway_ft = haversineFt(lat, lng, hwLat, hwLng);
    } else {
      // Fallback to OSM motorway/trunk
      const osm = await fallbackRoadFromOSM(lat, lng);
      if (osm?.traffic_road_name) {
        mobilityData.nearest_highway = osm.traffic_road_name;
        mobilityData.distance_highway_ft = osm.traffic_distance_ft;
      }
    }
    
    // Find nearest transit stop
    
    // Find nearest transit stop
    const transitUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=2000&type=transit_station&key=${googleApiKey}`;
    const transitResp = await fetch(transitUrl);
    const transitData = await transitResp.json();
    
    if (transitData?.results?.[0]) {
      const transit = transitData.results[0];
      mobilityData.nearest_transit_stop = transit.name;
      
      const trLat = transit.geometry.location.lat;
      const trLng = transit.geometry.location.lng;
      const distMiles = Math.sqrt(
        Math.pow((trLng - lng) * 69, 2) + 
        Math.pow((trLat - lat) * 69, 2)
      );
      mobilityData.distance_transit_ft = distMiles * 5280;
    }
    
    return mobilityData;
  } catch (error) {
    console.error('Mobility data fetch error:', error);
    return {};
  }
}

// Helper function to fetch Census demographics
async function fetchDemographics(lat: number, lng: number): Promise<any> {
  try {
    // First, get the census tract for the coordinates
    const geoUrl = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
    const geoResp = await fetch(geoUrl);
    const geoData = await geoResp.json();
    
    const tract = geoData?.result?.geographies?.['Census Tracts']?.[0]?.GEOID;
    if (!tract) return {};
    
    // Fetch ACS data for tract
    const state = tract.substring(0, 2);
    const county = tract.substring(2, 5);
    const tractNum = tract.substring(5);
    
    // Population, income, households
    const varsUrl = `${CENSUS_ACS_BASE}?get=NAME,B01003_001E,B19013_001E,B11001_001E,B01003_001E&for=tract:${tractNum}&in=state:${state}%20county:${county}`;
    const varsResp = await fetch(varsUrl);
    const varsData = await varsResp.json();
    
    if (varsData && varsData.length > 1) {
      return {
        population_1mi: parseInt(varsData[1][1]) || null,
        population_3mi: parseInt(varsData[1][1]) * 3 || null, // Approximation
        population_5mi: parseInt(varsData[1][1]) * 5 || null, // Approximation
        median_income: parseInt(varsData[1][2]) || null,
        households_5mi: parseInt(varsData[1][3]) * 5 || null, // Approximation
        growth_rate_5yr: null // Would need historical data
      };
    }
    return {};
  } catch (error) {
    console.error('Demographics fetch error:', error);
    return {};
  }
}

// Utility attribute picker to handle varying field names across services
function pickAttr(attrs: any, keys: string[]): any {
  for (const key of keys) {
    if (attrs[key] !== undefined && attrs[key] !== null) return attrs[key];
  }
  return null;
}

// Geo helpers
function toRad(d: number) { return (d * Math.PI) / 180; }
function haversineFt(lat1: number, lng1: number, lat2: number, lng2: number) {
  const Rm = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const meters = Rm * c;
  return meters * 3.28084; // feet
}
function bearingToCardinal(b: number) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  const idx = Math.round(((b % 360) / 45)) % 8;
  return dirs[idx];
}

// Helper to safely parse JSON and detect HTML error responses
async function safeJsonParse(response: Response, context: string): Promise<any> {
  const text = await response.text();
  
  if (!text || text.trim() === '') {
    console.log(`${context}: Empty response`);
    return null;
  }
  
  // Check if response is HTML (error page)
  if (text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('<html')) {
    console.log(`${context}: Received HTML error page instead of JSON`);
    return null;
  }
  
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error(`${context}: JSON parse error:`, error);
    return null;
  }
}

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
async function fallbackRoadFromOSM(lat: number, lng: number) {
  try {
    const query = `[
      out:json][timeout:25];
      way(around:2000, ${lat}, ${lng})[highway~"^(motorway|trunk|primary|secondary|tertiary)$"]; 
      out geom 1;`;
    const resp = await fetch(OVERPASS_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(query)}` });
    const data = await resp.json();
    if (data?.elements?.length) {
      const way = data.elements[0];
      const name = way.tags?.name || way.tags?.ref || 'Nearest road';
      // Use first geometry point to approx bearing
      const g0 = way.geometry?.[0];
      const g1 = way.geometry?.[1] || g0;
      const distFt = haversineFt(lat, lng, g0.lat, g0.lon);
      const bearing = Math.atan2(g1.lon - g0.lon, g1.lat - g0.lat) * 180 / Math.PI;
      return {
        traffic_road_name: name,
        traffic_distance_ft: distFt,
        traffic_direction: bearingToCardinal(bearing),
        traffic_map_url: `https://www.openstreetmap.org/way/${way.id}`
      };
    }
  } catch (e) {
    console.error('OSM fallback error:', e);
  }
  return {};
}

// Helper function to fetch utility infrastructure from city GIS
/**
 * For Houston utilities, route through proxy to bypass DNS block
 * cohgis.houstontx.gov is unreachable from Supabase edge runtime
 */
async function fetchUtilities(lat: number, lng: number, endpoints: any, useProxy: boolean = false): Promise<any> {
  const utilities: any = {
    water_lines: null,
    sewer_lines: null,
    storm_lines: null,
    water_capacity_mgd: null,
    sewer_capacity_mgd: null,
    power_kv_nearby: null
  };

  const searchRadius = 2000; // Increased to 2000 feet radius for better coverage
  
  // Get Supabase client for proxy calls
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Fetch water lines if endpoint exists
    if (endpoints.water_lines_url) {
      console.log('Fetching water lines from:', endpoints.water_lines_url);
      const waterParams = {
        geometry: `${lng},${lat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        distance: searchRadius.toString(),
        units: 'esriFeet',
        where: '1=1',
        outFields: '*',
        returnGeometry: 'false',
        f: 'json'
      };

      let waterData;
      
      if (useProxy) {
        // Route through utility-proxy edge function
        console.log('Using proxy for Houston utilities...');
        const { data, error } = await supabase.functions.invoke('utility-proxy', {
          body: {
            url: endpoints.water_lines_url,
            params: waterParams
          }
        });
        
        if (error) throw error;
        waterData = data;
      } else {
        // Direct call
        const waterParamsUrl = new URLSearchParams(waterParams as any);
        const waterResp = await fetch(`${endpoints.water_lines_url}?${waterParamsUrl}`);
        waterData = await safeJsonParse(waterResp, 'Water lines query');
      }
      
      console.log('Water lines API response:', {
        hasFeatures: !!waterData?.features,
        featureCount: waterData?.features?.length || 0,
        error: waterData?.error
      });
      
      if (waterData?.features && waterData.features.length > 0) {
        utilities.water_lines = waterData.features.map((f: any) => {
          const attrs = f.attributes || {};
          return {
            diameter: Number(pickAttr(attrs, ['DIAMETER','PIPE_SIZE','DIAMETER_IN','PIPE_DIAM','DIAM','DIAMTR','SIZE','DIAM_IN'])) || null,
            material: pickAttr(attrs, ['MATERIAL','MATL','PIPE_MATL','MAT_TYPE','MAT']) || null,
            install_date: pickAttr(attrs, ['INSTALL_DATE','INSTDTTM','INSTALLDTE','DATE_INST','INSTALL_YR','YEAR_BUILT']) || null,
            distance_ft: searchRadius
          };
        });
        const maxDiameter = Math.max(...waterData.features.map((f: any) => {
          const attrs = f.attributes || {};
          return Number(pickAttr(attrs, ['DIAMETER','PIPE_SIZE','DIAMETER_IN','PIPE_DIAM','DIAM','DIAMTR','SIZE','DIAM_IN'])) || 0;
        }));
        utilities.water_capacity_mgd = maxDiameter > 0 ? (maxDiameter / 12) * 0.5 : null;
        console.log('Water lines found:', utilities.water_lines.length, 'capacity:', utilities.water_capacity_mgd);
      } else {
        console.log('No water lines found in response');
      }
    } else {
      console.log('No water lines endpoint configured for this county');
    }

    // Fetch sewer lines if endpoint exists
    if (endpoints.sewer_lines_url) {
      console.log('Fetching sewer lines from:', endpoints.sewer_lines_url);
      const sewerParams = {
        geometry: `${lng},${lat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        distance: searchRadius.toString(),
        units: 'esriFeet',
        where: '1=1',
        outFields: '*',
        returnGeometry: 'false',
        f: 'json'
      };

      let sewerData;
      
      if (useProxy) {
        const { data, error } = await supabase.functions.invoke('utility-proxy', {
          body: {
            url: endpoints.sewer_lines_url,
            params: sewerParams
          }
        });
        
        if (error) throw error;
        sewerData = data;
      } else {
        const sewerParamsUrl = new URLSearchParams(sewerParams as any);
        const sewerResp = await fetch(`${endpoints.sewer_lines_url}?${sewerParamsUrl}`);
        sewerData = await safeJsonParse(sewerResp, 'Sewer lines query');
      }
      
      console.log('Sewer lines API response:', {
        hasFeatures: !!sewerData?.features,
        featureCount: sewerData?.features?.length || 0,
        error: sewerData?.error
      });
      
      if (sewerData?.features && sewerData.features.length > 0) {
        utilities.sewer_lines = sewerData.features.map((f: any) => {
          const attrs = f.attributes || {};
          return {
            diameter: Number(pickAttr(attrs, ['DIAMETER','PIPE_SIZE','DIAMETER_IN','PIPE_DIAM','DIAM','DIAMTR','SIZE','DIAM_IN'])) || null,
            material: pickAttr(attrs, ['MATERIAL','MATL','PIPE_MATL','MAT_TYPE','MAT']) || null,
            install_date: pickAttr(attrs, ['INSTALL_DATE','INSTDTTM','INSTALLDTE','DATE_INST','INSTALL_YR','YEAR_BUILT']) || null,
            distance_ft: searchRadius
          };
        });
        const maxDiameter = Math.max(...sewerData.features.map((f: any) => {
          const attrs = f.attributes || {};
          return Number(pickAttr(attrs, ['DIAMETER','PIPE_SIZE','DIAMETER_IN','PIPE_DIAM','DIAM','DIAMTR','SIZE','DIAM_IN'])) || 0;
        }));
        utilities.sewer_capacity_mgd = maxDiameter > 0 ? (maxDiameter / 12) * 0.5 : null;
        console.log('Sewer lines found:', utilities.sewer_lines.length, 'capacity:', utilities.sewer_capacity_mgd);
      } else {
        console.log('No sewer lines found in response');
      }
    } else {
      console.log('No sewer lines endpoint configured for this county');
    }

    // Fetch storm lines if endpoint exists
    if (endpoints.storm_lines_url) {
      console.log('Fetching storm lines from:', endpoints.storm_lines_url);
      const stormParams = {
        geometry: `${lng},${lat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        distance: searchRadius.toString(),
        units: 'esriFeet',
        where: '1=1',
        outFields: '*',
        returnGeometry: 'false',
        f: 'json'
      };

      let stormData;
      
      if (useProxy) {
        const { data, error } = await supabase.functions.invoke('utility-proxy', {
          body: {
            url: endpoints.storm_lines_url,
            params: stormParams
          }
        });
        
        if (error) throw error;
        stormData = data;
      } else {
        const stormParamsUrl = new URLSearchParams(stormParams as any);
        const stormResp = await fetch(`${endpoints.storm_lines_url}?${stormParamsUrl}`);
        stormData = await safeJsonParse(stormResp, 'Storm lines query');
      }
      
      console.log('Storm lines API response:', {
        hasFeatures: !!stormData?.features,
        featureCount: stormData?.features?.length || 0,
        error: stormData?.error
      });
      
      if (stormData?.features && stormData.features.length > 0) {
        utilities.storm_lines = stormData.features.map((f: any) => {
          const attrs = f.attributes || {};
          return {
            diameter: Number(pickAttr(attrs, ['DIAMETER','PIPE_SIZE','DIAMETER_IN','PIPE_DIAM','DIAM','DIAMTR','SIZE','DIAM_IN'])) || null,
            material: pickAttr(attrs, ['MATERIAL','MATL','PIPE_MATL','MAT_TYPE','MAT']) || null,
            install_date: pickAttr(attrs, ['INSTALL_DATE','INSTDTTM','INSTALLDTE','DATE_INST','INSTALL_YR','YEAR_BUILT']) || null,
            distance_ft: searchRadius
          };
        });
        console.log('Storm lines found:', utilities.storm_lines.length);
      } else {
        console.log('No storm lines found in response');
      }
    } else {
      console.log('No storm lines endpoint configured for this county');
    }

    // Power infrastructure typically requires manual lookup or private utility data
    // Placeholder for future integration with utility company APIs
    utilities.power_kv_nearby = null;

  } catch (error) {
    console.error('Utility infrastructure fetch error:', error);
  }

  return utilities;
}

// Helper function to fetch property tax data from CAD
async function fetchPropertyTax(lat: number, lng: number, county: string, endpoints: any): Promise<any> {
  try {
    // Query the parcel to get property ID for tax lookup
    const parcelParams = new URLSearchParams({
      geometry: `${lng},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'ACCOUNT,PARCEL_ID,TAX_RATE,TAXING_ENTITIES',
      returnGeometry: 'false',
      f: 'json'
    });

    const parcelResp = await fetch(`${endpoints.parcel_url}?${parcelParams}`);
    const parcelData = await safeJsonParse(parcelResp, 'Property tax parcel query');

    if (parcelData?.features?.[0]) {
      const attrs = parcelData.features[0].attributes;
      
      // Extract tax rate (typically in mills or percentage)
      const taxRate = attrs.TAX_RATE || attrs.TOTAL_TAX_RATE || null;
      
      // Extract taxing jurisdictions (varies by county)
      let jurisdictions = [];
      if (attrs.TAXING_ENTITIES) {
        jurisdictions = typeof attrs.TAXING_ENTITIES === 'string' 
          ? attrs.TAXING_ENTITIES.split(',').map((j: string) => j.trim())
          : [attrs.TAXING_ENTITIES];
      }
      
      // Default jurisdictions for Texas properties
      if (jurisdictions.length === 0) {
        jurisdictions = ['County', 'School District', 'City', 'MUD/Water District'];
      }

      return {
        tax_rate_total: taxRate,
        taxing_jurisdictions: jurisdictions
      };
    }

    // Fallback: typical Texas combined rate
    return {
      tax_rate_total: 2.5, // Average 2.5% combined rate in Texas
      taxing_jurisdictions: ['County', 'School District', 'City', 'Special Districts']
    };
  } catch (error) {
    console.error('Property tax fetch error:', error);
    return {
      tax_rate_total: null,
      taxing_jurisdictions: []
    };
  }
}

// Helper function to check all incentive zones
async function fetchIncentiveZones(lat: number, lng: number): Promise<any> {
  const incentives: any = {
    opportunity_zone: false,
    enterprise_zone: false,
    foreign_trade_zone: false
  };

  const params = new URLSearchParams({
    geometry: `${lng},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'false',
    f: 'json'
  });

  try {
    // Check Opportunity Zones
    const ozResp = await fetch(`${OPPORTUNITY_ZONES_URL}?${params}`);
    const ozData = await safeJsonParse(ozResp, 'Opportunity Zone query');
    incentives.opportunity_zone = ozData?.features && ozData.features.length > 0;
  } catch (error) {
    console.error('Opportunity Zone check error:', error);
  }

  try {
    // Check Texas Enterprise Zones
    const ezResp = await fetch(`${TEXAS_ENTERPRISE_ZONES_URL}?${params}`);
    const ezData = await safeJsonParse(ezResp, 'Enterprise Zone query');
    incentives.enterprise_zone = ezData?.features && ezData.features.length > 0;
  } catch (error) {
    console.error('Enterprise Zone check error:', error);
  }

  try {
    // Check Foreign Trade Zones
    const ftzResp = await fetch(`${US_FTZ_URL}?${params}`);
    const ftzData = await safeJsonParse(ftzResp, 'Foreign Trade Zone query');
    incentives.foreign_trade_zone = ftzData?.features && ftzData.features.length > 0;
  } catch (error) {
    console.error('Foreign Trade Zone check error:', error);
  }

  return incentives;
}

// Helper function to fetch city permitting data
async function fetchPermittingData(city: string, county: string): Promise<any> {
  try {
    // City-specific permitting timelines (requires manual data entry or APIs)
    const permitTimelines: Record<string, number> = {
      'Houston': 4.5,
      'Dallas': 5.0,
      'Austin': 6.0,
      'San Antonio': 4.0,
      'Fort Worth': 4.5,
      'League City': 3.5,
      'Sugar Land': 3.0,
      'Pearland': 3.5,
      'Katy': 3.0,
      'Plano': 4.5,
      'Frisco': 4.0,
      'McKinney': 4.0,
      'Round Rock': 3.5,
      'Cedar Park': 3.5,
      'Georgetown': 3.0
    };

    const avgTime = permitTimelines[city] || 5.0; // Default 5 months if city not found

    return {
      average_permit_time_months: avgTime
    };
  } catch (error) {
    console.error('Permitting data fetch error:', error);
    return {
      average_permit_time_months: null
    };
  }
}

/**
 * Fetch NFIP Multiple Loss Properties for investment risk analysis (BUY path)
 * OpenFEMA API: Properties with 2+ flood insurance claims
 */
async function fetchNFIPMultipleLossProperties(lat: number, lng: number): Promise<{
  total_events: number;
  flood_events: any[];
  nfip_multiple_loss: boolean;
  insurance_risk_level: 'high' | 'moderate' | 'low';
}> {
  try {
    // Search within 0.01 degree radius (~0.7 miles at 29°N latitude)
    const latMin = lat - 0.01;
    const latMax = lat + 0.01;
    const lngMin = lng - 0.01;
    const lngMax = lng + 0.01;
    
    const nfipUrl = `https://www.fema.gov/api/open/v2/FimaNfipMultipleLossProperties?$filter=latitude ge ${latMin} and latitude le ${latMax} and longitude ge ${lngMin} and longitude le ${lngMax}&$top=100`;
    
    console.log('[BUY PATH] Querying NFIP Multiple Loss Properties API...');
    const response = await fetch(nfipUrl, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`NFIP API returned ${response.status}`);
    }
    
    const data = await response.json();
    const properties = data.FimaNfipMultipleLossProperties || [];
    
    // Also fetch standard flood history
    const historicalEvents = await fetchHistoricalFloodEvents(lat, lng);
    
    // Determine insurance risk level
    let insuranceRiskLevel: 'high' | 'moderate' | 'low' = 'low';
    if (properties.length > 5) {
      insuranceRiskLevel = 'high';
    } else if (properties.length > 2) {
      insuranceRiskLevel = 'moderate';
    }
    
    console.log(`[BUY PATH] Found ${properties.length} NFIP multiple loss properties nearby`);
    console.log(`[BUY PATH] Insurance risk level: ${insuranceRiskLevel}`);
    
    return {
      total_events: historicalEvents.total_events,
      flood_events: [
        ...historicalEvents.flood_events,
        ...properties.map((p: any) => ({
          type: 'NFIP Multiple Loss Property',
          date: p.reportedDate || 'Unknown',
          claims_count: p.numberOfLosses || 0,
          total_payments: p.totalPaymentAmount || 0,
          latitude: p.latitude,
          longitude: p.longitude,
          occupancy_type: p.occupancyType,
          construction_type: p.constructionType
        }))
      ],
      nfip_multiple_loss: properties.length > 0,
      insurance_risk_level: insuranceRiskLevel
    };
  } catch (error) {
    console.error('[BUY PATH] NFIP Multiple Loss Properties API error:', error);
    // Fallback to standard flood history
    return await fetchHistoricalFloodEvents(lat, lng);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { application_id, address } = await req.json();

    console.log('Enriching application:', { application_id, address });

    // Fetch application record to check intent_type
    let intentType = 'build'; // Default to build
    if (application_id) {
      try {
        const { data: app, error: appError } = await supabase
          .from('applications')
          .select('intent_type')
          .eq('id', application_id)
          .single();
        
        if (!appError && app?.intent_type) {
          intentType = app.intent_type;
          console.log(`[enrich-feasibility] Intent type: ${intentType}`);
        }
      } catch (err) {
        console.log('[enrich-feasibility] Could not fetch intent_type, defaulting to build');
      }
    }

    // application_id is optional - if not provided, we'll just return the data without saving

    const dataFlags: string[] = [];
    const enrichedData: any = {};
    const apiMeta: any = {}; // Track API response metadata

    let geoLat: number | null = null;
    let geoLng: number | null = null;
    let countyName: string | null = null;

    // Step 1: Geocode the address
    try {
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleApiKey}`;
      const geoResp = await fetch(geoUrl);
      const geoData = await geoResp.json();

      if (geoData?.results?.[0]) {
        const result = geoData.results[0];
        geoLat = result.geometry.location.lat;
        geoLng = result.geometry.location.lng;
        enrichedData.geo_lat = geoLat;
        enrichedData.geo_lng = geoLng;
        enrichedData.situs_address = result.formatted_address;
        enrichedData.place_id = result.place_id;

        // Extract all address components
        const components = result.address_components || [];
        
        // Extract county (administrative_area_level_2)
        const countyComponent = components.find((c: any) =>
          c.types.includes('administrative_area_level_2')
        );
        if (countyComponent) {
          countyName = countyComponent.long_name;
          enrichedData.administrative_area_level_2 = countyName;
        }
        
        // Extract state (administrative_area_level_1)
        const stateComponent = components.find((c: any) =>
          c.types.includes('administrative_area_level_1')
        );
        if (stateComponent) {
          enrichedData.administrative_area_level_1 = stateComponent.short_name; // e.g., "TX"
        }
        
        // Extract postal code
        const postalComponent = components.find((c: any) =>
          c.types.includes('postal_code')
        );
        if (postalComponent) {
          enrichedData.postal_code = postalComponent.long_name;
        }
        
        // Extract neighborhood
        const neighborhoodComponent = components.find((c: any) =>
          c.types.includes('neighborhood')
        );
        if (neighborhoodComponent) {
          enrichedData.neighborhood = neighborhoodComponent.long_name;
        }
        
        // Extract sublocality
        const sublocalityComponent = components.find((c: any) =>
          c.types.includes('sublocality') || c.types.includes('sublocality_level_1')
        );
        if (sublocalityComponent) {
          enrichedData.sublocality = sublocalityComponent.long_name;
        }
        
        // Extract locality (city)
        const localityComponent = components.find((c: any) =>
          c.types.includes('locality')
        );
        if (localityComponent) {
          enrichedData.city = localityComponent.long_name;
        }
        
        // Submarket is typically city + neighborhood or sublocality
        // Fallback: use county if city is not available
        const submarketParts = [
          enrichedData.city,
          enrichedData.neighborhood || enrichedData.sublocality
        ].filter(Boolean);
        
        if (submarketParts.length === 0 && countyName) {
          // Fallback: use county name as submarket
          enrichedData.submarket_enriched = countyName;
        } else {
          enrichedData.submarket_enriched = submarketParts.join(' - ') || null;
        }
        
        console.log('Geocoding successful:', { 
          geoLat, 
          geoLng, 
          place_id: enrichedData.place_id,
          county: countyName,
          city: enrichedData.city,
          neighborhood: enrichedData.neighborhood,
          sublocality: enrichedData.sublocality,
          submarket: enrichedData.submarket_enriched
        });
      } else {
        console.log('No geocoding results found');
        dataFlags.push('geocoding_failed');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      dataFlags.push('geocoding_failed');
    }

    // If geocoding failed, return error
    if (!geoLat || !geoLng || !countyName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unable to geocode address'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Check if county has endpoints
    const endpoints = ENDPOINT_CATALOG[countyName];
    if (!endpoints) {
      console.log(`No endpoints configured for county: ${countyName}`);
      return new Response(JSON.stringify({
        success: false,
        error: `No endpoint configured for ${countyName}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Query parcel data (with Fort Bend fallback logic)
    try {
      // Build outFields based on county configuration
      // For Harris County, use composite fields
      let outFieldsList;
      if (countyName === 'Harris County') {
        // HCAD specific fields (address is split, legal is split)
        outFieldsList = [
          // Core Parcel Data
          'HCAD_NUM',
          'acct_num',
          'owner_name_1',
          'Acreage',
          'acreage_1',
          'land_sqft',
          
          // Address Components
          'site_str_num',
          'site_str_name',
          'site_str_sfx',
          'site_city',
          'site_zip',
          'site_county',
          
          // Legal Description
          'legal_dscr_1',
          'legal_dscr_2',
          'legal_dscr_3',
          'legal_dscr_4',
          
          // ⭐ NEW: Valuation Fields
          'total_appraised_val',  // ✅ Total appraised value (correct HCAD field)
          'total_market_val',     // ✅ Total market value (correct HCAD field)
          'land_value',           // ✅ Land value (correct HCAD field)
          'impr_value',           // ✅ Improvement value (correct HCAD field)
          'bld_value',            // ✅ Building value (correct HCAD field)
          'tax_value',            // ✅ Taxable value (correct HCAD field)
          
          // ⭐ NEW: Building Details
          'bldg_sqft',         // Building square footage
          'tot_living_area',   // Alternative building area field
          'year_built',        // Year built
          'effect_yr_blt',     // Effective year built
          'actual_year',       // Alternative year field
          'num_stories',       // Number of stories
          'bldg_style_cd',     // Building style code
          
          // ⭐ NEW: Classification
          'state_class',       // State classification code
          'state_cd',          // Alternative field
          'prop_type_cd',      // Property type code
          'land_use_cd',       // Land use code
          
          // ⭐ NEW: Tax Information
          'exemption_cd',      // Exemption codes
          'ag_use',            // Agricultural use flag
          'homestead',         // Homestead exemption flag
          
          // ⭐ NEW: Location Details
          'subdivision',       // Subdivision name
          'subdivsn',          // Alternative field
          'BLK_NUM',           // ✅ Block (correct HCAD field)
          'LOT_NUM'            // ✅ Lot (correct HCAD field)
        ].join(',');
      } else {
        // Other counties: use configured field names
        outFieldsList = [
          endpoints.parcel_id_field,
          endpoints.parcel_id_alt_field,
          endpoints.owner_field,
          endpoints.acreage_field,
          endpoints.address_field,
          endpoints.county_field,
          endpoints.legal_field
        ].filter(Boolean).join(',');
      }
      
      // For Harris County, use Locator_Parcels GeocodeServer for precise coordinates
      let geometryCoords = `${geoLng},${geoLat}`;
      let spatialReference = '4326';
      let outputFormat = 'json';
      let returnGeometry = 'false';
      let useEnvelope = false;
      let envelopeGeometry = '';
      
      // Harris County: Use envelope buffer with WGS84 (let service handle transformation)
      if (countyName === 'Harris County') {
        // Create a small envelope buffer around the point (roughly 50 feet in degrees)
        // At Houston's latitude (~29.7°), 1 degree lat ≈ 364,000 ft, 1 degree lng ≈ 315,000 ft
        // 50 feet ≈ 0.00015 degrees
        const bufferDegrees = 0.00015;
        const xmin = geoLng - bufferDegrees;
        const ymin = geoLat - bufferDegrees;
        const xmax = geoLng + bufferDegrees;
        const ymax = geoLat + bufferDegrees;
        
        useEnvelope = true;
        envelopeGeometry = `${xmin},${ymin},${xmax},${ymax}`;
        spatialReference = '4326'; // Use WGS84, let service transform to EPSG:2278
        outputFormat = 'json';
        returnGeometry = 'true';
        
        console.log(`Using HCAD envelope query with inSR=4326:`, {
          envelope: envelopeGeometry,
          center: { lat: geoLat, lng: geoLng },
          buffer_ft: 50
        });
      }
      
      // Build comprehensive outFields
      const comprehensiveOutFields = countyName === 'Harris County' ? '*' : (outFieldsList || '*');
      
      // Build parcel query params
      const parcelParams: Record<string, string> = {
        spatialRel: 'esriSpatialRelIntersects',
        outFields: comprehensiveOutFields,
        returnGeometry: returnGeometry,
        f: outputFormat
      };
      
      // Use envelope or point geometry
      if (useEnvelope && envelopeGeometry) {
        parcelParams.geometry = envelopeGeometry;
        parcelParams.geometryType = 'esriGeometryEnvelope';
        parcelParams.inSR = spatialReference; // Service will transform from WGS84 to EPSG:2278
        parcelParams.outSR = '4326';  // Return in WGS84 for consistency
        parcelParams.where = '1=1';  // Required by ArcGIS
      } else {
        parcelParams.geometry = geometryCoords;
        parcelParams.geometryType = 'esriGeometryPoint';
        parcelParams.inSR = spatialReference;
        parcelParams.outSR = '4326';
        parcelParams.where = '1=1';  // Required by ArcGIS
      }

      let parcelData = null;
      const parcelAttempts: any[] = [];
      
      // Query parcel data from primary endpoint with 3-tier fallback and retry logic
      if (endpoints.parcel_url) {
        console.log('Querying parcel data from:', endpoints.parcel_url);
        
        // 💾 Check cache first (30-day TTL)
        const parcelCacheKey = `parcel_${countyName}_${geoLat.toFixed(6)}_${geoLng.toFixed(6)}`;
        let cachedParcel = await getCachedData(supabase, parcelCacheKey, CACHE_TTL.PARCEL);
        
        if (cachedParcel) {
          console.log('✅ Using cached parcel data');
          parcelData = cachedParcel;
          apiMeta.parcel_cached = true;
        } else {
          console.log('Parcel query params:', new URLSearchParams(parcelParams).toString());
          
          // 🔄 Tier 1: Primary envelope/point query with retry logic
          try {
            parcelData = await retryWithBackoff(
            async () => {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
              
              try {
                const parcelResp = await fetch(
                  `${endpoints.parcel_url}?${new URLSearchParams(parcelParams)}`,
                  { signal: controller.signal }
                );
                clearTimeout(timeout);
                
                const data = await safeJsonParse(parcelResp, 'Parcel query');
                
                parcelAttempts.push({
                  tier: 1,
                  method: useEnvelope ? 'envelope' : 'point',
                  radius_ft: useEnvelope ? 50 : 0,
                  timestamp: new Date().toISOString(),
                  status: parcelResp.status,
                  feature_count: data?.features?.length || 0,
                  success: !!data?.features?.[0]
                });
                
                return data;
              } catch (err) {
                clearTimeout(timeout);
                throw err;
              }
            },
            3,
            [1000, 2000, 4000],
            'HCAD Tier 1 (Primary)'
          );
          
          console.log('Tier 1 parcel API response:', { 
            hasFeatures: !!parcelData?.features,
            featureCount: parcelData?.features?.length || 0,
            error: parcelData?.error
          });
        } catch (tier1Error) {
          console.error('Tier 1 parcel query failed after retries:', tier1Error);
          parcelAttempts.push({
            tier: 1,
            method: useEnvelope ? 'envelope' : 'point',
            error: tier1Error.message,
            timestamp: new Date().toISOString(),
            success: false
          });
        }
        
        // 🔄 Tier 1b: Houston-specific geocode with EPSG:2278 envelope (Harris County only)
        if (!parcelData?.features?.[0] && countyName === 'Harris County') {
          console.log('🔄 Tier 1b: Trying Houston-specific geocode with EPSG:2278 envelope...');
          
          try {
            const houstonGeocode = await geocodeHoustonParcel(address);
            
            if (houstonGeocode && houstonGeocode.xmin && houstonGeocode.xmax && houstonGeocode.ymin && houstonGeocode.ymax) {
              const envelopeGeometry2278 = `${houstonGeocode.xmin},${houstonGeocode.ymin},${houstonGeocode.xmax},${houstonGeocode.ymax}`;
              
              const tier1bData = await retryWithBackoff(
                async () => {
                  const tier1bParams: Record<string, string> = {
                    geometry: envelopeGeometry2278,
                    geometryType: 'esriGeometryEnvelope',
                    spatialRel: 'esriSpatialRelIntersects',
                    outFields: comprehensiveOutFields,
                    inSR: '2278',  // Texas South Central Feet
                    outSR: '4326', // Return in WGS84
                    returnGeometry: 'true',
                    f: 'json',
                    where: '1=1'
                  };
                  
                  const controller = new AbortController();
                  const timeout = setTimeout(() => controller.abort(), 10000);
                  
                  try {
                    const tier1bResp = await fetch(
                      `${endpoints.parcel_url}?${new URLSearchParams(tier1bParams)}`,
                      { signal: controller.signal }
                    );
                    clearTimeout(timeout);
                    
                    const data = await safeJsonParse(tier1bResp, 'Houston geocode envelope query');
                    
                    parcelAttempts.push({
                      tier: '1b',
                      method: 'envelope_2278',
                      geocode_score: houstonGeocode.score,
                      match_addr: houstonGeocode.match_addr,
                      timestamp: new Date().toISOString(),
                      status: tier1bResp.status,
                      feature_count: data?.features?.length || 0,
                      success: !!data?.features?.[0]
                    });
                    
                    return data;
                  } catch (err) {
                    clearTimeout(timeout);
                    throw err;
                  }
                },
                3,
                [1000, 2000, 4000],
                'HCAD Tier 1b (Houston geocode EPSG:2278)'
              );
              
              if (tier1bData?.features?.[0]) {
                console.log(`✅ Tier 1b found ${tier1bData.features.length} parcel(s) via Houston geocode`);
                parcelData = tier1bData;
              }
            } else {
              console.log('Houston geocode did not return valid extent');
              parcelAttempts.push({
                tier: '1b',
                method: 'envelope_2278',
                error: 'No valid geocode extent',
                timestamp: new Date().toISOString(),
                success: false
              });
            }
          } catch (tier1bError) {
            console.error('Tier 1b Houston geocode query failed:', tier1bError);
            parcelAttempts.push({
              tier: '1b',
              method: 'envelope_2278',
              error: tier1bError.message,
              timestamp: new Date().toISOString(),
              success: false
            });
          }
        }
        
        // 🔄 Tier 2: Buffered point query (500 feet) - only for Harris County when Tier 1 and 1b fail
        if (!parcelData?.features?.[0] && countyName === 'Harris County') {
          console.log('🔄 Tier 2: Trying 500-foot buffered point query...');
          
          try {
            const bufferedData = await retryWithBackoff(
              async () => {
                const bufferedParams: Record<string, string> = {
                  geometry: geometryCoords,
                  geometryType: 'esriGeometryPoint',
                  spatialRel: 'esriSpatialRelIntersects',
                  outFields: comprehensiveOutFields,
                  inSR: '4326',
                  outSR: '4326',
                  distance: '500',
                  units: 'esriSRUnit_Foot',
                  returnGeometry: 'true',
                  f: 'json',
                  where: '1=1'
                };
                
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000);
                
                try {
                  const bufferedResp = await fetch(
                    `${endpoints.parcel_url}?${new URLSearchParams(bufferedParams)}`,
                    { signal: controller.signal }
                  );
                  clearTimeout(timeout);
                  
                  const data = await safeJsonParse(bufferedResp, 'Buffered parcel query');
                  
                  parcelAttempts.push({
                    tier: 2,
                    method: 'buffered_point',
                    radius_ft: 500,
                    timestamp: new Date().toISOString(),
                    status: bufferedResp.status,
                    feature_count: data?.features?.length || 0,
                    success: !!data?.features?.[0]
                  });
                  
                  return data;
                } catch (err) {
                  clearTimeout(timeout);
                  throw err;
                }
              },
              3,
              [1000, 2000, 4000],
              'HCAD Tier 2 (500ft buffer)'
            );
            
            if (bufferedData?.features?.[0]) {
              console.log(`✅ Tier 2 found ${bufferedData.features.length} parcel(s)`);
              parcelData = bufferedData;
            }
          } catch (tier2Error) {
            console.error('Tier 2 buffered query failed after retries:', tier2Error);
            parcelAttempts.push({
              tier: 2,
              method: 'buffered_point',
              radius_ft: 500,
              error: tier2Error.message,
              timestamp: new Date().toISOString(),
              success: false
            });
          }
        }
        
        // 🔄 Tier 3: Extended buffered query (1000 feet) - last resort for Harris County
        if (!parcelData?.features?.[0] && countyName === 'Harris County') {
          console.log('🔄 Tier 3: Trying 1000-foot extended buffered query (last resort)...');
          
          try {
            const extendedData = await retryWithBackoff(
              async () => {
                const extendedParams: Record<string, string> = {
                  geometry: geometryCoords,
                  geometryType: 'esriGeometryPoint',
                  spatialRel: 'esriSpatialRelIntersects',
                  outFields: comprehensiveOutFields,
                  inSR: '4326',
                  outSR: '4326',
                  distance: '1000',
                  units: 'esriSRUnit_Foot',
                  returnGeometry: 'true',
                  f: 'json',
                  where: '1=1'
                };
                
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000);
                
                try {
                  const extendedResp = await fetch(
                    `${endpoints.parcel_url}?${new URLSearchParams(extendedParams)}`,
                    { signal: controller.signal }
                  );
                  clearTimeout(timeout);
                  
                  const data = await safeJsonParse(extendedResp, 'Extended buffered parcel query');
                  
                  parcelAttempts.push({
                    tier: 3,
                    method: 'buffered_point',
                    radius_ft: 1000,
                    timestamp: new Date().toISOString(),
                    status: extendedResp.status,
                    feature_count: data?.features?.length || 0,
                    success: !!data?.features?.[0]
                  });
                  
                  return data;
                } catch (err) {
                  clearTimeout(timeout);
                  throw err;
                }
              },
              3,
              [1000, 2000, 4000],
              'HCAD Tier 3 (1000ft buffer)'
            );
            
            if (extendedData?.features?.[0]) {
              console.log(`✅ Tier 3 found ${extendedData.features.length} parcel(s) - using nearest match`);
              parcelData = extendedData;
            }
          } catch (tier3Error) {
            console.error('Tier 3 extended query failed after retries:', tier3Error);
            parcelAttempts.push({
              tier: 3,
              method: 'buffered_point',
              radius_ft: 1000,
              error: tier3Error.message,
              timestamp: new Date().toISOString(),
              success: false
            });
          }
        }
        
        // Final status log
        if (parcelData?.features?.[0]) {
          const successfulTier = parcelAttempts.find(a => a.success);
          console.log(`✅ Parcel data found via Tier ${successfulTier?.tier || 1} (${successfulTier?.method || 'unknown'})`);
          
          // 💾 Cache successful parcel data (only if not from cache)
          if (!cachedParcel && !apiMeta.parcel_cached) {
            await setCacheData(supabase, parcelCacheKey, parcelData, CACHE_TTL.PARCEL, application_id);
          }
        } else {
          console.error('❌ All parcel query tiers failed:', {
            totalAttempts: parcelAttempts.length,
            attempts: parcelAttempts
          });
        }
        }
      }

      if (parcelData?.features?.[0]) {
        let selectedFeature = parcelData.features[0];
        let selectionMetadata: any = { method: 'single_result' };
        
        // For Harris County with multiple parcels, use smart selection
        if (countyName === 'Harris County' && parcelData.features.length > 1) {
          console.log(`🎯 HCAD returned ${parcelData.features.length} parcels, selecting best match...`);
          
          // Extract house number from user's input address
          const inputAddr = (address || enrichedData.situs_address || '').toString();
          const userHouseNumber = inputAddr.match(/^\d+/)?.[0] || '';
          console.log('User address house number:', userHouseNumber);
          
          // Score and rank parcels
          const scoredParcels = parcelData.features.map((feature: any) => {
            const attrs = feature.properties || feature.attributes;
            let score = 0;
            const reasons: string[] = [];
            
            // Calculate parcel centroid from geometry
            let centroidLat = geoLat;
            let centroidLng = geoLng;
            
            // Handle GeoJSON format (coordinates array)
            if (feature.geometry?.coordinates?.[0]?.[0]) {
              const coords = feature.geometry.coordinates[0];
              const sumLat = coords.reduce((sum: number, c: number[]) => sum + c[1], 0);
              const sumLng = coords.reduce((sum: number, c: number[]) => sum + c[0], 0);
              centroidLat = sumLat / coords.length;
              centroidLng = sumLng / coords.length;
            }
            // Handle ESRI JSON format (rings array)
            else if (feature.geometry?.rings?.[0]) {
              const ring = feature.geometry.rings[0];
              const sumLng = ring.reduce((sum: number[], pt: number[]) => sum + pt[0], 0);
              const sumLat = ring.reduce((sum: number[], pt: number[]) => sum + pt[1], 0);
              centroidLng = sumLng / ring.length;
              centroidLat = sumLat / ring.length;
            }
            
            const distanceFt = haversineFt(geoLat, geoLng, centroidLat, centroidLng);
            
            // Parse acreage for scoring
            let acreage = 0;
            const acreageRaw = attrs.Acreage || attrs.acreage_1;
            if (acreageRaw) {
              const match = String(acreageRaw).match(/[\d.]+/);
              acreage = match ? parseFloat(match[0]) : 0;
            }
            if (acreage === 0 && attrs.land_sqft) {
              acreage = Number(attrs.land_sqft) / 43560;
            }
            
            // Scoring criteria:
            // 1. Exact house number match: +1000 points
            const siteStrNum = attrs.site_str_num ? String(attrs.site_str_num).trim() : '';
            if (userHouseNumber && siteStrNum === userHouseNumber) {
              score += 1000;
              reasons.push('exact_house_match');
            }
            
            // 2. Distance from query point: closer is better (max 500 points at 0ft, 0 points at 250ft)
            const distanceScore = Math.max(0, 500 - (distanceFt / 250) * 500);
            score += distanceScore;
            reasons.push(`distance_${Math.round(distanceFt)}ft`);
            
            // 3. Smaller parcels preferred: up to 200 points for parcels < 5 acres
            if (acreage > 0 && acreage < 5) {
              const sizeScore = 200 * (1 - acreage / 5);
              score += sizeScore;
              reasons.push(`size_${acreage.toFixed(2)}ac`);
            }
            
            return {
              feature,
              score,
              reasons,
              metadata: {
                hcad_num: attrs.HCAD_NUM,
                acct_num: attrs.acct_num,
                site_str_num: siteStrNum,
                acreage: acreage.toFixed(4),
                land_sqft: attrs.land_sqft,
                distance_ft: Math.round(distanceFt),
                owner: attrs.owner_name_1
              }
            };
          });
          
          // Sort by score descending
          scoredParcels.sort((a, b) => b.score - a.score);
          
          selectedFeature = scoredParcels[0].feature;
          selectionMetadata = {
            method: 'scored_selection',
            total_candidates: parcelData.features.length,
            winner_score: Math.round(scoredParcels[0].score),
            winner_reasons: scoredParcels[0].reasons,
            winner_metadata: scoredParcels[0].metadata,
            all_candidates: scoredParcels.map(p => ({
              score: Math.round(p.score),
              metadata: p.metadata
            }))
          };
          
          console.log('🏆 Selected parcel:', selectionMetadata.winner_metadata);
          console.log('📊 All candidates:', selectionMetadata.all_candidates);
        }
        
        // Extract attributes from selected feature
        const attrs = selectedFeature.properties || selectedFeature.attributes;
        
        // Map fields with robust fallbacks for HCAD and other counties
        const resolvedParcelId = [
          attrs.HCAD_NUM,
          attrs.acct_num,
          attrs.ACCOUNT,
          attrs.ACCOUNT_NUM,
          attrs.ACCOUNTNO,
          attrs.PARCEL,
          attrs.PARCEL_ID,
          attrs[endpoints.parcel_id_field]
        ].find((v) => v != null && String(v).trim() !== '');
        enrichedData.parcel_id = resolvedParcelId ? String(resolvedParcelId) : null;

        const resolvedOwner = [
          attrs.owner_name_1,
          attrs.OWNER,
          attrs.OWNER_NAME,
          attrs.OWNER_NM,
          attrs[endpoints.owner_field]
        ].find((v) => v != null && String(v).trim() !== '');
        enrichedData.parcel_owner = resolvedOwner ? String(resolvedOwner) : null;
        
        // Parse acreage - support string (e.g., "1.4624 AC") and numeric fields with fallbacks
        let parsedAcreage: number | null = null;
        const acreageRaw = (attrs[endpoints.acreage_field] ?? attrs.Acreage ?? attrs.ACRES);
        if (acreageRaw != null) {
          const match = String(acreageRaw).match(/[\d.]+/);
          parsedAcreage = match ? parseFloat(match[0]) : null;
        }
        if (parsedAcreage == null && attrs.acreage_1 != null) {
          const a1 = Number(attrs.acreage_1);
          parsedAcreage = Number.isFinite(a1) ? a1 : null;
        }
        if (parsedAcreage == null && attrs.land_sqft != null) {
          const sqft = Number(attrs.land_sqft);
          parsedAcreage = Number.isFinite(sqft) ? +(sqft / 43560).toFixed(4) : null;
        }
        enrichedData.acreage_cad = parsedAcreage;
        enrichedData.lot_size_value = parsedAcreage;
        enrichedData.lot_size_unit = 'acres';
        
        console.log('Acreage resolution:', { 
          raw: acreageRaw, 
          acreage_1: attrs.acreage_1, 
          land_sqft: attrs.land_sqft, 
          resolved: parsedAcreage 
        });
        
        // For Harris County, concatenate address components
        if (countyName === 'Harris County') {
          const addressParts = [
            attrs.site_str_num,
            attrs.site_str_name,
            attrs.site_str_sfx,
            attrs.site_city,
            'TX',
            attrs.site_zip
          ].filter(Boolean);
          enrichedData.situs_address = addressParts.length > 0 ? addressParts.join(' ') : null;
          
          // Concatenate legal description
          const legalParts = [
            attrs.legal_dscr_1,
            attrs.legal_dscr_2,
            attrs.legal_dscr_3,
            attrs.legal_dscr_4
          ].filter(Boolean);
          enrichedData.legal_description = legalParts.length > 0 ? legalParts.join(' ') : null;
          
          // ⭐ NEW: Extract valuation data
          const pickAttr = (attrs: any, fields: string[]) => {
            for (const field of fields) {
              if (attrs[field] !== undefined && attrs[field] !== null) return attrs[field];
            }
            return null;
          };
          
          enrichedData.tot_appr_val = parseFloat(pickAttr(attrs, ['total_appraised_val', 'tot_appr_val'])) || null;
          enrichedData.tot_market_val = parseFloat(pickAttr(attrs, ['total_market_val', 'tot_market_val'])) || null;
          enrichedData.land_val = parseFloat(pickAttr(attrs, ['land_value', 'land_val'])) || null;
          enrichedData.imprv_val = parseFloat(pickAttr(attrs, ['impr_value', 'bld_value', 'imprv_val', 'improvement_value'])) || null;
          enrichedData.taxable_value = parseFloat(pickAttr(attrs, ['tax_value', 'taxable_value', 'tot_assessed_val'])) || null;
          
          // ⭐ NEW: Extract building details
          enrichedData.bldg_sqft = parseFloat(pickAttr(attrs, ['bldg_sqft', 'tot_living_area', 'building_sqft'])) || null;
          enrichedData.year_built = parseInt(pickAttr(attrs, ['year_built', 'actual_year', 'yr_built'])) || null;
          enrichedData.effective_yr = parseInt(pickAttr(attrs, ['effect_yr_blt', 'effective_year'])) || null;
          enrichedData.num_stories = parseInt(pickAttr(attrs, ['num_stories', 'stories'])) || null;
          
          // ⭐ NEW: Extract classification
          enrichedData.state_class = pickAttr(attrs, ['state_class', 'state_cd']) || null;
          enrichedData.prop_type = pickAttr(attrs, ['prop_type_cd', 'property_type']) || null;
          enrichedData.land_use_code = pickAttr(attrs, ['land_use_cd', 'land_use']) || null;
          
          // ⭐ NEW: Extract tax information
          enrichedData.exemption_code = pickAttr(attrs, ['exemption_cd', 'exempt_code']) || null;
          enrichedData.ag_use = (pickAttr(attrs, ['ag_use']) === 'Y' || pickAttr(attrs, ['ag_use']) === true || pickAttr(attrs, ['ag_use']) === '1');
          enrichedData.homestead = (pickAttr(attrs, ['homestead']) === 'Y' || pickAttr(attrs, ['homestead']) === true || pickAttr(attrs, ['homestead']) === '1');
          enrichedData.acct_num = pickAttr(attrs, ['acct_num']) || null;
          enrichedData.legal_dscr_1 = pickAttr(attrs, ['legal_dscr_1']) || null;
          enrichedData.legal_dscr_2 = pickAttr(attrs, ['legal_dscr_2']) || null;
          enrichedData.legal_dscr_3 = pickAttr(attrs, ['legal_dscr_3']) || null;
          enrichedData.legal_dscr_4 = pickAttr(attrs, ['legal_dscr_4']) || null;
          enrichedData.bldg_style_cd = pickAttr(attrs, ['bldg_style_cd']) || null;
          
          // ⭐ NEW: Extract location details
          enrichedData.subdivision = pickAttr(attrs, ['subdivision', 'subdivsn']) || null;
          enrichedData.block = pickAttr(attrs, ['BLK_NUM', 'block']) || null;
          enrichedData.lot = pickAttr(attrs, ['LOT_NUM', 'lot']) || null;
          
          // ⭐ PHASE 3D: Decode Texas Property Classification Codes
          console.log('🔍 Phase 3D: Decoding property classification from state_class and land_use_code...');
          
          if (enrichedData.state_class) {
            enrichedData.property_category = getPropertyCategory(enrichedData.state_class);
            enrichedData.land_use_description = getLandUseDescription(enrichedData.state_class, enrichedData.land_use_code);
            
            // Autofill prop_type if not already set
            if (!enrichedData.prop_type) {
              enrichedData.prop_type = getPropType(enrichedData.state_class, enrichedData.land_use_code);
            }
            
            // Autofill exemption_code if applicable
            if (!enrichedData.exemption_code) {
              enrichedData.exemption_code = getExemptionCode(enrichedData.state_class);
            }
            
            console.log('✅ Phase 3D classification decoded:', {
              state_class: enrichedData.state_class,
              land_use_code: enrichedData.land_use_code,
              property_category: enrichedData.property_category,
              land_use_description: enrichedData.land_use_description,
              prop_type: enrichedData.prop_type,
              exemption_code: enrichedData.exemption_code
            });
          } else {
            console.log('⚠️ Phase 3D: No state_class available for classification decoding');
          }
          
          console.log('⭐ HCAD valuation data extracted:', {
            tot_appr_val: enrichedData.tot_appr_val,
            tot_market_val: enrichedData.tot_market_val,
            land_val: enrichedData.land_val,
            imprv_val: enrichedData.imprv_val,
            taxable_value: enrichedData.taxable_value,
            bldg_sqft: enrichedData.bldg_sqft,
            year_built: enrichedData.year_built,
            state_class: enrichedData.state_class,
            subdivision: enrichedData.subdivision,
            block: enrichedData.block,
            lot: enrichedData.lot
          });
          
          console.log('✅ Field Name Mapping Fix Applied - Raw HCAD fields available:', 
            Object.keys(attrs).filter(k => 
              k.toLowerCase().includes('val') || 
              k.toLowerCase().includes('blk') || 
              k.toLowerCase().includes('lot') ||
              k.toLowerCase().includes('appr') ||
              k.toLowerCase().includes('tax')
            )
          );
          
          // Store HCAD selection metadata
          apiMeta.hcad_parcel = {
            queried_at: new Date().toISOString(),
            query_url: `${endpoints.parcel_url}?${new URLSearchParams(parcelParams)}`,
            attempts: parcelAttempts,
            selection: selectionMetadata,
            attributes_sample: Object.keys(attrs || {}).slice(0, 20),
            parcel_data: {
              hcad_num: attrs.HCAD_NUM,
              acct_num: attrs.acct_num,
              land_sqft: attrs.land_sqft,
              acreage_string: acreageRaw,
              site_address: enrichedData.situs_address
            }
          };
        } else {
          enrichedData.situs_address = attrs[endpoints.address_field] || null;
          enrichedData.legal_description = attrs[endpoints.legal_field] || null;
        }
        
        enrichedData.administrative_area_level_2 = attrs[endpoints.county_field] || null;
        
        // Store geometry if available (GeoJSON polygon)
        if (selectedFeature.geometry) {
          enrichedData.geom = selectedFeature.geometry;
        }
        
        console.log('Parcel data mapped:', {
          parcel_id: enrichedData.parcel_id,
          parcel_owner: enrichedData.parcel_owner,
          acreage_cad: enrichedData.acreage_cad,
          lot_size_value: enrichedData.lot_size_value,
          lot_size_unit: enrichedData.lot_size_unit,
          situs_address: enrichedData.situs_address,
          legal_description: enrichedData.legal_description,
          county: enrichedData.administrative_area_level_2,
          has_geometry: !!selectedFeature.geometry,
          source_fields: {
            parcel_id_field: endpoints.parcel_id_field,
            owner_field: endpoints.owner_field,
            acreage_field: endpoints.acreage_field,
            address_field: endpoints.address_field,
            county_field: endpoints.county_field
          }
        });
        
        // Flag if owner data is missing (some counties don't expose it publicly due to privacy)
        if (!enrichedData.parcel_owner) {
          dataFlags.push('parcel_owner_missing');
          console.log('⚠️ Parcel owner data not available (county privacy policy or field not exposed)');
        }
      } else {
        dataFlags.push('parcel_not_found');
        console.log('❌ No parcel data found at this location');
      }
    } catch (error) {
      console.error('Parcel query error:', error);
      dataFlags.push('parcel_query_failed');
    }

    // Step 4: Query zoning data
    console.log('Fetching zoning data...');
    
    /**
     * HOUSTON ZONING BYPASS
     * =====================
     * Houston is unique among major US cities - it has NO formal zoning ordinances.
     * Instead, land use is regulated through:
     * - Deed restrictions (private covenants between property owners)
     * - Building codes and setback requirements
     * - Parking ordinances
     * - Use-based regulations (e.g., incompatible use restrictions)
     * 
     * For Houston properties, we return descriptive text rather than a zoning code.
     * Other Texas cities use traditional Euclidean zoning (residential, commercial, industrial).
     */
    if (enrichedData.city?.toLowerCase().includes('houston')) {
      // Houston has no zoning - provide context instead
      enrichedData.zoning_code = 'No formal zoning (Houston)';
      enrichedData.overlay_district = 'Deed-restricted area - check HOA/deed covenants';
      console.log('Houston detected: Applying zoning bypass (no formal zoning ordinances)');
      } else if (endpoints.zoning_url) {
      try {
        const zoningParams = new URLSearchParams({
          geometry: `${geoLng},${geoLat}`,
          geometryType: 'esriGeometryPoint',
          inSR: '4326',
          spatialRel: 'esriSpatialRelIntersects',
          outFields: '*',
          returnGeometry: 'false',
          f: 'json'
        });

        const zoningResp = await fetch(`${endpoints.zoning_url}?${zoningParams}`);
        const zoningData = await safeJsonParse(zoningResp, 'Zoning query');

        if (zoningData?.features?.[0]) {
          const attrs = zoningData.features[0].attributes;
          
          // For Austin/Travis County, extract ZONING_BASE and ZONING_ZTYPE (ArcGIS MapServer format)
          if (countyName === 'Travis County' && attrs.ZONING_BASE) {
            enrichedData.zoning_code = attrs.ZONING_BASE;
            // Extract overlay from ZONING_ZTYPE (e.g., "SF-3-CO" -> overlay = "CO")
            const zoningFull = attrs.ZONING_ZTYPE || '';
            const overlayMatch = zoningFull.includes('-') ? zoningFull.split('-').slice(2).join('-') : null;
            enrichedData.overlay_district = overlayMatch || null;
          } else {
            // Other counties: use generic field mapping
            enrichedData.zoning_code = attrs[endpoints.zoning_field] || attrs.ZONE_CODE || attrs.ZONING || attrs.ZONECODE || attrs.ZONE;
            enrichedData.overlay_district = attrs[endpoints.overlay_field] || attrs.OVERLAY_DISTRICT || attrs.OVERLAY || attrs.OVERLAY_CODE;
          }
          
          console.log('Zoning data found:', { 
            zoning_code: enrichedData.zoning_code, 
            overlay_district: enrichedData.overlay_district, 
            endpoint: endpoints.zoning_url,
            available_fields: Object.keys(attrs)
          });
        } else {
          dataFlags.push('zoning_not_found');
          console.log('No zoning data found for endpoint:', endpoints.zoning_url);
        }
      } catch (error) {
        console.error('Zoning query error:', error);
        dataFlags.push('zoning_query_failed');
      }
    } else {
      console.log(`Zoning not available for ${countyName} - skipping zoning query`);
      dataFlags.push('zoning_not_available');
    }

    // Step 4a: Fetch elevation data first (needed for BFE estimation)
    console.log('Fetching elevation data...');
    try {
      const elevation = await fetchElevation(geoLat, geoLng);
      if (elevation !== null) {
        enrichedData.elevation = elevation;
        console.log('✅ Elevation data fetched successfully:', elevation);
      } else {
        console.log('⚠️ Elevation API returned null');
        dataFlags.push('elevation_missing');
      }
    } catch (elevError) {
      console.error('Elevation fetch failed:', elevError);
      dataFlags.push('elevation_missing');
    }

    // Step 4b: Query FEMA flood data (now that we have elevation for BFE estimation)
    console.log('Fetching FEMA flood zone data...');
    
    try {
      // Use retry logic for FEMA API (known to be flaky with 404s and timeouts)
      await retryWithBackoff(async () => {
        // Query FEMA NFHL Layer 0 (official flood zones layer per research document)
        const femaCacheKey = `fema_${geoLat}_${geoLng}`;
        let femaData = await getCachedData(supabase, femaCacheKey, CACHE_TTL.FEMA);
        
        if (!femaData) {
          // Cache miss - fetch from FEMA API
          const femaParams = new URLSearchParams({
            f: 'json',
            geometry: `${geoLng},${geoLat}`,
            geometryType: 'esriGeometryPoint',
            inSR: '4326',
            spatialRel: 'esriSpatialRelIntersects',
            outFields: 'FLD_ZONE,ZONE_SUBTY,STATIC_BFE,DFIRM_ID,V_DATUM',
            returnGeometry: 'false'
          });

          const femaResp = await fetch(`${FEMA_NFHL_ZONES_URL}?${femaParams}`, {
            headers: { 'Accept': 'application/json' }
          });
          
          apiMeta.fema_nfhl = { status: femaResp.status, layer: 0, coords: `${geoLng},${geoLat}`, cached: false }; // Track response
        
          if (!femaResp.ok) {
            const errorText = await femaResp.text();
            console.error(`FEMA API error ${femaResp.status}:`, errorText.substring(0, 200));
            throw new Error(`FEMA API returned ${femaResp.status}`);
          }
          
          femaData = await safeJsonParse(femaResp, 'FEMA flood zones query');
          
          // Store in cache
          if (femaData) {
            await setCacheData(supabase, femaCacheKey, femaData, CACHE_TTL.FEMA, appId);
          }
        } else {
          apiMeta.fema_nfhl = { status: 200, layer: 0, coords: `${geoLng},${geoLat}`, cached: true };
        }

        if (femaData?.features && femaData.features.length > 0) {
          apiMeta.fema_nfhl.record_count = femaData.features.length;
          const attrs = femaData.features[0].attributes;
          
          enrichedData.floodplain_zone = attrs.FLD_ZONE || null;
          enrichedData.base_flood_elevation = attrs.BFE || attrs.STATIC_BFE || null;
          enrichedData.fema_panel_id = attrs.FIRM_PAN || attrs.PANEL || null;
          
          // Track BFE source
          if (enrichedData.base_flood_elevation) {
            enrichedData.base_flood_elevation_source = 'FEMA NFHL';
          }
          
          // Add flag if zone exists but BFE is not available (common in Zone X)
      if (enrichedData.floodplain_zone && !enrichedData.base_flood_elevation) {
            dataFlags.push('bfe_not_available');
            console.log(`FEMA zone ${enrichedData.floodplain_zone} found but no BFE published`);
          }
          
          console.log('FEMA flood data found:', {
            floodplain_zone: enrichedData.floodplain_zone,
            base_flood_elevation: enrichedData.base_flood_elevation,
            fema_panel_id: enrichedData.fema_panel_id
          });
        } else {
          apiMeta.fema_nfhl.record_count = 0;
          console.log('Property not located in FEMA Special Flood Hazard Area (SFHA)');
          
          // Set explicit "Not in SFHA" indicators instead of null
          enrichedData.floodplain_zone = 'Zone X or Unzoned';
          enrichedData.base_flood_elevation = null; // Intentionally null - not applicable
          enrichedData.base_flood_elevation_source = 'FEMA NFHL - Not in SFHA';
          
          // ⭐ PHASE 2: Estimate conservative BFE for planning purposes
          if (enrichedData.elevation && typeof enrichedData.elevation === 'number') {
            const estimatedBFE = enrichedData.elevation + 2; // Conservative 2-foot freeboard
            enrichedData.base_flood_elevation = estimatedBFE;
            enrichedData.base_flood_elevation_source = `Estimated (Ground Elevation + 2 ft freeboard) - Not in FEMA SFHA`;
            console.log(`✅ Estimated BFE for non-SFHA property: ${estimatedBFE.toFixed(2)} ft (${enrichedData.elevation.toFixed(2)} + 2 ft)`);
          } else {
            console.log('⚠️ Cannot estimate BFE - ground elevation not yet available');
          }
          
          // Use more informative flag
          dataFlags.push('fema_unmapped_zone'); // Changed from 'floodplain_missing'
        }
      }, 3, [500, 1000, 2000], 'FEMA NFHL query');
      
    } catch (error) {
      console.error('FEMA query failed after retries:', error);
      dataFlags.push('fema_nfhl_unavailable');
      apiMeta.fema_nfhl = { error: error.message };
    }
    
    // Fetch historical flood events from OpenFEMA
    try {
      console.log('Fetching historical flood events from OpenFEMA...');
      const startTime = Date.now();
      
      // 🚀 INTENT-SPECIFIC: Buy path includes NFIP multiple loss properties
      let floodHistory;
      if (intentType === 'buy') {
        console.log('[BUY PATH] Fetching NFIP multiple loss properties for investment risk analysis...');
        floodHistory = await fetchNFIPMultipleLossProperties(geoLat, geoLng);
      } else {
        floodHistory = await fetchHistoricalFloodEvents(geoLat, geoLng);
      }
      
      apiMeta.openfema_disasters = { 
        latency_ms: Date.now() - startTime,
        total_events: floodHistory.total_events,
        flood_events_count: Array.isArray(floodHistory.flood_events) 
          ? floodHistory.flood_events.length 
          : 0
      };
      
      // Now storing array instead of count
      enrichedData.historical_flood_events = floodHistory.flood_events;
      console.log(`Found ${Array.isArray(floodHistory.flood_events) ? floodHistory.flood_events.length : 0} historical flood events`);
    } catch (error) {
      console.error('OpenFEMA query failed:', error);
      dataFlags.push(ERROR_FLAGS.FLOOD_HISTORY_ERROR);
      apiMeta.openfema_disasters = { error: error.message };
      enrichedData.historical_flood_events = [];
    }

    // Generate map URLs for topography and aerial imagery
    try {
      enrichedData.topography_map_url = `https://apps.nationalmap.gov/viewer/?bbox=${geoLng - 0.01},${geoLat - 0.01},${geoLng + 0.01},${geoLat + 0.01}`;
      enrichedData.aerial_imagery_url = `https://www.google.com/maps/@${geoLat},${geoLng},18z/data=!5m1!1e4`;
      console.log('Generated map URLs:', {
        topography: enrichedData.topography_map_url,
        aerial: enrichedData.aerial_imagery_url,
        elevation: enrichedData.elevation
      });
    } catch (urlError) {
      console.error('Failed to generate map URLs:', urlError);
    }

    // Step 5: Environmental Constraints
    // ⭐ PRIORITY: Wetlands check (HIGH REGULATORY IMPACT - Section 404 permits)
    console.log('⚠️ PRIORITY CHECK: Fetching wetlands data (regulatory compliance)...');
    try {
      const wetlands = await fetchWetlands(geoLat, geoLng);
      if (wetlands) {
        enrichedData.wetlands_type = wetlands.type;
        apiMeta.usfws_wetlands = wetlands.raw;
        
        // Flag high-impact wetlands for immediate attention
        if (wetlands.permit_required) {
          dataFlags.push('wetlands_permit_required');
          console.log('🚨 REGULATORY ALERT: Wetlands permit required - Section 404 CWA');
        }
        
        if (wetlands.regulatory_impact === 'high') {
          dataFlags.push('wetlands_high_impact');
          console.log('🚨 HIGH IMPACT WETLAND: Significant permitting delays expected');
        }
      } else {
        enrichedData.wetlands_type = 'None detected';
        dataFlags.push(ERROR_FLAGS.WETLANDS_API_ERROR);
        console.error('⚠️ Wetlands API failed - manual verification required');
      }
    } catch (wetlandsError) {
      console.error('❌ CRITICAL: Wetlands API error:', wetlandsError);
      dataFlags.push(ERROR_FLAGS.WETLANDS_API_ERROR);
      enrichedData.wetlands_type = 'API Error - Manual Verification Required';
      // Don't fail entire enrichment due to wetlands error, but flag it prominently
    }

    console.log('Fetching soil data...');
    try {
      const soilData = await fetchSoilData(geoLat, geoLng);
      if (soilData.soil_series || soilData.soil_drainage_class || soilData.soil_slope_percent) {
        Object.assign(enrichedData, soilData);
        
        // ⭐ NEW: Infer drainage class if missing from API
        if (enrichedData.soil_series && !enrichedData.soil_drainage_class) {
          const inferredDrainage = inferDrainageFromSoilSeries(enrichedData.soil_series);
          if (inferredDrainage) {
            enrichedData.soil_drainage_class = inferredDrainage;
            console.log('✅ Inferred soil drainage class:', inferredDrainage);
          } else {
            console.log('⚠️ Could not infer drainage class from soil series');
          }
        }
      } else {
        dataFlags.push(ERROR_FLAGS.SOIL_API_ERROR);
      }
    } catch (soilError) {
      console.error('Soil API error:', soilError);
      dataFlags.push(ERROR_FLAGS.SOIL_API_ERROR);
    }

    console.log('Fetching environmental sites...');
    try {
      const envSites = await fetchEnvironmentalSites(geoLat, geoLng, countyName);
      if (envSites.length > 0) {
        enrichedData.environmental_sites = envSites;
        console.log(`Found ${envSites.length} environmental sites within search radius`);
      }
    } catch (envSitesError) {
      console.error('Environmental sites API error:', envSitesError);
      dataFlags.push(ERROR_FLAGS.EPA_SITES_ERROR);
    }

    // Step 5.5: EPA ECHO Facility Proximity (1-Mile Radius)
    console.log('Step 5.5: Querying EPA ECHO facilities...');
    try {
      const epaCacheKey = `epa_echo_${geoLat.toFixed(4)}_${geoLng.toFixed(4)}`;
      let epaData = await getCachedData(supabase, epaCacheKey, CACHE_TTL.EPA_ECHO);
      
      if (!epaData) {
        console.log('🔄 EPA ECHO cache MISS - calling function');
        const epaResp = await supabase.functions.invoke('enrich-epa-echo', {
          body: { lat: geoLat, lng: geoLng, application_id: null } // Don't auto-update DB
        });
        
        if (epaResp.data && epaResp.data.success) {
          epaData = {
            epa_facilities_count: epaResp.data.epa_facilities_count,
            nearest_facility_dist: epaResp.data.nearest_facility_dist,
            nearest_facility_type: epaResp.data.nearest_facility_type,
            facilities: epaResp.data.facilities
          };
          
          // Cache the result
          await setCacheData(supabase, epaCacheKey, epaData, CACHE_TTL.EPA_ECHO, application_id);
          console.log(`✅ EPA ECHO: ${epaData.epa_facilities_count} facilities found, nearest: ${epaData.nearest_facility_dist} mi`);
        } else {
          console.warn('EPA ECHO API returned no data or error');
          dataFlags.push(ERROR_FLAGS.EPA_SITES_ERROR);
        }
      } else {
        console.log('✅ EPA ECHO cache HIT');
      }
      
      if (epaData) {
        enrichedData.epa_facilities_count = epaData.epa_facilities_count;
        enrichedData.nearest_facility_dist = epaData.nearest_facility_dist;
        enrichedData.nearest_facility_type = epaData.nearest_facility_type;
      }
    } catch (epaError) {
      console.error('EPA ECHO enrichment failed:', epaError);
      dataFlags.push(ERROR_FLAGS.EPA_SITES_ERROR);
    }

    // Step 5.6: USFWS Wetlands (National Wetlands Inventory)
    console.log('Step 5.6: Querying USFWS Wetlands...');
    try {
      // Wetlands require parcel polygon, check if we have it
      if (parcelGeometry && parcelGeometry.coordinates) {
        const wetlandsCacheKey = `wetlands_${geoLat.toFixed(4)}_${geoLng.toFixed(4)}`;
        let wetlandsData = await getCachedData(supabase, wetlandsCacheKey, CACHE_TTL.WETLANDS);
        
        if (!wetlandsData) {
          console.log('🔄 Wetlands cache MISS - calling function');
          
          // Calculate parcel area in sqft if we have acreage
          const parcelAreaSqft = enrichedData.acreage_cad ? enrichedData.acreage_cad * 43560 : null;
          
          const wetlandsResp = await supabase.functions.invoke('enrich-wetlands', {
            body: { 
              parcel_polygon: parcelGeometry,
              parcel_area_sqft: parcelAreaSqft,
              application_id: null // Don't auto-update DB
            }
          });
          
          if (wetlandsResp.data && wetlandsResp.data.success) {
            wetlandsData = {
              wetlands_type: wetlandsResp.data.wetlands_type,
              wetlands_area_pct: wetlandsResp.data.wetlands_area_pct,
              wetlands_count: wetlandsResp.data.wetlands_count
            };
            
            // Cache the result
            await setCacheData(supabase, wetlandsCacheKey, wetlandsData, CACHE_TTL.WETLANDS, application_id);
            
            if (wetlandsData.wetlands_type) {
              console.log(`✅ Wetlands: ${wetlandsData.wetlands_type} (${wetlandsData.wetlands_area_pct}% coverage)`);
            } else {
              console.log('✅ No wetlands detected on parcel');
            }
          } else {
            console.warn('Wetlands API returned no data or error');
            dataFlags.push(ERROR_FLAGS.WETLANDS_API_ERROR);
          }
        } else {
          console.log('✅ Wetlands cache HIT');
        }
        
        if (wetlandsData) {
          enrichedData.wetlands_type = wetlandsData.wetlands_type;
          enrichedData.wetlands_area_pct = wetlandsData.wetlands_area_pct;
        }
      } else {
        console.warn('⚠️ No parcel geometry available - skipping wetlands analysis');
        dataFlags.push('wetlands_no_geometry');
      }
    } catch (wetlandsError) {
      console.error('Wetlands enrichment failed:', wetlandsError);
      dataFlags.push(ERROR_FLAGS.WETLANDS_API_ERROR);
    }

    // Step 6: Utilities / Infrastructure
    console.log('Fetching utility infrastructure data...');
    
    // Try direct connection first (mycity2 subdomain should work)
    // Proxy fallback removed as mycity2.houstontx.gov should be DNS-resolvable
    const useProxy = false; // Disabled proxy, using mycity2 subdomain instead
    
    const utilities = await fetchUtilities(geoLat, geoLng, endpoints, useProxy);
    console.log('Utilities fetched summary:', {
      water: utilities.water_lines?.length || 0,
      sewer: utilities.sewer_lines?.length || 0,
      storm: utilities.storm_lines?.length || 0,
      water_capacity_mgd: utilities.water_capacity_mgd,
      sewer_capacity_mgd: utilities.sewer_capacity_mgd,
      power_kv_nearby: utilities.power_kv_nearby
    });
    Object.assign(enrichedData, utilities);
    if (!utilities.water_lines && !utilities.sewer_lines && !utilities.storm_lines) {
      dataFlags.push('utilities_not_found');
    }
    
    // Generate utilities map URL if we have utility data
    if (utilities.water_lines?.length || utilities.sewer_lines?.length || utilities.storm_lines?.length) {
      enrichedData.utilities_map_url = `https://www.google.com/maps/@${geoLat},${geoLng},17z/data=!5m1!1e1`;
    }

    console.log('Fetching broadband data...');
    const broadband = await fetchBroadband(geoLat, geoLng);
    console.log('Broadband result:', broadband);
    Object.assign(enrichedData, broadband);

    // Step 7: Traffic & Mobility
    console.log('Fetching traffic data...');
    let trafficData = null;
    try {
      trafficData = await queryTrafficData(geoLat, geoLng, enrichedData.city, supabase, application_id);
      
      if (trafficData) {
        enrichedData.traffic_aadt = trafficData.aadt || null;
        enrichedData.traffic_year = trafficData.year || null;
        enrichedData.traffic_segment_id = trafficData.stationId || null;
        enrichedData.traffic_distance_ft = trafficData.distance ? Math.round(trafficData.distance) : null;
        enrichedData.traffic_road_name = trafficData.roadName || null;
        
        // Calculate truck percentage and congestion level from AADT
        if (enrichedData.traffic_aadt) {
          // Typical truck percentage: 5-8% urban, 15-25% highway/rural
          enrichedData.truck_percent = enrichedData.traffic_aadt > 50000 ? 8 : 5;
          
          // Congestion level based on AADT (simplified LOS)
          const aadt = enrichedData.traffic_aadt;
          if (aadt < 10000) enrichedData.congestion_level = 'Low';
          else if (aadt < 25000) enrichedData.congestion_level = 'Moderate';
          else if (aadt < 50000) enrichedData.congestion_level = 'High';
          else enrichedData.congestion_level = 'Very High';
        }
      } else {
        dataFlags.push('traffic_not_found');
        console.log('❌ No traffic data found within search radius');
      }
    } catch (err) {
      console.error('Traffic enrichment failed:', err);
      dataFlags.push('traffic_api_unreachable');
    }

    console.log('Fetching mobility data (highways, transit)...');
    const mobilityData = await fetchMobilityData(geoLat, geoLng, googleApiKey);
    Object.assign(enrichedData, mobilityData);

    // Step 8: Demographics / Market Context
    console.log('Fetching demographics...');
    const demographics = await fetchDemographics(geoLat, geoLng);
    Object.assign(enrichedData, demographics);
    if (!demographics.population_1mi) {
      dataFlags.push('demographics_not_found');
    }
    
    // Estimate drive time populations (using radius approximations)
    // 15 min drive ≈ 5-8 miles radius, 30 min drive ≈ 12-18 miles radius
    if (enrichedData.population_5mi) {
      enrichedData.drive_time_15min_population = Math.round(enrichedData.population_5mi * 2.5);
      enrichedData.drive_time_30min_population = Math.round(enrichedData.population_5mi * 8);
    }
    
    // Identify major employment clusters (simplified - major cities)
    const employmentClusters = [];
    const cityLower = enrichedData.city?.toLowerCase() || '';
    if (cityLower.includes('houston')) {
      employmentClusters.push(
        { name: 'Texas Medical Center', distance_mi: 5, jobs: 106000 },
        { name: 'Downtown Houston', distance_mi: 2, jobs: 150000 },
        { name: 'Energy Corridor', distance_mi: 15, jobs: 80000 }
      );
    } else if (cityLower.includes('dallas')) {
      employmentClusters.push(
        { name: 'Downtown Dallas', distance_mi: 3, jobs: 125000 },
        { name: 'Las Colinas', distance_mi: 10, jobs: 95000 }
      );
    } else if (cityLower.includes('austin')) {
      employmentClusters.push(
        { name: 'Downtown Austin', distance_mi: 5, jobs: 85000 },
        { name: 'Domain', distance_mi: 8, jobs: 45000 }
      );
    }
    enrichedData.employment_clusters = employmentClusters;
    
    // NEW: Step 7.5 - Fetch precise elevation
    console.log('Step 7.5: Fetching elevation...');
    try {
      const elevationResp = await supabase.functions.invoke('fetch-elevation', {
        body: { lat: geoLat, lng: geoLng, application_id }
      });
      if (elevationResp.data?.elevation_ft) {
        enrichedData.elevation = elevationResp.data.elevation_ft;
      }
    } catch (err) {
      console.error('Elevation fetch failed:', err);
      dataFlags.push('elevation_api_failed');
    }

    // NEW: Step 7.6 - Calculate drive times to key destinations
    console.log('Step 7.6: Calculating drive times...');
    try {
      let destinations = [];
      
      if (cityLower.includes('houston')) {
        destinations = [
          { name: "Downtown Houston", lat: 29.7604, lng: -95.3698 },
          { name: "IAH Airport", lat: 29.9844, lng: -95.3414 },
          { name: "Texas Medical Center", lat: 29.7066, lng: -95.4007 }
        ];
      } else if (cityLower.includes('dallas')) {
        destinations = [
          { name: "Downtown Dallas", lat: 32.7767, lng: -96.7970 },
          { name: "DFW Airport", lat: 32.8998, lng: -97.0403 }
        ];
      } else if (cityLower.includes('austin')) {
        destinations = [
          { name: "Downtown Austin", lat: 30.2672, lng: -97.7431 },
          { name: "AUS Airport", lat: 30.1975, lng: -97.6664 }
        ];
      }
      
      if (destinations.length > 0) {
        const drivetimesResp = await supabase.functions.invoke('fetch-drivetimes', {
          body: { 
            application_id,
            origin: { lat: geoLat, lng: geoLng }, 
            destinations 
          }
        });
        if (drivetimesResp.data) {
          enrichedData.drivetimes = drivetimesResp.data;
        }
      }
    } catch (err) {
      console.error('Drive times fetch failed:', err);
      dataFlags.push('drivetimes_api_failed');
    }

    // NEW: Step 7.7 - Find nearby places
    console.log('Step 7.7: Finding nearby places...');
    try {
      const placesResp = await supabase.functions.invoke('fetch-places-context', {
        body: { 
          lat: geoLat, 
          lng: geoLng,
          application_id,
          radius_meters: 3000, 
          types: ['hospital', 'school', 'transit_station', 'shopping_mall'] 
        }
      });
      if (placesResp.data) {
        enrichedData.nearby_places = placesResp.data;
      }
    } catch (err) {
      console.error('Nearby places fetch failed:', err);
      dataFlags.push('places_api_failed');
    }
    

    // Step 9: Financial / Incentives
    console.log('Fetching property tax data...');
    const taxData = await fetchPropertyTax(geoLat, geoLng, countyName, endpoints);
    Object.assign(enrichedData, taxData);
    
    // MUD District detection (simplified - requires county GIS layer for precise data)
    if (countyName?.includes('Harris') || countyName?.includes('Fort Bend') || countyName?.includes('Montgomery')) {
      enrichedData.mud_district = 'Potential MUD area - verify with county MUD map';
    } else {
      enrichedData.mud_district = null;
    }
    
    // ETJ (Extraterritorial Jurisdiction) provider
    if (enrichedData.city) {
      enrichedData.etj_provider = `${enrichedData.city} ETJ (verify city limits)`;
    } else {
      enrichedData.etj_provider = 'Unincorporated - County jurisdiction';
    }

    console.log('Fetching incentive zones...');
    const incentives = await fetchIncentiveZones(geoLat, geoLng);
    Object.assign(enrichedData, incentives);

    console.log('Fetching permitting data...');
    const city = enrichedData.city || address.split(',')[1]?.trim();
    const permitting = await fetchPermittingData(city, countyName);
    Object.assign(enrichedData, permitting);

    // Step 10: Save enriched data to database if application_id provided
    if (application_id) {
      // Build safe update data - only include fields with valid values
      const updateData: Record<string, any> = {
        enrichment_metadata: {
          enriched_at: new Date().toISOString(),
          county: countyName,
          city: enrichedData.city || null,
          state: enrichedData.administrative_area_level_1 || null,
          postal_code: enrichedData.postal_code || null
        },
        
        // Observability - always update these
        api_meta: apiMeta,
        enrichment_status: dataFlags.length === 0 ? 'complete' : 
                          dataFlags.length < 3 ? 'partial' : 'failed',
        data_flags: dataFlags
      };

      // Location - only update if we have valid values
      if (enrichedData.geo_lat) updateData.geo_lat = enrichedData.geo_lat;
      if (enrichedData.geo_lng) updateData.geo_lng = enrichedData.geo_lng;
      if (enrichedData.situs_address) {
        updateData.situs_address = enrichedData.situs_address;
        updateData.formatted_address = enrichedData.situs_address;
      }
      if (enrichedData.place_id) updateData.place_id = enrichedData.place_id;
      if (enrichedData.administrative_area_level_2) updateData.county = enrichedData.administrative_area_level_2;
      if (enrichedData.city) updateData.city = enrichedData.city;
      if (enrichedData.administrative_area_level_1) updateData.administrative_area_level_1 = enrichedData.administrative_area_level_1;
      if (enrichedData.postal_code) updateData.postal_code = enrichedData.postal_code;
      if (enrichedData.neighborhood) updateData.neighborhood = enrichedData.neighborhood;
      if (enrichedData.sublocality) updateData.sublocality = enrichedData.sublocality;
      if (enrichedData.submarket_enriched) updateData.submarket_enriched = enrichedData.submarket_enriched;
      if (enrichedData.mud_district) updateData.mud_district = enrichedData.mud_district;
      if (enrichedData.etj_provider) updateData.etj_provider = enrichedData.etj_provider;

      // Safe parcel updates - CRITICAL: only if we have valid data
      if (enrichedData.parcel_id && enrichedData.parcel_id.trim() !== '') {
        updateData.parcel_id = enrichedData.parcel_id;
      }
      if (enrichedData.parcel_owner) {
        updateData.parcel_owner = enrichedData.parcel_owner;
      }
      if (typeof enrichedData.acreage_cad === 'number' && enrichedData.acreage_cad > 0) {
        updateData.acreage_cad = enrichedData.acreage_cad;
        updateData.lot_size_value = enrichedData.acreage_cad;
        updateData.lot_size_unit = 'acres';
      }
      
      // ⭐ NEW: Valuation fields
      if (enrichedData.tot_appr_val) updateData.tot_appr_val = enrichedData.tot_appr_val;
      if (enrichedData.tot_market_val) updateData.tot_market_val = enrichedData.tot_market_val;
      if (enrichedData.land_val) updateData.land_val = enrichedData.land_val;
      if (enrichedData.imprv_val) updateData.imprv_val = enrichedData.imprv_val;
      if (enrichedData.taxable_value) updateData.taxable_value = enrichedData.taxable_value;
      
      // ⭐ NEW: Building details
      if (enrichedData.bldg_sqft) updateData.bldg_sqft = enrichedData.bldg_sqft;
      if (enrichedData.year_built) updateData.year_built = enrichedData.year_built;
      if (enrichedData.effective_yr) updateData.effective_yr = enrichedData.effective_yr;
      if (enrichedData.num_stories) updateData.num_stories = enrichedData.num_stories;
      
      // ⭐ NEW: Classification
      if (enrichedData.state_class) updateData.state_class = enrichedData.state_class;
      if (enrichedData.prop_type) updateData.prop_type = enrichedData.prop_type;
      if (enrichedData.land_use_code) updateData.land_use_code = enrichedData.land_use_code;
      
      // ⭐ NEW: Tax information
      if (enrichedData.exemption_code) updateData.exemption_code = enrichedData.exemption_code;
      if (enrichedData.ag_use !== undefined) updateData.ag_use = enrichedData.ag_use;
      if (enrichedData.homestead !== undefined) updateData.homestead = enrichedData.homestead;
      if (enrichedData.acct_num) updateData.acct_num = enrichedData.acct_num;
      
      // ⭐ NEW: Legal description fields
      if (enrichedData.legal_dscr_1) updateData.legal_dscr_1 = enrichedData.legal_dscr_1;
      if (enrichedData.legal_dscr_2) updateData.legal_dscr_2 = enrichedData.legal_dscr_2;
      if (enrichedData.legal_dscr_3) updateData.legal_dscr_3 = enrichedData.legal_dscr_3;
      if (enrichedData.legal_dscr_4) updateData.legal_dscr_4 = enrichedData.legal_dscr_4;
      if (enrichedData.bldg_style_cd) updateData.bldg_style_cd = enrichedData.bldg_style_cd;
      
      // ⭐ NEW: Location details
      if (enrichedData.subdivision) updateData.subdivision = enrichedData.subdivision;
      if (enrichedData.block) updateData.block = enrichedData.block;
      if (enrichedData.lot) updateData.lot = enrichedData.lot;
      
      // Zoning
      if (enrichedData.zoning_code) updateData.zoning_code = enrichedData.zoning_code;
      if (enrichedData.overlay_district) updateData.overlay_district = enrichedData.overlay_district;
      
      // Floodplain / Environmental
      if (enrichedData.floodplain_zone) updateData.floodplain_zone = enrichedData.floodplain_zone;
      if (enrichedData.base_flood_elevation) updateData.base_flood_elevation = enrichedData.base_flood_elevation;
      if (enrichedData.fema_panel_id) updateData.fema_panel_id = enrichedData.fema_panel_id;
      if (enrichedData.base_flood_elevation_source) updateData.base_flood_elevation_source = enrichedData.base_flood_elevation_source;
      if (enrichedData.elevation) updateData.elevation = enrichedData.elevation;
      if (enrichedData.topography_map_url) updateData.topography_map_url = enrichedData.topography_map_url;
      if (enrichedData.aerial_imagery_url) updateData.aerial_imagery_url = enrichedData.aerial_imagery_url;
      if (enrichedData.wetlands_type) updateData.wetlands_type = enrichedData.wetlands_type;
      if (enrichedData.wetlands_area_pct !== null && enrichedData.wetlands_area_pct !== undefined) updateData.wetlands_area_pct = enrichedData.wetlands_area_pct;
      if (enrichedData.epa_facilities_count !== null && enrichedData.epa_facilities_count !== undefined) updateData.epa_facilities_count = enrichedData.epa_facilities_count;
      if (enrichedData.nearest_facility_dist !== null && enrichedData.nearest_facility_dist !== undefined) updateData.nearest_facility_dist = enrichedData.nearest_facility_dist;
      if (enrichedData.nearest_facility_type) updateData.nearest_facility_type = enrichedData.nearest_facility_type;
      if (enrichedData.soil_series) updateData.soil_series = enrichedData.soil_series;
      if (enrichedData.soil_slope_percent) updateData.soil_slope_percent = enrichedData.soil_slope_percent;
      if (enrichedData.soil_drainage_class) updateData.soil_drainage_class = enrichedData.soil_drainage_class;
      if (enrichedData.environmental_sites) updateData.environmental_sites = enrichedData.environmental_sites;
      if (enrichedData.historical_flood_events !== undefined) updateData.historical_flood_events = enrichedData.historical_flood_events;
      
      // Utilities / Infrastructure
      if (enrichedData.water_lines) updateData.water_lines = enrichedData.water_lines;
      if (enrichedData.sewer_lines) updateData.sewer_lines = enrichedData.sewer_lines;
      if (enrichedData.storm_lines) updateData.storm_lines = enrichedData.storm_lines;
      if (enrichedData.water_capacity_mgd) updateData.water_capacity_mgd = enrichedData.water_capacity_mgd;
      if (enrichedData.sewer_capacity_mgd) updateData.sewer_capacity_mgd = enrichedData.sewer_capacity_mgd;
      if (enrichedData.power_kv_nearby) updateData.power_kv_nearby = enrichedData.power_kv_nearby;
      if (enrichedData.fiber_available !== undefined) updateData.fiber_available = enrichedData.fiber_available;
      if (enrichedData.broadband_providers) updateData.broadband_providers = enrichedData.broadband_providers;
      if (enrichedData.utilities_map_url) updateData.utilities_map_url = enrichedData.utilities_map_url;
      
      // Traffic / Mobility
      if (enrichedData.traffic_aadt) updateData.traffic_aadt = enrichedData.traffic_aadt;
      if (enrichedData.traffic_year) updateData.traffic_year = enrichedData.traffic_year;
      if (enrichedData.traffic_segment_id) updateData.traffic_segment_id = enrichedData.traffic_segment_id;
      if (enrichedData.traffic_distance_ft) updateData.traffic_distance_ft = enrichedData.traffic_distance_ft;
      if (enrichedData.traffic_road_name) updateData.traffic_road_name = enrichedData.traffic_road_name;
      if (enrichedData.traffic_direction) updateData.traffic_direction = enrichedData.traffic_direction;
      if (enrichedData.traffic_map_url) updateData.traffic_map_url = enrichedData.traffic_map_url;
      if (enrichedData.truck_percent) updateData.truck_percent = enrichedData.truck_percent;
      if (enrichedData.congestion_level) updateData.congestion_level = enrichedData.congestion_level;
      if (enrichedData.nearest_highway) updateData.nearest_highway = enrichedData.nearest_highway;
      if (enrichedData.distance_highway_ft) updateData.distance_highway_ft = enrichedData.distance_highway_ft;
      if (enrichedData.nearest_transit_stop) updateData.nearest_transit_stop = enrichedData.nearest_transit_stop;
      if (enrichedData.distance_transit_ft) updateData.distance_transit_ft = enrichedData.distance_transit_ft;
      if (enrichedData.drive_time_15min_population) updateData.drive_time_15min_population = enrichedData.drive_time_15min_population;
      if (enrichedData.drive_time_30min_population) updateData.drive_time_30min_population = enrichedData.drive_time_30min_population;
      
      // Demographics / Market
      if (enrichedData.population_1mi) updateData.population_1mi = enrichedData.population_1mi;
      if (enrichedData.population_3mi) updateData.population_3mi = enrichedData.population_3mi;
      if (enrichedData.population_5mi) updateData.population_5mi = enrichedData.population_5mi;
      if (enrichedData.median_income) updateData.median_income = enrichedData.median_income;
      if (enrichedData.households_5mi) updateData.households_5mi = enrichedData.households_5mi;
      if (enrichedData.employment_clusters) updateData.employment_clusters = enrichedData.employment_clusters;
      if (enrichedData.growth_rate_5yr) updateData.growth_rate_5yr = enrichedData.growth_rate_5yr;
      
      // Financial / Incentives
      if (enrichedData.tax_rate_total) updateData.tax_rate_total = enrichedData.tax_rate_total;
      if (enrichedData.taxing_jurisdictions) updateData.taxing_jurisdictions = enrichedData.taxing_jurisdictions;
      if (enrichedData.opportunity_zone !== undefined) updateData.opportunity_zone = enrichedData.opportunity_zone;
      if (enrichedData.enterprise_zone !== undefined) updateData.enterprise_zone = enrichedData.enterprise_zone;
      if (enrichedData.foreign_trade_zone !== undefined) updateData.foreign_trade_zone = enrichedData.foreign_trade_zone;
      if (enrichedData.average_permit_time_months) updateData.average_permit_time_months = enrichedData.average_permit_time_months;
      
      // NEW: Google Maps integration data
      if (enrichedData.drivetimes) updateData.drivetimes = enrichedData.drivetimes;
      if (enrichedData.nearby_places) updateData.nearby_places = enrichedData.nearby_places;
      
      // 📊 Track API refresh metadata (which APIs were called vs cached)
      const refreshMetadata = {
        parcel: apiMeta.parcel_cached ? null : new Date().toISOString(),
        fema: apiMeta.fema_nfhl?.cached ? null : new Date().toISOString(),
        zoning: apiMeta.zoning_cached ? null : new Date().toISOString(),
        traffic: enrichedData.traffic_aadt && trafficData?.cached ? null : new Date().toISOString(),
        epa_echo: enrichedData.epa_facilities_count !== null ? new Date().toISOString() : null,
        wetlands: enrichedData.wetlands_type !== null ? new Date().toISOString() : null,
        refreshed_at: new Date().toISOString()
      };
      
      // Calculate next cache expiration (use minimum TTL of all cached data)
      const activeCacheTTLs = [];
      if (apiMeta.parcel_cached) activeCacheTTLs.push(CACHE_TTL.PARCEL);
      if (apiMeta.fema_nfhl?.cached) activeCacheTTLs.push(CACHE_TTL.FEMA);
      if (apiMeta.zoning_cached) activeCacheTTLs.push(CACHE_TTL.ZONING);
      
      if (activeCacheTTLs.length > 0) {
        const minTTL = Math.min(...activeCacheTTLs);
        updateData.cache_expires_at = new Date(Date.now() + minTTL).toISOString();
      }
      
      updateData.last_api_refresh = refreshMetadata;

      console.log('Updating database with enriched data:', updateData);

      const { error: updateError } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', application_id);

      if (updateError) {
        console.error('Database update error:', updateError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Failed to update application',
          details: updateError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log('Enrichment saved to database');
      
      // 🚨 CRITICAL DATA VALIDATION: Block report generation if critical data missing
      const hasGeocode = enrichedData.geo_lat && enrichedData.geo_lng;
      const hasParcel = enrichedData.parcel_id || parcelGeometry;
      const hasZoning = enrichedData.zoning_category || enrichedData.enrichment_metadata?.zoning;
      const hasFlood = enrichedData.floodplain_zone || enrichedData.enrichment_metadata?.flood_zone;

      if (!hasGeocode || !hasParcel || !hasZoning || !hasFlood) {
        const missing = [];
        if (!hasGeocode) missing.push('geocode');
        if (!hasParcel) missing.push('parcel');
        if (!hasZoning) missing.push('zoning');
        if (!hasFlood) missing.push('flood');
        
        console.error('❌ [enrich-feasibility] CRITICAL DATA MISSING:', {
          missing,
          application_id,
          has: { hasGeocode, hasParcel, hasZoning, hasFlood }
        });
        
        // Mark enrichment as failed
        await supabase
          .from('applications')
          .update({
            enrichment_status: 'failed',
            data_flags: [...dataFlags, 'critical_feasibility_data_missing']
          })
          .eq('id', application_id);
        
        return new Response(JSON.stringify({
          success: false,
          error: 'Critical feasibility data missing',
          details: `Missing: ${missing.join(', ')}`,
          application_id
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // 🚀 PHASE 3: Trigger geospatial scoring
      if (enrichedData.geo_lat && enrichedData.geo_lng) {
        try {
          console.log('Triggering geospatial score computation...');
          const geoResponse = await supabase.functions.invoke('compute-geospatial-score', {
            body: {
              application_id,
              lat: enrichedData.geo_lat,
              lng: enrichedData.geo_lng
            }
          });
          
          if (geoResponse.error) {
            console.error('Geospatial scoring failed:', geoResponse.error);
            dataFlags.push('geospatial_score_unavailable');
          } else {
            console.log('Geospatial score computed successfully:', geoResponse.data);
          }
        } catch (geoError) {
          console.error('Failed to invoke compute-geospatial-score:', geoError);
          dataFlags.push('geospatial_score_error');
        }
      }
    }

    // Return success response (Step 10 AI Generation would happen after this in a separate process)
    return new Response(JSON.stringify({
      success: true,
      county: countyName,
      data: enrichedData,
      api_meta: apiMeta,
      data_flags: dataFlags
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enrich-feasibility function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
