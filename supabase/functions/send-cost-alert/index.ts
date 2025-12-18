import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CostAlertPayload {
  severity: 'warning' | 'critical' | 'emergency';
  title: string;
  daily_spend: number;
  monthly_spend: number;
  threshold_breached: string;
  top_drivers?: { source: string; cost: number; calls: number }[];
  recommended_actions?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL');
    
    if (!slackWebhookUrl) {
      console.log('[send-cost-alert] SLACK_WEBHOOK_URL not configured, logging only');
    }

    const payload: CostAlertPayload = await req.json();
    console.log('[send-cost-alert] Alert payload:', JSON.stringify(payload));

    // Determine emoji based on severity
    const severityEmoji = {
      warning: '🟡',
      critical: '🔴',
      emergency: '🚨'
    }[payload.severity] || '⚠️';

    // Build top drivers text
    let driversText = '';
    if (payload.top_drivers && payload.top_drivers.length > 0) {
      driversText = payload.top_drivers
        .slice(0, 5)
        .map(d => `• ${d.source}: $${d.cost.toFixed(2)} (${d.calls} calls)`)
        .join('\n');
    }

    // Build actions text
    let actionsText = '';
    if (payload.recommended_actions && payload.recommended_actions.length > 0) {
      actionsText = payload.recommended_actions.map(a => `• ${a}`).join('\n');
    }

    // Slack Block Kit message
    const slackMessage = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${severityEmoji} SiteIntel Cost Alert: ${payload.title}`,
            emoji: true
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Daily Spend:*\n$${payload.daily_spend.toFixed(2)}`
            },
            {
              type: "mrkdwn",
              text: `*Monthly Spend:*\n$${payload.monthly_spend.toFixed(2)}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Threshold Breached:* ${payload.threshold_breached}`
          }
        }
      ]
    };

    // Add top drivers if present
    if (driversText) {
      slackMessage.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Top Cost Drivers:*\n${driversText}`
        }
      });
    }

    // Add recommended actions if present
    if (actionsText) {
      slackMessage.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Recommended Actions:*\n${actionsText}`
        }
      });
    }

    // Add timestamp
    slackMessage.blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Alert generated at ${new Date().toISOString()}`
        }
      ]
    });

    // Send to Slack if configured
    if (slackWebhookUrl) {
      const slackResponse = await fetch(slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
      });

      if (!slackResponse.ok) {
        console.error('[send-cost-alert] Slack webhook failed:', slackResponse.status);
      } else {
        console.log('[send-cost-alert] Alert sent to Slack successfully');
      }
    }

    // Also log to database for audit trail
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    await supabase.from('system_alerts').insert({
      alert_type: 'cost_alert',
      severity: payload.severity,
      title: payload.title,
      metadata: {
        daily_spend: payload.daily_spend,
        monthly_spend: payload.monthly_spend,
        threshold_breached: payload.threshold_breached,
        top_drivers: payload.top_drivers
      },
      resolved: false
    }).catch(e => console.log('[send-cost-alert] DB log error (table may not exist):', e));

    return new Response(
      JSON.stringify({ 
        success: true, 
        slack_configured: !!slackWebhookUrl,
        message: slackWebhookUrl ? 'Alert sent to Slack' : 'Alert logged (Slack not configured)'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[send-cost-alert] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
