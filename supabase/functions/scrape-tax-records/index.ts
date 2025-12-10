/**
 * Harris County Tax Records Scraper
 * Scrapes tax delinquency data from Harris County Tax Office
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { smartFetch } from "../_shared/scraper-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  account_number?: string;
  address?: string;
  owner_name?: string;
  include_delinquent_only?: boolean;
}

interface TaxRecord {
  account_number: string;
  owner_name: string;
  property_address: string;
  tax_year: number;
  total_tax: number | null;
  amount_paid: number | null;
  amount_due: number | null;
  is_delinquent: boolean;
  delinquent_date: string | null;
  penalty_interest: number | null;
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
    const { account_number, address, owner_name, include_delinquent_only } = body;

    console.log(`[scrape-tax-records] Starting tax record scrape for: ${account_number || address || owner_name || 'search'}`);

    // Harris County Tax Office search URL
    const baseUrl = 'https://www.hctax.net/Property/PropertySearch';
    
    const params = new URLSearchParams();
    if (account_number) params.set('account', account_number);
    if (address) params.set('address', address);
    if (owner_name) params.set('owner', owner_name);

    const searchUrl = `${baseUrl}?${params.toString()}`;
    
    console.log(`[scrape-tax-records] Fetching: ${searchUrl}`);

    // Use ScraperAPI with JS rendering (primary mode for tax portals)
    const result = await smartFetch(searchUrl, {
      scraperMode: 'primary',
      scraperConfig: {
        render: true,
        country_code: 'us',
        device_type: 'desktop',
        premium: true  // Use premium proxies for government sites
      },
      timeout: 60000,
      retries: 3,
      endpointType: 'tax_portal',
      cacheTtlHours: 12  // Tax data updates less frequently
    });

    console.log(`[scrape-tax-records] Fetch completed via ${result.source} in ${result.responseTimeMs}ms`);

    // Parse the HTML response (placeholder - actual parsing depends on site structure)
    const taxRecords: TaxRecord[] = [];
    
    // Example parsing logic
    /*
    const doc = new DOMParser().parseFromString(result.data, 'text/html');
    const rows = doc.querySelectorAll('table#searchResults tbody tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const amountDue = parseFloat(cells[6]?.textContent?.replace(/[^0-9.]/g, '') || '0') || 0;
      const isDelinquent = amountDue > 0;
      
      if (!include_delinquent_only || isDelinquent) {
        taxRecords.push({
          account_number: cells[0]?.textContent?.trim() || '',
          owner_name: cells[1]?.textContent?.trim() || '',
          property_address: cells[2]?.textContent?.trim() || '',
          tax_year: parseInt(cells[3]?.textContent?.trim() || '0'),
          total_tax: parseFloat(cells[4]?.textContent?.replace(/[^0-9.]/g, '') || '0') || null,
          amount_paid: parseFloat(cells[5]?.textContent?.replace(/[^0-9.]/g, '') || '0') || null,
          amount_due: amountDue || null,
          is_delinquent: isDelinquent,
          delinquent_date: isDelinquent ? cells[7]?.textContent?.trim() || null : null,
          penalty_interest: parseFloat(cells[8]?.textContent?.replace(/[^0-9.]/g, '') || '0') || null,
          scraped_at: new Date().toISOString()
        });
      }
    });
    */

    // For now, return the raw response for debugging
    const response = {
      success: true,
      data: {
        tax_records: taxRecords,
        raw_response_preview: typeof result.data === 'string' 
          ? result.data.substring(0, 1000) 
          : JSON.stringify(result.data).substring(0, 1000),
        search_params: Object.fromEntries(params)
      },
      meta: {
        source: result.source,
        response_time_ms: result.responseTimeMs,
        api_credits_used: result.apiCreditsUsed,
        record_count: taxRecords.length,
        delinquent_count: taxRecords.filter(r => r.is_delinquent).length,
        scraped_at: new Date().toISOString()
      }
    };

    // Link tax records to parcels if account numbers match (commented until parsing implemented)
    /*
    if (taxRecords.length > 0) {
      for (const record of taxRecords) {
        // Try to find matching parcel
        const { data: parcel } = await supabase
          .from('parcels')
          .select('parcel_uuid')
          .or(`cad_id.eq.${record.account_number},source_id.eq.${record.account_number}`)
          .single();
        
        if (parcel) {
          console.log(`[scrape-tax-records] Linked tax record to parcel: ${parcel.parcel_uuid}`);
        }
      }
    }
    */

    console.log(`[scrape-tax-records] Completed in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[scrape-tax-records] Error:', errorMessage);

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
