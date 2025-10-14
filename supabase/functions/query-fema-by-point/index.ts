import { corsHeaders } from '../_shared/cors.ts';

const FEMA_NFHL_URL = 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng } = await req.json();

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: 'Missing lat or lng parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Querying FEMA for point: ${lat}, ${lng}`);

    // Query FEMA NFHL MapServer for the specific point
    const femaUrl = `${FEMA_NFHL_URL}` +
      `?geometry=${lng},${lat}` +
      `&geometryType=esriGeometryPoint` +
      `&inSR=4326` +
      `&spatialRel=esriSpatialRelIntersects` +
      `&outFields=FLD_ZONE,ZONE_SUBTY,STATIC_BFE,DFIRM_ID,FLD_AR_ID` +
      `&returnGeometry=false` +
      `&f=json`;

    console.log('FEMA API URL:', femaUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const femaRes = await fetch(femaUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!femaRes.ok) {
      console.error(`FEMA API error: ${femaRes.status} ${femaRes.statusText}`);
      return new Response(
        JSON.stringify({
          error: `FEMA API returned ${femaRes.status}`,
          flood_zone: null,
          in_flood_zone: false,
          source: 'FEMA NFHL MapServer 28 (error)'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const femaData = await femaRes.json();
    const features = femaData?.features || [];

    if (features.length === 0) {
      console.log('✓ No flood zone found (likely Zone X - minimal flood risk)');
      return new Response(
        JSON.stringify({
          flood_zone: 'X',
          zone_subtype: null,
          base_flood_elevation: null,
          dfirm_id: null,
          in_flood_zone: false,
          flood_risk_level: 0.2,
          source: 'FEMA NFHL MapServer 28',
          query_timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Take the first matching feature
    const feature = features[0];
    const attrs = feature.attributes;
    const zoneCode = attrs.FLD_ZONE || 'X';
    
    // Calculate flood risk level based on zone
    let floodRiskLevel = 0.2; // Default: minimal risk
    let inFloodZone = false;

    if (['AE', 'VE', 'A', 'AO', 'AH', 'A99'].includes(zoneCode)) {
      floodRiskLevel = 0.8; // High risk
      inFloodZone = true;
    } else if (['X', 'X500', 'OPEN WATER'].includes(zoneCode)) {
      floodRiskLevel = 0.2; // Low risk
      inFloodZone = false;
    } else {
      floodRiskLevel = 0.5; // Moderate risk
      inFloodZone = true;
    }

    const result = {
      flood_zone: zoneCode,
      zone_subtype: attrs.ZONE_SUBTY || null,
      base_flood_elevation: attrs.STATIC_BFE || null,
      dfirm_id: attrs.DFIRM_ID || null,
      fld_ar_id: attrs.FLD_AR_ID || null,
      in_flood_zone: inFloodZone,
      flood_risk_level: floodRiskLevel,
      source: 'FEMA NFHL MapServer 28',
      query_timestamp: new Date().toISOString()
    };

    console.log('✓ FEMA query result:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in query-fema-by-point:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        flood_zone: null,
        in_flood_zone: false,
        source: 'FEMA NFHL MapServer 28 (error)'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
