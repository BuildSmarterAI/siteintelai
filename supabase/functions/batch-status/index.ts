// Batch Status Endpoint (E-06)
// Check status of a batch report generation
// Version: 1.0.0

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchStatusResponse {
  success: boolean;
  batchId: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  totalCount: number;
  completedCount: number;
  failedCount: number;
  progress: number;
  estimatedRemainingMinutes: number;
  applications: Array<{
    id: string;
    status: string;
    reportId?: string;
    error?: string;
  }>;
  startedAt?: string;
  completedAt?: string;
  traceId: string;
}

const MINUTES_PER_REPORT = 2;

function generateTraceId(): string {
  return `bst-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = generateTraceId();

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get batchId from query params or body
    let batchId: string | null = null;
    
    const url = new URL(req.url);
    batchId = url.searchParams.get('batchId');

    if (!batchId && req.method === 'POST') {
      const body = await req.json();
      batchId = body.batchId;
    }

    if (!batchId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'batchId is required',
        traceId,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`[BatchStatus] ${traceId}: Checking status for batch ${batchId}`);

    // Get batch record
    const { data: batch, error: batchError } = await supabase
      .from('report_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchError || !batch) {
      // Try to get info from queue directly if batch table doesn't exist
      const { data: queueItems } = await supabase
        .from('report_queue')
        .select('application_id, status, error_message, completed_at')
        .eq('batch_id', batchId);

      if (!queueItems || queueItems.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Batch not found',
          traceId,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

      // Reconstruct batch info from queue
      const completedCount = queueItems.filter(q => q.status === 'complete').length;
      const failedCount = queueItems.filter(q => q.status === 'failed').length;
      const totalCount = queueItems.length;
      const pendingCount = totalCount - completedCount - failedCount;

      let status: 'pending' | 'processing' | 'complete' | 'failed' = 'pending';
      if (completedCount + failedCount === totalCount) {
        status = failedCount === totalCount ? 'failed' : 'complete';
      } else if (completedCount > 0 || failedCount > 0) {
        status = 'processing';
      }

      const response: BatchStatusResponse = {
        success: true,
        batchId,
        status,
        totalCount,
        completedCount,
        failedCount,
        progress: Math.round((completedCount + failedCount) / totalCount * 100),
        estimatedRemainingMinutes: pendingCount * MINUTES_PER_REPORT,
        applications: queueItems.map(q => ({
          id: q.application_id,
          status: q.status,
          error: q.error_message || undefined,
        })),
        traceId,
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get queue items for this batch
    const { data: queueItems } = await supabase
      .from('report_queue')
      .select('application_id, status, error_message')
      .eq('batch_id', batchId)
      .order('priority', { ascending: false });

    // Get report IDs for completed applications
    const completedAppIds = (queueItems || [])
      .filter(q => q.status === 'complete')
      .map(q => q.application_id);

    let appReports: Record<string, string> = {};
    if (completedAppIds.length > 0) {
      const { data: reports } = await supabase
        .from('applications')
        .select('id, report_url')
        .in('id', completedAppIds);

      appReports = (reports || []).reduce((acc, r) => {
        if (r.report_url) acc[r.id] = r.report_url;
        return acc;
      }, {} as Record<string, string>);
    }

    // Calculate progress
    const pendingCount = batch.total_count - batch.completed_count - batch.failed_count;
    const progress = Math.round((batch.completed_count + batch.failed_count) / batch.total_count * 100);

    const response: BatchStatusResponse = {
      success: true,
      batchId,
      status: batch.status as 'pending' | 'processing' | 'complete' | 'failed',
      totalCount: batch.total_count,
      completedCount: batch.completed_count,
      failedCount: batch.failed_count,
      progress,
      estimatedRemainingMinutes: pendingCount * MINUTES_PER_REPORT,
      applications: (queueItems || []).map(q => ({
        id: q.application_id,
        status: q.status,
        reportId: appReports[q.application_id],
        error: q.error_message || undefined,
      })),
      startedAt: batch.started_at,
      completedAt: batch.completed_at,
      traceId,
    };

    console.log(`[BatchStatus] ${traceId}: Batch ${batchId} is ${batch.status} (${progress}%)`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[BatchStatus] ${traceId}: Error:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      traceId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
