import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SocrataRecord {
  taxpayer_number?: string;
  taxpayer_name?: string;
  location_number?: string;
  location_name?: string;
  location_address?: string;
  location_city?: string;
  location_county?: string;
  location_zip?: string;
  obligation_end_date_yyyymmdd?: string;
  total_receipts?: string;
  beer_receipts?: string;
  wine_receipts?: string;
  liquor_receipts?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[hii-ingest] Starting Texas Mixed Beverage Activity ingestion...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const socrataToken = Deno.env.get('SOCRATA_TOKEN') || '';
    const googleMapsKey = Deno.env.get('GOOGLE_MAPS_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseKey);

    const SOURCE_URL = "https://data.texas.gov/resource/naix-2893.json";
    const BATCH_SIZE = 5000;
    let offset = 0;
    let totalIngested = 0;
    let hasMore = true;

    while (hasMore) {
      console.log(`[hii-ingest] Fetching batch at offset ${offset}...`);

      // Fetch from Texas Open Data Portal
      const headers: HeadersInit = { 
        'Accept': 'application/json'
      };
      
      if (socrataToken) {
        headers['X-App-Token'] = socrataToken;
      }

      const response = await fetch(
        `${SOURCE_URL}?$limit=${BATCH_SIZE}&$offset=${offset}&$order=obligation_end_date_yyyymmdd DESC`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Socrata API error: ${response.status} ${response.statusText}`);
      }

      const data: SocrataRecord[] = await response.json();
      
      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`[hii-ingest] Processing ${data.length} records...`);

      // Transform and geocode records
      const transformedRecords = [];
      
      for (const record of data) {
        try {
          const fullAddress = `${record.location_address || ''}, ${record.location_city || ''}, TX ${record.location_zip || ''}`.trim();
          
          let lat = null;
          let lon = null;
          let geog = null;

          // Geocode if we have address and Google Maps API key
          if (fullAddress && fullAddress.length > 10 && googleMapsKey) {
            try {
              const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${googleMapsKey}`;
              const geocodeResponse = await fetch(geocodeUrl);
              const geocodeData = await geocodeResponse.json();

              if (geocodeData.status === 'OK' && geocodeData.results?.[0]) {
                lat = geocodeData.results[0].geometry.location.lat;
                lon = geocodeData.results[0].geometry.location.lng;
                geog = `POINT(${lon} ${lat})`;
              }
            } catch (geoError) {
              console.warn(`[hii-ingest] Geocoding failed for ${fullAddress}:`, geoError);
            }
          }

          // Parse date (YYYYMMDD format)
          const dateStr = record.obligation_end_date_yyyymmdd || '';
          const periodEndDate = dateStr.length === 8 
            ? `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
            : null;

          if (!periodEndDate) {
            console.warn('[hii-ingest] Skipping record with invalid date:', record);
            continue;
          }

          // Create hash for deduplication
          const srcHash = `${record.taxpayer_number}_${record.location_number}_${dateStr}`;

          transformedRecords.push({
            taxpayer_number: record.taxpayer_number || null,
            taxpayer_name: record.taxpayer_name || null,
            location_number: record.location_number || null,
            location_name: record.location_name || null,
            address: record.location_address || null,
            city: record.location_city || null,
            county: record.location_county || null,
            zip_code: record.location_zip || null,
            period_end_date: periodEndDate,
            total_receipts: parseFloat(record.total_receipts || '0'),
            beer_receipts: parseFloat(record.beer_receipts || '0'),
            wine_receipts: parseFloat(record.wine_receipts || '0'),
            liquor_receipts: parseFloat(record.liquor_receipts || '0'),
            lat,
            lon,
            geog,
            src_hash: srcHash,
            updated_at: new Date().toISOString(),
          });
        } catch (transformError) {
          console.error('[hii-ingest] Error transforming record:', transformError);
        }
      }

      // Upsert to Supabase (using src_hash as unique key)
      if (transformedRecords.length > 0) {
        const { error } = await supabase
          .from('tx_mixed_beverage_activity')
          .upsert(transformedRecords, { 
            onConflict: 'src_hash',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error('[hii-ingest] Supabase upsert error:', error);
          throw error;
        }

        totalIngested += transformedRecords.length;
        console.log(`[hii-ingest] Upserted ${transformedRecords.length} records. Total: ${totalIngested}`);
      }

      // Continue pagination
      offset += BATCH_SIZE;

      // Safety limit to prevent infinite loops
      if (offset > 500000) {
        console.log('[hii-ingest] Reached safety limit of 500k records');
        hasMore = false;
      }
    }

    console.log(`[hii-ingest] Ingestion complete. Total records processed: ${totalIngested}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        total_ingested: totalIngested,
        message: 'HII data ingestion completed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[hii-ingest] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
