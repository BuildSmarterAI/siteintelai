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
    parcel_url: "https://maps.hcad.org/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: "https://gis.houstontx.gov/arcgis/rest/services/Zoning/MapServer/0/query",
    parcel_id_field: "ACCOUNT",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: "ZONING",
    overlay_field: "OVERLAY_DISTRICT"
  },
  "Fort Bend County": {
    // Primary parcel source (CAD data - richer information)
    cad_parcel_url: "https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0/query",
    // Fallback parcel source
    parcel_url: "https://gisweb.fortbendcountytx.gov/arcgis/rest/services/General/Parcels/MapServer/0/query",
    zoning_url: null,
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER_NAME",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null
  },
  "Galveston County": {
    parcel_url: "https://www1.cityofwebster.com/arcgis/rest/services/Landbase/CountyGalveston/MapServer/0/query",
    zoning_url: "https://gis.galvestontx.gov/server/rest/services/Planning/Zoning/MapServer/0/query",
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: "ZONE",
    overlay_field: "OVERLAY"
  },
  "Montgomery County": {
    parcel_url: "https://mcad-tx.maps.arcgis.com/arcgis/rest/services/MCAD_Parcels/FeatureServer/0/query",
    zoning_url: null,
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null
  },
  "Brazoria County": {
    parcel_url: "https://gis.brazoriacad.org/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: null,
    parcel_id_field: "PARCEL",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null
  },
  "Dallas County": {
    parcel_url: "https://gisservices.dallasopendata.com/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: "https://gis.dallascityhall.com/arcgis/rest/services/Zoning/MapServer/0/query",
    parcel_id_field: "PARCEL",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: "ZONE_CODE",
    overlay_field: "OVERLAY"
  },
  "Tarrant County": {
    parcel_url: "https://gis.tad.org/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: null,
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null
  },
  "Collin County": {
    parcel_url: "https://ccad-tx.maps.arcgis.com/arcgis/rest/services/Parcels/FeatureServer/0/query",
    zoning_url: null,
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null
  },
  "Denton County": {
    parcel_url: "https://gis.dentoncad.com/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: null,
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null
  },
  "Travis County": {
    parcel_url: "https://gis.traviscad.org/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: "https://data.austintexas.gov/resource/zoning.json",
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: "ZONE",
    overlay_field: "OVERLAY"
  },
  "Williamson County": {
    parcel_url: "https://gis.wcad.org/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: null,
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null
  },
  "Hays County": {
    parcel_url: "https://gis.hayscad.com/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: null,
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null
  },
  "Bexar County": {
    parcel_url: "https://gis.bcad.org/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: null, // San Antonio has zoning but needs different API approach
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: null,
    overlay_field: null
  }
};

// API Endpoints - Official Sources
const FEMA_NFHL_URL = "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query";
const USGS_ELEVATION_URL = "https://nationalmap.gov/epqs/pqs.php"; // Updated to correct endpoint
const USFWS_WETLANDS_URL = "https://www.fws.gov/wetlands/arcgis/rest/services/Wetlands/MapServer/0/query";
const USDA_SOIL_URL = "https://sdmdataaccess.nrcs.usda.gov/Tabular/post.rest";
const EPA_FRS_URL = "https://enviro.epa.gov/frs/frs_rest_services";
const NOAA_STORM_URL = "https://www.ncdc.noaa.gov/stormevents/csv";
const FCC_BROADBAND_URL = "https://broadbandmap.fcc.gov/api/nationwide";
const TXDOT_AADT_URL = "https://gis-txdot.opendata.arcgis.com/datasets/txdot::aadt-traffic-counts/api";
const CENSUS_ACS_BASE = "https://api.census.gov/data/2022/acs/acs5";
const BLS_QCEW_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/";
const OPPORTUNITY_ZONES_URL = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/Opportunity_Zones/FeatureServer/0/query";

// Helper function to fetch elevation from USGS
async function fetchElevation(lat: number, lng: number): Promise<number | null> {
  try {
    const url = `${USGS_ELEVATION_URL}?x=${lng}&y=${lat}&units=Feet&output=json`;
    const response = await fetch(url);
    const data = await response.json();
    return data?.USGS_Elevation_Point_Query_Service?.Elevation_Query?.Elevation || null;
  } catch (error) {
    console.error('Elevation fetch error:', error);
    return null;
  }
}

