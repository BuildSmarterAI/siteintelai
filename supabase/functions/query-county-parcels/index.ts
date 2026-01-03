import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CountyConfig {
  name: string;
  featureServerUrl: string;
  acreageField: string;
  outFields: string[];
  ownerField: string;
  addressField: string;
  apnField: string;
  compositeAddress?: boolean; // If true, build address from component fields
  available?: boolean; // If false, skip this county
}

const COUNTY_CONFIGS: Record<string, CountyConfig> = {
  HARRIS: {
    name: "Harris",
    featureServerUrl: "https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0",
    acreageField: "acreage_1",
    outFields: ["OBJECTID", "acct_num", "owner_name_1", "acreage_1", "land_value", "impr_value", "site_str_num", "site_str_name", "site_str_sfx", "site_city", "site_zip"],
    ownerField: "owner_name_1",
    addressField: "", // Built from composite fields
    apnField: "acct_num",
    compositeAddress: true,
    available: true,
  },
  "FORT BEND": {
    name: "Fort Bend",
    featureServerUrl: "https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0",
    acreageField: "acreage",
    outFields: ["OBJECTID", "propnumber", "ownername", "acreage", "situs", "totalvalue"],
    ownerField: "ownername",
    addressField: "situs",
    apnField: "propnumber",
    available: true,
  },
  MONTGOMERY: {
    name: "Montgomery",
    featureServerUrl: "https://gis.mctx.org/arcgis/rest/services/MCAD/Parcels/MapServer/0",
    acreageField: "ACRES",
    outFields: ["OBJECTID", "PROP_ID", "OWNER_NAME", "ACRES", "SITUS_ADDR", "TOTAL_MKT"],
    ownerField: "OWNER_NAME",
    addressField: "SITUS_ADDR",
    apnField: "PROP_ID",
    available: false, // Endpoint may be unavailable
  },
};

interface QueryRequest {
  county: string;
  acreage_min: number;
  acreage_max: number;
  limit?: number;
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

interface NormalizedParcel {
  parcel_uuid: string;
  source_parcel_id: string;
  owner_name: string | null;
  acreage: number | null;
  situs_address: string | null;
  county: string;
  geometry: any;
  match_score: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: QueryRequest = await req.json();
    const { county, acreage_min, acreage_max, limit = 10, bbox } = body;

    console.log("[query-county-parcels] Request:", { county, acreage_min, acreage_max, limit });

    const countyUpper = county?.toUpperCase()?.trim();
    const config = COUNTY_CONFIGS[countyUpper];

    if (!config) {
      console.log("[query-county-parcels] Unsupported county:", countyUpper);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Unsupported county: ${county}. Supported: ${Object.keys(COUNTY_CONFIGS).join(", ")}`,
          parcels: [] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if county is available
    if (config.available === false) {
      console.log("[query-county-parcels] County marked unavailable:", countyUpper);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `${config.name} County endpoint is currently unavailable`,
          parcels: [] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build WHERE clause for acreage filter
    const whereClause = `${config.acreageField} >= ${acreage_min} AND ${config.acreageField} <= ${acreage_max}`;

    // Build query URL
    const queryParams = new URLSearchParams({
      where: whereClause,
      outFields: config.outFields.join(","),
      returnGeometry: "true",
      outSR: "4326",
      f: "geojson",
      resultRecordCount: String(limit),
    });

    // Add bbox if provided
    if (bbox && bbox.length === 4) {
      queryParams.set("geometry", `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`);
      queryParams.set("geometryType", "esriGeometryEnvelope");
      queryParams.set("inSR", "4326");
      queryParams.set("spatialRel", "esriSpatialRelIntersects");
    }

    const queryUrl = `${config.featureServerUrl}/query?${queryParams.toString()}`;
    console.log("[query-county-parcels] Querying:", queryUrl);

    const response = await fetch(queryUrl, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      console.error("[query-county-parcels] ArcGIS error:", response.status, response.statusText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `ArcGIS query failed: ${response.status}`,
          parcels: [] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geoJson = await response.json();

    if (geoJson.error) {
      console.error("[query-county-parcels] ArcGIS returned error:", geoJson.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: geoJson.error.message || "ArcGIS query error",
          parcels: [] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const features = geoJson.features || [];
    console.log("[query-county-parcels] Retrieved", features.length, "parcels from", countyUpper);

    // Normalize parcels to standard format
    const parcels: NormalizedParcel[] = features.map((f: any, idx: number) => {
      const props = f.properties || {};
      const acreage = props[config.acreageField] || props[config.acreageField.toLowerCase()];
      
      // Build address - composite for Harris County, direct field for others
      let situsAddress: string | null = null;
      if (config.compositeAddress) {
        // Harris County: build from component fields
        const parts = [
          props.site_str_num,
          props.site_str_name,
          props.site_str_sfx,
          props.site_city,
          props.site_zip
        ].filter(Boolean);
        situsAddress = parts.length > 0 ? parts.join(" ") : null;
      } else {
        situsAddress = props[config.addressField] || null;
      }
      
      // Calculate match score based on acreage proximity
      const targetAcreage = (acreage_min + acreage_max) / 2;
      const acreageDiff = Math.abs((acreage || 0) - targetAcreage);
      const acreageScore = Math.max(0.5, 1 - (acreageDiff / targetAcreage));

      return {
        parcel_uuid: `live_${countyUpper}_${props[config.apnField] || props.OBJECTID || idx}`,
        source_parcel_id: String(props[config.apnField] || props.OBJECTID || ""),
        owner_name: props[config.ownerField] || null,
        acreage: acreage || null,
        situs_address: situsAddress,
        county: countyUpper,
        geometry: f.geometry,
        match_score: acreageScore,
      };
    });

    // Sort by match score
    parcels.sort((a, b) => b.match_score - a.match_score);

    console.log("[query-county-parcels] Returning", parcels.length, "normalized parcels");
    console.log("[query-county-parcels] DataSource:", countyUpper, "| CandidateCount:", parcels.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        parcels,
        source: "live_county_query",
        county: countyUpper,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[query-county-parcels] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error",
        parcels: [] 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
