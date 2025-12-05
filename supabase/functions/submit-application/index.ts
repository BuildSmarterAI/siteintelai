import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ZIP Code to County mapping for Texas (most reliable)
const TX_ZIP_TO_COUNTY: Record<string, string> = {
  // Harris County
  "77002": "Harris County", "77003": "Harris County", "77004": "Harris County",
  "77005": "Harris County", "77006": "Harris County", "77007": "Harris County",
  "77008": "Harris County", "77009": "Harris County", "77010": "Harris County",
  "77011": "Harris County", "77012": "Harris County", "77013": "Harris County",
  "77014": "Harris County", "77015": "Harris County", "77016": "Harris County",
  "77017": "Harris County", "77018": "Harris County", "77019": "Harris County",
  "77020": "Harris County", "77021": "Harris County", "77022": "Harris County",
  "77023": "Harris County", "77024": "Harris County", "77025": "Harris County",
  "77026": "Harris County", "77027": "Harris County", "77028": "Harris County",
  "77029": "Harris County", "77030": "Harris County", "77031": "Harris County",
  "77032": "Harris County", "77033": "Harris County", "77034": "Harris County",
  "77035": "Harris County", "77036": "Harris County", "77037": "Harris County",
  "77038": "Harris County", "77039": "Harris County", "77040": "Harris County",
  "77041": "Harris County", "77042": "Harris County", "77043": "Harris County",
  "77044": "Harris County", "77045": "Harris County", "77046": "Harris County",
  "77047": "Harris County", "77048": "Harris County", "77049": "Harris County",
  "77050": "Harris County", "77051": "Harris County", "77053": "Harris County",
  "77054": "Harris County", "77055": "Harris County", "77056": "Harris County",
  "77057": "Harris County", "77058": "Harris County", "77059": "Harris County",
  "77060": "Harris County", "77061": "Harris County", "77062": "Harris County",
  "77063": "Harris County", "77064": "Harris County", "77065": "Harris County",
  "77066": "Harris County", "77067": "Harris County", "77068": "Harris County",
  "77069": "Harris County", "77070": "Harris County", "77071": "Harris County",
  "77072": "Harris County", "77073": "Harris County", "77074": "Harris County",
  "77075": "Harris County", "77076": "Harris County", "77077": "Harris County",
  "77078": "Harris County", "77079": "Harris County", "77080": "Harris County",
  "77081": "Harris County", "77082": "Harris County", "77083": "Harris County",
  "77084": "Harris County", "77085": "Harris County", "77086": "Harris County",
  "77087": "Harris County", "77088": "Harris County", "77089": "Harris County",
  "77090": "Harris County", "77091": "Harris County", "77092": "Harris County",
  "77093": "Harris County", "77094": "Harris County", "77095": "Harris County",
  "77096": "Harris County", "77098": "Harris County", "77099": "Harris County",
  
  // Fort Bend County
  "77406": "Fort Bend County", "77407": "Fort Bend County", "77459": "Fort Bend County",
  "77461": "Fort Bend County", "77464": "Fort Bend County", "77469": "Fort Bend County",
  "77471": "Fort Bend County", "77477": "Fort Bend County", "77478": "Fort Bend County",
  "77479": "Fort Bend County", "77489": "Fort Bend County", "77498": "Fort Bend County",
  
  // Montgomery County
  "77301": "Montgomery County", "77302": "Montgomery County", "77303": "Montgomery County",
  "77304": "Montgomery County", "77316": "Montgomery County", "77318": "Montgomery County",
  "77356": "Montgomery County", "77362": "Montgomery County", "77380": "Montgomery County",
  "77381": "Montgomery County", "77382": "Montgomery County", "77384": "Montgomery County",
  "77385": "Montgomery County", "77386": "Montgomery County", "77389": "Montgomery County",
  "77393": "Montgomery County",
};

// City to County mapping (fallback)
const TX_CITY_TO_COUNTY: Record<string, string> = {
  "Houston": "Harris County",
  "Sugar Land": "Fort Bend County",
  "Missouri City": "Fort Bend County",
  "Stafford": "Fort Bend County",
  "Richmond": "Fort Bend County",
  "Rosenberg": "Fort Bend County",
  "The Woodlands": "Montgomery County",
  "Conroe": "Montgomery County",
  "Spring": "Harris County",
  "Cypress": "Harris County",
  "Katy": "Harris County",
  "Pearland": "Harris County",
  "Pasadena": "Harris County",
  "Humble": "Harris County",
  "Tomball": "Harris County",
};