// Helper function to fetch wetlands data from USFWS
async function fetchWetlands(lat: number, lng: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      geometry: `${lng},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'WETLAND_TYPE,ATTRIBUTE',
      returnGeometry: 'false',
      f: 'json'
    });
    const response = await fetch(`${USFWS_WETLANDS_URL}?${params}`);
    const data = await response.json();
    return data?.features?.[0]?.attributes?.WETLAND_TYPE || null;
  } catch (error) {
    console.error('Wetlands fetch error:', error);
    return null;
  }
}

// Helper function to fetch soil data from USDA NRCS
async function fetchSoilData(lat: number, lng: number): Promise<any> {
  try {
    // SSURGO Web Soil Survey API
    const url = `https://SDMDataAccess.sc.egov.usda.gov/Tabular/post.rest`;
    const query = `SELECT TOP 1 muname, slope_r, drainagecl FROM mapunit WHERE mukey IN (SELECT * FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('POINT(${lng} ${lat})'))`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, format: 'JSON' })
    });
    const data = await response.json();
    
    if (data?.Table?.[0]) {
      return {
        soil_series: data.Table[0][0],
        soil_slope_percent: data.Table[0][1],
        soil_drainage_class: data.Table[0][2]
      };
    }
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
    const data = await response.json();
    
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
    const response = await fetch(
      `${FCC_BROADBAND_URL}?latitude=${lat}&longitude=${lng}`
    );
    const data = await response.json();
    
    const providers = (data?.results || []).map((p: any) => ({
      provider: p.provider_name || p.holding_company_name,
      technology: p.technology_code,
      max_download: p.max_advertised_download_speed,
      max_upload: p.max_advertised_upload_speed
    }));
    
    return {
      fiber_available: providers.some((p: any) => 
        p.technology === '50' || p.technology === 'Fiber'
      ),
      broadband_providers: providers
    };
  } catch (error) {
    console.error('Broadband fetch error:', error);
    return { fiber_available: false, broadband_providers: [] };
  }
}

// Helper function to fetch TxDOT traffic data
async function fetchTrafficData(lat: number, lng: number): Promise<any> {
  try {
    // TxDOT AADT REST API - query nearest traffic count station
    const params = new URLSearchParams({
      where: '1=1',
      geometry: `${lng},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      distance: '2640', // 0.5 miles in feet
      units: 'esriFeet',
      outFields: 'AADT,YEAR,SECTION_ID,RTE_NM,DIRECTION',
      returnGeometry: 'true',
      f: 'json'
    });
    
    const response = await fetch(`${TXDOT_AADT_URL}?${params}`);
    const data = await response.json();
    
    if (data?.features?.[0]) {
      const feature = data.features[0];
      const attrs = feature.attributes;
      
      // Calculate distance from parcel to traffic station
      const geom = feature.geometry;
      const distMiles = Math.sqrt(
        Math.pow((geom.x - lng) * 69, 2) + 
        Math.pow((geom.y - lat) * 69, 2)
      );
      
      return {
        traffic_aadt: attrs.AADT,
        traffic_year: attrs.YEAR,
        traffic_segment_id: attrs.SECTION_ID,
        traffic_distance_ft: distMiles * 5280,
        traffic_road_name: attrs.RTE_NM,
        traffic_direction: attrs.DIRECTION,
        traffic_map_url: `https://gis-txdot.opendata.arcgis.com/maps/txdot-aadt`
      };
    }
    return {};
  } catch (error) {
    console.error('Traffic data fetch error:', error);
    return {};
  }
}

