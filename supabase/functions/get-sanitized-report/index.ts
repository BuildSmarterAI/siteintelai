import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { reportId } = await req.json();

    if (!reportId) {
      return new Response(JSON.stringify({ error: 'reportId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔍 Fetching report ${reportId} for user ${user.id}`);

    // Fetch report with RLS enforcement
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        *,
        applications(*)
      `)
      .eq('id', reportId)
      .single();

    if (reportError) {
      console.error('❌ Report fetch error:', reportError);
      return new Response(
        JSON.stringify({ error: reportError.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine user's subscription tier
    let userTier = 'free';
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier_id, subscription_tiers(name)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subscription?.subscription_tiers?.name) {
      userTier = subscription.subscription_tiers.name.toLowerCase();
    }

    console.log(`👤 User ${user.id} tier: ${userTier}`);

    // 🔒 IP Protection: Sanitize data_sources for non-enterprise users
    if (userTier !== 'enterprise' && report.json_data?.data_sources) {
      const sourceCount = report.json_data.data_sources.length;
      console.log(`🔒 Sanitizing ${sourceCount} data sources for ${userTier} user ${user.id}`);
      
      // Remove data_sources array entirely
      const sanitizedReport = {
        ...report,
        json_data: {
          ...report.json_data,
          data_sources: undefined, // Remove from object
        },
      };
      
      // Clean up undefined field
      delete sanitizedReport.json_data.data_sources;

      return new Response(
        JSON.stringify({ report: sanitizedReport }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`✅ Full report returned to enterprise user ${user.id}`);

    return new Response(
      JSON.stringify({ report }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Unexpected error in get-sanitized-report:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
