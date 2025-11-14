const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Validates intersection input
 * Expected format: "Street A & Street B" or "Street A and Street B"
 */
function validateIntersection(intersection: string): { valid: boolean; error?: string } {
  if (!intersection || typeof intersection !== 'string') {
    return { valid: false, error: 'Intersection must be a non-empty string' };
  }
  
  // Trim whitespace
  intersection = intersection.trim();
  
  // Min length: 7 characters (e.g., "A & B")
  if (intersection.length < 7) {
    return { valid: false, error: 'Intersection must be at least 7 characters' };
  }
  
  // Max length: 150 characters
  if (intersection.length > 150) {
    return { valid: false, error: 'Intersection must be less than 150 characters' };
  }
  
  // Must contain an intersection indicator (& or "and")
  if (!intersection.includes('&') && !/\band\b/i.test(intersection)) {
    return { valid: false, error: 'Intersection must contain "&" or "and" between street names' };
  }
  
  // Reject suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /\$\{/,
    /\x00/,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(intersection)) {
      return { valid: false, error: 'Intersection contains invalid characters' };
    }
  }
  
  return { valid: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { intersection } = await req.json();
    
    // 🛡️ SECURITY: Validate intersection input
    const validation = validateIntersection(intersection);
    if (!validation.valid) {
      console.warn('⚠️ Invalid intersection input:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedIntersection = intersection.trim();

    console.log('Geocoding intersection:', sanitizedIntersection);

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!GOOGLE_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    // Append Houston, TX to help with geocoding accuracy
    const address = `${sanitizedIntersection}, Houston, TX`;
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
      `address=${encodeURIComponent(address)}&` +
      `key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${data.status}`);
    }

    const result = data.results[0];
    const location = result.geometry.location;

    return new Response(
      JSON.stringify({
        lat: location.lat,
        lng: location.lng,
        formatted_address: result.formatted_address,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error geocoding intersection:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
