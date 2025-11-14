import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Validates address input to prevent abuse
 */
function validateAddress(address: string): { valid: boolean; error?: string } {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Address must be a non-empty string' };
  }
  
  // Trim whitespace
  address = address.trim();
  
  // Min length: 5 characters (e.g., "123 A")
  if (address.length < 5) {
    return { valid: false, error: 'Address must be at least 5 characters' };
  }
  
  // Max length: 200 characters (generous for full addresses)
  if (address.length > 200) {
    return { valid: false, error: 'Address must be less than 200 characters' };
  }
  
  // Reject suspicious patterns that could indicate injection attempts
  const suspiciousPatterns = [
    /<script/i,           // XSS attempts
    /javascript:/i,       // JavaScript protocol
    /on\w+\s*=/i,        // Event handlers
    /\$\{/,              // Template literals
    /\x00/,              // Null bytes
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(address)) {
      return { valid: false, error: 'Address contains invalid characters' };
    }
  }
  
  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();
    
    // 🛡️ SECURITY: Validate address input
    const validation = validateAddress(address);
    if (!validation.valid) {
      console.warn('⚠️ Invalid address input:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trim and sanitize
    const sanitizedAddress = address.trim();

    console.log('[QUICK-CHECK] Generating QuickCheck for address:', sanitizedAddress);

    // Geocode the address using Google Places API
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(sanitizedAddress)}&key=${GOOGLE_API_KEY}`;
    
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();
    
    if (!geocodeData.results || geocodeData.results.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Address not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const location = geocodeData.results[0].geometry.location;
    const lat = location.lat;
    const lng = location.lng;

    console.log('[QUICK-CHECK] Geocoded to:', { lat, lng });

    // Quick FEMA flood zone check
    const femaUrl = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE,ZONE_SUBTY&returnGeometry=false&f=json`;
    
    let floodRisk = 'Minimal Risk';
    try {
      const femaResponse = await fetch(femaUrl);
      const femaData = await femaResponse.json();
      
      if (femaData.features && femaData.features.length > 0) {
        const zone = femaData.features[0].attributes.FLD_ZONE;
        if (zone && ['A', 'AE', 'AH', 'AO', 'V', 'VE'].includes(zone)) {
          floodRisk = 'High Risk - Special Flood Hazard Area';
        } else if (zone === 'X') {
          floodRisk = 'Moderate to Low Risk';
        }
      }
    } catch (error) {
      console.error('[QUICK-CHECK] FEMA API error:', error);
    }

    // Simplified zoning check (would need actual zoning API)
    const zoningVerdict = 'Commercial Zoning Likely';

    // Generate simplified score based on flood risk
    let score = 75; // Base score
    if (floodRisk.includes('High Risk')) {
      score -= 25;
    } else if (floodRisk.includes('Moderate')) {
      score -= 10;
    }

    // Determine band
    let band = 'C';
    if (score >= 85) band = 'A';
    else if (score >= 75) band = 'B';
    else if (score >= 60) band = 'C';
    else if (score >= 45) band = 'D';
    else band = 'F';

    console.log('[QUICK-CHECK] Generated score:', score, 'Band:', band);

    return new Response(
      JSON.stringify({
        score,
        band,
        floodRisk,
        zoningVerdict,
        preview: true,
        lat,
        lng,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[QUICK-CHECK] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
