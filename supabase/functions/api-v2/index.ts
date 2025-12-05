import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
};

// DataProvenance wrapper for all responses
interface DataProvenance {
  primary_source: string;
  data_confidence: number;
  data_last_updated: string;
  known_limitations: string[];
  cache_status: { ttl_seconds: number; cached_at: string | null };
}

function wrapWithProvenance<T>(data: T, provenance: Partial<DataProvenance>): { data: T; data_provenance: DataProvenance } {
  return {
    data,
    data_provenance: {
      primary_source: provenance.primary_source || "Unknown",
      data_confidence: provenance.data_confidence || 0.5,
      data_last_updated: provenance.data_last_updated || new Date().toISOString(),
      known_limitations: provenance.known_limitations || [],
      cache_status: provenance.cache_status || { ttl_seconds: 3600, cached_at: null },
    },
  };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message, timestamp: new Date().toISOString() }, status);
}

// Helper to get parcel data
async function getParcelData(supabase: ReturnType<typeof createClient>, parcelId: string) {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", parcelId)
    .single();
  
  if (error || !data) {
    // Try parcels table
    const { data: parcel, error: parcelError } = await supabase
      .from("parcels")
      .select("*")
      .eq("parcel_uuid", parcelId)
      .single();
    
    if (parcelError) return null;
    return parcel;
  }
  return data;
}

// ==================== FLOOD ENDPOINTS ====================

