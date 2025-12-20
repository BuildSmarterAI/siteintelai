import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// USFWS National Wetlands Inventory (NWI) REST Service
// Research doc: Section 2.7 - USFWS Wetlands (National Wetlands Inv.)
const NWI_URL = "https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0/query";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application_id, parcel_polygon, parcel_area_sqft } = await req.json();
    
    if (!parcel_polygon) {
      throw new Error('Parcel polygon geometry is required');
    }

    console.log(`[NWI Wetlands] Querying wetlands for parcel (${parcel_area_sqft || 'unknown'} sqft)`);

    // Query NWI for wetlands intersecting parcel
    const params = new URLSearchParams({
      geometry: JSON.stringify(parcel_polygon),
      geometryType: 'esriGeometryPolygon',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'ATTRIBUTE,WETLAND_TYPE,ACRES',
      returnGeometry: 'true', // Need geometry to calculate overlap
      outSR: '4326',
      f: 'json'
    });

    const response = await fetch(`${NWI_URL}?${params}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    
    if (!response.ok) {
      console.error(`NWI API error: ${response.status}`);
      throw new Error(`NWI API returned ${response.status}`);
    }

    const data = await response.json();
    const wetlands = data.features || [];

    console.log(`[NWI Wetlands] Found ${wetlands.length} wetland features`);

    let wetlandsType = null;
    let wetlandsAreaPct = null;
    let wetlandCowardinCode = null;

    if (wetlands.length > 0) {
      // Get most common wetland type
      wetlandsType = wetlands[0].attributes.WETLAND_TYPE || null;
      
      // Capture the Cowardin classification code (e.g., PFO1A, PEM1C)
      wetlandCowardinCode = wetlands[0].attributes.ATTRIBUTE || null;
      
      // Calculate overlap percentage (simplified approach)
      // For precise calculation, would need PostGIS ST_Intersection
      if (parcel_area_sqft) {
        const totalWetlandAcres = wetlands.reduce((sum, w) => sum + (w.attributes.ACRES || 0), 0);
        const wetlandSqft = totalWetlandAcres * 43560; // acres to sqft
        wetlandsAreaPct = Math.min(100, Math.round((wetlandSqft / parcel_area_sqft) * 100));
      }

      console.log(`[NWI Wetlands] Type: ${wetlandsType}, Cowardin: ${wetlandCowardinCode}, Coverage: ${wetlandsAreaPct}%`);
    }

    // Update application record if application_id provided
    if (application_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: updateError } = await supabase
        .from('applications')
        .update({
          wetlands_type: wetlandsType,
          wetlands_area_pct: wetlandsAreaPct,
          wetland_cowardin_code: wetlandCowardinCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', application_id);

      if (updateError) {
        console.error('Failed to update application:', updateError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      wetlands_type: wetlandsType,
      wetlands_area_pct: wetlandsAreaPct,
      wetland_cowardin_code: wetlandCowardinCode,
      wetlands_count: wetlands.length,
      wetlands_details: wetlands.slice(0, 5).map(w => ({
        type: w.attributes.WETLAND_TYPE,
        attribute: w.attributes.ATTRIBUTE,
        acres: w.attributes.ACRES
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Wetlands enrichment error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        wetlands_type: null,
        wetlands_area_pct: null
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
