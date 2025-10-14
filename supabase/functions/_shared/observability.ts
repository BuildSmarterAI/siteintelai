import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

export interface ApiLogEntry {
  source: string;
  endpoint: string;
  duration_ms: number;
  success: boolean;
  application_id?: string | null;
  error_message?: string | null;
  cache_key?: string | null;
  expires_at?: string | null;
}

export async function logExternalCall(
  supabase: SupabaseClient,
  source: string,
  endpoint: string,
  durationMs: number,
  success: boolean,
  applicationId: string | null = null,
  errorMessage: string | null = null
): Promise<void> {
  const logEntry: ApiLogEntry = {
    source,
    endpoint,
    duration_ms: durationMs,
    success,
    application_id: applicationId,
    error_message: errorMessage,
  };

  try {
    // Write to Supabase (no RLS for system inserts)
    const { error } = await supabase.from('api_logs').insert(logEntry);
    
    if (error) {
      console.error('[observability] Failed to insert API log:', error);
    }

    // Send to OpenTelemetry if configured
    const otelEndpoint = Deno.env.get('OPEN_TELEMETRY_ENDPOINT');
    if (otelEndpoint) {
      try {
        await fetch(otelEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: 'siteintel-feasibility',
            timestamp: new Date().toISOString(),
            trace: logEntry,
          }),
        });
      } catch (e) {
        console.error('[observability] Failed to send to OTEL:', e);
      }
    }
  } catch (e) {
    console.error('[observability] Error in logExternalCall:', e);
  }
}