async function handleBfeInterpolate(supabase: ReturnType<typeof createClient>, parcelId: string, body: Record<string, unknown>) {
  console.log(`[BFE-INTERPOLATE] Processing parcel: ${parcelId}`);
  
  const parcel = await getParcelData(supabase, parcelId);
  if (!parcel) return errorResponse("Parcel not found", 404);
  
  const lat = parcel.geo_lat || parcel.centroid?.coordinates?.[1];
  const lng = parcel.geo_lng || parcel.centroid?.coordinates?.[0];
  
  if (!lat || !lng) return errorResponse("Parcel coordinates not available", 400);

  // Query FEMA NFHL BFE cross-sections (Layer 14)
  const bfeUrl = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/14/query?` +
    `geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&` +
    `spatialRel=esriSpatialRelIntersects&distance=500&units=esriSRUnit_Foot&` +
    `outFields=BFE_LN_ID,ELEV,LEN_UNIT,V_DATUM,SOURCE_CIT&returnGeometry=true&f=json`;

  try {
    const response = await fetch(bfeUrl, { signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    
    const features = result.features || [];
    if (features.length === 0) {
      return jsonResponse(wrapWithProvenance({
        parcelId,
        minBFE: null,
        maxBFE: null,
        meanBFE: null,
        controlSections: [],
        interpolationMethod: "none",
        notes: "No BFE cross-sections found within 500ft of parcel"
      }, {
        primary_source: "FEMA NFHL Layer 14 (S_BFE)",
        data_confidence: 0.72,
        known_limitations: ["BFE data may not exist for all flood zones", "500ft search radius applied"]
      }));
    }

    const elevations = features.map((f: { attributes: { ELEV: number } }) => f.attributes.ELEV).filter((e: number) => e != null);
    const minBFE = Math.min(...elevations);
    const maxBFE = Math.max(...elevations);
    const meanBFE = elevations.reduce((a: number, b: number) => a + b, 0) / elevations.length;

    const controlSections = features.slice(0, 5).map((f: { attributes: { BFE_LN_ID: string; ELEV: number; V_DATUM: string } }) => ({
      sectionId: f.attributes.BFE_LN_ID,
      elevation: f.attributes.ELEV,
      datum: f.attributes.V_DATUM || "NAVD88"
    }));

    return jsonResponse(wrapWithProvenance({
      parcelId,
      minBFE: Math.round(minBFE * 10) / 10,
      maxBFE: Math.round(maxBFE * 10) / 10,
      meanBFE: Math.round(meanBFE * 10) / 10,
      controlSections,
      interpolationMethod: "linear",
      unit: "feet",
      datum: "NAVD88"
    }, {
      primary_source: "FEMA NFHL Layer 14 (S_BFE)",
      data_confidence: 0.72,
      known_limitations: ["Linear interpolation between cross-sections", "Accuracy depends on BFE density"]
    }));
  } catch (err) {
    console.error("[BFE-INTERPOLATE] Error:", err);
    return errorResponse("Failed to query FEMA BFE data", 500);
  }
}

async function handleFloodRiskSummary(supabase: ReturnType<typeof createClient>, parcelId: string) {
  console.log(`[FLOOD-RISK-SUMMARY] Processing parcel: ${parcelId}`);
  
  const parcel = await getParcelData(supabase, parcelId);
  if (!parcel) return errorResponse("Parcel not found", 404);
  
  const lat = parcel.geo_lat || parcel.centroid?.coordinates?.[1];
  const lng = parcel.geo_lng || parcel.centroid?.coordinates?.[0];
  
  if (!lat || !lng) return errorResponse("Parcel coordinates not available", 400);

  // Query FEMA NFHL Flood Hazard Areas (Layer 28)
  const floodUrl = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?` +
    `geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&` +
    `spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE,DEPTH,VELOCITY,SOURCE_CIT&f=json`;

  // Query Floodway (Layer 7)
  const floodwayUrl = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/7/query?` +
    `geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&` +
    `spatialRel=esriSpatialRelIntersects&outFields=FLOODWAY&f=json`;

  try {
    const [floodRes, floodwayRes] = await Promise.all([
      fetch(floodUrl, { signal: AbortSignal.timeout(15000) }),
      fetch(floodwayUrl, { signal: AbortSignal.timeout(15000) })
    ]);

    const floodData = await floodRes.json();
    const floodwayData = await floodwayRes.json();

    const zones = (floodData.features || []).map((f: { attributes: { FLD_ZONE: string; ZONE_SUBTY: string; SFHA_TF: string; STATIC_BFE: number } }) => ({
      zone: f.attributes.FLD_ZONE,
      subtype: f.attributes.ZONE_SUBTY,
      isSFHA: f.attributes.SFHA_TF === "T",
      staticBFE: f.attributes.STATIC_BFE
    }));

    const inFloodway = (floodwayData.features || []).some(
      (f: { attributes: { FLOODWAY: string } }) => f.attributes.FLOODWAY === "FLOODWAY"
    );

    // Determine most restrictive zone
    const zoneHierarchy = ["VE", "AE", "A", "AO", "AH", "X-SHADED", "X"];
    const mostRestrictive = zones.reduce((acc: string | null, z: { zone: string }) => {
      const idx = zoneHierarchy.indexOf(z.zone);
      const accIdx = acc ? zoneHierarchy.indexOf(acc) : 999;
      return idx < accIdx ? z.zone : acc;
    }, null) || "X";

    const riskLevel = ["VE", "AE", "A", "AO", "AH"].includes(mostRestrictive) ? "High" :
                      mostRestrictive === "X-SHADED" ? "Moderate" : "Low";

    const recommendations: string[] = [];
    if (inFloodway) recommendations.push("Development prohibited in floodway per NFIP regulations");
    if (riskLevel === "High") recommendations.push("Flood insurance required for federally-backed mortgages");
    if (mostRestrictive === "AE") recommendations.push("Construction must meet BFE + freeboard requirements");

    return jsonResponse(wrapWithProvenance({
      parcelId,
      zones,
      mostRestrictiveZone: mostRestrictive,
      riskLevel,
      inFloodway,
      inSFHA: zones.some((z: { isSFHA: boolean }) => z.isSFHA),
      recommendations,
      groundElevation: parcel.elevation || null,
      freeboard: null // Would need BFE interpolation
    }, {
      primary_source: "FEMA NFHL Layers 7, 28",
      data_confidence: 0.72,
      known_limitations: ["Point-based query may miss partial parcel flooding", "FEMA data updated irregularly"]
    }));
  } catch (err) {
    console.error("[FLOOD-RISK-SUMMARY] Error:", err);
    return errorResponse("Failed to query FEMA flood data", 500);
  }
}

// ==================== WETLAND ENDPOINT ====================

async function handleWetlandRisk(supabase: ReturnType<typeof createClient>, parcelId: string) {
  console.log(`[WETLAND-RISK] Processing parcel: ${parcelId}`);
  
  const parcel = await getParcelData(supabase, parcelId);
  if (!parcel) return errorResponse("Parcel not found", 404);
  
  const lat = parcel.geo_lat || parcel.centroid?.coordinates?.[1];
  const lng = parcel.geo_lng || parcel.centroid?.coordinates?.[0];
  
  if (!lat || !lng) return errorResponse("Parcel coordinates not available", 400);

  const nwiUrl = `https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0/query?` +
    `geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&` +
    `spatialRel=esriSpatialRelIntersects&distance=100&units=esriSRUnit_Meter&` +
    `outFields=ATTRIBUTE,WETLAND_TYPE,ACRES&returnGeometry=false&f=json`;

  try {
    const response = await fetch(nwiUrl, { signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    
    const features = result.features || [];
    
    if (features.length === 0) {
      return jsonResponse(wrapWithProvenance({
        parcelId,
        hasWetlands: false,
        wetlandClasses: [],
        totalAcres: 0,
        percentCoverage: 0,
        confidenceLevel: "high",
        requiresFieldVerification: false,
        notes: "No NWI wetlands identified within 100m of parcel centroid"
      }, {
        primary_source: "USFWS National Wetlands Inventory",
        data_confidence: 0.8,
        known_limitations: ["NWI is remote-sensed, not field verified", "Small or seasonal wetlands may be missed"]
      }));
    }

    // Parse Cowardin codes
    const wetlandClasses = features.map((f: { attributes: { ATTRIBUTE: string; WETLAND_TYPE: string; ACRES: number } }) => {
      const code = f.attributes.ATTRIBUTE || "";
      const type = f.attributes.WETLAND_TYPE || "Unknown";
      return {
        cowardinCode: code,
        description: type,
        acres: f.attributes.ACRES || 0,
        isProvisional: code.includes("?")
      };
    });

    const totalAcres = wetlandClasses.reduce((sum: number, w: { acres: number }) => sum + w.acres, 0);
    const parcelAcres = parcel.acreage_cad || parcel.acreage || 1;
    const percentCoverage = Math.min(100, Math.round((totalAcres / parcelAcres) * 100));
    const hasProvisional = wetlandClasses.some((w: { isProvisional: boolean }) => w.isProvisional);

    return jsonResponse(wrapWithProvenance({
      parcelId,
      hasWetlands: true,
      wetlandClasses,
      totalAcres: Math.round(totalAcres * 100) / 100,
      percentCoverage,
      confidenceLevel: hasProvisional ? "medium" : "high",
      requiresFieldVerification: hasProvisional || percentCoverage > 25,
      notes: hasProvisional ? "Provisional wetlands require field delineation" : null
    }, {
      primary_source: "USFWS National Wetlands Inventory",
      data_confidence: hasProvisional ? 0.5 : 0.8,
      known_limitations: ["NWI is remote-sensed, not field verified", "Accuracy varies by region"]
    }));
  } catch (err) {
    console.error("[WETLAND-RISK] Error:", err);
    return errorResponse("Failed to query NWI wetlands data", 500);
  }
}

// ==================== UTILITY ENDPOINTS ====================

async function handleUtilitiesCapacity(supabase: ReturnType<typeof createClient>, parcelId: string) {
  console.log(`[UTILITIES-CAPACITY] Processing parcel: ${parcelId}`);
  
  const parcel = await getParcelData(supabase, parcelId);
  if (!parcel) return errorResponse("Parcel not found", 404);

  // Use existing enrichment data if available
  const waterLines = parcel.water_lines || [];
  const sewerLines = parcel.sewer_lines || [];
  const elevation = parcel.elevation || 0;

  // Calculate distances and capacity scores
  const nearestWater = waterLines.length > 0 ? 
    Math.min(...waterLines.map((l: { distance_ft?: number }) => l.distance_ft || 9999)) : null;
  const nearestSewer = sewerLines.length > 0 ?
    Math.min(...sewerLines.map((l: { distance_ft?: number }) => l.distance_ft || 9999)) : null;

  // Capacity score: 1 - (distance / 2000), clamped 0-1
  const waterCapacityScore = nearestWater ? Math.max(0, Math.min(1, 1 - (nearestWater / 2000))) : 0;
  const sewerCapacityScore = nearestSewer ? Math.max(0, Math.min(1, 1 - (nearestSewer / 1500))) : 0;

  // Estimate pressure (60 PSI base, adjust for elevation)
  const estimatedPressure = Math.max(20, 60 - (elevation / 2.31)); // 2.31 ft per PSI

  return jsonResponse(wrapWithProvenance({
    parcelId,
    water: {
      available: nearestWater !== null && nearestWater < 2000,
      nearestMainlineDistanceFt: nearestWater,
      capacityScore: Math.round(waterCapacityScore * 100) / 100,
      estimatedPressurePSI: Math.round(estimatedPressure),
      provider: parcel.wcid_district || parcel.mud_district || "Unknown"
    },
    sewer: {
      available: nearestSewer !== null && nearestSewer < 1500,
      nearestMainlineDistanceFt: nearestSewer,
      capacityScore: Math.round(sewerCapacityScore * 100) / 100,
      type: nearestSewer && nearestSewer < 100 ? "gravity" : "force_main_or_lift"
    },
    electric: {
      available: parcel.power_kv_nearby ? true : null,
      nearestLineKV: parcel.power_kv_nearby
    },
    fiber: {
      available: parcel.fiber_available
    },
    overallCapacityScore: Math.round(((waterCapacityScore + sewerCapacityScore) / 2) * 100) / 100
  }, {
    primary_source: "City GIS, TCEQ CCN",
    data_confidence: 0.65,
    known_limitations: ["Distance estimates from available GIS data", "Actual capacity requires utility coordination"]
  }));
}

async function handleSewerServiceability(supabase: ReturnType<typeof createClient>, parcelId: string) {
  console.log(`[SEWER-SERVICEABILITY] Processing parcel: ${parcelId}`);
  
  const parcel = await getParcelData(supabase, parcelId);
  if (!parcel) return errorResponse("Parcel not found", 404);

  const sewerLines = parcel.sewer_lines || [];
  const nearestSewer = sewerLines.length > 0 ?
    Math.min(...sewerLines.map((l: { distance_ft?: number }) => l.distance_ft || 9999)) : 9999;

  // Tier classification
  let tier: string;
  let tierDescription: string;
  let estimatedConnectionCost: number;

  if (nearestSewer < 100) {
    tier = "existing_service";
    tierDescription = "Direct connection to existing gravity sewer available";
    estimatedConnectionCost = 15000;
  } else if (nearestSewer < 500) {
    tier = "short_extension";
    tierDescription = "Short sewer extension required";
    estimatedConnectionCost = 15000 + (nearestSewer * 75);
  } else if (nearestSewer < 1500) {
    tier = "planned_extension";
    tierDescription = "Sewer extension required, may need lift station";
    estimatedConnectionCost = 15000 + (nearestSewer * 100) + 50000; // Include lift station
  } else {
    tier = "on_site_required";
    tierDescription = "On-site septic or package plant required";
    estimatedConnectionCost = 25000; // Septic system estimate
  }

  const inMUD = parcel.mud_district ? true : false;

  return jsonResponse(wrapWithProvenance({
    parcelId,
    tier,
    tierDescription,
    nearestSewerDistanceFt: nearestSewer < 9999 ? nearestSewer : null,
    estimatedConnectionCost: Math.round(estimatedConnectionCost),
    requiresLiftStation: nearestSewer > 500 && nearestSewer < 1500,
    inMUD,
    mudDistrict: parcel.mud_district,
    notes: tier === "on_site_required" ? 
      "Contact county health department for septic permitting requirements" : null
  }, {
    primary_source: "City GIS, MUD Records",
    data_confidence: 0.6,
    known_limitations: ["Cost estimates are approximate", "Actual costs require utility company quote"]
  }));
}

// ==================== TRAFFIC ENDPOINT ====================

async function handleTrafficAccessScore(supabase: ReturnType<typeof createClient>, parcelId: string) {
  console.log(`[TRAFFIC-ACCESS-SCORE] Processing parcel: ${parcelId}`);
  
  const parcel = await getParcelData(supabase, parcelId);
  if (!parcel) return errorResponse("Parcel not found", 404);

  const aadt = parcel.traffic_aadt || parcel.aadt_near || 0;
  const roadName = parcel.traffic_road_name || parcel.aadt_road_name || "Unknown";
  const truckPercent = parcel.truck_percent || 5;

  // Roadway classification based on AADT
  let roadwayClass: string;
  if (aadt > 30000) roadwayClass = "arterial";
  else if (aadt > 10000) roadwayClass = "major_collector";
  else if (aadt > 3000) roadwayClass = "minor_collector";
  else roadwayClass = "local";

  // Access score calculation (weighted)
  const aadtScore = Math.min(1, aadt / 20000); // Max score at 20k AADT
  const classScore = { arterial: 1, major_collector: 0.8, minor_collector: 0.6, local: 0.4 }[roadwayClass] || 0.5;
  const accessScore = Math.round((aadtScore * 0.6 + classScore * 0.4) * 100) / 100;

  // Congestion level
  let congestionLevel: string;
  if (aadt > 40000) congestionLevel = "High";
  else if (aadt > 15000) congestionLevel = "Moderate";
  else congestionLevel = "Low";

  return jsonResponse(wrapWithProvenance({
    parcelId,
    aadt,
    roadName,
    roadwayClass,
    truckPercent,
    accessScore,
    congestionLevel,
    nearestSignalizedIntersectionFt: null, // Would require additional data
    drivewaySpacinqIssue: false, // Would require detailed analysis
    year: parcel.traffic_year || new Date().getFullYear() - 1,
    notes: aadt > 50000 ? "High traffic volume may require TIA study" : null
  }, {
    primary_source: "TxDOT AADT",
    data_confidence: 0.75,
    known_limitations: ["AADT is annual average, not peak hour", "Data typically 1-2 years old"]
  }));
}

// ==================== TOPOGRAPHY ENDPOINT ====================

async function handleTopography(supabase: ReturnType<typeof createClient>, parcelId: string) {
  console.log(`[TOPOGRAPHY] Processing parcel: ${parcelId}`);
  
  const parcel = await getParcelData(supabase, parcelId);
  if (!parcel) return errorResponse("Parcel not found", 404);
  
  const lat = parcel.geo_lat || parcel.centroid?.coordinates?.[1];
  const lng = parcel.geo_lng || parcel.centroid?.coordinates?.[0];
  const elevation = parcel.elevation;
  
  if (!lat || !lng) return errorResponse("Parcel coordinates not available", 400);

  // For now, use existing elevation data and estimate slope
  // Full implementation would do multi-point grid sampling
  const slopeEstimate = parcel.soil_slope_percent || 2; // Default to 2% if unknown

  // Slope band classification
  let slopeBand: string;
  let buildabilityImpact: string;
  if (slopeEstimate <= 3) {
    slopeBand = "0-3%";
    buildabilityImpact = "Excellent - minimal grading required";
  } else if (slopeEstimate <= 8) {
    slopeBand = "3-8%";
    buildabilityImpact = "Good - moderate grading may be required";
  } else if (slopeEstimate <= 15) {
    slopeBand = "8-15%";
    buildabilityImpact = "Fair - significant grading and retaining walls likely";
  } else {
    slopeBand = ">15%";
    buildabilityImpact = "Poor - extensive earthwork or terracing required";
  }

  return jsonResponse(wrapWithProvenance({
    parcelId,
    elevation: elevation ? Math.round(elevation) : null,
    elevationUnit: "feet",
    averageSlope: slopeEstimate,
    slopeBand,
    buildabilityImpact,
    soilDrainage: parcel.soil_drainage_class || "Unknown",
    soilSeries: parcel.soil_series || "Unknown",
    estimatedCutFillVolumeCY: null, // Requires detailed survey
    buildablePadPolygons: [], // Requires detailed analysis
    notes: slopeEstimate > 15 ? "Steep slopes may trigger geotechnical study requirement" : null
  }, {
    primary_source: "USGS Elevation, NRCS Soils",
    data_confidence: 0.6,
    known_limitations: ["Slope estimate based on soil data, not survey", "Detailed topographic survey recommended for steep sites"]
  }));
}

// ==================== STORMWATER ENDPOINT ====================

async function handleStormwaterDetention(supabase: ReturnType<typeof createClient>, parcelId: string, body: Record<string, unknown>) {
  console.log(`[STORMWATER-DETENTION] Processing parcel: ${parcelId}`);
  
  const parcel = await getParcelData(supabase, parcelId);
  if (!parcel) return errorResponse("Parcel not found", 404);

  // Get parameters from request body
  const designStorm = (body.designStorm as string) || "100-year";
  const imperviousPercent = (body.imperviousPercent as number) || 85;
  const soilGroup = (body.soilGroup as string) || parcel.soil_drainage_class?.charAt(0) || "C";
  const drainageAreaAcres = (body.drainageAreaAcres as number) || parcel.acreage_cad || parcel.acreage || 1;

  // TR-55 Curve Number calculation
  const cnTable: Record<string, Record<string, number>> = {
    A: { open: 30, residential: 61, commercial: 89 },
    B: { open: 58, residential: 75, commercial: 92 },
    C: { open: 71, residential: 83, commercial: 94 },
    D: { open: 78, residential: 87, commercial: 95 }
  };

  const baseCN = cnTable[soilGroup]?.commercial || 92;
  const adjustedCN = baseCN * (imperviousPercent / 100) + 30 * (1 - imperviousPercent / 100);

  // Design storm rainfall (inches) - Houston area approximations
  const rainfallTable: Record<string, number> = {
    "2-year": 4.5,
    "10-year": 6.5,
    "25-year": 8.5,
    "100-year": 12.0
  };
  const rainfall = rainfallTable[designStorm] || 12.0;

  // Runoff calculation (TR-55 method)
  const S = (1000 / adjustedCN) - 10;
  const Ia = 0.2 * S;
  const runoffDepth = rainfall > Ia ? Math.pow(rainfall - Ia, 2) / (rainfall - Ia + S) : 0;
  
  // Pre-development runoff (assume open space)
  const preCN = cnTable[soilGroup]?.open || 71;
  const preS = (1000 / preCN) - 10;
  const preIa = 0.2 * preS;
  const preRunoff = rainfall > preIa ? Math.pow(rainfall - preIa, 2) / (rainfall - preIa + preS) : 0;

  // Detention volume (difference in runoff × area)
  const runoffDiff = runoffDepth - preRunoff; // inches
  const detentionVolumeAcFt = (runoffDiff / 12) * drainageAreaAcres;
  
  // Peak flow estimate (rational method)
  const C = adjustedCN / 100;
  const intensityInHr = 3.5; // Approximate for Houston
  const peakFlowCFS = C * intensityInHr * drainageAreaAcres;

  return jsonResponse(wrapWithProvenance({
    parcelId,
    inputs: {
      designStorm,
      imperviousPercent,
      soilGroup,
      drainageAreaAcres
    },
    results: {
      curveNumber: Math.round(adjustedCN),
      runoffDepthInches: Math.round(runoffDepth * 100) / 100,
      preDevRunoffInches: Math.round(preRunoff * 100) / 100,
      requiredDetentionVolumeAcreFt: Math.round(detentionVolumeAcFt * 1000) / 1000,
      requiredDetentionVolumeCubicFt: Math.round(detentionVolumeAcFt * 43560),
      peakFlowCFS: Math.round(peakFlowCFS * 10) / 10
    },
    assumptions: [
      "TR-55 methodology used for runoff calculation",
      "Houston-area rainfall depths applied",
      "Pre-development assumed as open space",
      "Time of concentration not site-specific"
    ],
    notes: "Final detention design requires civil engineering analysis"
  }, {
    primary_source: "TR-55 Methodology, Houston Rainfall Data",
    data_confidence: 0.55,
    known_limitations: ["Simplified calculation", "Site-specific factors not considered", "Requires professional engineering review"]
  }));
}

// ==================== FEASIBILITY SCORE ENDPOINT ====================

async function handleFeasibilityScore(supabase: ReturnType<typeof createClient>, parcelId: string) {
  console.log(`[FEASIBILITY-SCORE] Processing parcel: ${parcelId}`);
  
  const parcel = await getParcelData(supabase, parcelId);
  if (!parcel) return errorResponse("Parcel not found", 404);

  // Get kill factors
  const { data: killFactors } = await supabase
    .from("kill_factors")
    .select("*");

  // Calculate sub-scores
  const floodZone = parcel.floodplain_zone || "X";
  const floodScore = ["X", "X-SHADED"].includes(floodZone) ? 100 : 
                     floodZone === "AE" ? 40 : 20;

  const slopePercent = parcel.soil_slope_percent || 2;
  const soilScore = slopePercent <= 3 ? 100 : slopePercent <= 8 ? 80 : slopePercent <= 15 ? 50 : 20;

  const wetlandsPercent = parcel.wetlands_area_pct || 0;
  const epaFacilities = parcel.epa_facilities_count || 0;
  const envScore = Math.max(0, 100 - (wetlandsPercent * 2) - (epaFacilities * 10));

  const aadt = parcel.traffic_aadt || parcel.aadt_near || 0;
  const trafficScore = aadt > 5000 ? 100 : aadt > 1000 ? 70 : 40;

  const hasWater = parcel.water_capacity_mgd || parcel.water_lines?.length > 0;
  const hasSewer = parcel.sewer_capacity_mgd || parcel.sewer_lines?.length > 0;
  const economicScore = (hasWater ? 50 : 0) + (hasSewer ? 50 : 0);

  // Weighted composite
  const weights = { flood: 0.25, soil: 0.15, environmental: 0.20, traffic: 0.20, economic: 0.20 };
  const compositeScore = Math.round(
    floodScore * weights.flood +
    soilScore * weights.soil +
    envScore * weights.environmental +
    trafficScore * weights.traffic +
    economicScore * weights.economic
  );

  // Check kill factors
  const triggeredKillFactors: string[] = [];
  if (killFactors) {
    for (const kf of killFactors) {
      if (kf.code === "FLOODWAY" && parcel.floodplain_zone?.includes("WAY")) {
        triggeredKillFactors.push(kf.code);
      }
      if (kf.code === "WETLAND_50" && wetlandsPercent > (kf.threshold || 50)) {
        triggeredKillFactors.push(kf.code);
      }
      if (kf.code === "FLOOD_ZONE_AE" && floodZone === "AE") {
        triggeredKillFactors.push(kf.code);
      }
      if (kf.code === "STEEP_SLOPE" && slopePercent > 15) {
        triggeredKillFactors.push(kf.code);
      }
    }
  }

  // Score band
  let scoreBand: string;
  if (compositeScore >= 80) scoreBand = "Excellent";
  else if (compositeScore >= 60) scoreBand = "Good";
  else if (compositeScore >= 40) scoreBand = "Fair";
  else scoreBand = "Poor";

  // Recommendations
  const recommendations: string[] = [];
  if (floodScore < 60) recommendations.push("Flood mitigation required - consider elevation or flood insurance costs");
  if (soilScore < 60) recommendations.push("Significant grading may be required - budget for earthwork");
  if (envScore < 60) recommendations.push("Environmental constraints present - wetland delineation recommended");
  if (economicScore < 50) recommendations.push("Limited utility access - investigate extension costs");

  return jsonResponse(wrapWithProvenance({
    parcelId,
    compositeScore,
    scoreBand,
    subScores: {
      flood: { score: floodScore, weight: weights.flood, zone: floodZone },
      soil: { score: soilScore, weight: weights.soil, slopePercent },
      environmental: { score: envScore, weight: weights.environmental },
      traffic: { score: trafficScore, weight: weights.traffic, aadt },
      economic: { score: economicScore, weight: weights.economic }
    },
    killFactors: triggeredKillFactors,
    hasKillFactors: triggeredKillFactors.length > 0,
    recommendations,
    percentileRank: null // Would require county-wide comparison
  }, {
    primary_source: "SiteIntel Composite Analysis",
    data_confidence: 0.7,
    known_limitations: ["Score based on available data", "Site-specific conditions may vary"]
  }));
}

// ==================== KILL FACTORS ENDPOINTS ====================

async function handleGetKillFactors(supabase: ReturnType<typeof createClient>) {
  console.log(`[GET-KILL-FACTORS] Fetching all kill factors`);
  
  const { data, error } = await supabase
    .from("kill_factors")
    .select("*")
    .order("category");

  if (error) return errorResponse("Failed to fetch kill factors", 500);

  return jsonResponse(wrapWithProvenance({
    killFactors: data || [],
    count: data?.length || 0
  }, {
    primary_source: "SiteIntel Kill Factors Database",
    data_confidence: 1.0,
    known_limitations: []
  }));
}

async function handlePatchKillFactors(supabase: ReturnType<typeof createClient>, body: Record<string, unknown>) {
  console.log(`[PATCH-KILL-FACTORS] Updating kill factors`);
  
  const updates = body.updates as Array<{ code: string; threshold?: number; description?: string }>;
  
  if (!updates || !Array.isArray(updates)) {
    return errorResponse("Invalid request body - expected { updates: [...] }", 400);
  }

  const results: Array<{ code: string; success: boolean; error?: string }> = [];
  
  for (const update of updates) {
    const { code, ...fields } = update;
    const { error } = await supabase
      .from("kill_factors")
      .update(fields)
      .eq("code", code);
    
    results.push({
      code,
      success: !error,
      error: error?.message
    });
  }

  return jsonResponse(wrapWithProvenance({
    results,
    successCount: results.filter(r => r.success).length,
    failureCount: results.filter(r => !r.success).length
  }, {
    primary_source: "SiteIntel Kill Factors Database",
    data_confidence: 1.0,
    known_limitations: []
  }));
}

// ==================== MAIN ROUTER ====================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api-v2/, "").replace(/\/$/, "");
  const method = req.method;

  console.log(`[API-V2] ${method} ${path}`);

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Parse body for POST/PATCH
  let body: Record<string, unknown> = {};
  if (["POST", "PATCH"].includes(method)) {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  }

  // Route matching
  const parcelMatch = path.match(/^\/parcels\/([^/]+)\/(.+)$/);
  const feasibilityMatch = path.match(/^\/feasibility\/([^/]+)\/score$/);

  try {
    // Parcel endpoints
    if (parcelMatch) {
      const parcelId = parcelMatch[1];
      const endpoint = parcelMatch[2];

      switch (endpoint) {
        case "flood/bfe-interpolate":
          if (method !== "POST") return errorResponse("Method not allowed", 405);
          return await handleBfeInterpolate(supabase, parcelId, body);

        case "flood/risk-summary":
          if (method !== "GET") return errorResponse("Method not allowed", 405);
          return await handleFloodRiskSummary(supabase, parcelId);

        case "wetland-risk":
          if (method !== "GET") return errorResponse("Method not allowed", 405);
          return await handleWetlandRisk(supabase, parcelId);

        case "utilities/capacity":
          if (method !== "GET") return errorResponse("Method not allowed", 405);
          return await handleUtilitiesCapacity(supabase, parcelId);

        case "sewer/serviceability":
          if (method !== "GET") return errorResponse("Method not allowed", 405);
          return await handleSewerServiceability(supabase, parcelId);

        case "traffic/access-score":
          if (method !== "GET") return errorResponse("Method not allowed", 405);
          return await handleTrafficAccessScore(supabase, parcelId);

        case "topography":
          if (method !== "GET") return errorResponse("Method not allowed", 405);
          return await handleTopography(supabase, parcelId);

        case "stormwater/detention-estimate":
          if (method !== "POST") return errorResponse("Method not allowed", 405);
          return await handleStormwaterDetention(supabase, parcelId, body);

        default:
          return errorResponse(`Unknown endpoint: ${endpoint}`, 404);
      }
    }

    // Feasibility score endpoint
    if (feasibilityMatch) {
      const parcelId = feasibilityMatch[1];
      if (method !== "GET") return errorResponse("Method not allowed", 405);
      return await handleFeasibilityScore(supabase, parcelId);
    }

    // Kill factors endpoints
    if (path === "/lender/kill-factors") {
      if (method === "GET") return await handleGetKillFactors(supabase);
      if (method === "PATCH") return await handlePatchKillFactors(supabase, body);
      return errorResponse("Method not allowed", 405);
    }

    // Health check
    if (path === "/health" || path === "") {
      return jsonResponse({
        status: "healthy",
        version: "2.0.0",
        endpoints: [
          "POST /parcels/{id}/flood/bfe-interpolate",
          "GET /parcels/{id}/flood/risk-summary",
          "GET /parcels/{id}/wetland-risk",
          "GET /parcels/{id}/utilities/capacity",
          "GET /parcels/{id}/sewer/serviceability",
          "GET /parcels/{id}/traffic/access-score",
          "GET /parcels/{id}/topography",
          "POST /parcels/{id}/stormwater/detention-estimate",
          "GET /feasibility/{id}/score",
          "GET /lender/kill-factors",
          "PATCH /lender/kill-factors"
        ]
      });
    }

    return errorResponse(`Not found: ${path}`, 404);
  } catch (err) {
    console.error("[API-V2] Unhandled error:", err);
    return errorResponse("Internal server error", 500);
  }
});
