import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Texas state bounds
const TEXAS_BOUNDS = {
  minLat: 25.84,
  maxLat: 36.50,
  minLng: -106.65,
  maxLng: -93.51,
}

// Cost constants
const NOMINATIM_COST = 0
const GOOGLE_COST = 0.00283

// Rate limits
const RATE_LIMIT_AUTHENTICATED = 10 // per minute
const RATE_LIMIT_ANONYMOUS = 5 // per minute

interface AutocompleteRequest {
  input: string
  sessionToken: string
  userId?: string
  preferredProvider?: 'nominatim' | 'google' | 'auto'
  limit?: number
  bounds?: { sw: [number, number]; ne: [number, number] }
}

interface Prediction {
  description: string
  placeId?: string
  lat?: number
  lng?: number
  source: 'nominatim' | 'google'
  confidence: number
  addressComponents?: {
    streetNumber?: string
    street?: string
    city?: string
    county?: string
    state?: string
    zip?: string
  }
}

interface AutocompleteResponse {
  predictions: Prediction[]
  provider: 'nominatim' | 'google' | 'none'
  cacheHit: boolean
  traceId: string
  requestCost: number
}

function generateTraceId(): string {
  return crypto.randomUUID().substring(0, 8)
}

function normalizeInput(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, ' ')
}

function sanitizeInput(input: string): string {
  // Remove emojis and special characters, keep alphanumeric, spaces, and common address chars
  return input.replace(/[^\\w\\s\\-.,#&]/g, '').trim()
}

async function checkRateLimit(
  supabase: any,
  userId: string | null,
  clientIp: string,
  traceId: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const limit = userId ? RATE_LIMIT_AUTHENTICATED : RATE_LIMIT_ANONYMOUS
  const identifier = userId || `ip:${clientIp}`
  
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
  
  const { count } = await supabase
    .from('api_logs')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'address-autocomplete')
    .gte('timestamp', oneMinuteAgo)
    .or(`application_id.eq.${userId || 'null'},cache_key.ilike.ip:${clientIp}%`)

  if ((count || 0) >= limit) {
    console.log(`[address-autocomplete:${traceId}] Rate limit exceeded for ${identifier}: ${count}/${limit}`)
    return { allowed: false, retryAfter: 60 }
  }
  
  return { allowed: true }
}

async function checkEmergencyMode(supabase: any): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'emergency_cost_mode')
      .single()
    
    return data?.value === true || data?.value === 'true'
  } catch {
    return false
  }
}

async function getCachedResult(
  supabase: any,
  cacheKey: string,
  traceId: string
): Promise<Prediction[] | null> {
  try {
    const { data } = await supabase
      .from('api_cache_universal')
      .select('response')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (data?.response) {
      console.log(`[address-autocomplete:${traceId}] Cache HIT for key=${cacheKey}`)
      
      // Update hit count
      await supabase.rpc('increment_cache_hit_count', { p_cache_key: cacheKey }).catch(() => {})
      
      return data.response as Prediction[]
    }
  } catch {
    // Cache miss
  }
  return null
}

async function setCacheResult(
  supabase: any,
  cacheKey: string,
  response: Prediction[],
  ttlHours: number,
  provider: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString()
  
  await supabase
    .from('api_cache_universal')
    .upsert({
      cache_key: cacheKey,
      provider,
      endpoint: 'autocomplete',
      response,
      expires_at: expiresAt,
      request_params: { type: 'autocomplete' },
      hit_count: 0
    }, { onConflict: 'cache_key' })
    .catch((err: any) => console.error('Cache write error:', err))
}

async function logApiCall(
  supabase: any,
  source: string,
  endpoint: string,
  durationMs: number,
  success: boolean,
  userId: string | null,
  traceId: string,
  errorMessage?: string
): Promise<void> {
  await supabase
    .from('api_logs')
    .insert({
      source,
      endpoint,
      duration_ms: durationMs,
      success,
      application_id: userId,
      cache_key: `trace:${traceId}`,
      error_message: errorMessage
    })
    .catch((err: any) => console.error('Log write error:', err))
}

interface NominatimResult {
  place_id: number
  osm_id: number
  osm_type: string
  lat: string
  lon: string
  display_name: string
  type: string
  importance: number
  address?: {
    house_number?: string
    road?: string
    neighbourhood?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    postcode?: string
    country?: string
  }
}

