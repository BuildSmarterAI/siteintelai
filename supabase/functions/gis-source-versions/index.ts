import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { generateTraceId } from '../_shared/observability.ts';

/**
 * GIS Source Version Tracking (I-02)
 * Track and display GIS data source versions
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

interface SourceVersion {
  name: string;
  lastUpdated: string | null;
  lastChecked: string | null;
  versionInfo?: {
    firmEffectiveDate?: string;
    taxYear?: number;
    dataDate?: string;
  };
  stale: boolean;
  status: 'healthy' | 'degraded' | 'unknown';
}

interface SourceVersionsResponse {
  sources: SourceVersion[];
  summary: {
    total: number;
    healthy: number;
    stale: number;
    unknown: number;
  };
  traceId: string;
}

// Staleness thresholds in days
const STALENESS_THRESHOLDS: Record<string, number> = {
  hcad_parcels: 30,      // Updated bi-weekly, stale after 30 days
  fbcad_parcels: 365,    // Updated annually
  mcad_parcels: 365,     // Updated annually
  fema_nfhl: 180,        // Updated ~quarterly
  nwi_wetlands: 365,     // Updated annually
  txdot_traffic: 365,    // Updated annually
  epa_echo: 30,          // Updated frequently
  usda_soil: 365,        // Static data
  census_acs: 365,       // Annual updates
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = generateTraceId();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get map server health data
    const { data: mapServers } = await supabase
      .from('map_servers')
      .select('name, base_url, last_health_check, is_healthy, metadata')
      .order('name');

    const sources: SourceVersion[] = [];
    const now = Date.now();

    // Process map servers
    for (const server of mapServers || []) {
      const staleDays = STALENESS_THRESHOLDS[server.name] || 365;
      const lastChecked = server.last_health_check ? new Date(server.last_health_check) : null;
      const daysSinceCheck = lastChecked ? (now - lastChecked.getTime()) / (1000 * 60 * 60 * 24) : Infinity;
      
      // Extract version info from metadata
      const versionInfo: SourceVersion['versionInfo'] = {};
      if (server.metadata) {
        if (server.metadata.firmEffectiveDate) {
          versionInfo.firmEffectiveDate = server.metadata.firmEffectiveDate;
        }
        if (server.metadata.taxYear) {
          versionInfo.taxYear = server.metadata.taxYear;
        }
        if (server.metadata.dataDate) {
          versionInfo.dataDate = server.metadata.dataDate;
        }
      }

      sources.push({
        name: server.name,
        lastUpdated: server.metadata?.lastUpdated || null,
        lastChecked: server.last_health_check,
        versionInfo: Object.keys(versionInfo).length > 0 ? versionInfo : undefined,
        stale: daysSinceCheck > staleDays,
        status: server.is_healthy === true ? 'healthy' : server.is_healthy === false ? 'degraded' : 'unknown',
      });
    }

    // Add known sources that might not be in map_servers
    const knownSources = [
      { name: 'fema_nfhl', displayName: 'FEMA NFHL Flood Zones' },
      { name: 'nwi_wetlands', displayName: 'USFWS National Wetlands Inventory' },
      { name: 'txdot_traffic', displayName: 'TxDOT Traffic Counts (AADT)' },
      { name: 'epa_echo', displayName: 'EPA ECHO Facilities' },
      { name: 'usda_soil', displayName: 'USDA Soil Survey' },
      { name: 'census_acs', displayName: 'Census ACS Demographics' },
    ];

    for (const known of knownSources) {
      if (!sources.find(s => s.name === known.name)) {
        sources.push({
          name: known.name,
          lastUpdated: null,
          lastChecked: null,
          stale: false,
          status: 'unknown',
        });
      }
    }

    // Calculate summary
    const summary = {
      total: sources.length,
      healthy: sources.filter(s => s.status === 'healthy').length,
      stale: sources.filter(s => s.stale).length,
      unknown: sources.filter(s => s.status === 'unknown').length,
    };

    const response: SourceVersionsResponse = {
      sources: sources.sort((a, b) => a.name.localeCompare(b.name)),
      summary,
      traceId,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[gis-source-versions] Error:', err);
    return new Response(
      JSON.stringify({ error: String(err), traceId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
