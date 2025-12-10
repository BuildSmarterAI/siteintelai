/**
 * Houston Building Permits Scraper
 * Scrapes permit data from Houston Permitting Center (requires JS rendering)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { smartFetch } from "../_shared/scraper-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  address?: string;
  permit_number?: string;
  date_from?: string;
  date_to?: string;
  max_results?: number;
}

interface PermitRecord {
  permit_number: string;
  address: string;
  permit_type: string;
  status: string;
  issue_date: string | null;
  expiration_date: string | null;
  description: string | null;
  contractor: string | null;
  valuation: number | null;
  scraped_at: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: ScrapeRequest = await req.json();
    const { address, permit_number, date_from, date_to, max_results = 50 } = body;

    console.log(`[scrape-permits] Starting permit scrape for: ${address || permit_number || 'all'}`);

    // Houston Permitting Center search URL
    // Note: This is a placeholder - actual URL structure may vary
    const baseUrl = 'https://houstonpermittingcenter.org/permits/search';
    
    const params = new URLSearchParams();
    if (address) params.set('address', address);
    if (permit_number) params.set('permit_number', permit_number);
    if (date_from) params.set('date_from', date_from);
    if (date_to) params.set('date_to', date_to);
    params.set('limit', String(max_results));

    const searchUrl = `${baseUrl}?${params.toString()}`;
    
    console.log(`[scrape-permits] Fetching: ${searchUrl}`);

    // Use ScraperAPI with JS rendering enabled (primary mode for permit portals)
    const result = await smartFetch(searchUrl, {
      scraperMode: 'primary',
      scraperConfig: {
        render: true,  // JavaScript rendering required
        country_code: 'us',
        device_type: 'desktop'
      },
      timeout: 60000,
      retries: 3,
      endpointType: 'permit_portal',
      cacheTtlHours: 6  // Permits change frequently
    });

    console.log(`[scrape-permits] Fetch completed via ${result.source} in ${result.responseTimeMs}ms`);

    // Parse the HTML response (placeholder - actual parsing depends on site structure)
    // In production, this would use a DOM parser to extract permit data
    const permits: PermitRecord[] = [];
    
    // Example parsing logic (would need to be adapted to actual HTML structure)
    /*
    const doc = new DOMParser().parseFromString(result.data, 'text/html');
    const rows = doc.querySelectorAll('table.permits-table tbody tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      permits.push({
        permit_number: cells[0]?.textContent?.trim() || '',
        address: cells[1]?.textContent?.trim() || '',
        permit_type: cells[2]?.textContent?.trim() || '',
        status: cells[3]?.textContent?.trim() || '',
        issue_date: cells[4]?.textContent?.trim() || null,
        expiration_date: null,
        description: cells[5]?.textContent?.trim() || null,
        contractor: cells[6]?.textContent?.trim() || null,
        valuation: parseFloat(cells[7]?.textContent?.replace(/[^0-9.]/g, '') || '0') || null,
        scraped_at: new Date().toISOString()
      });
    });
    */

    // For now, return the raw response for debugging/development
    const response = {
      success: true,
      data: {
        permits: permits,
        raw_response_preview: typeof result.data === 'string' 
          ? result.data.substring(0, 1000) 
          : JSON.stringify(result.data).substring(0, 1000),
        search_params: Object.fromEntries(params)
      },
      meta: {
        source: result.source,
        response_time_ms: result.responseTimeMs,
        api_credits_used: result.apiCreditsUsed,
        permit_count: permits.length,
        scraped_at: new Date().toISOString()
      }
    };

    // Store permits if any were parsed (commented out until parsing is implemented)
    /*
    if (permits.length > 0) {
      const { error } = await supabase
        .from('permits_scraped')
        .upsert(permits, { onConflict: 'permit_number' });
      
      if (error) {
        console.warn('[scrape-permits] Failed to store permits:', error);
      }
    }
    */

    console.log(`[scrape-permits] Completed in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[scrape-permits] Error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        meta: {
          duration_ms: Date.now() - startTime
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
