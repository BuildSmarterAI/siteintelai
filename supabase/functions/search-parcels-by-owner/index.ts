/**
 * search-parcels-by-owner - B-05: Owner Name Search
 * 
 * Searches parcels by owner name with fuzzy matching and LLC/Corp variations.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OwnerSearchRequest {
  ownerName: string;
  county?: string;
  exactMatch?: boolean;
  limit?: number;
  offset?: number;
}

interface ParcelResult {
  apn: string;
  owner: string;
  siteAddress: string;
  acreage: number;
  totalValue: number;
  matchScore: number;
}

interface OwnerSearchResponse {
  parcels: ParcelResult[];
  totalCount: number;
  hasMore: boolean;
  traceId: string;
  duration_ms: number;
}

// Generate 8-char trace ID
function generateTraceId(): string {
  return crypto.randomUUID().substring(0, 8);
}

// Normalize owner name for search (handle LLC variations)
function normalizeOwnerName(name: string): string {
  return name
    .toUpperCase()
    .replace(/,?\s*(LLC|L\.L\.C\.|L L C|LIMITED LIABILITY COMPANY)\.?$/i, '')
    .replace(/,?\s*(INC|INCORPORATED|CORP|CORPORATION)\.?$/i, '')
    .replace(/,?\s*(LTD|LIMITED|LP|L\.P\.)\.?$/i, '')
    .replace(/,?\s*(TRUST|TR|REVOCABLE TRUST|LIVING TRUST)\.?$/i, '')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate search variations
function generateSearchVariations(name: string): string[] {
  const normalized = normalizeOwnerName(name);
  const variations = [
    normalized,
    `${normalized} LLC`,
    `${normalized}, LLC`,
    `${normalized} L.L.C.`,
    `${normalized} INC`,
    `${normalized}, INC`,
    `${normalized} CORP`,
    `${normalized} LTD`,
    `${normalized} LP`,
    `${normalized} TRUST`,
  ];
  return [...new Set(variations)];
}

// Calculate match score (simple Levenshtein-inspired)
function calculateMatchScore(searchTerm: string, ownerName: string): number {
  const normalizedSearch = normalizeOwnerName(searchTerm);
  const normalizedOwner = normalizeOwnerName(ownerName);
  
  if (normalizedOwner === normalizedSearch) return 100;
  if (normalizedOwner.startsWith(normalizedSearch)) return 90;
  if (normalizedOwner.includes(normalizedSearch)) return 80;
  
  // Token-based matching
  const searchTokens = normalizedSearch.split(' ');
  const ownerTokens = normalizedOwner.split(' ');
  const matchedTokens = searchTokens.filter(t => ownerTokens.includes(t));
  
  return Math.round((matchedTokens.length / searchTokens.length) * 70);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const traceId = generateTraceId();

  try {
    const { 
      ownerName, 
      county, 
      exactMatch = false, 
      limit = 25, 
      offset = 0 
    }: OwnerSearchRequest = await req.json();

    if (!ownerName || ownerName.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Owner name must be at least 2 characters', traceId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const effectiveLimit = Math.min(limit, 100);
    console.log(`[${traceId}] search-parcels-by-owner: "${ownerName}", county=${county || 'all'}, exact=${exactMatch}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('canonical_parcels')
      .select('source_parcel_id, owner_name, situs_address, acreage, market_value, jurisdiction', { count: 'exact' });

    if (exactMatch) {
      // Exact match (case insensitive)
      query = query.ilike('owner_name', ownerName);
    } else {
      // Fuzzy search - try normalized variations
      const variations = generateSearchVariations(ownerName);
      const orConditions = variations.map(v => `owner_name.ilike.%${v}%`).join(',');
      query = query.or(orConditions);
    }

    // Filter by county if specified
    if (county) {
      query = query.ilike('jurisdiction', `%${county}%`);
    }

    // Apply pagination
    query = query
      .order('owner_name', { ascending: true })
      .range(offset, offset + effectiveLimit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error(`[${traceId}] Query error:`, error);
      return new Response(
        JSON.stringify({ error: 'Database query failed', traceId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map and score results
    const parcels: ParcelResult[] = (data || []).map((p: any) => ({
      apn: p.source_parcel_id || '',
      owner: p.owner_name || '',
      siteAddress: p.situs_address || '',
      acreage: p.acreage || 0,
      totalValue: p.market_value || 0,
      matchScore: calculateMatchScore(ownerName, p.owner_name || ''),
    }));

    // Sort by match score descending
    parcels.sort((a, b) => b.matchScore - a.matchScore);

    const totalCount = count || 0;
    const duration = Date.now() - startTime;

    // Log the search
    await supabase.from('api_logs').insert({
      source: 'search-parcels-by-owner',
      endpoint: 'canonical_parcels',
      duration_ms: duration,
      success: true,
      cache_key: `trace:${traceId}`,
    }).catch(() => {});

    const response: OwnerSearchResponse = {
      parcels,
      totalCount,
      hasMore: offset + parcels.length < totalCount,
      traceId,
      duration_ms: duration,
    };

    console.log(`[${traceId}] Found ${parcels.length} of ${totalCount} parcels in ${duration}ms`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[${traceId}] Error:`, error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', traceId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
