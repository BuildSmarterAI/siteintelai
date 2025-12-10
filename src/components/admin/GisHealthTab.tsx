import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock, Activity, Database } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MapServer {
  id: string;
  server_key: string;
  base_url: string;
  health_status: string | null;
  reliability_score: number | null;
  last_health_check: string | null;
  jurisdiction: string | null;
  dataset_family: string | null;
  provider: string | null;
}

interface DataSourceError {
  id: string;
  map_server_id: string;
  error_type: string;
  error_message: string | null;
  status_code: number | null;
  endpoint_url: string | null;
  occurred_at: string | null;
}

interface HealthCheckResult {
  server_key: string;
  status: 'operational' | 'degraded' | 'down';
  response_time_ms: number;
  feature_count?: number;
  error?: string;
}

interface HealthCheckSummary {
  timestamp: string;
  summary: {
    total_endpoints: number;
    operational: number;
    degraded: number;
    down: number;
  };
  avg_response_time_ms: number;
  results: HealthCheckResult[];
}

function HealthStatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return <Badge variant="outline" className="text-muted-foreground">Unknown</Badge>;
  }

  const config = {
    operational: { icon: CheckCircle2, className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    degraded: { icon: AlertTriangle, className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    down: { icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  }[status] || { icon: Activity, className: 'bg-muted text-muted-foreground' };

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn('gap-1', config.className)}>
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function ReliabilityScore({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground">—</span>;
  
  const color = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-destructive';
  
  return <span className={cn('font-mono font-medium', color)}>{score}%</span>;
}

export function GisHealthTab() {
  const [mapServers, setMapServers] = useState<MapServer[]>([]);
  const [recentErrors, setRecentErrors] = useState<DataSourceError[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<HealthCheckSummary | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [serversRes, errorsRes] = await Promise.all([
        supabase
          .from('map_servers')
          .select('id, server_key, base_url, health_status, reliability_score, last_health_check, jurisdiction, dataset_family, provider')
          .eq('is_active', true)
          .order('server_key'),
        supabase
          .from('data_source_errors')
          .select('*')
          .order('occurred_at', { ascending: false })
          .limit(20),
      ]);

      if (serversRes.data) setMapServers(serversRes.data);
      if (errorsRes.data) setRecentErrors(errorsRes.data);
    } catch (err) {
      console.error('Failed to fetch GIS health data:', err);
      toast.error('Failed to load GIS health data');
    } finally {
      setLoading(false);
    }
  };

  const runHealthCheck = async () => {
    setChecking(true);
    toast.info('Running comprehensive health check...');
    
    try {
      const { data, error } = await supabase.functions.invoke('gis-health-check');
      
      if (error) throw error;
      
      setLastCheck(data as HealthCheckSummary);
      toast.success(`Health check complete: ${data.summary.operational} operational, ${data.summary.degraded} degraded, ${data.summary.down} down`);
      
      // Refresh data after check
      await fetchData();
    } catch (err) {
      console.error('Health check failed:', err);
      toast.error('Health check failed');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const operationalCount = mapServers.filter(s => s.health_status === 'operational').length;
  const degradedCount = mapServers.filter(s => s.health_status === 'degraded').length;
  const downCount = mapServers.filter(s => s.health_status === 'down').length;
  const unknownCount = mapServers.filter(s => !s.health_status).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold mt-1">{mapServers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Operational</span>
            </div>
            <p className="text-2xl font-bold text-emerald-500 mt-1">{operationalCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Degraded</span>
            </div>
            <p className="text-2xl font-bold text-amber-500 mt-1">{degradedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Down</span>
            </div>
            <p className="text-2xl font-bold text-destructive mt-1">{downCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Unchecked</span>
            </div>
            <p className="text-2xl font-bold text-muted-foreground mt-1">{unknownCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button onClick={runHealthCheck} disabled={checking}>
          <RefreshCw className={cn('h-4 w-4 mr-2', checking && 'animate-spin')} />
          {checking ? 'Checking...' : 'Run Full Health Check'}
        </Button>
        {lastCheck && (
          <span className="text-sm text-muted-foreground">
            Last check: {new Date(lastCheck.timestamp).toLocaleTimeString()} 
            {' '}({lastCheck.avg_response_time_ms}ms avg)
          </span>
        )}
      </div>

      {/* Endpoints Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">GIS Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium">Endpoint</th>
                  <th className="text-left py-2 px-3 font-medium">Family</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium">Reliability</th>
                  <th className="text-left py-2 px-3 font-medium">Last Check</th>
                </tr>
              </thead>
              <tbody>
                  {mapServers.map((server) => (
                  <tr key={server.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-2 px-3">
                      <div>
                        <p className="font-medium font-mono text-sm">{server.server_key}</p>
                        <p className="text-xs text-muted-foreground">{server.provider || 'Unknown provider'}</p>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant="outline" className="text-xs">
                        {server.dataset_family || 'general'}
                      </Badge>
                    </td>
                    <td className="py-2 px-3">
                      <HealthStatusBadge status={server.health_status} />
                    </td>
                    <td className="py-2 px-3">
                      <ReliabilityScore score={server.reliability_score} />
                    </td>
                    <td className="py-2 px-3">
                      {server.last_health_check ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">
                            {new Date(server.last_health_check).toLocaleDateString()}{' '}
                            {new Date(server.last_health_check).toLocaleTimeString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Never</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      {recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentErrors.map((error) => {
                const server = mapServers.find(s => s.id === error.map_server_id);
                return (
                  <div key={error.id} className="flex items-start gap-3 p-2 rounded bg-destructive/5 border border-destructive/10">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm font-mono">{server?.server_key || 'Unknown'}</span>
                        <Badge variant="outline" className="text-xs">{error.error_type}</Badge>
                        {error.status_code && (
                          <Badge variant="outline" className="text-xs">HTTP {error.status_code}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {error.error_message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {error.occurred_at && new Date(error.occurred_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
