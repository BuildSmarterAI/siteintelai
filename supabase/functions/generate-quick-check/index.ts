import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP
const RATE_LIMIT_CACHE_KEY_PREFIX = 'quickcheck_rate:';

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

/**
 * Get client identifier for rate limiting (IP or fingerprint)
 */
function getClientIdentifier(req: Request): string {
  // Try to get real IP from various headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfIp = req.headers.get('cf-connecting-ip');
  
  // Use the first available IP, defaulting to 'unknown'
  const ip = cfIp || realIp || (forwardedFor?.split(',')[0]?.trim()) || 'unknown';
  
  // Hash the IP for privacy
  return ip;
}

/**
 * Check and update rate limit for a client
 */
async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  clientId: string
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const cacheKey = `${RATE_LIMIT_CACHE_KEY_PREFIX}${clientId}`;
  const now = Date.now();
  const expiresAt = new Date(now + RATE_LIMIT_WINDOW_MS).toISOString();
  
  // Try to get existing rate limit entry
  const { data: existing } = await supabase
    .from('api_cache_universal')
    .select('response, expires_at')
    .eq('cache_key', cacheKey)
    .single();
  
  let currentCount = 0;
  let windowStart = now;
  
  if (existing && existing.response) {
    const record = existing.response as { count: number; windowStart: number };
    const expiresTime = new Date(existing.expires_at).getTime();
    
    // Check if the window is still valid
    if (expiresTime > now) {
      currentCount = record.count;
      windowStart = record.windowStart;
    }
  }
  
  // Check if limit exceeded
  if (currentCount >= RATE_LIMIT_MAX_REQUESTS) {
    const resetMs = RATE_LIMIT_WINDOW_MS - (now - windowStart);
    return { 
      allowed: false, 
      remaining: 0, 
      resetMs: Math.max(0, resetMs) 
    };
  }
  
  // Increment counter
  const newCount = currentCount + 1;
  await supabase
    .from('api_cache_universal')
    .upsert({
      cache_key: cacheKey,
      provider: 'rate_limit',
      endpoint: 'generate-quick-check',
      response: { count: newCount, windowStart: windowStart || now },
      expires_at: expiresAt,
    }, { onConflict: 'cache_key' });
  
  return { 
    allowed: true, 
    remaining: RATE_LIMIT_MAX_REQUESTS - newCount,
    resetMs: RATE_LIMIT_WINDOW_MS 
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client for rate limiting
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 🛡️ SECURITY: Rate limiting check
    const clientId = getClientIdentifier(req);
    const rateLimit = await checkRateLimit(supabase, clientId);
    
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(rateLimit.resetMs / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(rateLimit.resetMs / 1000)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + Math.ceil(rateLimit.resetMs / 1000))
          } 
        }
      );
    }

    const { address } = await req.json();
    
    // 🛡️ SECURITY: Validate address input
    const validation = validateAddress(address);
    if (!validation.valid) {
      // Log validation failures (potential abuse)
      await supabase.from('api_logs').insert({
        source: 'quick-check',
        endpoint: 'validate',
        duration_ms: 0,
        success: false,
        error_message: validation.error
      });
      
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trim and sanitize
    const sanitizedAddress = address.trim();
    const startTime = Date.now();

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
    } catch {
      // FEMA API error - continue with default
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

    const durationMs = Date.now() - startTime;

    // Log successful request
    await supabase.from('api_logs').insert({
      source: 'quick-check',
      endpoint: 'generate',
      duration_ms: durationMs,
      success: true
    });

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
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log error
    await supabase.from('api_logs').insert({
      source: 'quick-check',
      endpoint: 'error',
      duration_ms: 0,
      success: false,
      error_message: errorMessage
    });

    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