/**
 * Infers county from available location data using multiple fallback strategies
 */
function inferCounty(
  administrative_area_level_2: string | null | undefined,
  postal_code: string | null | undefined,
  locality: string | null | undefined,
  administrative_area_level_1: string | null | undefined
): string | null {
  
  // Strategy 1: Use Google's administrative_area_level_2 if present
  if (administrative_area_level_2) {
    console.log('✅ [county-inference] Using Google geocoding result:', administrative_area_level_2);
    return administrative_area_level_2;
  }
  
  // Strategy 2: ZIP code lookup (most reliable for Texas)
  if (postal_code && administrative_area_level_1 === 'TX') {
    const countyFromZip = TX_ZIP_TO_COUNTY[postal_code];
    if (countyFromZip) {
      console.log('✅ [county-inference] Inferred from ZIP code:', { postal_code, county: countyFromZip });
      return countyFromZip;
    } else {
      console.warn('⚠️ [county-inference] ZIP code not in mapping:', postal_code);
    }
  }
  
  // Strategy 3: City lookup (less reliable, but better than nothing)
  if (locality) {
    const countyFromCity = TX_CITY_TO_COUNTY[locality];
    if (countyFromCity) {
      console.log('✅ [county-inference] Inferred from city:', { locality, county: countyFromCity });
      return countyFromCity;
    } else {
      console.warn('⚠️ [county-inference] City not in mapping:', locality);
    }
  }
  
  console.error('❌ [county-inference] Could not infer county from any source:', {
    administrative_area_level_2,
    postal_code,
    locality,
    state: administrative_area_level_1
  });
  
  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Generate trace ID for logging
  const traceId = crypto.randomUUID().slice(0, 8);

  try {
    console.log(`📥 [TRACE:${traceId}] [SUBMIT] ================== APPLICATION SUBMISSION ==================`);
    console.log(`📥 [TRACE:${traceId}] [SUBMIT] Timestamp: ${new Date().toISOString()}`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from authorization header (if authenticated)
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    
    console.log(`🔐 [TRACE:${traceId}] [AUTH] Authorization header present: ${!!authHeader}`);
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      console.log(`🔐 [TRACE:${traceId}] [AUTH] Token length: ${token?.length || 0}`);
      
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError) {
          console.error(`🔐 [TRACE:${traceId}] [AUTH] getUser error:`, authError.message);
        }
        
        if (user) {
          userId = user.id;
          console.log(`✅ [TRACE:${traceId}] [AUTH] User authenticated: ${user.id} (${user.email})`);
        } else {
          console.warn(`⚠️ [TRACE:${traceId}] [AUTH] No user returned from getUser (token may be invalid/expired)`);
        }
      } catch (e) {
        console.error(`❌ [TRACE:${traceId}] [AUTH] Exception during getUser:`, e);
      }
    } else {
      console.warn(`⚠️ [TRACE:${traceId}] [AUTH] No authorization header provided`);
    }
    
    // Require authentication for application submission
    if (!userId) {
      console.error(`❌ [TRACE:${traceId}] [SUBMIT] Authentication required: No user ID found`);
      return new Response(JSON.stringify({ 
        error: 'Authentication required',
        message: 'You must be logged in to submit an application',
        trace_id: traceId
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed', trace_id: traceId }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData = await req.json();
    
    // Log input data with coordinate details
    console.log(`📥 [TRACE:${traceId}] [SUBMIT] Input Data:`, JSON.stringify({
      hasAddress: !!requestData.propertyAddress,
      hasCoords: !!(requestData.geoLat && requestData.geoLng),
      geoLat: requestData.geoLat,
      geoLng: requestData.geoLng,
      city: requestData.city,
      county: requestData.county,
      state: requestData.state,
      zipCode: requestData.zipCode,
      userId: userId,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    // Extract drawn parcel data
    const drawnParcelGeometry = requestData.drawnParcelGeometry || null;
    const drawnParcelName = requestData.drawnParcelName || null;

    // Extract UTM parameters and page URL from headers if available
    const utmSource = req.headers.get('utm-source') || requestData.utm_source;
    const utmMedium = req.headers.get('utm-medium') || requestData.utm_medium;
    const utmCampaign = req.headers.get('utm-campaign') || requestData.utm_campaign;
    const utmTerm = req.headers.get('utm-term') || requestData.utm_term;
    const pageUrl = req.headers.get('referer') || requestData.page_url || 'unknown';

    // Normalize numeric values and determine geolocation
    const parseNumber = (val: unknown): number | null => {
      if (typeof val === 'number' && !Number.isNaN(val)) return val;
      if (typeof val === 'string') {
        const cleaned = val.replace(/[^0-9.-]/g, '');
        const n = parseFloat(cleaned);
        return Number.isNaN(n) ? null : n;
      }
      return null;
    };

    let geo_lat = parseNumber(requestData.geoLat);
    let geo_lng = parseNumber(requestData.geoLng);
    let formatted_address: string | null = null;
    let administrative_area_level_2: string | null = requestData.county || null;
    let locality: string | null = requestData.city || null;
    let administrative_area_level_1: string | null = requestData.state || null;
    let postal_code: string | null = requestData.zipCode || null;
    let neighborhood_raw: string | null = requestData.neighborhood || null;
    let sublocality: string | null = requestData.sublocality || null;
    let place_id: string | null = requestData.placeId || null;

    // Geocoding: forward (address->coords) or reverse (coords->components)
    const needsForwardGeocoding = (geo_lat === null || geo_lng === null) && requestData.propertyAddress;
    const needsReverseGeocoding = geo_lat !== null && geo_lng !== null && 
      (!postal_code || !locality || !administrative_area_level_1);
    
    if (needsForwardGeocoding || needsReverseGeocoding) {
      try {
        const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
        if (apiKey) {
          let geoResp;
          
          if (needsReverseGeocoding) {
            // Reverse geocoding: coords -> address components
            console.log('🔄 [geocoding] Using reverse geocoding (have coords, missing components):', {
              geo_lat,
              geo_lng,
              missing: { postal_code: !postal_code, locality: !locality, state: !administrative_area_level_1 }
            });
            geoResp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${geo_lat},${geo_lng}&key=${apiKey}`);
          } else {
            // Forward geocoding: address -> coords + components
            console.log('🔄 [geocoding] Using forward geocoding (missing coords)');
            const q = encodeURIComponent(String(requestData.propertyAddress));
            geoResp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${apiKey}`);
          }
          
          const geoData = await geoResp.json();
          if (geoData?.results?.[0]) {
            const result = geoData.results[0];
            
            // Extract coordinates
            if (result.geometry?.location) {
              geo_lat = result.geometry.location.lat;
              geo_lng = result.geometry.location.lng;
            }
            
            // Extract formatted address
            if (result.formatted_address) {
              formatted_address = result.formatted_address;
            }
            
            // Extract address components if not already set
            if (result.address_components) {
              // County (administrative_area_level_2)
              if (!administrative_area_level_2) {
                const countyComponent = result.address_components.find(
                  (component: any) => component.types.includes('administrative_area_level_2')
                );
                if (countyComponent) {
                  administrative_area_level_2 = countyComponent.long_name;
                }
              }

              // City (locality)
              if (!locality) {
                const cityComponent = result.address_components.find(
                  (component: any) => component.types.includes('locality')
                );
                if (cityComponent) {
                  locality = cityComponent.long_name;
                }
              }

              // State (administrative_area_level_1)
              if (!administrative_area_level_1) {
                const stateComponent = result.address_components.find(
                  (component: any) => component.types.includes('administrative_area_level_1')
                );
                if (stateComponent) {
                  administrative_area_level_1 = stateComponent.short_name;
                }
              }

              // ZIP Code (postal_code)
              if (!postal_code) {
                const zipComponent = result.address_components.find(
                  (component: any) => component.types.includes('postal_code')
                );
                if (zipComponent) {
                  postal_code = zipComponent.long_name;
                }
              }

              // Neighborhood (try neighborhood first, then sublocality as fallback)
              if (!neighborhood_raw) {
                const neighborhoodComponent = result.address_components.find(
                  (component: any) => component.types.includes('neighborhood')
                );
                if (neighborhoodComponent) {
                  neighborhood_raw = neighborhoodComponent.long_name;
                }
              }

              // Sublocality (also use as neighborhood fallback)
              if (!sublocality) {
                const sublocalityComponent = result.address_components.find(
                  (component: any) => component.types.includes('sublocality') || component.types.includes('sublocality_level_1')
                );
                if (sublocalityComponent) {
                  sublocality = sublocalityComponent.long_name;
                  // Use as neighborhood fallback if neighborhood not found
                  if (!neighborhood_raw) {
                    neighborhood_raw = sublocalityComponent.long_name;
                  }
                }
              }

              // Final fallback: if neighborhood still missing, use locality (city)
              if (!neighborhood_raw && locality) {
                neighborhood_raw = locality;
              }
            }

            // Extract Place ID
            if (result.place_id && !place_id) {
              place_id = result.place_id;
            }
            
            console.log('Geocoding extracted:', { 
              geo_lat, 
              geo_lng, 
              formatted_address, 
              administrative_area_level_2,
              locality,
              administrative_area_level_1,
              postal_code,
              neighborhood_raw,
              sublocality,
              place_id,
              inferred_county: inferCounty(administrative_area_level_2, postal_code, locality, administrative_area_level_1)
            });
          }
        }
      } catch (e) {
        console.error('Geocoding fallback failed:', e);
      }
    }

    // Apply intelligent county inference
    const inferredCounty = inferCounty(
      administrative_area_level_2,
      postal_code,
      locality,
      administrative_area_level_1
    );

    // Prepare the application data
    const applicationData = {
      // Link to authenticated user if available
      user_id: userId,
      
      // Step 1: Contact Information
      full_name: requestData.fullName,
      company: requestData.company,
      email: requestData.email,
      phone: requestData.phone,
      
      // Step 2: Property Information
      property_address: requestData.propertyAddress, // Can be string or JSON
      formatted_address: formatted_address,
      county: inferredCounty,
      city: locality,
      administrative_area_level_1: administrative_area_level_1,
      postal_code: postal_code,
      neighborhood: neighborhood_raw,
      sublocality: sublocality,
      place_id: place_id,
      parcel_id: requestData.parcelIdApn || requestData.parcelId || null,
      lot_size_value: parseNumber(requestData.lotSizeValue),
      lot_size_unit: requestData.lotSizeUnit || null,
      existing_improvements: requestData.existingImprovements,
      ownership_status: requestData.ownershipStatus || 'not_specified',
      geo_lat: geo_lat,
      geo_lng: geo_lng,
      
      // Step 3: Project Intent & Building Parameters
      project_type: requestData.projectType || [], // Array
      building_size_value: parseNumber(requestData.buildingSizeValue),
      building_size_unit: requestData.buildingSizeUnit || null,
      stories_height: requestData.storiesHeight,
      prototype_requirements: requestData.prototypeRequirements || null,
      quality_level: requestData.qualityLevel,
      desired_budget: parseNumber(requestData.desiredBudget),
      
      // Step 4: Market & Risks
      access_priorities: requestData.accessPriorities || [], // Array
      known_risks: requestData.knownRisks || [], // Array
      utility_access: requestData.utilityAccess || [], // Array
      environmental_constraints: requestData.environmentalConstraints || [], // Array
      tenant_requirements: requestData.tenantRequirements || null,
      
      // Step 5: Final Questions
      heard_about: requestData.heardAbout,
      preferred_contact: requestData.preferredContact || null,
      best_time: requestData.bestTime || null,
      additional_notes: requestData.additionalNotes || null,
      attachments: requestData.attachments || null, // JSONB for file metadata
      
      // Consent & Legal
      nda_confidentiality: requestData.ndaConfidentiality !== false,
      consent_contact: requestData.consentContact !== false,
      consent_terms_privacy: requestData.consentTermsPrivacy !== false,
      marketing_opt_in: requestData.marketingOptIn === true,
      
      // Tracking Fields
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_term: utmTerm,
      page_url: pageUrl,
      submission_timestamp: new Date().toISOString(),
      
      // Enriched GIS Data (from enrich-feasibility edge function)
      parcel_owner: requestData.parcelOwner || null,
      acreage_cad: parseNumber(requestData.acreageCad),
      situs_address: requestData.situsAddress || null,
      overlay_district: requestData.overlayDistrict || null,
      floodplain_zone: requestData.floodplainZone || null,
      base_flood_elevation: parseNumber(requestData.baseFloodElevation),
      
      // Orchestration State Fields
      status: 'queued',
      status_rev: 0,
      status_percent: 5,
      enrichment_status: 'pending',
    };

    console.log('Inserting application data:', applicationData);

    // Insert the application into the database
    const { data, error } = await supabase
      .from('applications')
      .insert(applicationData)
      .select('id, created_at')
      .single();

    if (error) {
      console.error(`❌ [TRACE:${traceId}] [SUBMIT] Database insertion error:`, error);
      return new Response(JSON.stringify({ 
        error: 'Failed to submit application',
        details: error.message,
        trace_id: traceId
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log successful application creation with coords verification
    console.log(`✅ [TRACE:${traceId}] [SUBMIT] Application created:`, JSON.stringify({
      application_id: data.id,
      created_at: data.created_at,
      geo_lat: geo_lat,
      geo_lng: geo_lng,
      has_coords: !!(geo_lat && geo_lng),
      county: inferredCounty,
      city: locality,
      formatted_address: formatted_address?.substring(0, 50)
    }, null, 2));
    
    // Save drawn parcel to drawn_parcels table if geometry provided
    if (drawnParcelGeometry && data.id) {
      try {
        const { error: parcelError } = await supabase
          .from('drawn_parcels')
          .insert({
            application_id: data.id,
            user_id: userId,
            name: drawnParcelName || 'Primary Parcel',
            geometry: drawnParcelGeometry,
            source: 'user_drawn',
            created_at: new Date().toISOString()
          });
        
        if (parcelError) {
          console.error('[submit-application] Failed to save drawn parcel:', parcelError);
        } else {
          console.log('[submit-application] Drawn parcel saved successfully');
        }
      } catch (parcelErr) {
        console.error('[submit-application] Error saving drawn parcel:', parcelErr);
      }
    }

    // If data flags exist, log conflicts for admin review
    if (applicationData.data_flags && Array.isArray(applicationData.data_flags)) {
      const criticalFlags = applicationData.data_flags.filter(
        (flag: any) => flag.type === 'user_override' && flag.confidence === 'very_low'
      );
      
      if (criticalFlags.length > 0) {
        console.warn('[Data Conflict] Critical user overrides detected:', {
          application_id: data.id,
          flags: criticalFlags
        });
      }
    }

    // Trigger orchestration workflow (fire and forget - don't block response)
    try {
      // Validate that we have minimum required data
      if (!geo_lat || !geo_lng) {
        console.error('❌ [submit-application] Cannot trigger orchestration: missing coordinates', {
          application_id: data.id,
          geo_lat,
          geo_lng,
          property_address: requestData.propertyAddress,
          formatted_address: formatted_address
        });
        
        // Update application to error state
        await supabase
          .from('applications')
          .update({
            status: 'error',
            error_code: 'E001',
            enrichment_status: 'failed',
            data_flags: ['geocode_failed']
          })
          .eq('id', data.id);
        
        return new Response(JSON.stringify({
          id: data.id,
          created_at: data.created_at,
          status: 'error',
          message: 'Application created but geocoding failed. Missing coordinates.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ [submit-application] Application created successfully:', {
        id: data.id,
        created_at: data.created_at,
        property_address: requestData.propertyAddress,
        formatted_address: formatted_address,
        geo_lat,
        geo_lng,
        county: inferredCounty,
        city: locality,
        status: 'queued',
        status_percent: 5,
        will_trigger_orchestration: true
      });

      console.log('✅ [submit-application] Triggering orchestration workflow for:', data.id);
      
      // Fire and forget - don't block response
      supabase.functions.invoke('orchestrate-application', {
        body: {
          application_id: data.id
        }
      }).then(result => {
        if (result.error) {
          console.error('❌ [submit-application] Orchestration trigger failed:', {
            application_id: data.id,
            error: result.error
          });
        } else {
          console.log('✅ [submit-application] Orchestration workflow started:', {
            application_id: data.id,
            result: result.data
          });
        }
      }).catch(err => {
        console.error('❌ [submit-application] Orchestration invoke exception:', {
          application_id: data.id,
          error: err instanceof Error ? err.message : String(err)
        });
      });
    } catch (orchestrateError) {
      console.error('❌ [submit-application] Failed to trigger orchestration:', {
        application_id: data.id,
        error: orchestrateError instanceof Error ? orchestrateError.message : String(orchestrateError)
      });
    }

    // Return success response
    console.log(`📤 [TRACE:${traceId}] [SUBMIT] ================== SUBMISSION COMPLETE ==================`);
    console.log(`📤 [TRACE:${traceId}] [SUBMIT] Final State:`, {
      application_id: data.id,
      status: 'success',
      has_coords: !!(geo_lat && geo_lng),
      orchestration_triggered: true
    });
    
    return new Response(JSON.stringify({
      id: data.id,
      created_at: data.created_at,
      status: 'success',
      message: 'Application submitted successfully',
      trace_id: traceId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`❌ [TRACE:${traceId}] [SUBMIT] Fatal error in submit-application:`, error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});