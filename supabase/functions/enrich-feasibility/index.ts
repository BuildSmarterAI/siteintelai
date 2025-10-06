import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import proj4 from 'https://cdn.skypack.dev/proj4@2.8.0';

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
  TRAFFIC_NOT_FOUND: 'traffic_not_found'
};

// County endpoint catalog - Texas major counties (Top 10 by development activity)
const ENDPOINT_CATALOG: Record<string, any> = {
  "Harris County": {
    // HCAD parcel service (confirmed working)
    parcel_url: "https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query",
    zoning_url: "https://services.arcgis.com/su8ic9KbA7PYVxPS/arcgis/rest/services/Current_Zoning_/FeatureServer/0/query",
    // HCAD-specific field mappings (confirmed from service metadata)
    parcel_id_field: "HCAD_NUM",
    owner_field: "owner_name_1",
    acreage_field: "StatedArea",
    // HCAD doesn't have SITUS_ADDR - address is split into multiple fields
    site_address_fields: "site_str_num,site_str_name,site_str_sfx,site_str_sfx_dir,site_city,site_zip",
    zoning_field: "ZONECODE",
    overlay_field: "OVERLAY",
    // Houston utility endpoints - using GeoGIMS test/ms servers (discovered from Geocortex directory)
    water_lines_url: "https://geogimstest.houstontx.gov/arcgis/rest/services/HW/WaterUNPublic/MapServer/4/query",
    sewer_lines_url: "https://geogimstest.houstontx.gov/arcgis/rest/services/HW/WastewaterUNPublic/MapServer/4/query",
    storm_lines_url: "https://geogimsms.houstontx.gov/arcgis/rest/services/TDO/StormWater_Maintenance_gx/MapServer/1/query"
  },
  "Fort Bend County": {
    // FBCAD parcel service (confirmed working)
    parcel_url: "https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0/query",
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
    zoning_url: "https://data.austintexas.gov/resource/zoning.json",
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
const FEMA_NFHL_ZONES_URL = "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/0/query"; // Flood Hazard Zones (layer 0, not deprecated 28)
const OPENFEMA_DISASTERS_URL = "https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries"; // Historical flood events

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
const USGS_ELEVATION_URL = "https://nationalmap.gov/epqs/pqs.php";
const USFWS_WETLANDS_URL = "https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/1/query";
const USDA_SOIL_URL = "https://SDMDataAccess.sc.egov.usda.gov/Tabular/post.rest";
const EPA_FRS_URL = "https://enviro.epa.gov/frs/frs_rest_services";
const NOAA_STORM_URL = "https://www.ncdc.noaa.gov/stormevents/csv";
const FCC_BROADBAND_URL = "https://broadbandmap.fcc.gov/api/nationwide";
// TxDOT Official Traffic Data Endpoints
const TXDOT_AADT_URL = "https://services.arcgis.com/KTcxiTD9dsQwVSFh/arcgis/rest/services/AADT/FeatureServer/0/query";
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

// Helper function to fetch wetlands data from USFWS
async function fetchWetlands(lat: number, lng: number): Promise<string | null> {
  try {
    // Buffer distance in meters (100m ~ 328ft)
    const bufferMeters = 100;
    
    const params = new URLSearchParams({
      geometry: `${lng},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      distance: bufferMeters.toString(),
      units: 'esriSRUnit_Meter',
      outFields: 'WETLAND_TYPE,ATTRIBUTE,WETLAND_LABEL,WETLAND_CODE,WET_TYPE',
      returnGeometry: 'false',
      f: 'json'
    });
    
    const response = await fetch(`${USFWS_WETLANDS_URL}?${params}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    const text = await response.text();
    
    if (!text || text.trim().startsWith('<')) {
      console.log('Wetlands API returned HTML/invalid response');
      return null;
    }
    
    const data = JSON.parse(text);
    
    if (data?.features && data.features.length > 0) {
      const attrs = data.features[0].attributes;
      const wetlandType = attrs.WETLAND_TYPE || attrs.WET_TYPE || attrs.WETLAND_LABEL || 
                         attrs.ATTRIBUTE || attrs.WETLAND_CODE;
      console.log('Wetlands found:', { type: wetlandType, featureCount: data.features.length });
      return wetlandType || null;
    }
    
    console.log('No wetlands features found at location');
    return null;
  } catch (error) {
    console.error('Wetlands fetch error:', error);
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
    
    // Fallback: Try NRCS Soil Survey Geographic (SSURGO) REST service
    console.log('Trying NRCS SSURGO REST service fallback');
    const ssurgoUrl = `https://sdmdataaccess.nrcs.usda.gov/Spatial/SDMWGS84Geographic.wfs`;
    const ssurgoParams = new URLSearchParams({
      service: 'WFS',
      version: '1.1.0',
      request: 'GetFeature',
      typeName: 'MapunitPoly',
      outputFormat: 'application/json',
      srsname: 'EPSG:4326',
      bbox: `${lng-0.001},${lat-0.001},${lng+0.001},${lat+0.001},EPSG:4326`
    });
    
    const ssurgoResponse = await fetch(`${ssurgoUrl}?${ssurgoParams}`);
    const ssurgoText = await ssurgoResponse.text();
    
    if (ssurgoText && !ssurgoText.trim().startsWith('<')) {
      try {
        const ssurgoData = JSON.parse(ssurgoText);
        if (ssurgoData?.features?.[0]?.properties) {
          const props = ssurgoData.features[0].properties;
          const soilData = {
            soil_series: props.muname || props.MapUnitName || null,
            soil_slope_percent: props.slope_r || props.slopegradwta || null,
            soil_drainage_class: props.drainagecl || props.drclassdcd || null
          };
          console.log('Soil data from SSURGO fallback:', soilData);
          return soilData;
        }
      } catch (parseError) {
        console.error('Failed to parse SSURGO response:', parseError);
      }
    }
    
    console.log('No soil data available from any source');
    return {};
  } catch (error) {
    console.error('Soil data fetch error:', error);
    return {};
  }
}

// Helper function to fetch EPA environmental sites
async function fetchEnvironmentalSites(lat: number, lng: number, county: string): Promise<any[]> {
  try {
    // EPA EFService (newer endpoint) - query by lat/lng
    const response = await fetch(
      `https://enviro.epa.gov/efservice/FRS_INTEREST/latitude/${lat}/longitude/${lng}/JSON`,
      { headers: { 'Accept': 'application/json' } }
    );
    const data = await safeJsonParse(response, 'EPA environmental sites query');
    
    const sites = (data || []).slice(0, 10).map((site: any) => ({
      site_name: site.REGISTRY_NAME || site.SITE_NAME,
      program: site.PROGRAM_SYSTEM_ACRONYM,
      status: site.FACILITY_STATUS
    }));
    
    return sites;
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

// TxDOT AADT REST Endpoint
const TXDOT_URL = "https://services.arcgis.com/KTcxiTD9dsQwVSFh/arcgis/rest/services/AADT/FeatureServer/0/query";

// Major Texas urban areas requiring larger traffic search radius
const MAJOR_URBAN_AREAS = ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington', 'Plano', 'Irving'];

/**
 * Query TxDOT traffic layer with adaptive search radius
 * Urban cores use 3000ft radius due to sensor spacing
 * Rural/suburban areas use 1000ft radius
 */
async function queryTxDOT(lat: number, lng: number, city?: string) {
  // Use larger radius for major urban areas where sensors are more spread out
  const isUrban = city && MAJOR_URBAN_AREAS.some(urban => city.includes(urban));
  const searchRadius = isUrban ? "3000" : "1000"; // Increased to 3000ft for urban
  
  console.log(`TxDOT search radius: ${searchRadius}ft for ${city || 'unknown city'} (${isUrban ? 'urban' : 'standard'})`);

  const params = new URLSearchParams({
    geometry: `${lng},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    distance: searchRadius,
    outFields: "AADT,Year,SEGID",
    returnGeometry: "false",
    f: "json"
  });

  const resp = await fetch(`${TXDOT_URL}?${params.toString()}`);
  if (!resp.ok) throw new Error(`TxDOT query failed: ${resp.status}`);
  const json = await resp.json();
  return json.features?.[0]?.attributes || null;
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
    
    return {
      total_events: disasters.length,
      by_type: byType,
      flood_events: byType['Flood']?.count || 0
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
      const outFieldsList = [
        endpoints.parcel_id_field,
        endpoints.parcel_id_alt_field,
        endpoints.owner_field,
        endpoints.acreage_field
      ].filter(Boolean).join(',');
      
      // For Harris County, convert to EPSG:2278 (Texas South Central Feet)
      let geometryCoords = `${geoLng},${geoLat}`;
      let spatialReference = '4326';
      let additionalParams: Record<string, string> = {};
      
      if (countyName === 'Harris County') {
        const wgs84 = 'EPSG:4326';
        const epsg2278 = '+proj=lcc +lat_1=30.28333333333333 +lat_2=28.38333333333333 +lat_0=27.83333333333333 +lon_0=-99 +x_0=2296583.333 +y_0=9842500 +datum=NAD83 +units=ft +no_defs';
        const [x2278, y2278] = proj4(wgs84, epsg2278, [geoLng, geoLat]);
        geometryCoords = `${x2278},${y2278}`;
        spatialReference = '2278';
        console.log(`Converted coordinates to EPSG:2278: ${geometryCoords} from WGS84: ${geoLng},${geoLat}`);
      }
      
      // Build comprehensive outFields - for Harris County, use individual address fields instead of SITUS_ADDR
      const comprehensiveOutFields = countyName === 'Harris County' 
        ? `${outFieldsList},site_str_num,site_str_name,site_str_sfx,site_str_sfx_dir,site_city,site_zip`
        : outFieldsList || '*';
      
      // Build parcel query params - add where=1=1 for ArcGIS servers that require it
      const parcelParams = new URLSearchParams({
        geometry: geometryCoords,
        geometryType: 'esriGeometryPoint',
        inSR: spatialReference,
        spatialRel: 'esriSpatialRelIntersects',
        outFields: comprehensiveOutFields,
        where: '1=1',  // Required by some ArcGIS services even with standardized queries
        returnGeometry: 'false',
        f: 'json',
        ...additionalParams
      });

      let parcelData = null;
      
      // Query parcel data from primary endpoint with fallback variants
      if (endpoints.parcel_url) {
        console.log('Querying parcel data from:', endpoints.parcel_url);
        console.log('Parcel query params:', parcelParams.toString());
        
        // Try primary query first
        try {
          const parcelResp = await fetch(`${endpoints.parcel_url}?${parcelParams}`);
          parcelData = await safeJsonParse(parcelResp, 'Parcel query');
          console.log('Parcel API response:', { 
            status: parcelResp.status,
            hasFeatures: !!parcelData?.features,
            featureCount: parcelData?.features?.length || 0,
            error: parcelData?.error
          });
          
          // If primary query fails and we're in Harris County, try buffered query
          if (!parcelData?.features?.[0] && countyName === 'Harris County') {
            console.log('No features found, trying buffered query (1 foot radius)...');
            const bufferedParams = new URLSearchParams({
              geometry: geometryCoords,
              geometryType: 'esriGeometryPoint',
              inSR: spatialReference,
              spatialRel: 'esriSpatialRelIntersects',
              outFields: comprehensiveOutFields,
              where: '1=1',
              distance: '1',
              units: 'esriSRUnit_Foot',
              returnGeometry: 'false',
              f: 'json'
            });
            
            const bufferedResp = await fetch(`${endpoints.parcel_url}?${bufferedParams}`);
            const bufferedData = await safeJsonParse(bufferedResp, 'Buffered parcel query');
            if (bufferedData?.features?.[0]) {
              console.log('✅ Buffered query succeeded');
              parcelData = bufferedData;
            }
          }
          
          if (parcelData?.features?.[0]) {
            console.log('✅ Parcel data found');
          }
        } catch (parcelError) {
          console.error('Parcel query failed:', parcelError);
        }
      }

      if (parcelData?.features?.[0]) {
        const attrs = parcelData.features[0].attributes;
        
        // Map fields using confirmed field names from endpoint catalog
        enrichedData.parcel_id = attrs[endpoints.parcel_id_field] || null;
        enrichedData.parcel_owner = attrs[endpoints.owner_field] || null;
        enrichedData.acreage_cad = attrs[endpoints.acreage_field] || null;
        
        // For Harris County, build situs_address from individual components
        if (countyName === 'Harris County') {
          const parts = [];
          if (attrs.site_str_num) parts.push(attrs.site_str_num);
          if (attrs.site_str_name) parts.push(attrs.site_str_name);
          if (attrs.site_str_sfx) parts.push(attrs.site_str_sfx);
          if (attrs.site_str_sfx_dir) parts.push(attrs.site_str_sfx_dir);
          const street = parts.join(' ');
          const cityZip = [attrs.site_city, attrs.site_zip].filter(Boolean).join(', ');
          enrichedData.situs_address = [street, cityZip].filter(Boolean).join(', ') || null;
        }
        
        console.log('Parcel data mapped:', {
          parcel_id: enrichedData.parcel_id,
          parcel_owner: enrichedData.parcel_owner,
          acreage_cad: enrichedData.acreage_cad,
          situs_address: enrichedData.situs_address,
          source_fields: {
            parcel_id_field: endpoints.parcel_id_field,
            owner_field: endpoints.owner_field,
            acreage_field: endpoints.acreage_field
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
          enrichedData.zoning_code = attrs[endpoints.zoning_field] || attrs.ZONE_CODE || attrs.ZONING || attrs.ZONECODE || attrs.ZONE;
          enrichedData.overlay_district = attrs[endpoints.overlay_field] || attrs.OVERLAY_DISTRICT || attrs.OVERLAY || attrs.OVERLAY_CODE;
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

    // Step 4: Query FEMA flood data (Floodplain & Elevation - Part 1)
    console.log('Fetching FEMA flood zone data...');
    
    try {
      // Use retry logic for FEMA API (known to be flaky with 404s and timeouts)
      await retryWithBackoff(async () => {
        // Query FEMA NFHL Layer 0 (updated endpoint, not deprecated 28)
        const femaParams = new URLSearchParams({
          f: 'json',
          geometry: `${geoLng},${geoLat}`,
          geometryType: 'esriGeometryPoint',
          inSR: '4326',
          spatialRel: 'esriSpatialRelIntersects',
          outFields: 'FLD_ZONE,BFE,STATIC_BFE,PANEL',
          returnGeometry: 'false'
        });

        const femaResp = await fetch(`${FEMA_NFHL_ZONES_URL}?${femaParams}`, {
          headers: { 'Accept': 'application/json' }
        });
        
        apiMeta.fema_nfhl = { status: femaResp.status, layer: 0, coords: `${geoLng},${geoLat}` }; // Track response
        
        if (!femaResp.ok) {
          const errorText = await femaResp.text();
          console.error(`FEMA API error ${femaResp.status}:`, errorText.substring(0, 200));
          throw new Error(`FEMA API returned ${femaResp.status}`);
        }
        
        const femaData = await safeJsonParse(femaResp, 'FEMA flood zones query');

        if (femaData?.features && femaData.features.length > 0) {
          apiMeta.fema_nfhl.record_count = femaData.features.length;
          const attrs = femaData.features[0].attributes;
          
          enrichedData.floodplain_zone = attrs.FLD_ZONE || null;
          enrichedData.base_flood_elevation = attrs.BFE || attrs.STATIC_BFE || null;
          enrichedData.fema_panel_id = attrs.PANEL || null;
          
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
          console.log('No flood zone features found at this location');
          dataFlags.push('floodplain_missing');
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
      const floodHistory = await fetchHistoricalFloodEvents(geoLat, geoLng);
      apiMeta.openfema_disasters = { 
        latency_ms: Date.now() - startTime,
        total_events: floodHistory.total_events,
        flood_events: floodHistory.flood_events
      };
      
      enrichedData.historical_flood_events = floodHistory.flood_events;
      console.log(`Found ${floodHistory.flood_events} historical flood events`);
    } catch (error) {
      console.error('OpenFEMA query failed:', error);
      dataFlags.push('openfema_no_match');
      apiMeta.openfema_disasters = { error: error.message };
      enrichedData.historical_flood_events = 0;
    }

    // Step 4 continued: Fetch elevation data (Floodplain & Elevation - Part 2)
    console.log('Fetching elevation data...');
    try {
      const elevation = await fetchElevation(geoLat, geoLng);
      if (elevation !== null) {
        enrichedData.elevation = elevation;
        console.log('Elevation data fetched successfully:', elevation);
      } else {
        console.log('Elevation API returned null');
        dataFlags.push('elevation_missing');
      }
    } catch (elevError) {
      console.error('Elevation fetch failed:', elevError);
      dataFlags.push('elevation_missing');
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
    console.log('Fetching wetlands data...');
    const wetlands = await fetchWetlands(geoLat, geoLng);
    if (wetlands) {
      enrichedData.wetlands_type = wetlands;
    }

    console.log('Fetching soil data...');
    const soilData = await fetchSoilData(geoLat, geoLng);
    Object.assign(enrichedData, soilData);

    console.log('Fetching environmental sites...');
    const envSites = await fetchEnvironmentalSites(geoLat, geoLng, countyName);
    if (envSites.length > 0) {
      enrichedData.environmental_sites = envSites;
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
    try {
      // Pass city name to enable adaptive search radius (2500ft for urban, 1000ft for rural)
      const trafficAttrs = await queryTxDOT(geoLat, geoLng, enrichedData.city);
      
      enrichedData.traffic_aadt = trafficAttrs?.AADT || null;
      enrichedData.traffic_year = trafficAttrs?.Year || null;
      enrichedData.traffic_segment_id = trafficAttrs?.SEGID || null;
      enrichedData.traffic_distance_ft = trafficAttrs?.distance_ft;
      enrichedData.traffic_road_name = trafficAttrs?.road_name;
      enrichedData.traffic_direction = trafficAttrs?.direction;
      
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
      
      if (!trafficAttrs?.AADT) {
        dataFlags.push('traffic_not_found');
        console.log('No TxDOT traffic counts within search radius.');
      }
    } catch (err) {
      console.error('TxDOT AADT enrichment failed:', err.message);
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
      const updateData = {
        // Location
        geo_lat: enrichedData.geo_lat,
        geo_lng: enrichedData.geo_lng,
        situs_address: enrichedData.situs_address,
        formatted_address: enrichedData.situs_address, // Same as situs_address from geocoding
        place_id: enrichedData.place_id,
        county: enrichedData.administrative_area_level_2,
        city: enrichedData.city,
        administrative_area_level_1: enrichedData.administrative_area_level_1,
        postal_code: enrichedData.postal_code,
        neighborhood: enrichedData.neighborhood,
        sublocality: enrichedData.sublocality,
        submarket_enriched: enrichedData.submarket_enriched,
        mud_district: enrichedData.mud_district,
        etj_provider: enrichedData.etj_provider,
        
        // Parcel
        parcel_id: enrichedData.parcel_id,
        parcel_owner: enrichedData.parcel_owner,
        acreage_cad: enrichedData.acreage_cad,
        lot_size_value: enrichedData.acreage_cad, // Auto-fill from CAD acreage
        lot_size_unit: enrichedData.acreage_cad ? 'acres' : null, // Set unit when we have acreage
        
        // Zoning
        zoning_code: enrichedData.zoning_code,
        overlay_district: enrichedData.overlay_district,
        
        // Floodplain / Environmental
        floodplain_zone: enrichedData.floodplain_zone,
        base_flood_elevation: enrichedData.base_flood_elevation,
        fema_panel_id: enrichedData.fema_panel_id,
        elevation: enrichedData.elevation || null,
        topography_map_url: enrichedData.topography_map_url || null,
        aerial_imagery_url: enrichedData.aerial_imagery_url || null,
        wetlands_type: enrichedData.wetlands_type,
        soil_series: enrichedData.soil_series,
        soil_slope_percent: enrichedData.soil_slope_percent,
        soil_drainage_class: enrichedData.soil_drainage_class,
        environmental_sites: enrichedData.environmental_sites || [],
        historical_flood_events: enrichedData.historical_flood_events || 0,
        
        // Utilities / Infrastructure
        water_lines: enrichedData.water_lines,
        sewer_lines: enrichedData.sewer_lines,
        storm_lines: enrichedData.storm_lines,
        water_capacity_mgd: enrichedData.water_capacity_mgd,
        sewer_capacity_mgd: enrichedData.sewer_capacity_mgd,
        power_kv_nearby: enrichedData.power_kv_nearby,
        fiber_available: enrichedData.fiber_available || false,
        broadband_providers: enrichedData.broadband_providers || [],
        utilities_map_url: enrichedData.utilities_map_url,
        
        // Traffic / Mobility
        traffic_aadt: enrichedData.traffic_aadt,
        traffic_year: enrichedData.traffic_year,
        traffic_segment_id: enrichedData.traffic_segment_id,
        traffic_distance_ft: enrichedData.traffic_distance_ft,
        traffic_road_name: enrichedData.traffic_road_name,
        traffic_direction: enrichedData.traffic_direction,
        traffic_map_url: enrichedData.traffic_map_url,
        truck_percent: enrichedData.truck_percent,
        congestion_level: enrichedData.congestion_level,
        nearest_highway: enrichedData.nearest_highway,
        distance_highway_ft: enrichedData.distance_highway_ft,
        nearest_transit_stop: enrichedData.nearest_transit_stop,
        distance_transit_ft: enrichedData.distance_transit_ft,
        drive_time_15min_population: enrichedData.drive_time_15min_population,
        drive_time_30min_population: enrichedData.drive_time_30min_population,
        
        // Demographics / Market
        population_1mi: enrichedData.population_1mi,
        population_3mi: enrichedData.population_3mi,
        population_5mi: enrichedData.population_5mi,
        median_income: enrichedData.median_income,
        households_5mi: enrichedData.households_5mi,
        employment_clusters: enrichedData.employment_clusters || [],
        growth_rate_5yr: enrichedData.growth_rate_5yr,
        
        // Financial / Incentives
        tax_rate_total: enrichedData.tax_rate_total,
        taxing_jurisdictions: enrichedData.taxing_jurisdictions || [],
        opportunity_zone: enrichedData.opportunity_zone || false,
        enterprise_zone: enrichedData.enterprise_zone || false,
        foreign_trade_zone: enrichedData.foreign_trade_zone || false,
        average_permit_time_months: enrichedData.average_permit_time_months,
        
        // Observability
        api_meta: apiMeta,
        enrichment_status: dataFlags.length === 0 ? 'complete' : 
                          dataFlags.length < 3 ? 'partial' : 'failed',
        
        // Data quality flags
        data_flags: dataFlags
      };

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
    }

    // Return success response (Step 10 AI Generation would happen after this in a separate process)
    return new Response(JSON.stringify({
      success: true,
      county: countyName,
      data: enrichedData,
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
