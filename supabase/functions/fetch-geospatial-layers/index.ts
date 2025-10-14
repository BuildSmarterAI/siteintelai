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

    // ---------- FEMA FLOOD ZONES (by County Bounding Box) ----------
    console.log('Fetching FEMA flood zones by county extent...');
    try {
      // Get county boundaries from database
      const { data: counties, error: countyError } = await supabase
        .from('county_boundaries')
        .select('county_name, geometry');

      if (countyError) {
        throw new Error(`Failed to fetch counties: ${countyError.message}`);
      }

      if (!counties || counties.length === 0) {
        throw new Error('No counties found in database. Please populate county boundaries first.');
      }

      let totalFemaSuccess = 0;
      let totalFemaErrors = 0;

      // Query FEMA for each county's bounding box
      for (const county of counties) {
        console.log(`Querying FEMA flood zones for ${county.county_name}...`);
        
        // Calculate bounding box from county geometry
        const geometry = county.geometry;
        let bbox = { xmin: 180, ymin: 90, xmax: -180, ymax: -90 };
        
        if (geometry.type === 'Polygon') {
          geometry.coordinates[0].forEach((coord: number[]) => {
            bbox.xmin = Math.min(bbox.xmin, coord[0]);
            bbox.ymin = Math.min(bbox.ymin, coord[1]);
            bbox.xmax = Math.max(bbox.xmax, coord[0]);
            bbox.ymax = Math.max(bbox.ymax, coord[1]);
          });
        } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates.forEach((polygon: number[][][]) => {
            polygon[0].forEach((coord: number[]) => {
              bbox.xmin = Math.min(bbox.xmin, coord[0]);
              bbox.ymin = Math.min(bbox.ymin, coord[1]);
              bbox.xmax = Math.max(bbox.xmax, coord[0]);
              bbox.ymax = Math.max(bbox.ymax, coord[1]);
            });
          });
        }

        // Query FEMA with spatial extent
        const femaUrl = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query` +
          `?where=1=1` +
          `&geometry=${bbox.xmin},${bbox.ymin},${bbox.xmax},${bbox.ymax}` +
          `&geometryType=esriGeometryEnvelope` +
          `&spatialRel=esriSpatialRelIntersects` +
          `&outFields=OBJECTID,DFIRM_ID,FLD_ZONE,ZONE_SUBTY,STATIC_BFE` +
          `&outSR=4326` +
          `&f=geojson` +
          `&resultRecordCount=5000`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);
        
        const femaRes = await fetch(femaUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!femaRes.ok) {
          console.warn(`FEMA API returned status ${femaRes.status} for ${county.county_name}`);
          continue;
        }
        
        const femaData = await femaRes.json();
        const femaFeatures = femaData?.features || [];

        console.log(`Processing ${femaFeatures.length} FEMA features for ${county.county_name}...`);
        
        for (const feature of femaFeatures) {
          if (!feature.geometry || !feature.properties) {
            totalFemaErrors++;
            continue;
          }

          const femaId = feature.properties.OBJECTID?.toString() || 
                         feature.properties.DFIRM_ID || 
                         `fema_${county.county_name}_${Date.now()}_${Math.random()}`;

          const { error } = await supabase.from('fema_flood_zones').upsert({
            fema_id: femaId,
            zone: feature.properties.FLD_ZONE || feature.properties.ZONE_SUBTY || 'UNKNOWN',
            geometry: feature.geometry,
            source: 'FEMA NFHL',
            updated_at: new Date().toISOString()
          }, { onConflict: 'fema_id' });

          if (error) {
            console.error('FEMA upsert error:', error);
            totalFemaErrors++;
          } else {
            totalFemaSuccess++;
          }
        }

        console.log(`✓ ${county.county_name}: ${femaFeatures.length} flood zones processed`);
      }

      console.log(`✓ FEMA zones updated: ${totalFemaSuccess} success, ${totalFemaErrors} errors`);
      results.push({
        type: 'fema',
        record_count: totalFemaSuccess,
        errors: totalFemaErrors,
        source: 'FEMA NFHL (spatial query)'
      });
    } catch (err) {
      console.error('Failed to fetch FEMA data:', err);
      results.push({
        type: 'fema',
        error: err.message,
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
