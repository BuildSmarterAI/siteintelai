import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TriggerRequest {
  layers?: string[];
  force?: boolean;
}

interface TriggerResponse {
  success: boolean;
  job_ids: string[];
  message: string;
  github_workflow_triggered?: boolean;
}

const VALID_LAYERS = ['parcels', 'zoning', 'utilities', 'flood', 'wetlands', 'transportation', 'environmental'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  console.log('[trigger-tile-generation] Starting...');

  try {
    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role using user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: TriggerRequest = await req.json().catch(() => ({}));
    const layers = body.layers?.filter(l => VALID_LAYERS.includes(l)) || VALID_LAYERS;
    const force = body.force ?? false;

    console.log(`[trigger-tile-generation] Layers: ${layers.join(', ')}, Force: ${force}`);

    // Create queued job records for each layer
    const jobIds: string[] = [];
    const now = new Date().toISOString();

    for (const layer of layers) {
      const jobId = crypto.randomUUID();
      const tilesetKey = `us_tx_${layer}_pending`;

      const { error: insertError } = await supabase.from('tile_jobs').insert({
        id: jobId,
        tileset_key: tilesetKey,
        job_type: force ? 'full' : 'incremental',
        status: 'queued',
        started_at: now,
        triggered_by: user.id,
        trigger_type: 'admin_dashboard',
      });

      if (insertError) {
        console.error(`[trigger-tile-generation] Failed to create job for ${layer}:`, insertError.message);
      } else {
        jobIds.push(jobId);
        console.log(`[trigger-tile-generation] Created job ${jobId} for ${layer}`);
      }
    }

    // Attempt to trigger GitHub Actions workflow
    let workflowTriggered = false;
    const githubPat = Deno.env.get('GITHUB_PAT');
    const githubRepo = Deno.env.get('GITHUB_REPO') || 'siteintel/siteintel';

    if (githubPat) {
      try {
        const workflowResponse = await fetch(
          `https://api.github.com/repos/${githubRepo}/actions/workflows/generate-tiles.yml/dispatches`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${githubPat}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ref: 'main',
              inputs: {
                layers: layers.join(','),
                force: force.toString(),
              },
            }),
          }
        );

        if (workflowResponse.status === 204) {
          workflowTriggered = true;
          console.log('[trigger-tile-generation] GitHub workflow triggered successfully');
        } else {
          const errorText = await workflowResponse.text();
          console.error('[trigger-tile-generation] GitHub API error:', workflowResponse.status, errorText);
        }
      } catch (ghError) {
        console.error('[trigger-tile-generation] GitHub API call failed:', ghError);
      }
    } else {
      console.log('[trigger-tile-generation] GITHUB_PAT not configured, skipping workflow trigger');
    }

    const response: TriggerResponse = {
      success: jobIds.length > 0,
      job_ids: jobIds,
      message: workflowTriggered
        ? `Triggered ${jobIds.length} tile generation jobs and GitHub workflow`
        : `Created ${jobIds.length} queued jobs. GitHub workflow trigger ${githubPat ? 'failed' : 'not configured (GITHUB_PAT missing)'}`,
      github_workflow_triggered: workflowTriggered,
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[trigger-tile-generation] Error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
