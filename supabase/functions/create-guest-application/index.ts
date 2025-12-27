import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-GUEST-APPLICATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request body
    const body = await req.json();
    const {
      propertyAddress,
      geoLat,
      geoLng,
      email,
      parcelId,
      lotSize,
      lotSizeUnit,
      parcelOwner,
      zoning,
      county,
      city,
      state,
      zipCode,
      neighborhood,
    } = body;

    logStep("Received data", { propertyAddress, geoLat, geoLng, email });

    // Validate required fields
    if (!propertyAddress || !email) {
      throw new Error("Property address and email are required");
    }

    // Check if user is authenticated (optional)
    let userId = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      if (userData?.user) {
        userId = userData.user.id;
        logStep("Authenticated user", { userId });
      }
    }

    // Create the application with minimal required data
    // Using default values for required fields
    const applicationData = {
      // Property info
      property_address: { formatted: propertyAddress },
      formatted_address: propertyAddress,
      geo_lat: geoLat || null,
      geo_lng: geoLng || null,
      parcel_id: parcelId || null,
      acreage_cad: lotSize ? parseFloat(lotSize) : null,
      parcel_owner: parcelOwner || null,
      zoning_code: zoning || null,
      county: county || null,
      city: city || null,
      administrative_area_level_1: state || null,
      postal_code: zipCode || null,
      neighborhood: neighborhood || null,
      
      // Contact info (minimal for guest)
      email: email,
      full_name: "", // Will be filled during account creation
      company: "",
      phone: "",
      heard_about: "website",
      
      // Defaults for required fields
      project_type: [],
      stories_height: "1-3",
      existing_improvements: "unknown",
      ownership_status: "unknown",
      quality_level: "standard",
      consent_contact: true,
      consent_terms_privacy: true,
      nda_confidentiality: false,
      marketing_opt_in: false,
      
      // Status fields - must match applications_status_check constraint
      status: "queued",
      payment_status: "pending",
      enrichment_status: "pending",
      user_id: userId, // NULL for guests, will be linked after account creation
    };

    logStep("Creating application", { email, hasUserId: !!userId });

    const { data: application, error: insertError } = await supabaseClient
      .from("applications")
      .insert(applicationData)
      .select("id, status, payment_status, formatted_address, geo_lat, geo_lng")
      .single();

    if (insertError) {
      logStep("Insert error", { error: insertError.message });
      throw new Error(`Failed to create application: ${insertError.message}`);
    }

    logStep("Application created", { 
      id: application.id, 
      status: application.status,
      paymentStatus: application.payment_status 
    });

    return new Response(JSON.stringify({
      success: true,
      application: {
        id: application.id,
        status: application.status,
        payment_status: application.payment_status,
        formatted_address: application.formatted_address,
        geo_lat: application.geo_lat,
        geo_lng: application.geo_lng,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
