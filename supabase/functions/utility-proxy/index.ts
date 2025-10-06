import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Utility Proxy Edge Function
 * 
 * Purpose: Bypass DNS resolution issues with cohgis.houstontx.gov from Supabase edge runtime
 * 
 * This function acts as a transparent proxy for Houston GIS utility endpoints:
 * - Water Distribution Mains
 * - Sanitary Sewer Lines
 * - Storm Sewer Lines
 * 
 * Usage: Send POST request with { url, params } to fetch data on behalf of caller
 */

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, params } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Whitelist: Only allow Houston GIS endpoints
    const allowedHosts = [
      'cohgis.houstontx.gov',
      'gis.houstontx.gov',
      'mycity.houstontx.gov',
      'mycity2.houstontx.gov',
      'geogimsprod.houstontx.gov',
      'geogimstest.houstontx.gov'
    ];

    const targetUrl = new URL(url);
    if (!allowedHosts.includes(targetUrl.hostname)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized host. Only Houston GIS endpoints allowed.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query string if params provided
    let fullUrl = url;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      fullUrl = `${url}?${queryString}`;
    }

    console.log('Proxying request to:', fullUrl);

    // Make the proxied request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/BuildSmarter-Proxy'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    
    // Handle JSON responses
    if (contentType.includes('application/json')) {
      const data = await response.json();
      
      return new Response(
        JSON.stringify(data),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Handle other responses
    const text = await response.text();
    return new Response(
      text,
      {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType
        }
      }
    );

  } catch (error) {
    console.error('Proxy error:', error.message);
    
    return new Response(
      JSON.stringify({
        error: 'Proxy request failed',
        message: error.message,
        type: error.name
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
