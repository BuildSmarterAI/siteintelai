import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    
    if (!apiKey) {
      console.error("[VALIDATE-GOOGLE-MAPS-KEY] API key not configured");
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "GOOGLE_MAPS_API_KEY not configured in Supabase secrets",
          troubleshooting: [
            "Add GOOGLE_MAPS_API_KEY to Supabase Edge Function secrets",
            "Dashboard → Settings → Edge Functions → Add secret"
          ]
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[VALIDATE-GOOGLE-MAPS-KEY] Testing Map Tiles API access...");
    console.log("[VALIDATE-GOOGLE-MAPS-KEY] API key (first 10 chars):", apiKey.substring(0, 10) + "...");
    
    // Test the Map Tiles API with root.json request
    const testUrl = `https://tile.googleapis.com/v1/3dtiles/root.json?key=${apiKey}`;
    
    const response = await fetch(testUrl);
    const responseText = await response.text();
    
    console.log("[VALIDATE-GOOGLE-MAPS-KEY] Response status:", response.status);
    console.log("[VALIDATE-GOOGLE-MAPS-KEY] Response body (first 500 chars):", responseText.substring(0, 500));
    
    if (response.ok) {
      console.log("[VALIDATE-GOOGLE-MAPS-KEY] API key is valid and Map Tiles API is accessible");
      return new Response(
        JSON.stringify({ 
          valid: true, 
          message: "Map Tiles API is accessible",
          status: response.status 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      let errorDetails: Record<string, unknown> = {};
      try {
        errorDetails = JSON.parse(responseText);
      } catch {
        errorDetails = { raw: responseText };
      }
      
      // Extract specific error code if available
      const errorCode = (errorDetails as { error?: { status?: string } })?.error?.status || `HTTP_${response.status}`;
      const errorMessage = (errorDetails as { error?: { message?: string } })?.error?.message || responseText;
      
      console.error("[VALIDATE-GOOGLE-MAPS-KEY] API validation failed:", errorCode, errorMessage);
      
      const troubleshooting = [
        "1. Go to Google Cloud Console → APIs & Services → Library",
        "2. Search for 'Map Tiles API' and ENABLE it",
        "3. Go to Credentials → Select your API key",
        "4. Under 'Application restrictions', add HTTP referrers:",
        "   - *.lovableproject.com/*",
        "   - *.lovable.app/*",
        "   - localhost:*",
        "5. Under 'API restrictions', select 'Restrict key' and add:",
        "   - Map Tiles API",
        "   - Maps JavaScript API"
      ];
      
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: `API returned ${response.status}: ${errorCode}`,
          errorCode,
          message: errorMessage,
          details: errorDetails,
          troubleshooting
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("[VALIDATE-GOOGLE-MAPS-KEY] Validation error:", error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: error instanceof Error ? error.message : String(error),
        troubleshooting: ["Check network connectivity and try again"]
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
