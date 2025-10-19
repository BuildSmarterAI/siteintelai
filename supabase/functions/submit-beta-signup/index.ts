import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { email, role, company, interests } = await req.json();

    // Validate required fields
    if (!email || !role || !interests || interests.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate email
    const { data: existing } = await supabase
      .from("beta_signups")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Email already registered" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert signup
    const { data, error } = await supabase
      .from("beta_signups")
      .insert({
        email,
        role,
        company: company || null,
        interests,
        source: "beta_landing_page",
      })
      .select()
      .single();

    if (error) throw error;

    // Get waitlist position
    const { count } = await supabase
      .from("beta_signups")
      .select("*", { count: "exact", head: true });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully registered for beta",
        waitlist_position: count || 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Beta signup error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
