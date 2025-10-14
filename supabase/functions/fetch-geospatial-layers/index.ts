/**
 * BuildSmarter™ Feasibility Core
 * Function: fetch-geospatial-layers
 * Purpose: Aggregate counties, FEMA flood zones, and TxDOT traffic data.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ---------- County Boundaries ----------
const COUNTY_ENDPOINTS = [
  {
    name: 'Harris County',
    source: 'HCAD',
    url: 'https://www.gis.hctx.net/arcgis/rest/services/repository/HCAD_Counties/MapServer/0/query?where=1%3D1&outFields=OBJECTID,code,name,GlobalID&outSR=4326&f=geojson'
  },
  {
    name: 'Fort Bend County',
    source: 'FBCAD',
    url: 'https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/1/query?where=1%3D1&outFields=*&outSR=4326&f=geojson'
  },
  {
    name: 'Montgomery County',
    source: 'MCAD',
    url: 'https://services.arcgis.com/KTcxiTD9dsQw6z7O/arcgis/rest/services/Montgomery_County_Boundary/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson'
  }
];

// ---------- FEMA NFHL (Flood Hazard Zones) ----------
const FEMA_URL = 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?where=1%3D1&outFields=OBJECTID,DFIRM_ID,FLD_ZONE,ZONE_SUBTY,STATIC_BFE&outSR=4326&f=geojson&resultRecordCount=2000';

// ---------- TxDOT AADT (Traffic Volumes) ----------
const TXDOT_URL = 'https://gis-txdot.opendata.arcgis.com/datasets/d5f56ecd2b274b4d8dc3c2d6fe067d37_0.geojson';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = [];

    console.log('Starting geospatial layers fetch...');

    // ---------- COUNTY BOUNDARIES ----------
    console.log('Fetching county boundaries...');
    for (const county of COUNTY_ENDPOINTS) {
      try {
        console.log(`Fetching ${county.name}...`);
        const response = await fetch(county.url);
        const data = await response.json();

        if (!data.features || data.features.length === 0) {
          console.warn(`No features found for ${county.name}`);
          continue;
        }

        const geometry = data.features[0].geometry;
        const countyName = data.features[0].properties?.name || county.name;

        const { error } = await supabase.from('county_boundaries').upsert(
          {
            county_name: countyName,
            geometry,
            source: county.source,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'county_name' }
        );

        if (error) {
          console.error(`Error upserting ${county.name}:`, error);
          throw error;
        }

        console.log(`✓ ${countyName} updated successfully`);
        results.push({
          type: 'county',
          county_name: countyName,
          source: county.source,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.error(`Failed to fetch ${county.name}:`, err);
        results.push({
          type: 'county',
          county_name: county.name,
          error: err.message
        });
      }
    }

    // ---------- FEMA FLOOD ZONES (by DFIRM_ID) ----------
    console.log('\n=== Fetching FEMA Flood Zones by DFIRM_ID ===');
    
    // DFIRM IDs for Texas counties (Digital Flood Insurance Rate Map IDs)
    const COUNTY_DFIRM_IDS: Record<string, string> = {
      'HARRIS COUNTY': '48201C',
      'FORT BEND COUNTY': '48157C',
      'MONTGOMERY COUNTY': '48339C'
    };

    let totalFemaSuccess = 0;
    let totalFemaErrors = 0;

    try {
      for (const [countyName, dfirmId] of Object.entries(COUNTY_DFIRM_IDS)) {
        console.log(`Querying FEMA for ${countyName} (DFIRM_ID: ${dfirmId})...`);
        
        // Query by DFIRM_ID - no geometry encoding required!
        const femaUrl = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query` +
          `?where=DFIRM_ID='${dfirmId}'` +
          `&outFields=OBJECTID,DFIRM_ID,FLD_ZONE,ZONE_SUBTY,STATIC_BFE` +
          `&outSR=4326` +
          `&f=geojson` +
          `&resultRecordCount=10000`; // Higher limit for bulk loading

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
          
          const femaRes = await fetch(femaUrl, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          if (!femaRes.ok) {
            console.error(`FEMA API error for ${countyName}: ${femaRes.status} ${femaRes.statusText}`);
            continue;
          }
          
          const femaData = await femaRes.json();
          const femaFeatures = femaData?.features || [];
          
          console.log(`✓ Retrieved ${femaFeatures.length} flood zones for ${countyName}`);
          
          // Upsert each feature
          for (const feature of femaFeatures) {
            if (!feature.geometry || !feature.properties) continue;
            
            const { error } = await supabase
              .from('fema_flood_zones')
              .upsert({
                fema_id: feature.properties.OBJECTID?.toString() || `${dfirmId}-${Math.random()}`,
                zone: feature.properties.FLD_ZONE,
                geometry: feature.geometry,
                source: `FEMA NFHL MapServer 28 - DFIRM ${dfirmId}`,
                updated_at: new Date().toISOString()
              }, { onConflict: 'fema_id' });
            
            if (error) {
              console.error(`Error upserting FEMA feature:`, error);
              totalFemaErrors++;
            } else {
              totalFemaSuccess++;
            }
          }
          
        } catch (countyErr) {
          const errorMsg = countyErr instanceof Error ? countyErr.message : String(countyErr);
          console.error(`Error fetching FEMA data for ${countyName}:`, errorMsg);
        }
      }

      console.log(`✓ FEMA zones updated: ${totalFemaSuccess} success, ${totalFemaErrors} errors`);
      results.push({
        type: 'fema',
        record_count: totalFemaSuccess,
        errors: totalFemaErrors,
        source: `FEMA NFHL (DFIRM query)`
      });
      
    } catch (err) {
      console.error('Failed to fetch FEMA data:', err);
      results.push({
        type: 'fema',
        error: err instanceof Error ? err.message : String(err),
        source: 'FEMA NFHL'
      });
    }

    // ---------- TXDOT TRAFFIC SEGMENTS ----------
    console.log('Fetching TxDOT traffic segments...');
    try {
      const txdotRes = await fetch(TXDOT_URL);
      const txdotData = await txdotRes.json();
      const txdotFeatures = txdotData?.features?.slice(0, 2000) || [];

      console.log(`Processing ${txdotFeatures.length} TxDOT features...`);
      let txdotSuccess = 0;
      let txdotErrors = 0;

      for (const seg of txdotFeatures) {
        const { error } = await supabase.from('txdot_traffic_segments').upsert({
          segment_id: seg?.properties?.OBJECTID?.toString() || `txdot_${Date.now()}_${Math.random()}`,
          aadt: seg?.properties?.AADT || seg?.properties?.aadt,
          year: seg?.properties?.AADT_YR || seg?.properties?.year,
          roadway: seg?.properties?.ROUTE_NAME || seg?.properties?.route,
          geometry: seg.geometry,
          source: 'TxDOT',
          updated_at: new Date().toISOString()
        }, { onConflict: 'segment_id' });

        if (error) {
          console.error('TxDOT upsert error:', error);
          txdotErrors++;
        } else {
          txdotSuccess++;
        }
      }

      console.log(`✓ TxDOT segments updated: ${txdotSuccess} success, ${txdotErrors} errors`);
      results.push({
        type: 'txdot',
        record_count: txdotSuccess,
        errors: txdotErrors,
        source: 'TxDOT'
      });
    } catch (err) {
      console.error('Failed to fetch TxDOT data:', err);
      results.push({
        type: 'txdot',
        error: err.message
      });
    }

    console.log('Geospatial layers fetch completed');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All layers fetched and updated successfully.',
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (err) {
    console.error('Fetch Error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
