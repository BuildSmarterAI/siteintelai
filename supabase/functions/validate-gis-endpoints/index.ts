import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EndpointTest {
  name: string;
  url: string;
  status: 'operational' | 'warning' | 'down';
  responseTime?: number;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting GIS endpoint validation...');
    
    // Load endpoint catalog
    const catalogPath = new URL('../enrich-utilities/endpoint_catalog.json', import.meta.url);
    const catalogText = await Deno.readTextFile(catalogPath);
    const catalog = JSON.parse(catalogText);
    
    const results: EndpointTest[] = [];
    const testCoord = { lat: 29.7555266, lng: -95.3632144 }; // Downtown Houston test point
    
    // Test Houston endpoints
    for (const [key, endpoint] of Object.entries(catalog.houston)) {
      const ep: any = endpoint;
      if (!ep.test_url) continue;
      
      console.log(`Testing ${ep.name}...`);
      const startTime = Date.now();
      
      try {
        const response = await fetch(ep.test_url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          const data = await response.json();
          const hasFeatures = data.features && data.features.length > 0;
          
          results.push({
            name: ep.name,
            url: ep.url,
            status: hasFeatures ? 'operational' : 'warning',
            responseTime,
            error: hasFeatures ? undefined : 'No features returned for test coordinate'
          });
          
          console.log(`✅ ${ep.name}: ${response.status} (${responseTime}ms) - ${hasFeatures ? 'has data' : 'no features'}`);
        } else {
          results.push({
            name: ep.name,
            url: ep.url,
            status: 'down',
            responseTime,
            error: `HTTP ${response.status}: ${response.statusText}`
          });
          
          console.error(`❌ ${ep.name}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        results.push({
          name: ep.name,
          url: ep.url,
          status: 'down',
          error: error instanceof Error ? error.message : String(error)
        });
        
        console.error(`❌ ${ep.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Generate summary
    const operational = results.filter(r => r.status === 'operational').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const down = results.filter(r => r.status === 'down').length;
    
    const summary = {
      timestamp: new Date().toISOString(),
      total_endpoints: results.length,
      operational,
      warnings,
      down,
      details: results
    };
    
    console.log(`📊 Validation complete: ${operational} operational, ${warnings} warnings, ${down} down`);
    
    // Store results in Supabase (optional)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    await supabase.from('api_logs').insert({
      endpoint: 'validate-gis-endpoints',
      source: 'system',
      success: down === 0,
      duration_ms: 0,
      error_message: down > 0 ? `${down} endpoints down` : null
    });
    
    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error('Validation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error) 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
