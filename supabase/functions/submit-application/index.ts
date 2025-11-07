import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from authorization header (if authenticated)
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }
    
    // Require authentication for application submission
    if (!userId) {
      console.error('Authentication required: No user ID found');
      return new Response(JSON.stringify({ 
        error: 'Authentication required',
        message: 'You must be logged in to submit an application'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData = await req.json();
    console.log('Received application submission:', requestData);
    
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

    // Fallback geocoding by address if coordinates missing
    if ((geo_lat === null || geo_lng === null) && requestData.propertyAddress) {
      try {
        const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
        if (apiKey) {
          const q = encodeURIComponent(String(requestData.propertyAddress));
          const geoResp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${apiKey}`);
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
              place_id
            });
          }
        }
      } catch (e) {
        console.error('Geocoding fallback failed:', e);
      }
    }

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
      county: administrative_area_level_2,
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
    };

    console.log('Inserting application data:', applicationData);

    // Insert the application into the database
    const { data, error } = await supabase
      .from('applications')
      .insert(applicationData)
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Database insertion error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to submit application',
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Application submitted successfully:', data);
    
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

    // Trigger enrichment to auto-fill GIS fields (fire and forget - don't block response)
    try {
      const addressForEnrichment = formatted_address || String(requestData.propertyAddress || '') || null;
      if (addressForEnrichment) {
        console.log('Triggering enrich-feasibility for application:', data.id);
        
        // Fire and forget - don't await
        supabase.functions.invoke('enrich-feasibility', {
          body: {
            application_id: data.id,
            address: addressForEnrichment
          }
        }).then(result => {
          if (result.error) {
            console.error('Enrichment invocation error:', result.error);
          } else {
            console.log('Enrichment triggered successfully');
          }
        });

        // Also trigger enrich-utilities (fire and forget) - PHASE 6: Enhanced invocation guard
        if (geo_lat && geo_lng) {
          console.log('✅ [submit-application] Coordinates available, triggering enrich-utilities:', {
            application_id: data.id,
            geo_lat,
            geo_lng,
            city: locality || 'unknown',
            county: administrative_area_level_2 || 'unknown'
          });
          
          supabase.functions.invoke('enrich-utilities', {
            body: {
              application_id: data.id
            }
          }).then(result => {
            if (result.error) {
              console.error('❌ [submit-application] Utilities enrichment error:', {
                application_id: data.id,
                error: result.error
              });
            } else {
              console.log('✅ [submit-application] Utilities enrichment triggered successfully:', {
                application_id: data.id,
                result_preview: result.data
              });
            }
          });
        } else {
          console.warn('⚠️ [submit-application] SKIPPING enrich-utilities: Missing coordinates', {
            application_id: data.id,
            geo_lat: geo_lat || 'null',
            geo_lng: geo_lng || 'null',
            property_address: requestData.propertyAddress,
            formatted_address: formatted_address,
            geocoding_attempted: !!(formatted_address || requestData.propertyAddress)
          });
        }
      } else {
        console.log('Skipping enrichment: no address available');
      }
    } catch (invokeError) {
      console.error('Failed to trigger enrichment:', invokeError);
    }

    // Trigger AI report generation (fire and forget - won't block response)
    try {
      supabase.functions.invoke('generate-ai-report', {
        body: { 
          application_id: data.id,
          report_type: 'full_report'
        }
      }).then(result => {
        if (result.error) {
          console.error('[submit-application] AI report generation error:', result.error);
        } else {
          console.log('[submit-application] AI report generation triggered');
        }
      });
    } catch (aiError) {
      console.error('Failed to trigger AI report:', aiError);
    }

    // Return success response
    return new Response(JSON.stringify({
      id: data.id,
      created_at: data.created_at,
      status: 'success',
      message: 'Application submitted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in submit-application function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});