import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[hii-alerts] Starting HII alert check...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookUrl = Deno.env.get('HII_ALERT_WEBHOOK');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call the threshold check function
    const { data: thresholdBreaches, error } = await supabase
      .rpc('hii_check_threshold');

    if (error) {
      console.error('[hii-alerts] Error calling hii_check_threshold:', error);
      throw error;
    }

    if (!thresholdBreaches || thresholdBreaches.length === 0) {
      console.log('[hii-alerts] No threshold breaches detected');
      return new Response(
        JSON.stringify({ 
          success: true, 
          alerts_sent: 0,
          message: 'No alerts to send'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`[hii-alerts] Found ${thresholdBreaches.length} threshold breaches`);

    const alertsSent = [];

    for (const breach of thresholdBreaches) {
      try {
        // Log the alert
        const { error: insertError } = await supabase
          .from('hii_alerts')
          .insert({
            city: breach.city,
            yoy: breach.yoy,
            establishment_count: breach.establishment_count,
            total_receipts: breach.total_receipts,
          });

        if (insertError) {
          console.error('[hii-alerts] Error inserting alert:', insertError);
        }

        // Send webhook notification if configured
        if (webhookUrl) {
          const message = `📈 **HII Alert**: ${breach.city}, TX\n` +
            `Year-over-Year Growth: **${breach.yoy}%**\n` +
            `Establishments: ${breach.establishment_count}\n` +
            `Total Receipts: $${(breach.total_receipts / 1000000).toFixed(2)}M`;

          const webhookResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              text: message,
              username: 'SiteIntel HII Monitor',
              icon_emoji: ':chart_with_upwards_trend:'
            }),
          });

          if (!webhookResponse.ok) {
            console.error('[hii-alerts] Webhook delivery failed:', webhookResponse.status);
          } else {
            console.log(`[hii-alerts] Alert sent for ${breach.city}`);
          }
        }

        alertsSent.push({
          city: breach.city,
          yoy: breach.yoy,
          establishment_count: breach.establishment_count,
        });

      } catch (alertError) {
        console.error(`[hii-alerts] Error processing alert for ${breach.city}:`, alertError);
      }
    }

    console.log(`[hii-alerts] Alert check complete. Sent ${alertsSent.length} alerts`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alerts_sent: alertsSent.length,
        alerts: alertsSent
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[hii-alerts] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
