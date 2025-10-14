import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const checks = {
    postgis: false,
    feature_flags: false,
    cost_data: false,
    lovable_ai: false,
    pdfshift: false
  };

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Check PostGIS
  try {
    const { data, error } = await supabase.rpc('calculate_acreage', {
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
    checks.postgis = !error && typeof data === 'number';
  } catch (error) {
    console.error('PostGIS check failed:', error);
  }

  // Check feature flags table
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('count')
      .limit(1);
    checks.feature_flags = !error;
  } catch (error) {
    console.error('Feature flags check failed:', error);
  }

  // Check cost schedule data
  try {
    const { data, error } = await supabase
      .from('cost_schedule_data')
      .select('count')
      .limit(1);
    checks.cost_data = !error;
  } catch (error) {
    console.error('Cost data check failed:', error);
  }

  // Check Lovable AI
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/models', {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`
      }
    });
    checks.lovable_ai = response.ok;
  } catch (error) {
    console.error('Lovable AI check failed:', error);
  }

  // Check PDFShift
  try {
    const apiKey = Deno.env.get('PDFSHIFT_API_KEY');
    if (apiKey) {
      const response = await fetch('https://api.pdfshift.io/v3/info', {
        headers: {
          'Authorization': `Basic ${btoa(apiKey + ':')}`
        }
      });
      checks.pdfshift = response.ok;
    }
  } catch (error) {
    console.error('PDFShift check failed:', error);
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
});
