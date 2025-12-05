/**
 * Unified Parcel Search Edge Function
 * Supports: address, CAD/APN, intersection, and point-based searches
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type SearchType = 'address' | 'cad' | 'intersection' | 'point' | 'auto';

interface SearchResult {
  type: 'address' | 'cad' | 'intersection' | 'point';
  confidence: number;
  lat: number;
  lng: number;
  formatted_address: string;
  county?: string;
  parcel?: {
    parcel_id: string;
    owner_name: string | null;
    acreage: number | null;
    situs_address: string | null;
    market_value: number | null;
    geometry?: unknown;
  };
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  search_type: SearchType;
}

// County boundary boxes for detection
const COUNTY_BOUNDS: Record<string, { minLng: number; maxLng: number; minLat: number; maxLat: number }> = {
  harris: { minLng: -95.91, maxLng: -94.91, minLat: 29.49, maxLat: 30.17 },
  montgomery: { minLng: -95.86, maxLng: -95.07, minLat: 30.07, maxLat: 30.67 },
  travis: { minLng: -98.17, maxLng: -97.37, minLat: 30.07, maxLat: 30.63 },
  bexar: { minLng: -98.81, maxLng: -98.09, minLat: 29.17, maxLat: 29.73 },
  dallas: { minLng: -97.05, maxLng: -96.52, minLat: 32.55, maxLat: 33.02 },
  tarrant: { minLng: -97.55, maxLng: -96.98, minLat: 32.55, maxLat: 33.00 },
  williamson: { minLng: -98.05, maxLng: -97.28, minLat: 30.48, maxLat: 30.91 },
  fortbend: { minLng: -96.01, maxLng: -95.45, minLat: 29.35, maxLat: 29.82 },
};

function detectCounty(lat: number, lng: number): string | null {
  for (const [county, bounds] of Object.entries(COUNTY_BOUNDS)) {
    if (lng >= bounds.minLng && lng <= bounds.maxLng && 
        lat >= bounds.minLat && lat <= bounds.maxLat) {
      return county;
    }
  }
  return null;
}

function detectSearchType(query: string): SearchType {
  // Cross-street pattern: contains "&" or " and " (case insensitive)
  if (/\s*(&|and)\s*/i.test(query)) {
    return 'intersection';
  }
  
  // Coordinate pattern: lat,lng format
  if (/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(query.trim())) {
    return 'point';
  }
  
  // CAD/APN pattern: mostly digits, possibly with dashes
  // Harris: 10-13 digits, Fort Bend: varies, etc.
  const cleanQuery = query.replace(/[\s\-]/g, '');
  if (/^\d{8,15}$/.test(cleanQuery)) {
    return 'cad';
  }
  
  // Default to address search
  return 'address';
}

async function searchByAddress(
  query: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<SearchResult[]> {
  // Use Google Places for geocoding
  const placesResponse = await fetch(`${supabaseUrl}/functions/v1/google-places`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ input: query }),
  });

  if (!placesResponse.ok) {
    console.error('[search-parcels] Google Places failed:', placesResponse.status);
    return [];
  }

  const placesData = await placesResponse.json();
  const predictions = placesData.predictions || [];
  
  const results: SearchResult[] = [];
  
  // Get details for top 3 predictions
  for (const prediction of predictions.slice(0, 3)) {
    try {
      const detailsResponse = await fetch(`${supabaseUrl}/functions/v1/google-place-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ placeId: prediction.place_id }),
      });

      if (!detailsResponse.ok) continue;

      const detailsData = await detailsResponse.json();
      const location = detailsData.result?.geometry?.location;
      
      if (location) {
        const county = detectCounty(location.lat, location.lng);
        
        // Try to fetch parcel at this location
        let parcel = null;
        if (county) {
          try {
            const parcelResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-parcels`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({ lat: location.lat, lng: location.lng, county }),
            });
            
            if (parcelResponse.ok) {
              const parcelData = await parcelResponse.json();
              if (parcelData.features?.length > 0) {
                const feature = parcelData.features[0];
                parcel = {
                  parcel_id: feature.properties.parcel_id,
                  owner_name: feature.properties.owner_name,
                  acreage: feature.properties.acreage,
                  situs_address: feature.properties.situs_address,
                  market_value: feature.properties.market_value,
                  geometry: feature.geometry,
                };
              }
            }
          } catch (err) {
            console.error('[search-parcels] Parcel fetch error:', err);
          }
        }

        results.push({
          type: 'address',
          confidence: 0.9 - (results.length * 0.1),
          lat: location.lat,
          lng: location.lng,
          formatted_address: prediction.description,
          county: county || undefined,
          parcel: parcel || undefined,
        });
      }
    } catch (err) {
      console.error('[search-parcels] Address result error:', err);
    }
  }

  return results;
}

