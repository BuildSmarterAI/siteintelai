import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { generateTraceId } from '../_shared/observability.ts';

/**
 * Data Quality Report (I-04)
 * Analyze data completeness and freshness across applications
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

interface DataQualityReport {
  period: { start: string; end: string };
  applications: {
    total: number;
    complete: number;
    partial: number;
    failed: number;
  };
  dataCompleteness: {
    flood: { available: number; missing: number; percentage: number };
    wetlands: { available: number; missing: number; percentage: number };
    utilities: { available: number; missing: number; percentage: number };
    parcel: { available: number; missing: number; percentage: number };
    traffic: { available: number; missing: number; percentage: number };
    demographics: { available: number; missing: number; percentage: number };
    soil: { available: number; missing: number; percentage: number };
  };
  commonIssues: Array<{
    issue: string;
    count: number;
    percentage: number;
  }>;
  recommendations: string[];
  traceId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = generateTraceId();
  const url = new URL(req.url);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Parse period from query params
    const days = parseInt(url.searchParams.get('days') || '30');
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get applications in period
    const { data: apps, error } = await supabase
      .from('applications')
      .select(`
        id,
        enrichment_status,
        data_flags,
        floodplain_zone,
        wetlands_type,
        utility_access,
        parcel_id,
        traffic_aadt,
        median_income,
        soil_series,
        created_at
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      throw error;
    }

    const total = apps?.length || 0;

    // Count by status
    const complete = apps?.filter(a => a.enrichment_status === 'complete').length || 0;
    const failed = apps?.filter(a => a.enrichment_status === 'error').length || 0;
    const partial = total - complete - failed;

    // Data completeness analysis
    const hasFlood = apps?.filter(a => a.floodplain_zone != null).length || 0;
    const hasWetlands = apps?.filter(a => a.wetlands_type != null).length || 0;
    const hasUtilities = apps?.filter(a => a.utility_access && a.utility_access.length > 0).length || 0;
    const hasParcel = apps?.filter(a => a.parcel_id != null).length || 0;
    const hasTraffic = apps?.filter(a => a.traffic_aadt != null).length || 0;
    const hasDemographics = apps?.filter(a => a.median_income != null).length || 0;
    const hasSoil = apps?.filter(a => a.soil_series != null).length || 0;

    const calcPercentage = (available: number) => total > 0 ? Math.round((available / total) * 100) : 0;

    // Analyze common issues from data_flags
    const issueCount = new Map<string, number>();
    for (const app of apps || []) {
      if (Array.isArray(app.data_flags)) {
        for (const flag of app.data_flags) {
          if (typeof flag === 'string') {
            issueCount.set(flag, (issueCount.get(flag) || 0) + 1);
          }
        }
      }
    }

    const commonIssues = Array.from(issueCount.entries())
      .map(([issue, count]) => ({
        issue,
        count,
        percentage: calcPercentage(count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Generate recommendations
    const recommendations: string[] = [];

    if (hasFlood < total * 0.9) {
      recommendations.push(`Flood zone data missing for ${total - hasFlood} applications (${100 - calcPercentage(hasFlood)}%). Check FEMA API connectivity.`);
    }
    if (hasParcel < total * 0.9) {
      recommendations.push(`Parcel data missing for ${total - hasParcel} applications. Review county parcel API endpoints.`);
    }
    if (hasTraffic < total * 0.8) {
      recommendations.push(`Traffic data coverage is ${calcPercentage(hasTraffic)}%. Consider expanding TxDOT data radius.`);
    }
    if (hasDemographics < total * 0.9) {
      recommendations.push(`Demographics missing for ${total - hasDemographics} applications. Verify Census API quota.`);
    }
    if (failed > total * 0.1) {
      recommendations.push(`High failure rate (${calcPercentage(failed)}%). Review error logs for systematic issues.`);
    }
    if (commonIssues.length > 0 && commonIssues[0].count > total * 0.2) {
      recommendations.push(`Common issue "${commonIssues[0].issue}" affects ${commonIssues[0].percentage}% of applications.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Data quality is within acceptable thresholds. No immediate action required.');
    }

    const report: DataQualityReport = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      applications: {
        total,
        complete,
        partial,
        failed,
      },
      dataCompleteness: {
        flood: { available: hasFlood, missing: total - hasFlood, percentage: calcPercentage(hasFlood) },
        wetlands: { available: hasWetlands, missing: total - hasWetlands, percentage: calcPercentage(hasWetlands) },
        utilities: { available: hasUtilities, missing: total - hasUtilities, percentage: calcPercentage(hasUtilities) },
        parcel: { available: hasParcel, missing: total - hasParcel, percentage: calcPercentage(hasParcel) },
        traffic: { available: hasTraffic, missing: total - hasTraffic, percentage: calcPercentage(hasTraffic) },
        demographics: { available: hasDemographics, missing: total - hasDemographics, percentage: calcPercentage(hasDemographics) },
        soil: { available: hasSoil, missing: total - hasSoil, percentage: calcPercentage(hasSoil) },
      },
      commonIssues,
      recommendations,
      traceId,
    };

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[data-quality-report] Error:', err);
    return new Response(
      JSON.stringify({ error: String(err), traceId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