async function fetchNominatim(
  input: string,
  limit: number,
  traceId: string
): Promise<Prediction[]> {
  const startTime = Date.now()
  
  const params = new URLSearchParams({
    q: input,
    format: 'jsonv2',
    addressdetails: '1',
    countrycodes: 'us',
    viewbox: `${TEXAS_BOUNDS.minLng},${TEXAS_BOUNDS.maxLat},${TEXAS_BOUNDS.maxLng},${TEXAS_BOUNDS.minLat}`,
    bounded: '1',
    limit: String(Math.min(limit * 2, 10)),
    dedupe: '1'
  })

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: {
      'User-Agent': 'SiteIntel/1.0 (harris@maxxbuilders.com)',
      'Accept': 'application/json'
    }
  })

  const durationMs = Date.now() - startTime
  console.log(`[address-autocomplete:${traceId}] Nominatim responded in ${durationMs}ms`)

  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.status}`)
  }

  const results: NominatimResult[] = await response.json()
  
  // Filter to Texas only
  const texasResults = results.filter(r => 
    r.address?.state === 'Texas' || r.address?.state === 'TX'
  )

  console.log(`[address-autocomplete:${traceId}] Nominatim returned ${texasResults.length} Texas results`)

  return texasResults.slice(0, limit).map(result => {
    const addr = result.address || {}
    const city = addr.city || addr.town || addr.village || ''
    
    let mainText = ''
    if (addr.house_number && addr.road) {
      mainText = `${addr.house_number} ${addr.road}`
    } else if (addr.road) {
      mainText = addr.road
    } else {
      mainText = result.display_name.split(',')[0]
    }

    return {
      description: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      source: 'nominatim' as const,
      confidence: Math.min(result.importance + 0.3, 1.0),
      addressComponents: {
        streetNumber: addr.house_number,
        street: addr.road,
        city,
        county: addr.county?.replace(' County', ''),
        state: addr.state,
        zip: addr.postcode
      }
    }
  })
}

async function fetchGoogle(
  input: string,
  sessionToken: string,
  limit: number,
  traceId: string
): Promise<Prediction[]> {
  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
  if (!apiKey) {
    console.error(`[address-autocomplete:${traceId}] No Google API key configured`)
    return []
  }

  const startTime = Date.now()
  
  const params = new URLSearchParams({
    input,
    key: apiKey,
    sessiontoken: sessionToken,
    types: 'address',
    components: 'country:us',
    location: '29.7604,-95.3698', // Houston center
    radius: '200000', // ~200km
  })

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
  )

  const durationMs = Date.now() - startTime
  console.log(`[address-autocomplete:${traceId}] Google responded in ${durationMs}ms`)

  if (!response.ok) {
    throw new Error(`Google error: ${response.status}`)
  }

  const data = await response.json()
  
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.error(`[address-autocomplete:${traceId}] Google API error: ${data.status}`)
    return []
  }

  const predictions = (data.predictions || []).slice(0, limit)
  console.log(`[address-autocomplete:${traceId}] Google returned ${predictions.length} results`)

  return predictions.map((p: any) => ({
    description: p.description,
    placeId: p.place_id,
    source: 'google' as const,
    confidence: 0.9,
    addressComponents: parseGoogleTerms(p.terms)
  }))
}

function parseGoogleTerms(terms: any[]): Prediction['addressComponents'] {
  if (!terms || terms.length < 2) return {}
  
  // Terms are typically: [street, city, state, country]
  return {
    street: terms[0]?.value,
    city: terms[1]?.value,
    state: terms[2]?.value
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const traceId = generateTraceId()
  const startTime = Date.now()

  try {
    const body: AutocompleteRequest = await req.json()
    const { 
      input, 
      sessionToken, 
      userId, 
      preferredProvider = 'auto',
      limit = 5 
    } = body

    console.log(`[address-autocomplete:${traceId}] Request: input="${input?.substring(0, 30)}", provider=${preferredProvider}`)

    // Validate input
    const sanitizedInput = sanitizeInput(input || '')
    if (sanitizedInput.length < 3) {
      return new Response(
        JSON.stringify({
          predictions: [],
          provider: 'none',
          cacheHit: false,
          traceId,
          requestCost: 0,
          error: 'Input must be at least 3 characters'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

    // Check rate limit
    const rateCheck = await checkRateLimit(supabase, userId || null, clientIp, traceId)
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({
          predictions: [],
          provider: 'none',
          cacheHit: false,
          traceId,
          requestCost: 0,
          error: 'Rate limit exceeded',
          retryAfter: rateCheck.retryAfter
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateCheck.retryAfter)
          } 
        }
      )
    }

    // Check emergency mode
    const emergencyMode = await checkEmergencyMode(supabase)
    const normalizedInput = normalizeInput(sanitizedInput)
    const effectiveLimit = Math.min(limit, 10)

    let predictions: Prediction[] = []
    let provider: 'nominatim' | 'google' | 'none' = 'none'
    let cacheHit = false
    let requestCost = 0

    // Determine provider strategy
    const useNominatim = preferredProvider === 'auto' || preferredProvider === 'nominatim'
    const useGoogle = (preferredProvider === 'auto' || preferredProvider === 'google') && !emergencyMode

    // Try Nominatim first (if applicable)
    if (useNominatim) {
      const nominatimCacheKey = `autocomplete:v1:nominatim:${normalizedInput}`
      
      // Check cache
      const cached = await getCachedResult(supabase, nominatimCacheKey, traceId)
      if (cached && cached.length > 0) {
        predictions = cached
        provider = 'nominatim'
        cacheHit = true
        requestCost = 0
      } else {
        // Fetch from Nominatim
        try {
          predictions = await fetchNominatim(sanitizedInput, effectiveLimit, traceId)
          provider = 'nominatim'
          requestCost = NOMINATIM_COST

          // Cache results (24h TTL)
          if (predictions.length > 0) {
            await setCacheResult(supabase, nominatimCacheKey, predictions, 24, 'nominatim')
          }

          // Log API call
          await logApiCall(supabase, 'address-autocomplete', 'nominatim', Date.now() - startTime, true, userId || null, traceId)
        } catch (err) {
          console.error(`[address-autocomplete:${traceId}] Nominatim error:`, err)
          await logApiCall(supabase, 'address-autocomplete', 'nominatim', Date.now() - startTime, false, userId || null, traceId, String(err))
        }
      }
    }

    // Fallback to Google if Nominatim returned 0 results
    if (predictions.length === 0 && useGoogle && preferredProvider !== 'nominatim') {
      console.log(`[address-autocomplete:${traceId}] Falling back to Google...`)
      
      const googleCacheKey = `autocomplete:v1:google:${normalizedInput}`
      
      // Check cache
      const cached = await getCachedResult(supabase, googleCacheKey, traceId)
      if (cached && cached.length > 0) {
        predictions = cached
        provider = 'google'
        cacheHit = true
        requestCost = 0
      } else {
        try {
          predictions = await fetchGoogle(sanitizedInput, sessionToken || crypto.randomUUID(), effectiveLimit, traceId)
          provider = 'google'
          requestCost = GOOGLE_COST

          // Cache results (1h TTL - shorter for paid API)
          if (predictions.length > 0) {
            await setCacheResult(supabase, googleCacheKey, predictions, 1, 'google')
          }

          // Log API call
          await logApiCall(supabase, 'address-autocomplete', 'google', Date.now() - startTime, true, userId || null, traceId)
        } catch (err) {
          console.error(`[address-autocomplete:${traceId}] Google error:`, err)
          await logApiCall(supabase, 'address-autocomplete', 'google', Date.now() - startTime, false, userId || null, traceId, String(err))
        }
      }
    }

    if (emergencyMode && provider === 'none' && !cacheHit) {
      console.log(`[address-autocomplete:${traceId}] Emergency mode active, Google blocked`)
    }

    const response: AutocompleteResponse = {
      predictions,
      provider: predictions.length > 0 ? provider : 'none',
      cacheHit,
      traceId,
      requestCost
    }

    console.log(`[address-autocomplete:${traceId}] Response: provider=${provider}, results=${predictions.length}, cached=${cacheHit}, cost=$${requestCost}`)

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error(`[address-autocomplete:${traceId}] Error:`, error)
    
    return new Response(
      JSON.stringify({
        predictions: [],
        provider: 'none',
        cacheHit: false,
        traceId,
        requestCost: 0,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
