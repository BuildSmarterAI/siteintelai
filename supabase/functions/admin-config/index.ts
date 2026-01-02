import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { generateTraceId } from '../_shared/observability.ts';

/**
 * Admin Configuration Management (I-03)
 * CRUD operations for system configuration
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
};

interface ConfigEntry {
  key: string;
  value: string;
  updated_at: string;
  updated_by: string | null;
  description?: string;
}

// Valid config keys with descriptions
const CONFIG_KEYS: Record<string, string> = {
  emergency_cost_mode: 'Enable cache-only mode when true',
  daily_budget_limit: 'Daily API spend limit in USD',
  monthly_budget_limit: 'Monthly API spend limit in USD',
  enable_google_fallback: 'Whether to use Google as fallback geocoder',
  maintenance_mode: 'Disable new applications when true',
  max_api_calls_per_app: 'Maximum API calls allowed per application',
  enable_ai_reports: 'Enable AI-generated report content',
  pdf_generation_enabled: 'Enable PDF report generation',
};

async function verifyAdmin(req: Request): Promise<{ userId: string } | { error: string; status: number }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = authHeader.substring(7);
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: 'Invalid token', status: 401 };
  }

  // Check admin role
  const adminSupabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }

  return { userId: user.id };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = generateTraceId();
  const url = new URL(req.url);

  try {
    // Verify admin access
    const authResult = await verifyAdmin(req);
    if ('error' in authResult) {
      return new Response(JSON.stringify({ error: authResult.error, traceId }), {
        status: authResult.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (req.method === 'GET') {
      const key = url.searchParams.get('key');

      if (key) {
        // Get single config
        const { data, error } = await supabase
          .from('system_config')
          .select('*')
          .eq('key', key)
          .single();

        if (error || !data) {
          return new Response(
            JSON.stringify({ error: 'Config not found', traceId }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            config: {
              key: data.key,
              value: data.value,
              updated_at: data.updated_at,
              updated_by: data.updated_by,
              description: CONFIG_KEYS[data.key],
            },
            traceId,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // List all configs
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .order('key');

      if (error) {
        throw error;
      }

      const configs: ConfigEntry[] = (data || []).map(c => ({
        key: c.key,
        value: c.value,
        updated_at: c.updated_at,
        updated_by: c.updated_by,
        description: CONFIG_KEYS[c.key],
      }));

      // Add missing keys with default values
      for (const [key, description] of Object.entries(CONFIG_KEYS)) {
        if (!configs.find(c => c.key === key)) {
          configs.push({
            key,
            value: '',
            updated_at: new Date().toISOString(),
            updated_by: null,
            description,
          });
        }
      }

      return new Response(
        JSON.stringify({ configs: configs.sort((a, b) => a.key.localeCompare(b.key)), traceId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'PUT') {
      const body = await req.json();
      const { key, value } = body;

      if (!key || value === undefined) {
        return new Response(
          JSON.stringify({ error: 'key and value are required', traceId }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate key
      if (!CONFIG_KEYS[key]) {
        return new Response(
          JSON.stringify({ error: `Invalid config key: ${key}`, validKeys: Object.keys(CONFIG_KEYS), traceId }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get current value for audit log
      const { data: current } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', key)
        .single();

      // Upsert config
      const { error: upsertError } = await supabase
        .from('system_config')
        .upsert({
          key,
          value: String(value),
          updated_at: new Date().toISOString(),
          updated_by: authResult.userId,
        }, { onConflict: 'key' });

      if (upsertError) {
        throw upsertError;
      }

      // Audit log
      await supabase.from('admin_audit_log').insert({
        user_id: authResult.userId,
        action: 'config_update',
        entity_type: 'system_config',
        entity_id: key,
        old_value: current?.value || null,
        new_value: String(value),
        metadata: { traceId },
      });

      console.log(`[admin-config] Config updated: ${key} = ${value} by ${authResult.userId}`);

      return new Response(
        JSON.stringify({
          success: true,
          config: {
            key,
            value: String(value),
            updated_at: new Date().toISOString(),
            updated_by: authResult.userId,
            description: CONFIG_KEYS[key],
          },
          traceId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed', traceId }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[admin-config] Error:', err);
    return new Response(
      JSON.stringify({ error: String(err), traceId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
