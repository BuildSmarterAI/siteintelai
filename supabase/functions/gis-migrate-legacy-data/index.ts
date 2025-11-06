/**
 * BuildSmarter™ Feasibility Platform
 * Function: gis-migrate-legacy-data
 * Purpose: One-time migration of existing GIS data to versioned cache system
 * 
 * Migrates data from:
 * - county_boundaries → gis_layer_versions
 * - fema_flood_zones → gis_layer_versions
 * - txdot_traffic_segments → gis_layer_versions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MigrationResult {
  layer_key: string;
  area_key: string;
  status: 'success' | 'error' | 'skipped';
  record_count?: number;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const results: MigrationResult[] = [];

  try {
    console.log('🚀 Starting legacy GIS data migration to versioned cache...');

    // ========================================================================
    // STEP 1: Migrate County Boundaries
    // ========================================================================
    console.log('\n📍 Migrating county_boundaries...');
    
    const { data: counties, error: countiesError } = await supabase
      .from('county_boundaries')
      .select('*');

    if (countiesError) {
      console.error('Error fetching counties:', countiesError);
      results.push({ 
        layer_key: 'county_boundaries', 
        area_key: 'all', 
        status: 'error', 
        error: countiesError.message 
      });
    } else if (counties && counties.length > 0) {
      for (const county of counties) {
        const areaKey = county.county_name.toLowerCase().replace(/\s+/g, '_');
        
        // Determine layer_key based on county name
        let layerKey = 'hcad:county_boundary';
        if (county.county_name.includes('Fort Bend')) {
          layerKey = 'fbcad:county_boundary';
        } else if (county.county_name.includes('Montgomery')) {
          layerKey = 'mcad:county_boundary';
        }

        // Get layer_id
        const { data: layer } = await supabase
          .from('gis_layers')
          .select('id')
          .eq('layer_key', layerKey)
          .single();

        if (!layer) {
          console.warn(`⚠️ Layer not found for ${layerKey}`);
          continue;
        }

        // Check if version already exists
        const { data: existing } = await supabase
          .from('gis_layer_versions')
          .select('id')
          .eq('layer_id', layer.id)
          .eq('area_key', areaKey)
          .eq('is_active', true)
          .single();

        if (existing) {
          console.log(`✓ ${layerKey} (${areaKey}): Already migrated`);
          results.push({ 
            layer_key: layerKey, 
            area_key: areaKey, 
            status: 'skipped' 
          });
          continue;
        }

        // Create GeoJSON feature
        const geojson = {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: county.geometry,
            properties: {
              county_name: county.county_name,
              source: county.source
            }
          }]
        };

        // Compute checksum
        const checksum = await computeChecksum(JSON.stringify(geojson.features));

        // Insert version
        const { error: insertError } = await supabase
          .from('gis_layer_versions')
          .insert({
            layer_id: layer.id,
            area_key: areaKey,
            checksum_sha256: checksum,
            record_count: 1,
            geojson,
            size_bytes: JSON.stringify(geojson).length,
            is_active: true,
            expires_at: calculateExpiry('weekly'),
            fetched_at: county.created_at || new Date().toISOString()
          });

        if (insertError) {
          console.error(`✗ ${layerKey} (${areaKey}): ${insertError.message}`);
          results.push({ 
            layer_key: layerKey, 
            area_key: areaKey, 
            status: 'error', 
            error: insertError.message 
          });
        } else {
          console.log(`✓ ${layerKey} (${areaKey}): Migrated (1 feature)`);
          results.push({ 
            layer_key: layerKey, 
            area_key: areaKey, 
            status: 'success', 
            record_count: 1 
          });
        }
      }
    }

    // ========================================================================
    // STEP 2: Migrate FEMA Flood Zones
    // ========================================================================
    console.log('\n🌊 Migrating fema_flood_zones...');
    
    const { data: floodZones, error: floodError } = await supabase
      .from('fema_flood_zones')
      .select('*');

    if (floodError) {
      console.error('Error fetching flood zones:', floodError);
      results.push({ 
        layer_key: 'fema:nfhl_zones', 
        area_key: 'all', 
        status: 'error', 
        error: floodError.message 
      });
    } else if (floodZones && floodZones.length > 0) {
      // Get FEMA layer
      const { data: femaLayer } = await supabase
        .from('gis_layers')
        .select('id')
        .eq('layer_key', 'fema:nfhl_zones')
        .single();

      if (femaLayer) {
        // Group by area (assume harris for now, can be extended)
        const areaKey = 'harris';

        // Check if already exists
        const { data: existing } = await supabase
          .from('gis_layer_versions')
          .select('id')
          .eq('layer_id', femaLayer.id)
          .eq('area_key', areaKey)
          .eq('is_active', true)
          .single();

        if (existing) {
          console.log(`✓ fema:nfhl_zones (${areaKey}): Already migrated`);
          results.push({ 
            layer_key: 'fema:nfhl_zones', 
            area_key: areaKey, 
            status: 'skipped' 
          });
        } else {
          // Create GeoJSON
          const geojson = {
            type: 'FeatureCollection',
            features: floodZones.map(zone => ({
              type: 'Feature',
              geometry: zone.geometry,
              properties: {
                fema_id: zone.fema_id,
                zone: zone.zone,
                source: zone.source
              }
            }))
          };

          const checksum = await computeChecksum(JSON.stringify(geojson.features));

          const { error: insertError } = await supabase
            .from('gis_layer_versions')
            .insert({
              layer_id: femaLayer.id,
              area_key: areaKey,
              checksum_sha256: checksum,
              record_count: floodZones.length,
              geojson,
              size_bytes: JSON.stringify(geojson).length,
              is_active: true,
              expires_at: calculateExpiry('monthly'),
              fetched_at: new Date().toISOString()
            });

          if (insertError) {
            console.error(`✗ fema:nfhl_zones (${areaKey}): ${insertError.message}`);
            results.push({ 
              layer_key: 'fema:nfhl_zones', 
              area_key: areaKey, 
              status: 'error', 
              error: insertError.message 
            });
          } else {
            console.log(`✓ fema:nfhl_zones (${areaKey}): Migrated (${floodZones.length} features)`);
            results.push({ 
              layer_key: 'fema:nfhl_zones', 
              area_key: areaKey, 
              status: 'success', 
              record_count: floodZones.length 
            });
          }
        }
      }
    }

    // ========================================================================
    // STEP 3: Migrate TxDOT Traffic Segments
    // ========================================================================
    console.log('\n🚗 Migrating txdot_traffic_segments...');
    
    const { data: trafficSegments, error: trafficError } = await supabase
      .from('txdot_traffic_segments')
      .select('*');

    if (trafficError) {
      console.error('Error fetching traffic segments:', trafficError);
      results.push({ 
        layer_key: 'txdot:aadt', 
        area_key: 'all', 
        status: 'error', 
        error: trafficError.message 
      });
    } else if (trafficSegments && trafficSegments.length > 0) {
      // Get TxDOT layer
      const { data: txdotLayer } = await supabase
        .from('gis_layers')
        .select('id')
        .eq('layer_key', 'txdot:aadt')
        .single();

      if (txdotLayer) {
        const areaKey = 'texas';

        // Check if already exists
        const { data: existing } = await supabase
          .from('gis_layer_versions')
          .select('id')
          .eq('layer_id', txdotLayer.id)
          .eq('area_key', areaKey)
          .eq('is_active', true)
          .single();

        if (existing) {
          console.log(`✓ txdot:aadt (${areaKey}): Already migrated`);
          results.push({ 
            layer_key: 'txdot:aadt', 
            area_key: areaKey, 
            status: 'skipped' 
          });
        } else {
          // Create GeoJSON
          const geojson = {
            type: 'FeatureCollection',
            features: trafficSegments.map(segment => ({
              type: 'Feature',
              geometry: segment.geometry,
              properties: {
                segment_id: segment.segment_id,
                roadway: segment.roadway,
                aadt: segment.aadt,
                year: segment.year,
                source: segment.source
              }
            }))
          };

          const checksum = await computeChecksum(JSON.stringify(geojson.features));

          const { error: insertError } = await supabase
            .from('gis_layer_versions')
            .insert({
              layer_id: txdotLayer.id,
              area_key: areaKey,
              checksum_sha256: checksum,
              record_count: trafficSegments.length,
              geojson,
              size_bytes: JSON.stringify(geojson).length,
              is_active: true,
              expires_at: calculateExpiry('quarterly'),
              fetched_at: new Date().toISOString()
            });

          if (insertError) {
            console.error(`✗ txdot:aadt (${areaKey}): ${insertError.message}`);
            results.push({ 
              layer_key: 'txdot:aadt', 
              area_key: areaKey, 
              status: 'error', 
              error: insertError.message 
            });
          } else {
            console.log(`✓ txdot:aadt (${areaKey}): Migrated (${trafficSegments.length} features)`);
            results.push({ 
              layer_key: 'txdot:aadt', 
              area_key: areaKey, 
              status: 'success', 
              record_count: trafficSegments.length 
            });
          }
        }
      }
    }

    // ========================================================================
    // Summary
    // ========================================================================
    console.log('\n✅ Migration complete!');
    console.log(`   Success: ${results.filter(r => r.status === 'success').length}`);
    console.log(`   Skipped: ${results.filter(r => r.status === 'skipped').length}`);
    console.log(`   Errors: ${results.filter(r => r.status === 'error').length}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Legacy GIS data migration complete',
        results,
        summary: {
          total: results.length,
          success: results.filter(r => r.status === 'success').length,
          skipped: results.filter(r => r.status === 'skipped').length,
          errors: results.filter(r => r.status === 'error').length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

async function computeChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function calculateExpiry(frequency: string): string {
  const now = new Date();
  switch (frequency) {
    case 'hourly':
      return new Date(now.getTime() + 3600 * 1000).toISOString();
    case 'daily':
      return new Date(now.getTime() + 86400 * 1000).toISOString();
    case 'weekly':
      return new Date(now.getTime() + 7 * 86400 * 1000).toISOString();
    case 'monthly':
      return new Date(now.getTime() + 30 * 86400 * 1000).toISOString();
    case 'quarterly':
      return new Date(now.getTime() + 90 * 86400 * 1000).toISOString();
    default:
      return new Date(now.getTime() + 86400 * 1000).toISOString();
  }
}
