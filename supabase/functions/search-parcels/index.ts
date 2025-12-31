/**
 * Unified Parcel Search Edge Function
 * Supports: address, CAD/APN, intersection, and point-based searches
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============ Address Matching Helpers ============

/**
 * Extract street number from an address string
 * Returns null if no number found
 */
function extractStreetNumber(address: string): string | null {
  if (!address) return null;
  const match = address.match(/^(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract and normalize street name from address
 * Handles common abbreviations and strips city/state/zip
 */
function extractStreetName(address: string): string | null {
  if (!address) return null;
  
  // Remove leading number
  let street = address.replace(/^\d+\s*/, '');
  
  // Remove city, state, zip (everything after first comma or common city names)
  street = street.split(',')[0];
  
  // Normalize common abbreviations
  const abbreviations: Record<string, string> = {
    'street': 'st', 'st': 'st',
    'avenue': 'ave', 'ave': 'ave',
    'boulevard': 'blvd', 'blvd': 'blvd',
    'drive': 'dr', 'dr': 'dr',
    'road': 'rd', 'rd': 'rd',
    'lane': 'ln', 'ln': 'ln',
    'court': 'ct', 'ct': 'ct',
    'circle': 'cir', 'cir': 'cir',
    'highway': 'hwy', 'hwy': 'hwy',
    'parkway': 'pkwy', 'pkwy': 'pkwy',
    'place': 'pl', 'pl': 'pl',
    'way': 'way',
    'north': 'n', 'n': 'n',
    'south': 's', 's': 's',
    'east': 'e', 'e': 'e',
    'west': 'w', 'w': 'w',
  };
  
  // Normalize to lowercase and split into words
  const words = street.toLowerCase().trim().split(/\s+/);
  const normalized = words.map(w => abbreviations[w] || w);
  
  return normalized.join(' ');
}

/**
 * Calculate address match score between input address and parcel situs
 * Returns: { score: 0-1, reason: string }
 */
function calculateAddressMatchScore(inputAddress: string, situsAddress: string | null): { score: number; reason: string } {
  if (!situsAddress) {
    return { score: 0.3, reason: 'no_situs' };
  }
  
  const inputNum = extractStreetNumber(inputAddress);
  const situsNum = extractStreetNumber(situsAddress);
  const inputStreet = extractStreetName(inputAddress);
  const situsStreet = extractStreetName(situsAddress);
  
  // If we have street numbers and they don't match, strong penalty
  if (inputNum && situsNum && inputNum !== situsNum) {
    return { score: 0.1, reason: `number_mismatch:${inputNum}≠${situsNum}` };
  }
  
  // Street number matches
  const numberMatch = inputNum && situsNum && inputNum === situsNum;
  
  // Situs has no street number - common in some CAD systems
  // If street names match well, trust the parcel lookup (it was found via point-in-polygon)
  const situsNoNumber = inputNum && !situsNum;
  
  // Check street name similarity
  let streetScore = 0;
  let streetReason = 'no_street';
  
  if (inputStreet && situsStreet) {
    // Check for exact match
    if (inputStreet === situsStreet) {
      streetScore = 1.0;
      streetReason = 'exact_street';
    } 
    // Check if one contains the other
    else if (inputStreet.includes(situsStreet) || situsStreet.includes(inputStreet)) {
      streetScore = 0.8;
      streetReason = 'partial_street';
    }
    // Check for similar words
    else {
      const inputWords = new Set(inputStreet.split(' '));
      const situsWords = new Set(situsStreet.split(' '));
      const intersection = [...inputWords].filter(w => situsWords.has(w));
      const union = new Set([...inputWords, ...situsWords]);
      const jaccard = intersection.length / union.size;
      streetScore = jaccard * 0.7;
      streetReason = `word_match:${jaccard.toFixed(2)}`;
    }
  }
  
  // Compute final score
  if (numberMatch && streetScore >= 0.8) {
    return { score: 1.0, reason: `perfect:num+${streetReason}` };
  } else if (numberMatch) {
    return { score: 0.85 + streetScore * 0.15, reason: `num_match+${streetReason}` };
  } else if (situsNoNumber && streetScore >= 0.6) {
    // Situs has no number but street name matches well - trust point-in-polygon result
    return { score: 0.75 + streetScore * 0.2, reason: `situs_no_num+${streetReason}` };
  } else if (streetScore >= 0.8) {
    return { score: 0.6 + streetScore * 0.2, reason: streetReason };
  } else if (situsNoNumber && streetScore >= 0.4) {
    // Situs has no number, partial street match - still accept with moderate confidence
    return { score: 0.55 + streetScore * 0.2, reason: `situs_no_num_partial+${streetReason}` };
  } else {
    return { score: 0.3 + streetScore * 0.2, reason: `weak:${streetReason}` };
  }
}

type SearchType = 'address' | 'cad' | 'intersection' | 'point' | 'auto';

interface ValidationData {
  valid: boolean;
  confidence: number;
  geocodeGranularity?: string;
  usps?: {
    dpvConfirmation: string;
    fipsCountyCode: string;
    county: string;
    isVacant: boolean;
  };
  standardizedAddress?: string;
  issues?: string[];
}

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
  validation?: ValidationData;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  search_type: SearchType;
}

// County boundary boxes for detection (expanded coverage)
const COUNTY_BOUNDS: Record<string, { minLng: number; maxLng: number; minLat: number; maxLat: number }> = {
  harris: { minLng: -95.91, maxLng: -94.91, minLat: 29.49, maxLat: 30.17 },
  montgomery: { minLng: -95.86, maxLng: -95.07, minLat: 30.07, maxLat: 30.67 },
  travis: { minLng: -98.17, maxLng: -97.37, minLat: 30.07, maxLat: 30.63 },
  bexar: { minLng: -98.81, maxLng: -98.09, minLat: 29.17, maxLat: 29.73 },
  dallas: { minLng: -97.05, maxLng: -96.52, minLat: 32.55, maxLat: 33.02 },
  tarrant: { minLng: -97.55, maxLng: -96.98, minLat: 32.55, maxLat: 33.00 },
  williamson: { minLng: -98.05, maxLng: -97.28, minLat: 30.48, maxLat: 30.91 },
  fortbend: { minLng: -96.01, maxLng: -95.45, minLat: 29.35, maxLat: 29.82 },
  galveston: { minLng: -95.15, maxLng: -94.50, minLat: 29.15, maxLat: 29.65 },
  brazoria: { minLng: -95.85, maxLng: -95.05, minLat: 28.95, maxLat: 29.50 },
  collin: { minLng: -96.85, maxLng: -96.25, minLat: 33.00, maxLat: 33.50 },
  denton: { minLng: -97.35, maxLng: -96.75, minLat: 33.00, maxLat: 33.55 },
  hays: { minLng: -98.20, maxLng: -97.60, minLat: 29.80, maxLat: 30.20 },
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

/**
 * Extract county name from address string
 * Handles formats like "Fort Bend County, Texas" or "Harris County"
 */
function extractCountyFromAddress(address: string): string | null {
  if (!address) return null;
  
  const normalized = address.toLowerCase();
  
  // Map of display names to internal keys
  const countyMappings: Record<string, string> = {
    'fort bend': 'fortbend',
    'harris': 'harris',
    'montgomery': 'montgomery',
    'travis': 'travis',
    'bexar': 'bexar',
    'dallas': 'dallas',
    'tarrant': 'tarrant',
    'williamson': 'williamson',
    'galveston': 'galveston',
    'brazoria': 'brazoria',
    'collin': 'collin',
    'denton': 'denton',
    'hays': 'hays',
  };
  
  // Look for "X County" pattern in the address
  for (const [displayName, key] of Object.entries(countyMappings)) {
    if (normalized.includes(`${displayName} county`)) {
      return key;
    }
  }
  
  return null;
}

/**
 * Smart county detection: prefers address-based detection, falls back to coordinates
 * This handles edge cases where coordinates fall in overlapping bounding boxes
 */
function detectCountySmart(lat: number, lng: number, addressText?: string): string | null {
  // First try to extract county from address text (most reliable for edge cases)
  if (addressText) {
    const addressCounty = extractCountyFromAddress(addressText);
    if (addressCounty) {
      console.log(`[search-parcels] County from address text: ${addressCounty}`);
      return addressCounty;
    }
  }
  
  // Fall back to coordinate-based detection
  return detectCounty(lat, lng);
}

// APN pattern detection for search routing
const APN_PATTERNS: Record<string, RegExp> = {
  harris: /^\d{13}$|^\d{3}-\d{3}-\d{3}-\d{4}$/,
  fort_bend: /^\d{6,12}$/,
  montgomery: /^[A-Z]\d{6,10}$|^\d{8,12}$/i,
  galveston: /^\d{5,10}$/,
  brazoria: /^\d{6,11}$/,
  travis: /^\d{6,10}$/,
  williamson: /^R\d{6,9}$/i,
  bexar: /^\d{8,12}$/,
  dallas: /^\d{10,13}$/,
  tarrant: /^\d{11,13}$/,
};

function detectCountyFromAPN(apn: string): string | null {
  const cleanAPN = apn.replace(/[\s\-]/g, '');
  for (const [county, pattern] of Object.entries(APN_PATTERNS)) {
    if (pattern.test(cleanAPN) || pattern.test(apn)) {
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

type AddressSearchOptions = {
  lat?: number;
  lng?: number;
  radius?: number;
  countyHint?: string;
};

async function searchByAddress(
  query: string,
  supabaseUrl: string,
  supabaseKey: string,
  validateFirst: boolean = false,
  options: AddressSearchOptions = {}
): Promise<SearchResult[]> {
  // Optional: Pre-validate address with Google Address Validation for USPS data
  let validationData: ValidationData | undefined;
  
  if (validateFirst) {
    try {
      const validationResponse = await fetch(`${supabaseUrl}/functions/v1/validate-address-google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ address: query }),
      });
      
      if (validationResponse.ok) {
        const vData = await validationResponse.json();
        validationData = {
          valid: vData.valid,
          confidence: vData.confidence,
          geocodeGranularity: vData.geocodeGranularity,
          usps: vData.usps ? {
            dpvConfirmation: vData.usps.dpvConfirmation,
            fipsCountyCode: vData.usps.fipsCountyCode,
            county: vData.usps.county,
            isVacant: vData.usps.isVacant,
          } : undefined,
          standardizedAddress: vData.standardizedAddress,
          issues: vData.issues,
        };
        
        console.log('[search-parcels] Address validation:', {
          valid: validationData.valid,
          dpvConfirmation: validationData.usps?.dpvConfirmation,
          geocodeGranularity: validationData.geocodeGranularity,
        });
        
        // If USPS says address doesn't exist, warn but continue
        // (allow the user to see results but flag it)
        if (validationData.usps?.dpvConfirmation === 'N') {
          console.warn('[search-parcels] USPS says address not deliverable - continuing with caution');
        }
      }
    } catch (err) {
      console.error('[search-parcels] Address validation error (non-fatal):', err);
    }
  }
  
  // If caller provided coordinates (e.g., user already selected a specific geocode result),
  // skip autocomplete/geocoding and go straight to parcel lookup.
  if (
    typeof options.lat === 'number' &&
    typeof options.lng === 'number' &&
    !isNaN(options.lat) &&
    !isNaN(options.lng)
  ) {
    const lat = options.lat;
    const lng = options.lng;
    const county = options.countyHint || detectCountySmart(lat, lng, query) || undefined;

    if (county) {
      try {
        const parcelResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-parcels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ lat, lng, county, inputAddress: query }),
        });

        if (parcelResponse.ok) {
          const parcelData = await parcelResponse.json();
          const feature = parcelData?.features?.[0];
          if (feature?.properties?.parcel_id) {
            const parcel = {
              parcel_id: feature.properties.parcel_id,
              owner_name: feature.properties.owner_name,
              acreage: feature.properties.acreage,
              situs_address: feature.properties.situs_address,
              market_value: feature.properties.market_value,
              geometry: feature.geometry,
            };

            // Compute confidence using address match (handles missing situs numbers)
            const addressMatch = calculateAddressMatchScore(query, parcel.situs_address);

            return [
              {
                type: 'address',
                confidence: Math.max(0.6, addressMatch.score),
                lat,
                lng,
                formatted_address: query,
                county,
                parcel,
              },
            ];
          }
        }
      } catch (err) {
        console.error('[search-parcels] Direct parcel fetch error:', err);
      }
    }
    // If we couldn't resolve a parcel directly, continue with normal geocoding flow.
  }
  
  let predictions: Array<{ place_id: string; description: string; lat?: number; lng?: number; addressDetails?: Record<string, string> }> = [];
  let useNominatim = false;

  // Try Google Places first
  try {
    const placesResponse = await fetch(`${supabaseUrl}/functions/v1/google-places`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ input: query }),
    });

    if (placesResponse.ok) {
      const placesData = await placesResponse.json();
      if (placesData.status === 'REQUEST_DENIED' || placesData.error) {
        console.log('[search-parcels] Google Places denied or error, trying Nominatim');
        useNominatim = true;
      } else if (placesData.predictions?.length > 0) {
        predictions = placesData.predictions;
      } else {
        useNominatim = true;
      }
    } else {
      console.error('[search-parcels] Google Places failed:', placesResponse.status);
      useNominatim = true;
    }
  } catch (err) {
    console.error('[search-parcels] Google Places error:', err);
    useNominatim = true;
  }

  // Fallback to Nominatim if Google failed
  if (useNominatim || predictions.length === 0) {
    console.log('[search-parcels] Using Nominatim fallback for address search');
    try {
      const nominatimResponse = await fetch(`${supabaseUrl}/functions/v1/nominatim-autocomplete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ input: query, limit: 5 }),
      });
      console.log(`[search-parcels] Nominatim response status: ${nominatimResponse.status}`);
      if (!nominatimResponse.ok) {
        const errorText = await nominatimResponse.text();
        console.error(`[search-parcels] Nominatim error: ${nominatimResponse.status} - ${errorText}`);
      } else {
        const nominatimData = await nominatimResponse.json();
        console.log(`[search-parcels] Nominatim data:`, JSON.stringify(nominatimData).substring(0, 200));
        if (nominatimData.predictions?.length > 0) {
          // Nominatim results already have coordinates - process with address validation
          const rawResults: Array<SearchResult & { matchScore: number; matchReason: string }> = [];
          for (const pred of nominatimData.predictions.slice(0, 3)) {
            const lat = parseFloat(pred.lat);
            const lng = parseFloat(pred.lng);
            // Use smart detection: prefer county name from address, fallback to coordinates
            const county = detectCountySmart(lat, lng, pred.description) || undefined;
            
            // Try to fetch parcel at this location
            let parcel = null;
            let matchScore = 0.5;
            let matchReason = 'no_parcel';
            
            if (county) {
              try {
              const parcelResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-parcels`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({ lat, lng, county, inputAddress: pred.description }),
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
                    
                    // Validate address match
                    const addressMatch = calculateAddressMatchScore(pred.description, parcel.situs_address);
                    matchScore = addressMatch.score;
                    matchReason = addressMatch.reason;
                    
                    console.log(`[search-parcels] Nominatim address match: "${pred.description}" vs "${parcel.situs_address}" => score=${matchScore.toFixed(2)}`);
                    
                    // Reject mismatched parcels
                    if (matchScore < 0.5) {
                      console.log(`[search-parcels] Rejecting Nominatim parcel ${parcel.parcel_id} due to low match`);
                      parcel = null;
                      matchScore = 0.3;
                      matchReason = 'rejected_mismatch';
                    }
                  }
                }
              } catch (err) {
                console.error('[search-parcels] Parcel fetch error:', err);
              }
            }

            // Build cleaner address from structured_formatting if available
            let cleanAddress = pred.description;
            if (pred.structured_formatting) {
              const main = pred.structured_formatting.main_text || '';
              const secondary = pred.structured_formatting.secondary_text || '';
              cleanAddress = secondary ? `${main}, ${secondary}` : main;
            }
            
            rawResults.push({
              type: 'address',
              confidence: parcel ? matchScore : 0.5,
              lat,
              lng,
              formatted_address: cleanAddress,
              county,
              parcel: parcel || undefined,
              matchScore,
              matchReason,
            });
          }
          
          // Filter and sort by match score
          const validResults = rawResults.filter(r => !r.parcel || r.matchScore >= 0.5);
          validResults.sort((a, b) => b.matchScore - a.matchScore);
          
          console.log(`[search-parcels] Nominatim returned ${validResults.length} valid results`);
          return validResults.map(({ matchScore: _ms, matchReason: _mr, ...rest }) => rest);
        }
      }
    } catch (err) {
      console.error('[search-parcels] Nominatim fallback error:', err);
    }
    
    // If both failed, return empty
    if (predictions.length === 0) {
      return [];
    }
  }

  // Process Google Places results with address validation
  const rawResults: Array<SearchResult & { matchScore: number; matchReason: string }> = [];
  
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
        // Use smart detection: prefer county name from address, fallback to coordinates
        const county = detectCountySmart(location.lat, location.lng, prediction.description);
        
        // Try to fetch parcel at this location
        let parcel = null;
        let matchScore = 0.5;
        let matchReason = 'no_parcel';
        
        if (county) {
          try {
            const parcelResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-parcels`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({ lat: location.lat, lng: location.lng, county, inputAddress: prediction.description }),
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
                
                // Validate that the returned parcel address matches the search input
                const addressMatch = calculateAddressMatchScore(prediction.description, parcel.situs_address);
                matchScore = addressMatch.score;
                matchReason = addressMatch.reason;
                
                console.log(`[search-parcels] Address match: "${prediction.description}" vs "${parcel.situs_address}" => score=${matchScore.toFixed(2)}, reason=${matchReason}`);
                
                // If the parcel doesn't match the input address, don't include it
                // This prevents "1616 Post Oak Blvd" returning "5402 Coastal Way"
                if (matchScore < 0.5) {
                  console.log(`[search-parcels] Rejecting parcel ${parcel.parcel_id} due to low match score`);
                  parcel = null;
                  matchScore = 0.3;
                  matchReason = 'rejected_mismatch';
                }
              }
            }
          } catch (err) {
            console.error('[search-parcels] Parcel fetch error:', err);
          }
        }

        // Build cleaner address from structured_formatting if available
        let cleanAddress = prediction.description;
        if (prediction.structured_formatting) {
          const main = prediction.structured_formatting.main_text || '';
          const secondary = prediction.structured_formatting.secondary_text || '';
          cleanAddress = secondary ? `${main}, ${secondary}` : main;
        }
        
        rawResults.push({
          type: 'address',
          confidence: parcel ? matchScore : 0.5,
          lat: location.lat,
          lng: location.lng,
          formatted_address: cleanAddress,
          county: county || undefined,
          parcel: parcel || undefined,
          matchScore,
          matchReason,
        });
      }
    } catch (err) {
      console.error('[search-parcels] Address result error:', err);
    }
  }

  // Filter and rank results:
  // 1. Keep only results with parcels that match the address, OR results without parcels
  // 2. If we have a high-confidence match (>0.85), return only that one
  // 3. Otherwise return all valid results sorted by match score
  
  const validResults = rawResults.filter(r => {
    // Keep results without parcels (geocode-only)
    if (!r.parcel) return true;
    // Keep results with matching parcels (score >= 0.5)
    return r.matchScore >= 0.5;
  });
  
  // Sort by match score descending
  validResults.sort((a, b) => b.matchScore - a.matchScore);
  
  // If top result has very high confidence and others are significantly lower, return only top
  if (validResults.length > 1 && validResults[0].parcel && validResults[0].matchScore >= 0.9) {
    const topScore = validResults[0].matchScore;
    const filtered = validResults.filter((r, i) => i === 0 || (r.parcel && r.matchScore >= topScore - 0.2));
    if (filtered.length < validResults.length) {
      console.log(`[search-parcels] Returning only high-confidence matches: ${filtered.length} of ${validResults.length}`);
      return filtered.map(({ matchScore: _ms, matchReason: _mr, ...rest }) => ({
        ...rest,
        validation: validationData,
      }));
    }
  }
  
  // Return cleaned results (without internal matchScore/matchReason) with validation data
  return validResults.map(({ matchScore: _ms, matchReason: _mr, ...rest }) => ({
    ...rest,
    validation: validationData,
  }));
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
    const { query, type: requestedType, county, lat, lng, radius } = body;
    
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query must be at least 2 characters', results: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parsedLat = typeof lat === 'number' ? lat : undefined;
    const parsedLng = typeof lng === 'number' ? lng : undefined;
    const parsedRadius = typeof radius === 'number' ? radius : undefined;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const searchType: SearchType = requestedType || detectSearchType(query.trim());
    
    console.log(`[search-parcels] Query: "${query}", Type: ${searchType}, County: ${county || 'auto'}`);

    let results: SearchResult[] = [];

    switch (searchType) {
      case 'address':
        results = await searchByAddress(query.trim(), supabaseUrl, supabaseKey, false, {
          lat: parsedLat,
          lng: parsedLng,
          radius: parsedRadius,
          countyHint: typeof county === 'string' ? county : undefined,
        });
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

    // CRITICAL: Deduplicate by parcel_id to prevent "multiple parcels" error
    // when the same parcel is returned from different address variations
    const seenParcelIds = new Set<string>();
    const deduplicatedResults = results.filter(r => {
      // Keep results without parcels (they're address-only results)
      if (!r.parcel?.parcel_id) return true;
      
      // Skip duplicates
      if (seenParcelIds.has(r.parcel.parcel_id)) {
        console.log(`[search-parcels] Deduplicating parcel: ${r.parcel.parcel_id}`);
        return false;
      }
      
      seenParcelIds.add(r.parcel.parcel_id);
      return true;
    });

    const response: SearchResponse = {
      results: deduplicatedResults,
      query: query.trim(),
      search_type: searchType,
    };

    console.log(`[search-parcels] Returning ${deduplicatedResults.length} results (${results.length - deduplicatedResults.length} duplicates removed)`);

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
