import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { corsHeaders } from "../_shared/cors.ts";

console.log("v2_health_check function started");

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const checks = {
      postgis: false,
      feature_flags: false,
      cost_data: false,
      lovable_ai: false,
      pdfshift: false
    };
    
    // Check PostGIS extension
    try {
      const { data } = await supabase.rpc('calculate_acreage', {
        geom: {
          type: 'Polygon',
          coordinates: [[
            [-95.3698, 29.7604],
            [-95.3698, 29.7614],
            [-95.3688, 29.7614],
            [-95.3688, 29.7604],
            [-95.3698, 29.7604]
          ]]
        }
      });
      checks.postgis = data !== null && data !== undefined;
    } catch (err) {
      console.error("PostGIS check failed:", err.message);
    }
    
    // Check feature flags table
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('count')
        .limit(1);
      checks.feature_flags = !error && data !== null;
    } catch (err) {
      console.error("Feature flags check failed:", err.message);
    }
    
    // Check cost_schedule_data table
    try {
      const { data, error } = await supabase
        .from('cost_schedule_data')
        .select('count')
        .limit(1);
      checks.cost_data = !error && data !== null;
    } catch (err) {
      console.error("Cost data check failed:", err.message);
    }
    
    // Check Lovable AI gateway
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`
        }
      });
      checks.lovable_ai = response.ok;
    } catch (err) {
      console.error("Lovable AI check failed:", err.message);
    }
    
    // Check PDFShift API
    try {
      const apiKey = Deno.env.get('PDFSHIFT_API_KEY');
      if (apiKey) {
        const response = await fetch('https://api.pdfshift.io/v3/info', {
          headers: {
            'Authorization': `Basic ${btoa(apiKey + ':')}`
          }
        });
        checks.pdfshift = response.ok;
      } else {
        checks.pdfshift = false;
      }
    } catch (err) {
      console.error("PDFShift check failed:", err.message);
    }
    
    const allHealthy = Object.values(checks).every(Boolean);
    
    return new Response(
      JSON.stringify({
        status: allHealthy ? 'healthy' : 'degraded',
        checks,
        timestamp: new Date().toISOString()
      }), 
      {
        status: allHealthy ? 200 : 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
    
  } catch (err) {
    console.error("Unexpected error in health check:", err);
    return new Response(
      JSON.stringify({ 
        status: 'error',
        error: err.message,
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