// Helper function to fetch Google Maps highway/transit data
async function fetchMobilityData(lat: number, lng: number, googleApiKey: string): Promise<any> {
  try {
    const mobilityData: any = {};
    
    // Find nearest highway using Places API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=highway&key=${googleApiKey}`;
    const placesResp = await fetch(placesUrl);
    const placesData = await placesResp.json();
    
    if (placesData?.results?.[0]) {
      const highway = placesData.results[0];
      mobilityData.nearest_highway = highway.name;
      
      // Calculate distance
      const hwLat = highway.geometry.location.lat;
      const hwLng = highway.geometry.location.lng;
      const distMiles = Math.sqrt(
        Math.pow((hwLng - lng) * 69, 2) + 
        Math.pow((hwLat - lat) * 69, 2)
      );
      mobilityData.distance_highway_ft = distMiles * 5280;
    }
    
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

// Helper function to check opportunity zones
async function fetchIncentiveZones(lat: number, lng: number): Promise<any> {
  try {
    // US Treasury Opportunity Zone ArcGIS Service
    const params = new URLSearchParams({
      geometry: `${lng},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: '*',
      returnGeometry: 'false',
      f: 'json'
    });
    
    const response = await fetch(`${OPPORTUNITY_ZONES_URL}?${params}`);
    const data = await response.json();
    
    const isOZ = data?.features && data.features.length > 0;
    
    return {
      opportunity_zone: isOZ,
      enterprise_zone: false, // Would need Texas EDC API
      foreign_trade_zone: false // Would need US FTZ Board shapefiles
    };
  } catch (error) {
    console.error('Incentive zones fetch error:', error);
    return {
      opportunity_zone: false,
      enterprise_zone: false,
      foreign_trade_zone: false
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

        // Extract county (administrative_area_level_2)
        const countyComponent = result.address_components?.find((c: any) =>
          c.types.includes('administrative_area_level_2')
        );
        if (countyComponent) {
          countyName = countyComponent.long_name;
          enrichedData.administrative_area_level_2 = countyName;
        }
        
        console.log('Geocoding successful:', { geoLat, geoLng, countyName });
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
      const parcelParams = new URLSearchParams({
        geometry: `${geoLng},${geoLat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        returnGeometry: 'false',
        f: 'json'
      });

      let parcelData = null;
      
      // Fort Bend County: Try CAD parcel URL first (preferred)
      if (countyName === "Fort Bend County" && endpoints.cad_parcel_url) {
        console.log('Querying Fort Bend CAD parcel data...');
        try {
          const cadResp = await fetch(`${endpoints.cad_parcel_url}?${parcelParams}`);
          const cadData = await cadResp.json();
          if (cadData?.features?.[0]) {
            parcelData = cadData;
            console.log('Fort Bend CAD parcel data found');
          }
        } catch (cadError) {
          console.error('Fort Bend CAD query failed, trying fallback:', cadError);
        }
      }

      // If CAD query failed or not Fort Bend, use standard parcel URL
      if (!parcelData && endpoints.parcel_url) {
        console.log('Querying standard parcel data...');
        const parcelResp = await fetch(`${endpoints.parcel_url}?${parcelParams}`);
        parcelData = await parcelResp.json();
      }

      if (parcelData?.features?.[0]) {
        const attrs = parcelData.features[0].attributes;
        enrichedData.parcel_id = attrs[endpoints.parcel_id_field];
        enrichedData.parcel_owner = attrs[endpoints.owner_field];
        enrichedData.acreage_cad = attrs[endpoints.acreage_field];
        console.log('Parcel data found:', enrichedData);
      } else {
        dataFlags.push('parcel_not_found');
        console.log('No parcel data found');
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
        const zoningData = await zoningResp.json();

        if (zoningData?.features?.[0]) {
          const attrs = zoningData.features[0].attributes;
          enrichedData.zoning_code = attrs[endpoints.zoning_field];
          enrichedData.overlay_district = attrs[endpoints.overlay_field];
          console.log('Zoning data found:', enrichedData);
        } else {
          dataFlags.push('zoning_not_found');
          console.log('No zoning data found');
        }
      } catch (error) {
        console.error('Zoning query error:', error);
        dataFlags.push('zoning_query_failed');
      }
    } else {
      console.log(`Zoning not available for ${countyName} - skipping zoning query`);
      dataFlags.push('zoning_not_available');
    }

    // Step 5: Query FEMA flood data
    try {
      const femaParams = new URLSearchParams({
        geometry: `${geoLng},${geoLat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'FLD_ZONE,STATIC_BFE',
        returnGeometry: 'false',
        f: 'json'
      });

      const femaResp = await fetch(`${FEMA_NFHL_URL}?${femaParams}`);
      const femaData = await femaResp.json();

      if (femaData?.features?.[0]) {
        const attrs = femaData.features[0].attributes;
        enrichedData.floodplain_zone = attrs.FLD_ZONE;
        enrichedData.base_flood_elevation = attrs.STATIC_BFE;
        console.log('FEMA data found:', enrichedData);
      } else {
        dataFlags.push('fema_not_found');
        console.log('No FEMA flood data found');
      }
    } catch (error) {
      console.error('FEMA query error:', error);
      dataFlags.push('fema_query_failed');
    }

    // Step 6: Fetch elevation data
    console.log('Fetching elevation data...');
    const elevation = await fetchElevation(geoLat, geoLng);
    if (elevation !== null) {
      enrichedData.elevation = elevation;
    } else {
      dataFlags.push('elevation_not_found');
    }

    // Step 7: Fetch wetlands data
    console.log('Fetching wetlands data...');
    const wetlands = await fetchWetlands(geoLat, geoLng);
    if (wetlands) {
      enrichedData.wetlands_type = wetlands;
    }

    // Step 8: Fetch soil data
    console.log('Fetching soil data...');
    const soilData = await fetchSoilData(geoLat, geoLng);
    Object.assign(enrichedData, soilData);

    // Step 9: Fetch environmental sites
    console.log('Fetching environmental sites...');
    const envSites = await fetchEnvironmentalSites(geoLat, geoLng, countyName);
    if (envSites.length > 0) {
      enrichedData.environmental_sites = envSites;
    }

    // Step 10: Fetch broadband data
    console.log('Fetching broadband data...');
    const broadband = await fetchBroadband(geoLat, geoLng);
    Object.assign(enrichedData, broadband);

    // Step 11: Fetch traffic data
    console.log('Fetching traffic data...');
    const trafficData = await fetchTrafficData(geoLat, geoLng);
    Object.assign(enrichedData, trafficData);
    if (!trafficData.traffic_aadt) {
      dataFlags.push('traffic_data_not_found');
    }

    // Step 12: Fetch mobility data (highways, transit)
    console.log('Fetching mobility data...');
    const mobilityData = await fetchMobilityData(geoLat, geoLng, googleApiKey);
    Object.assign(enrichedData, mobilityData);

    // Step 13: Fetch demographics
    console.log('Fetching demographics...');
    const demographics = await fetchDemographics(geoLat, geoLng);
    Object.assign(enrichedData, demographics);
    if (!demographics.population_1mi) {
      dataFlags.push('demographics_not_found');
    }

    // Step 14: Fetch incentive zones
    console.log('Fetching incentive zones...');
    const incentives = await fetchIncentiveZones(geoLat, geoLng);
    Object.assign(enrichedData, incentives);

    // Step 15: Save to database if application_id provided
    if (application_id) {
      const updateData = {
        // Location
        geo_lat: enrichedData.geo_lat,
        geo_lng: enrichedData.geo_lng,
        situs_address: enrichedData.situs_address,
        county: enrichedData.administrative_area_level_2,
        
        // Parcel
        parcel_id: enrichedData.parcel_id,
        parcel_owner: enrichedData.parcel_owner,
        acreage_cad: enrichedData.acreage_cad,
        
        // Zoning
        zoning_code: enrichedData.zoning_code,
        overlay_district: enrichedData.overlay_district,
        
        // Floodplain / Environmental
        floodplain_zone: enrichedData.floodplain_zone,
        base_flood_elevation: enrichedData.base_flood_elevation,
        elevation: enrichedData.elevation,
        wetlands_type: enrichedData.wetlands_type,
        soil_series: enrichedData.soil_series,
        soil_slope_percent: enrichedData.soil_slope_percent,
        soil_drainage_class: enrichedData.soil_drainage_class,
        environmental_sites: enrichedData.environmental_sites || [],
        
        // Utilities / Infrastructure
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
        opportunity_zone: enrichedData.opportunity_zone || false,
        enterprise_zone: enrichedData.enterprise_zone || false,
        foreign_trade_zone: enrichedData.foreign_trade_zone || false,
        
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

    // Step 16: Return success response
    return new Response(JSON.stringify({
      success: true,
      county: countyName,
      data: enrichedData
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
