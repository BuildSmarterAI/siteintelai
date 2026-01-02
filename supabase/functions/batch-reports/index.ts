// Batch Report Generation (E-06)
// Queue and process multiple report generations for portfolio analysis
// Version: 1.0.0

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchReportRequest {
  applicationIds: string[];  // Max 50
  priority?: 'normal' | 'high';
  notifyOnComplete?: boolean;
  webhookUrl?: string;
}

interface BatchReportResponse {
  success: boolean;
  batchId: string;
  queuedCount: number;
  estimatedCompletionMinutes: number;
  statusUrl: string;
  traceId: string;
}

const MAX_BATCH_SIZE = 50;
const MINUTES_PER_REPORT = 2; // Estimated time per report

function generateTraceId(): string {
  return `bch-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

function generateBatchId(): string {
  return `batch-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = generateTraceId();
  const startTime = Date.now();

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Parse request
    const body: BatchReportRequest = await req.json();
    const { 
      applicationIds, 
      priority = 'normal', 
      notifyOnComplete = false,
      webhookUrl,
    } = body;

    console.log(`[BatchReports] ${traceId}: Received request for ${applicationIds?.length || 0} applications`);

    // Validate input
    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'applicationIds is required and must be a non-empty array',
        traceId,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (applicationIds.length > MAX_BATCH_SIZE) {
      return new Response(JSON.stringify({
        success: false,
        error: `Maximum batch size is ${MAX_BATCH_SIZE} applications`,
        traceId,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Validate all applications exist
    const { data: existingApps, error: appError } = await supabase
      .from('applications')
      .select('id')
      .in('id', applicationIds);

    if (appError) {
      console.error(`[BatchReports] ${traceId}: Error checking applications:`, appError);
      throw new Error('Failed to validate applications');
    }

    const existingIds = new Set((existingApps || []).map(a => a.id));
    const missingIds = applicationIds.filter(id => !existingIds.has(id));

    if (missingIds.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `Applications not found: ${missingIds.join(', ')}`,
        traceId,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Get user ID from auth header (optional)
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.substring(7));
      userId = user?.id || null;
    }

    // Create batch record
    const batchId = generateBatchId();
    const { error: batchError } = await supabase
      .from('report_batches')
      .insert({
        id: batchId,
        user_id: userId,
        total_count: applicationIds.length,
        completed_count: 0,
        failed_count: 0,
        priority,
        status: 'pending',
        webhook_url: webhookUrl,
        created_at: new Date().toISOString(),
      });

    if (batchError) {
      console.error(`[BatchReports] ${traceId}: Error creating batch:`, batchError);
      // Continue without batch tracking if table doesn't exist
      console.log(`[BatchReports] ${traceId}: Continuing without batch tracking`);
    }

    // Queue individual reports
    const priorityValue = priority === 'high' ? 10 : 0;
    const queueItems = applicationIds.map((appId, index) => ({
      id: `${batchId}-${index}`,
      batch_id: batchId,
      application_id: appId,
      priority: priorityValue + (applicationIds.length - index), // Higher priority for earlier items
      status: 'pending',
      created_at: new Date().toISOString(),
    }));

    const { error: queueError } = await supabase
      .from('report_queue')
      .insert(queueItems);

    if (queueError) {
      console.error(`[BatchReports] ${traceId}: Error queueing reports:`, queueError);
      // Continue - we can still process directly
      console.log(`[BatchReports] ${traceId}: Continuing with direct processing`);
    }

    // Start background processing
    const processPromise = processBatch(supabase, batchId, applicationIds, traceId);
    
    // Use EdgeRuntime.waitUntil for background processing
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(processPromise);
    }

    // Calculate estimated completion time
    const estimatedCompletionMinutes = Math.ceil(applicationIds.length * MINUTES_PER_REPORT);

    const response: BatchReportResponse = {
      success: true,
      batchId,
      queuedCount: applicationIds.length,
      estimatedCompletionMinutes,
      statusUrl: `${supabaseUrl}/functions/v1/batch-status?batchId=${batchId}`,
      traceId,
    };

    const executionMs = Date.now() - startTime;
    console.log(`[BatchReports] ${traceId}: Batch ${batchId} queued (${applicationIds.length} apps, ~${estimatedCompletionMinutes}min, ${executionMs}ms)`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[BatchReports] ${traceId}: Error:`, error);
    
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

/**
 * Process batch of reports in background
 */
async function processBatch(
  supabase: ReturnType<typeof createClient>,
  batchId: string,
  applicationIds: string[],
  traceId: string
): Promise<void> {
  console.log(`[BatchReports] ${traceId}: Starting background processing for batch ${batchId}`);

  // Update batch status to processing
  await supabase
    .from('report_batches')
    .update({ 
      status: 'processing',
      started_at: new Date().toISOString(),
    })
    .eq('id', batchId);

  let completedCount = 0;
  let failedCount = 0;

  for (const appId of applicationIds) {
    try {
      console.log(`[BatchReports] ${traceId}: Processing ${appId} (${completedCount + failedCount + 1}/${applicationIds.length})`);

      // Trigger enrichment via orchestrate-application
      const { error } = await supabase.functions.invoke('orchestrate-application', {
        body: { applicationId: appId, resume: true },
      });

      if (error) {
        throw error;
      }

      completedCount++;

      // Update queue item status
      await supabase
        .from('report_queue')
        .update({ 
          status: 'complete',
          completed_at: new Date().toISOString(),
        })
        .eq('batch_id', batchId)
        .eq('application_id', appId);

    } catch (error) {
      console.error(`[BatchReports] ${traceId}: Failed to process ${appId}:`, error);
      failedCount++;

      // Update queue item status
      await supabase
        .from('report_queue')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('batch_id', batchId)
        .eq('application_id', appId);
    }

    // Update batch progress
    await supabase
      .from('report_batches')
      .update({ 
        completed_count: completedCount,
        failed_count: failedCount,
      })
      .eq('id', batchId);

    // Small delay between reports to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Mark batch as complete
  const finalStatus = failedCount === applicationIds.length ? 'failed' : 'complete';
  await supabase
    .from('report_batches')
    .update({ 
      status: finalStatus,
      completed_at: new Date().toISOString(),
    })
    .eq('id', batchId);

  console.log(`[BatchReports] ${traceId}: Batch ${batchId} ${finalStatus} (${completedCount} success, ${failedCount} failed)`);

  // Send webhook notification if configured
  const { data: batch } = await supabase
    .from('report_batches')
    .select('webhook_url')
    .eq('id', batchId)
    .single();

  if (batch?.webhook_url) {
    try {
      await fetch(batch.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          status: finalStatus,
          completedCount,
          failedCount,
          totalCount: applicationIds.length,
          completedAt: new Date().toISOString(),
        }),
      });
      console.log(`[BatchReports] ${traceId}: Webhook sent to ${batch.webhook_url}`);
    } catch (webhookError) {
      console.error(`[BatchReports] ${traceId}: Webhook failed:`, webhookError);
    }
  }
}

// Declare EdgeRuntime for TypeScript
declare const EdgeRuntime: { waitUntil?: (promise: Promise<unknown>) => void } | undefined;