async function searchByCAD(
  query: string,
  supabaseUrl: string,
  supabaseKey: string,
  supabase: ReturnType<typeof createClient>
): Promise<SearchResult[]> {
  // Normalize the CAD number
  const normalizedId = query.replace(/[\s\-]/g, '').toUpperCase();
  
  // First, try to find in our parcel_index table
  const { data: indexData } = await supabase
    .from('parcel_index')
    .select('parcel_uuid, county_id, identifier')
    .eq('identifier_normalized', normalizedId)
    .limit(5);

  if (indexData && indexData.length > 0) {
    const results: SearchResult[] = [];
    
    for (const idx of indexData) {
      const { data: parcelData } = await supabase
        .from('parcels')
        .select('*')
        .eq('parcel_uuid', idx.parcel_uuid)
        .single();

      if (parcelData) {
        results.push({
          type: 'cad',
          confidence: 1.0,
          lat: 0, // Will be extracted from centroid
          lng: 0,
          formatted_address: parcelData.situs_address || `Parcel ${idx.identifier}`,
          county: idx.county_id,
          parcel: {
            parcel_id: idx.identifier,
            owner_name: parcelData.owner_name,
            acreage: parcelData.acreage,
            situs_address: parcelData.situs_address,
            market_value: parcelData.total_value,
            geometry: parcelData.geometry,
          },
        });
      }
    }

    if (results.length > 0) return results;
  }

  // Fallback: query county APIs directly via fetch-parcels
  const parcelResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-parcels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ parcelId: normalizedId }),
  });

  if (!parcelResponse.ok) return [];

  const parcelData = await parcelResponse.json();
  
  return (parcelData.features || []).map((feature: { properties: Record<string, unknown>; geometry: unknown }, index: number) => {
    // Extract centroid from geometry
    let lat = 0, lng = 0;
    if (feature.geometry && (feature.geometry as { type: string }).type === 'Polygon') {
      const coords = (feature.geometry as { coordinates: number[][][] }).coordinates[0];
      const centroid = coords.reduce(
        (acc: [number, number], coord: number[]) => [acc[0] + coord[0], acc[1] + coord[1]],
        [0, 0]
      );
      lng = centroid[0] / coords.length;
      lat = centroid[1] / coords.length;
    }

    return {
      type: 'cad' as const,
      confidence: 1.0 - (index * 0.05),
      lat,
      lng,
      formatted_address: (feature.properties.situs_address as string) || `Parcel ${feature.properties.parcel_id}`,
      county: feature.properties.county as string,
      parcel: {
        parcel_id: feature.properties.parcel_id as string,
        owner_name: feature.properties.owner_name as string | null,
        acreage: feature.properties.acreage as number | null,
        situs_address: feature.properties.situs_address as string | null,
        market_value: feature.properties.market_value as number | null,
        geometry: feature.geometry,
      },
    };
  });
}

async function searchByIntersection(
  query: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<SearchResult[]> {
  const response = await fetch(`${supabaseUrl}/functions/v1/geocode-intersection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ intersection: query }),
  });

  if (!response.ok) {
    console.error('[search-parcels] Intersection geocode failed:', response.status);
    return [];
  }

  const data = await response.json();
  
  if (data.lat && data.lng) {
    const county = detectCounty(data.lat, data.lng);
    
    return [{
      type: 'intersection',
      confidence: data.confidence || 0.85,
      lat: data.lat,
      lng: data.lng,
      formatted_address: data.formatted_address || query,
      county: county || undefined,
    }];
  }

  return [];
}

async function searchByPoint(
  query: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<SearchResult[]> {
  const parts = query.split(',').map(p => parseFloat(p.trim()));
  
  if (parts.length !== 2 || parts.some(isNaN)) {
    return [];
  }

  const [lat, lng] = parts;
  const county = detectCounty(lat, lng);
  
  // Try to fetch parcel at this location
  let parcel = null;
  if (county) {
    try {
      const parcelResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-parcels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ lat, lng, county }),
      });
      
      if (parcelResponse.ok) {
        const parcelData = await parcelResponse.json();
        if (parcelData.features?.length > 0) {
          const feature = parcelData.features[0];
          parcel = {
            parcel_id: feature.properties.parcel_id,
            owner_name: feature.properties.owner_name,
            acreage: feature.properties.acreage,
            situs_address: feature.properties.situs_address,
            market_value: feature.properties.market_value,
            geometry: feature.geometry,
          };
        }
      }
    } catch (err) {
      console.error('[search-parcels] Point parcel fetch error:', err);
    }
  }

  return [{
    type: 'point',
    confidence: 1.0,
    lat,
    lng,
    formatted_address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    county: county || undefined,
    parcel: parcel || undefined,
  }];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { query, type: requestedType, county } = body;
    
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query must be at least 2 characters', results: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const searchType: SearchType = requestedType || detectSearchType(query.trim());
    
    console.log(`[search-parcels] Query: "${query}", Type: ${searchType}, County: ${county || 'auto'}`);

    let results: SearchResult[] = [];

    switch (searchType) {
      case 'address':
        results = await searchByAddress(query.trim(), supabaseUrl, supabaseKey);
        break;
      case 'cad':
        results = await searchByCAD(query.trim(), supabaseUrl, supabaseKey, supabase);
        break;
      case 'intersection':
        results = await searchByIntersection(query.trim(), supabaseUrl, supabaseKey);
        break;
      case 'point':
        results = await searchByPoint(query.trim(), supabaseUrl, supabaseKey);
        break;
      case 'auto':
      default:
        // Try detected type first, then fallback
        const detectedType = detectSearchType(query.trim());
        if (detectedType === 'cad') {
          results = await searchByCAD(query.trim(), supabaseUrl, supabaseKey, supabase);
          if (results.length === 0) {
            results = await searchByAddress(query.trim(), supabaseUrl, supabaseKey);
          }
        } else if (detectedType === 'intersection') {
          results = await searchByIntersection(query.trim(), supabaseUrl, supabaseKey);
        } else if (detectedType === 'point') {
          results = await searchByPoint(query.trim(), supabaseUrl, supabaseKey);
        } else {
          results = await searchByAddress(query.trim(), supabaseUrl, supabaseKey);
        }
        break;
    }

    // Filter by county if specified
    if (county && results.length > 0) {
      results = results.filter(r => !r.county || r.county.toLowerCase() === county.toLowerCase());
    }

    const response: SearchResponse = {
      results,
      query: query.trim(),
      search_type: searchType,
    };

    console.log(`[search-parcels] Returning ${results.length} results`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[search-parcels] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, results: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
