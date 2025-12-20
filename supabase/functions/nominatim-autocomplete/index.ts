import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NominatimResult {
  place_id: number;
  osm_id: number;
  osm_type: string;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  importance: number;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

// Texas state bounds
const TEXAS_BOUNDS = {
  minLat: 25.84,
  maxLat: 36.50,
  minLng: -106.65,
  maxLng: -93.51,
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { input, limit = 5 } = await req.json()
    
    if (!input || input.length < 3) {
      return new Response(
        JSON.stringify({ predictions: [], status: 'INVALID_REQUEST' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[nominatim-autocomplete] Searching Texas for: "${input}"`)

    // Build Nominatim search URL - limit to Texas addresses only
    const params = new URLSearchParams({
      q: input,
      format: 'jsonv2',
      addressdetails: '1',
      countrycodes: 'us',
      viewbox: `${TEXAS_BOUNDS.minLng},${TEXAS_BOUNDS.maxLat},${TEXAS_BOUNDS.maxLng},${TEXAS_BOUNDS.minLat}`,
      bounded: '1',
      limit: String(Math.min(limit * 2, 10)), // Request more to filter
      dedupe: '1'
    })

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SiteIntel/1.0 (harris@maxxbuilders.com)', // Required by Nominatim ToS
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`[nominatim-autocomplete] Nominatim error: ${response.status}`)
      return new Response(
        JSON.stringify({ predictions: [], status: 'API_ERROR' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results: NominatimResult[] = await response.json()
    console.log(`[nominatim-autocomplete] Got ${results.length} raw results`)

    // Filter to Texas only as a safety net
    const texasResults = results.filter(result => 
      result.address?.state === 'Texas' || 
      result.address?.state === 'TX'
    );
    console.log(`[nominatim-autocomplete] ${texasResults.length} Texas results after filter`)

    // Transform to Google-like format for compatibility
    const predictions = texasResults.slice(0, limit).map(result => {
      const addr = result.address || {}
      const city = addr.city || addr.town || addr.village || ''
      const state = addr.state || ''
      
      // Build main text (street address)
      let mainText = ''
      if (addr.house_number && addr.road) {
        mainText = `${addr.house_number} ${addr.road}`
      } else if (addr.road) {
        mainText = addr.road
      } else {
        // Use first part of display_name
        mainText = result.display_name.split(',')[0]
      }

      // Build secondary text (city, state)
      const secondaryText = [city, state].filter(Boolean).join(', ')

      return {
        place_id: `osm_${result.osm_type}_${result.osm_id}`,
        description: result.display_name,
        structured_formatting: {
          main_text: mainText,
          secondary_text: secondaryText || result.display_name.split(',').slice(1).join(',').trim()
        },
        // Include coordinates directly (Nominatim bonus!)
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        // Include address details for direct use
        addressDetails: {
          county: addr.county?.replace(' County', ''),
          city: city,
          state: state,
          zipCode: addr.postcode,
          neighborhood: addr.neighbourhood || addr.suburb
        },
        source: 'nominatim'
      }
    })

    return new Response(
      JSON.stringify({ 
        predictions, 
        status: predictions.length > 0 ? 'OK' : 'ZERO_RESULTS',
        source: 'nominatim'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[nominatim-autocomplete] Error:', error)
    return new Response(
      JSON.stringify({ 
        predictions: [], 
        status: 'ERROR',
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
