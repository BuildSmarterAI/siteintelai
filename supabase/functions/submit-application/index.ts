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

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData = await req.json();
    console.log('Received application submission:', requestData);

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
      ownership_status: requestData.ownershipStatus,
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

    // Trigger enrichment to auto-fill GIS fields for this application
    try {
      const addressForEnrichment = formatted_address || String(requestData.propertyAddress || '') || null;
      if (addressForEnrichment) {
        console.log('Invoking enrich-feasibility for application:', data.id);
        const { data: enrichResp, error: enrichErr } = await supabase.functions.invoke('enrich-feasibility', {
          body: {
            application_id: data.id,
            address: addressForEnrichment
          }
        });
        if (enrichErr) {
          console.error('Enrichment invocation error:', enrichErr);
        } else {
          console.log('Enrichment invoked successfully:', enrichResp?.success ?? enrichResp);
        }

        // Also call enrich-utilities to populate water/sewer/storm lines
        if (geo_lat && geo_lng) {
          console.log('Invoking enrich-utilities for application:', data.id);
          const { data: utilResp, error: utilErr } = await supabase.functions.invoke('enrich-utilities', {
            body: {
              application_id: data.id
            }
          });
          if (utilErr) {
            console.error('Utilities enrichment error:', utilErr);
          } else {
            console.log('Utilities enrichment completed:', utilResp?.status ?? utilResp);
          }
        }
      } else {
        console.log('Skipping enrichment: no address available');
      }
    } catch (invokeError) {
      console.error('Failed to invoke enrichment:', invokeError);
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