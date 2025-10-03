import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// County endpoint catalog - Texas major counties
const ENDPOINT_CATALOG: Record<string, any> = {
  "Harris County": {
    // Primary HCAD parcel service (most reliable)
    parcel_url: "https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query",
    // Alternate HCAD service (fallback if primary fails)
    parcel_url_alt: "https://maps.hcad.org/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: "https://services.arcgis.com/su8ic9KbA7PYVxPS/arcgis/rest/services/Current_Zoning_/FeatureServer/0/query",
    // HCAD-specific field mappings
    parcel_id_field: "HCAD_NUM",
    owner_field: "OWNER_NAME",
    owner_field_alt: "owner_name_1",
    acreage_field: "ACRES",
    acreage_field_alt: "StatedArea",
    zoning_field: "ZONECODE",
    overlay_field: "OVERLAY",
    // Houston utility endpoints - using COH open data portal
    water_lines_url: "https://services.arcgis.com/su8ic9KbA7PYVxPS/arcgis/rest/services/Water_Lines/FeatureServer/0/query",
    sewer_lines_url: "https://services.arcgis.com/su8ic9KbA7PYVxPS/arcgis/rest/services/Sanitary_Sewer_Lines/FeatureServer/0/query",
    storm_lines_url: "https://services.arcgis.com/su8ic9KbA7PYVxPS/arcgis/rest/services/Storm_Lines/FeatureServer/0/query"
  },
  "Fort Bend County": {
    // Primary parcel source (FBCAD public data - most reliable)
    parcel_url: "https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0/query",
    // Fallback parcel source (county GIS)
    parcel_url_alt: "https://gisweb.fortbendcountytx.gov/arcgis/rest/services/General/Parcels/MapServer/0/query",
    zoning_url: "https://gisweb.fortbendcountytx.gov/arcgis/rest/services/Planning/Zoning/MapServer/0/query",
    // FBCAD-specific field mappings
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
    // GCAD parcel service
    parcel_url: "https://www1.cityofwebster.com/arcgis/rest/services/Landbase/CountyGalveston/MapServer/0/query",
    zoning_url: "https://gis.galvestontx.gov/server/rest/services/Planning/Zoning/MapServer/0/query",
    // GCAD-specific field mappings
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
    // DCAD parcel service
    parcel_url: "https://gisservices.dallasopendata.com/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: "https://gis.dallascityhall.com/arcgis/rest/services/Zoning/MapServer/0/query",
    // DCAD-specific field mappings
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
    // TAD parcel service
    parcel_url: "https://gis.tad.org/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: null,
    // TAD-specific field mappings
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER_NAME",
    owner_field_alt: "OWNER",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null,
    // Fort Worth utility endpoints
    water_lines_url: "https://gis.fortworthtexas.gov/arcgis/rest/services/Utilities/Water_Lines/MapServer/0/query",
    sewer_lines_url: "https://gis.fortworthtexas.gov/arcgis/rest/services/Utilities/Wastewater_Lines/MapServer/0/query",
    storm_lines_url: "https://gis.fortworthtexas.gov/arcgis/rest/services/Utilities/Storm_Lines/MapServer/0/query"
  },
  "Collin County": {
    parcel_url: "https://ccad-tx.maps.arcgis.com/arcgis/rest/services/Parcels/FeatureServer/0/query",
    zoning_url: null,
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
    parcel_url: "https://gis.dentoncad.com/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: null,
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
    // Travis CAD parcel service (Austin area)
    parcel_url: "https://gis.traviscad.org/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: "https://data.austintexas.gov/resource/zoning.json",
    // Travis CAD-specific field mappings
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: "ZONE",
    overlay_field: "OVERLAY",
    // Austin utility endpoints
    water_lines_url: "https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/WATER_water_line/FeatureServer/0/query",
    sewer_lines_url: "https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/WATER_wastewater_line/FeatureServer/0/query"
  },
  "Williamson County": {
    // WCAD parcel service
    parcel_url: "https://gis.wcad.org/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: null,
    // WCAD-specific field mappings
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
    parcel_url: "https://gis.bcad.org/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: null, // San Antonio has zoning but needs different API approach
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
const FEMA_NFHL_ZONES_URL = "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query"; // Flood Hazard Zones
const FEMA_NFHL_AVAILABILITY_URL = "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/0/query"; // Check data availability
const USGS_ELEVATION_URL = "https://nationalmap.gov/epqs/pqs.php";
const USFWS_WETLANDS_URL = "https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/1/query";
const USDA_SOIL_URL = "https://SDMDataAccess.sc.egov.usda.gov/Tabular/post.rest";
const EPA_FRS_URL = "https://enviro.epa.gov/frs/frs_rest_services";
const NOAA_STORM_URL = "https://www.ncdc.noaa.gov/stormevents/csv";
const FCC_BROADBAND_URL = "https://broadbandmap.fcc.gov/api/nationwide";
// TxDOT Official Traffic Data Endpoints
const TXDOT_AADT_URL = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_AADT/FeatureServer/0/query";
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
    // EPA FRS API - search within county
    const response = await fetch(
      `${EPA_FRS_URL}?county=${encodeURIComponent(county)}&state=TX&output=JSON`
    );
    const data = await safeJsonParse(response, 'EPA environmental sites query');
    
    const sites = (data?.Results?.FRSFacility || []).slice(0, 10).map((site: any) => ({
      site_name: site.RegistryName,
      program: site.ProgramSystemAcronym,
      status: site.FacilityStatusCode
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
    // FCC Broadband Map API - nationwide dataset
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(
      `${FCC_BROADBAND_URL}?latitude=${lat}&longitude=${lng}`,
      { signal: controller.signal }
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

// Helper function to fetch TxDOT traffic data (with confirmed endpoints)
async function fetchTrafficData(lat: number, lng: number): Promise<any> {
  try {
    const searchRadius = '5280'; // 1 mile
    const commonParams = {
      geometry: `${lng},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      distance: searchRadius,
      units: 'esriFeet',
      where: '1=1',
      outFields: '*',
      returnGeometry: 'true',
      f: 'json'
    };

    let trafficResult: any = {
      traffic_aadt: null,
      traffic_year: null,
      traffic_segment_id: null,
      traffic_distance_ft: null,
      traffic_road_name: null,
      traffic_direction: null,
      traffic_map_url: null,
      congestion_level: null,
      truck_percent: null
    };

    console.log('Fetching traffic data from TxDOT AADT service...');

    // Try TxDOT AADT service first (primary source)
    try {
      const params = new URLSearchParams(commonParams as any);
      const resp = await fetch(`${TXDOT_AADT_URL}?${params}`, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (resp.ok) {
        const text = await resp.text();
        if (text && !text.trim().startsWith('<')) {
          const data = JSON.parse(text);
          
          if (data?.features && data.features.length > 0) {
            // Sort by distance to find nearest segment
            const sortedFeatures = data.features.sort((a: any, b: any) => {
              const geomA = a.geometry;
              const geomB = b.geometry;
              const distA = geomA?.x && geomA?.y ? haversineFt(lat, lng, geomA.y, geomA.x) : Infinity;
              const distB = geomB?.x && geomB?.y ? haversineFt(lat, lng, geomB.y, geomB.x) : Infinity;
              return distA - distB;
            });
            
            const feature = sortedFeatures[0];
            const attrs = feature.attributes || {};
            const geom = feature.geometry;
            const distFt = geom?.x && geom?.y ? haversineFt(lat, lng, geom.y, geom.x) : null;
            
            // TxDOT AADT confirmed field mappings
            const aadt = attrs.AADT_CUR || attrs.AADT || attrs.CUR_AADT || null;
            const year = attrs.ADT_YEAR || attrs.AADT_YEAR || attrs.YEAR || 2024;
            const segmentId = attrs.OBJECTID || attrs.SECTION_ID || attrs.RTE_ID || null;
            const roadName = attrs.RTE_NM || attrs.ROUTE_NAME || attrs.RD_NAME || null;
            const roadPrefix = attrs.RTE_PRFX || null;
            const direction = attrs.DIRECTION || attrs.DIR || null;
            
            // Build full road name with prefix if available
            const fullRoadName = roadPrefix ? `${roadPrefix} ${roadName}` : roadName;
            
            if (aadt || fullRoadName) {
              console.log('Traffic data from TxDOT AADT:', {
                aadt,
                year,
                segmentId,
                roadName: fullRoadName,
                direction,
                distFt
              });
              
              trafficResult = {
                traffic_aadt: aadt ? Number(aadt) : null,
                traffic_year: year ? Number(year) : null,
                traffic_segment_id: segmentId ? String(segmentId) : null,
                traffic_distance_ft: distFt,
                traffic_road_name: fullRoadName,
                traffic_direction: direction,
                traffic_map_url: TXDOT_AADT_URL.replace('/query', ''),
                congestion_level: null, // Will be populated below
                truck_percent: null // Will be populated below
              };
            }
          }
        }
      }
    } catch (error) {
      console.error('TxDOT AADT error:', error);
    }

    // If AADT didn't return data, try fallbacks before fetching supplemental data
    if (!trafficResult.traffic_aadt && !trafficResult.traffic_road_name) {

      // Try Houston-specific traffic data as fallback
      console.log('Trying Houston traffic data fallback...');
      try {
        const params = new URLSearchParams(commonParams as any);
        const resp = await fetch(`${HOUSTON_TRAFFIC_URL}?${params}`, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (resp.ok) {
          const text = await resp.text();
          if (text && !text.trim().startsWith('<')) {
            const data = JSON.parse(text);
            
            if (data?.features && data.features.length > 0) {
              const feature = data.features[0];
              const attrs = feature.attributes || {};
              const geom = feature.geometry;
              const distFt = geom?.x && geom?.y ? haversineFt(lat, lng, geom.y, geom.x) : null;
              
              const aadt = attrs.AADT || attrs.TRAFFIC_VOLUME || attrs.ADT || null;
              const year = attrs.YEAR || attrs.DATA_YEAR || 2024;
              const roadName = attrs.STREET_NAME || attrs.STREET || attrs.NAME || null;
              
              if (aadt || roadName) {
                console.log('Traffic data from Houston:', {
                  aadt,
                  year,
                  roadName,
                  distFt
                });
                
                trafficResult = {
                  traffic_aadt: aadt ? Number(aadt) : null,
                  traffic_year: year ? Number(year) : null,
                  traffic_segment_id: attrs.OBJECTID ? String(attrs.OBJECTID) : null,
                  traffic_distance_ft: distFt,
                  traffic_road_name: roadName,
                  traffic_direction: attrs.DIRECTION || null,
                  traffic_map_url: HOUSTON_TRAFFIC_URL.replace('/query', ''),
                  congestion_level: null,
                  truck_percent: null
                };
              }
            }
          }
        }
      } catch (error) {
        console.error('Houston traffic error:', error);
      }
    }

    // If still no data, try TxDOT Roadways fallback (for road name only, no AADT)
    if (!trafficResult.traffic_aadt && !trafficResult.traffic_road_name) {
      console.log('Trying TxDOT Roadways fallback (no AADT available)...');
      try {
        const params = new URLSearchParams(commonParams as any);
        const resp = await fetch(`${TXDOT_ROADWAYS_URL}?${params}`, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (resp.ok) {
          const text = await resp.text();
          if (text && !text.trim().startsWith('<')) {
            const data = JSON.parse(text);
            
            if (data?.features && data.features.length > 0) {
              const feature = data.features[0];
              const attrs = feature.attributes || {};
              const geom = feature.geometry;
              const distFt = geom?.x && geom?.y ? haversineFt(lat, lng, geom.y, geom.x) : null;
              
              const roadName = attrs.RTE_NM || attrs.ROADWAY_NAME || attrs.NAME || null;
              const roadPrefix = attrs.RTE_PRFX || null;
              const fullRoadName = roadPrefix ? `${roadPrefix} ${roadName}` : roadName;
              
              if (fullRoadName) {
                console.log('Road name from TxDOT Roadways (no AADT):', fullRoadName);
                
                trafficResult = {
                  traffic_aadt: null,
                  traffic_year: null,
                  traffic_segment_id: attrs.OBJECTID ? String(attrs.OBJECTID) : null,
                  traffic_distance_ft: distFt,
                  traffic_road_name: fullRoadName,
                  traffic_direction: attrs.DIRECTION || null,
                  traffic_map_url: TXDOT_ROADWAYS_URL.replace('/query', ''),
                  congestion_level: null,
                  truck_percent: null
                };
              }
            }
          }
        }
      } catch (error) {
        console.error('TxDOT Roadways error:', error);
      }
    }

    // Ultimate fallback to OSM
    if (!trafficResult.traffic_road_name) {
      console.log('All TxDOT sources failed, falling back to OSM');
      const osm = await fallbackRoadFromOSM(lat, lng);
      trafficResult = { 
        ...trafficResult,
        ...osm
      };
    }

    // Now fetch supplemental data: congestion level and truck percent
    // These are additional queries to enrich the traffic data we already have
    
    // Fetch congestion level from TxDOT Congestion service
    console.log('Fetching congestion level from TxDOT...');
    try {
      const congParams = new URLSearchParams(commonParams as any);
      const congResp = await fetch(`${TXDOT_CONGESTION_URL}?${congParams}`, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (congResp.ok) {
        const congText = await congResp.text();
        if (congText && !congText.trim().startsWith('<')) {
          const congData = JSON.parse(congText);
          
          if (congData?.features && congData.features.length > 0) {
            // Find the nearest congestion segment
            const sortedCong = congData.features.sort((a: any, b: any) => {
              const geomA = a.geometry;
              const geomB = b.geometry;
              const distA = geomA?.x && geomA?.y ? haversineFt(lat, lng, geomA.y, geomA.x) : Infinity;
              const distB = geomB?.x && geomB?.y ? haversineFt(lat, lng, geomB.y, geomB.x) : Infinity;
              return distA - distB;
            });
            
            const congFeature = sortedCong[0];
            const congAttrs = congFeature.attributes || {};
            const congLevel = congAttrs.CUR_CONG || congAttrs.CONG_LVL || congAttrs.CONGESTION || null;
            
            if (congLevel) {
              trafficResult.congestion_level = String(congLevel);
              console.log('Congestion level found:', congLevel);
            }
          }
        }
      }
    } catch (error) {
      console.error('TxDOT Congestion error:', error);
    }

    // Fetch truck percent from TxDOT Truck Percent service
    console.log('Fetching truck percentage from TxDOT...');
    try {
      const truckParams = new URLSearchParams(commonParams as any);
      const truckResp = await fetch(`${TXDOT_TRUCK_URL}?${truckParams}`, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (truckResp.ok) {
        const truckText = await truckResp.text();
        if (truckText && !truckText.trim().startsWith('<')) {
          const truckData = JSON.parse(truckText);
          
          if (truckData?.features && truckData.features.length > 0) {
            // Find the nearest truck segment
            const sortedTruck = truckData.features.sort((a: any, b: any) => {
              const geomA = a.geometry;
              const geomB = b.geometry;
              const distA = geomA?.x && geomA?.y ? haversineFt(lat, lng, geomA.y, geomA.x) : Infinity;
              const distB = geomB?.x && geomB?.y ? haversineFt(lat, lng, geomB.y, geomB.x) : Infinity;
              return distA - distB;
            });
            
            const truckFeature = sortedTruck[0];
            const truckAttrs = truckFeature.attributes || {};
            // Try various possible field names for truck percentage
            const truckPct = truckAttrs.TRUCK_PCT || truckAttrs.PCT_TRUCKS || 
                            truckAttrs.TRUCK_PERCENT || truckAttrs['%_TRUCKS'] || null;
            
            if (truckPct !== null && truckPct !== undefined) {
              trafficResult.truck_percent = Number(truckPct);
              console.log('Truck percentage found:', truckPct);
            }
          }
        }
      }
    } catch (error) {
      console.error('TxDOT Truck Percent error:', error);
    }

    return trafficResult;
  } catch (error) {
    console.error('Traffic data fetch error:', error);
    return {
      traffic_aadt: null,
      traffic_year: null,
      traffic_segment_id: null,
      traffic_road_name: null,
      traffic_distance_ft: null,
      traffic_direction: null,
      traffic_map_url: null,
      congestion_level: null,
      truck_percent: null
    };
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
async function fetchUtilities(lat: number, lng: number, endpoints: any): Promise<any> {
  const utilities: any = {
    water_lines: null,
    sewer_lines: null,
    storm_lines: null,
    water_capacity_mgd: null,
    sewer_capacity_mgd: null,
    power_kv_nearby: null
  };

  const searchRadius = 500; // 500 feet radius

  try {
    // Fetch water lines if endpoint exists
    if (endpoints.water_lines_url) {
      console.log('Fetching water lines from:', endpoints.water_lines_url);
      const waterParams = new URLSearchParams({
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
      });

      const waterResp = await fetch(`${endpoints.water_lines_url}?${waterParams}`);
      const waterData = await safeJsonParse(waterResp, 'Water lines query');
      
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
      const sewerParams = new URLSearchParams({
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
      });

      const sewerResp = await fetch(`${endpoints.sewer_lines_url}?${sewerParams}`);
      const sewerData = await safeJsonParse(sewerResp, 'Sewer lines query');
      
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
      const stormParams = new URLSearchParams({
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
      });

      const stormResp = await fetch(`${endpoints.storm_lines_url}?${stormParams}`);
      const stormData = await safeJsonParse(stormResp, 'Storm lines query');
      
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
      
      const parcelParams = new URLSearchParams({
        geometry: `${geoLng},${geoLat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: outFieldsList || '*',
        returnGeometry: 'false',
        f: 'json'
      });

      let parcelData = null;
      
      // Try primary parcel URL first
      if (endpoints.parcel_url) {
        console.log('Querying parcel data from primary endpoint...');
        try {
          const parcelResp = await fetch(`${endpoints.parcel_url}?${parcelParams}`);
          parcelData = await safeJsonParse(parcelResp, 'Primary parcel query');
          if (parcelData?.features?.[0]) {
            console.log('Primary parcel data found');
          }
        } catch (parcelError) {
          console.error('Primary parcel query failed:', parcelError);
        }
      }

      // Try alternate parcel URL if primary failed or returned no data
      if (!parcelData?.features?.[0] && endpoints.parcel_url_alt) {
        console.log('Trying alternate parcel endpoint...');
        try {
          const altParcelResp = await fetch(`${endpoints.parcel_url_alt}?${parcelParams}`);
          parcelData = await safeJsonParse(altParcelResp, 'Alternate parcel query');
          if (parcelData?.features?.[0]) {
            console.log('Alternate parcel data found');
          }
        } catch (altError) {
          console.error('Alternate parcel query failed:', altError);
        }
      }

      if (parcelData?.features?.[0]) {
        const attrs = parcelData.features[0].attributes;
        
        // Try primary parcel ID field, then alternative field
        enrichedData.parcel_id = attrs[endpoints.parcel_id_field] || 
                                  (endpoints.parcel_id_alt_field ? attrs[endpoints.parcel_id_alt_field] : null);
        
        // Try primary owner field, then alternative field
        enrichedData.parcel_owner = attrs[endpoints.owner_field] || 
                                     (endpoints.owner_field_alt ? attrs[endpoints.owner_field_alt] : null);
        
        // Try primary acreage field, then alternative field
        enrichedData.acreage_cad = attrs[endpoints.acreage_field] || 
                                    (endpoints.acreage_field_alt ? attrs[endpoints.acreage_field_alt] : null);
        
        console.log('Parcel data found:', {
          parcel_id: enrichedData.parcel_id,
          parcel_owner: enrichedData.parcel_owner,
          acreage: enrichedData.acreage_cad,
          rawAttributes: attrs
        });
        
        // Flag if owner data is missing (some counties don't expose it publicly)
        if (!enrichedData.parcel_owner) {
          dataFlags.push('parcel_owner_missing');
          console.log('Parcel owner data not available (county privacy policy)');
        }
      } else {
        dataFlags.push('parcel_not_found');
        console.log('No parcel data found at this location');
      }
    } catch (error) {
      console.error('Parcel query error:', error);
      dataFlags.push('parcel_query_failed');
    }

    // Step 4: Query zoning data (skip for Fort Bend County)
    if (endpoints.zoning_url) {
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
      // First check if NFHL data is available for this location
      const availParams = new URLSearchParams({
        geometry: `${geoLng},${geoLat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        returnGeometry: 'false',
        f: 'json'
      });

      const availResp = await fetch(`${FEMA_NFHL_AVAILABILITY_URL}?${availParams}`, {
        headers: { 'Accept': 'application/json' }
      });
      const availData = await safeJsonParse(availResp, 'FEMA availability check');
      
      if (availData?.features && availData.features.length > 0) {
        console.log('FEMA NFHL data available, querying flood zones...');
        
        // Query flood hazard zones (Layer 28)
        const femaParams = new URLSearchParams({
          geometry: `${geoLng},${geoLat}`,
          geometryType: 'esriGeometryPoint',
          inSR: '4326',
          spatialRel: 'esriSpatialRelIntersects',
          outFields: 'FLD_ZONE,BFE,STATIC_BFE,DFIRM_ID,PANEL_TYP,ZONE_SUBTY',
          returnGeometry: 'false',
          f: 'json'
        });

        const femaResp = await fetch(`${FEMA_NFHL_ZONES_URL}?${femaParams}`, {
          headers: { 'Accept': 'application/json' }
        });
        const femaData = await safeJsonParse(femaResp, 'FEMA flood zones query');

        if (femaData?.features && femaData.features.length > 0) {
          const attrs = femaData.features[0].attributes;
          
          // Map FEMA fields to schema
          enrichedData.floodplain_zone = attrs.FLD_ZONE || attrs.ZONE_SUBTY || null;
          enrichedData.base_flood_elevation = attrs.BFE || attrs.STATIC_BFE || null;
          enrichedData.fema_panel_id = attrs.DFIRM_ID || attrs.PANEL_TYP || null;
          
          console.log('FEMA flood data found:', {
            floodplain_zone: enrichedData.floodplain_zone,
            base_flood_elevation: enrichedData.base_flood_elevation,
            fema_panel_id: enrichedData.fema_panel_id,
            raw_attrs: attrs
          });
        } else {
          console.log('No flood zone features found at this location');
          dataFlags.push('floodplain_missing');
        }
      } else {
        console.log('FEMA NFHL data not available for this location');
        dataFlags.push('floodplain_missing');
      }
    } catch (error) {
      console.error('FEMA query error:', error);
      dataFlags.push('floodplain_missing');
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
    const utilities = await fetchUtilities(geoLat, geoLng, endpoints);
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

    console.log('Fetching broadband data...');
    const broadband = await fetchBroadband(geoLat, geoLng);
    console.log('Broadband result:', broadband);
    Object.assign(enrichedData, broadband);

    // Step 7: Traffic & Mobility
    console.log('Fetching traffic data...');
    const trafficData = await fetchTrafficData(geoLat, geoLng);
    console.log('Traffic result:', trafficData);
    Object.assign(enrichedData, trafficData);
    if (!trafficData.traffic_aadt && !trafficData.traffic_road_name) {
      dataFlags.push('traffic_missing');
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

    // Step 9: Financial / Incentives
    console.log('Fetching property tax data...');
    const taxData = await fetchPropertyTax(geoLat, geoLng, countyName, endpoints);
    Object.assign(enrichedData, taxData);

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
        neighborhood: enrichedData.neighborhood,
        sublocality: enrichedData.sublocality,
        submarket_enriched: enrichedData.submarket_enriched,
        
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
        
        // Utilities / Infrastructure
        water_lines: enrichedData.water_lines,
        sewer_lines: enrichedData.sewer_lines,
        storm_lines: enrichedData.storm_lines,
        water_capacity_mgd: enrichedData.water_capacity_mgd,
        sewer_capacity_mgd: enrichedData.sewer_capacity_mgd,
        power_kv_nearby: enrichedData.power_kv_nearby,
        fiber_available: enrichedData.fiber_available || false,
        broadband_providers: enrichedData.broadband_providers || [],
        
        // Traffic / Mobility
        traffic_aadt: enrichedData.traffic_aadt,
        traffic_year: enrichedData.traffic_year,
        traffic_segment_id: enrichedData.traffic_segment_id,
        traffic_distance_ft: enrichedData.traffic_distance_ft,
        traffic_road_name: enrichedData.traffic_road_name,
        traffic_direction: enrichedData.traffic_direction,
        traffic_map_url: enrichedData.traffic_map_url,
        nearest_highway: enrichedData.nearest_highway,
        distance_highway_ft: enrichedData.distance_highway_ft,
        nearest_transit_stop: enrichedData.nearest_transit_stop,
        distance_transit_ft: enrichedData.distance_transit_ft,
        
        // Demographics / Market
        population_1mi: enrichedData.population_1mi,
        population_3mi: enrichedData.population_3mi,
        population_5mi: enrichedData.population_5mi,
        median_income: enrichedData.median_income,
        households_5mi: enrichedData.households_5mi,
        growth_rate_5yr: enrichedData.growth_rate_5yr,
        
        // Financial / Incentives
        tax_rate_total: enrichedData.tax_rate_total,
        taxing_jurisdictions: enrichedData.taxing_jurisdictions || [],
        opportunity_zone: enrichedData.opportunity_zone || false,
        enterprise_zone: enrichedData.enterprise_zone || false,
        foreign_trade_zone: enrichedData.foreign_trade_zone || false,
        average_permit_time_months: enrichedData.average_permit_time_months,
        
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
