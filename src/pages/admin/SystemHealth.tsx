import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Database, 
  RefreshCw, 
  Server, 
  XCircle,
  Play,
  Bell,
  TrendingUp,
  Zap,
  BarChart3,
  Radio,
  GitBranch,
  Plug,
  Layers
} from "lucide-react";
import { ApiPerformanceTab } from "@/components/admin/ApiPerformanceTab";
import { PipelineHealthTab } from "@/components/admin/PipelineHealthTab";
import { RealTimeMonitorTab } from "@/components/admin/RealTimeMonitorTab";
import { ScraperApiTab } from "@/components/admin/ScraperApiTab";
import { GisHealthTab } from "@/components/admin/GisHealthTab";
import { ApiCostTab } from "@/components/admin/ApiCostTab";
import { MapPin, DollarSign } from "lucide-react";

interface CronJob {
  id: string;
  job_name: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  records_processed: number;
  execution_time_ms: number | null;
  error_message: string | null;
}

interface SystemAlert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  source: string;
  acknowledged: boolean;
  created_at: string;
}

interface SystemMetric {
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  recorded_at: string;
}

const CRON_JOBS = [
  { name: 'cron-enrichment', schedule: 'Every 5 minutes', description: 'Process queued applications' },
  { name: 'gis-refresh-scheduler', schedule: 'Daily at 3 AM', description: 'Refresh stale GIS layers' },
  { name: 'validate-gis-endpoints', schedule: 'Every 6 hours', description: 'Health check external APIs' },
  { name: 'credit-reset', schedule: 'Monthly (1st)', description: 'Reset subscription credits' },
  { name: 'cache-cleanup', schedule: 'Daily at 4 AM', description: 'Purge expired cache entries' },
  { name: 'alert-check', schedule: 'Every 15 minutes', description: 'Check system alert conditions' },
  { name: 'aggregate-api-costs', schedule: 'Hourly', description: 'Aggregate API costs and check budgets' },
];

export default function SystemHealth() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const [cronHistory, setCronHistory] = useState<CronJob[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
      return;
    }
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, adminLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch cron job history
      const { data: cronData } = await supabase
        .from('cron_job_history')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      // Fetch system alerts
      const { data: alertData } = await supabase
        .from('system_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch recent metrics
      const { data: metricData } = await supabase
        .from('system_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(100);

      setCronHistory(cronData || []);
      setAlerts(alertData || []);
      setMetrics(metricData || []);
    } catch (error) {
      console.error('Error fetching system health data:', error);
      toast.error('Failed to load system health data');
    } finally {
      setLoading(false);
    }
  };

  const triggerJob = async (jobName: string) => {
    setTriggeringJob(jobName);
    try {
      const { data, error } = await supabase.functions.invoke(jobName);
      
      if (error) throw error;
      
      toast.success(`${jobName} triggered successfully`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error(`Error triggering ${jobName}:`, error);
      toast.error(`Failed to trigger ${jobName}`);
    } finally {
      setTriggeringJob(null);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({ 
          acknowledged: true, 
          acknowledged_at: new Date().toISOString() 
        })
        .eq('id', alertId);

      if (error) throw error;
      
      toast.success('Alert acknowledged');
      fetchData();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Success</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Error</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Running</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-600/20 text-red-400 border-red-600/30">Critical</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Warning</Badge>;
      case 'info':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Info</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getLastRunForJob = (jobName: string) => {
    return cronHistory.find(job => job.job_name === jobName);
  };

  const getMetricValue = (metricName: string) => {
    return metrics.find(m => m.metric_name === metricName);
  };

  // Calculate summary stats
  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  const recentErrors = cronHistory.filter(j => j.status === 'error').slice(0, 5);
  const avgExecutionTime = cronHistory.length > 0 
    ? Math.round(cronHistory.filter(j => j.execution_time_ms).reduce((sum, j) => sum + (j.execution_time_ms || 0), 0) / cronHistory.length)
    : 0;

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">System Health</h1>
            <p className="text-muted-foreground">Monitor cron jobs, alerts, and system metrics</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Active Alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeAlerts.length}</div>
              {criticalAlerts.length > 0 && (
                <p className="text-red-400 text-sm">{criticalAlerts.length} critical</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Jobs Today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {cronHistory.filter(j => 
                  new Date(j.started_at).toDateString() === new Date().toDateString()
                ).length}
              </div>
              <p className="text-muted-foreground text-sm">
                {recentErrors.length} errors
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Avg Execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgExecutionTime}ms</div>
              <p className="text-muted-foreground text-sm">Last 50 jobs</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Success Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {cronHistory.length > 0 
                  ? Math.round((cronHistory.filter(j => j.status === 'success').length / cronHistory.length) * 100)
                  : 0}%
              </div>
              <p className="text-muted-foreground text-sm">Last 50 jobs</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="api" className="space-y-4">
          <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="api" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              API Performance
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Radio className="w-4 h-4" />
              Live
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Cron Jobs
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Alerts
              {activeAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {activeAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="scraper" className="flex items-center gap-2">
              <Plug className="w-4 h-4" />
              ScraperAPI
            </TabsTrigger>
            <TabsTrigger value="gis-health" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              GIS Health
            </TabsTrigger>
            <TabsTrigger value="costs" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              API Costs
            </TabsTrigger>
            <TabsTrigger value="tiles" className="flex items-center gap-2" onClick={() => window.location.href = '/admin/tile-management'}>
              <Layers className="w-4 h-4" />
              Tiles
            </TabsTrigger>
          </TabsList>

          {/* API Performance Tab */}
          <TabsContent value="api">
            <ApiPerformanceTab />
          </TabsContent>

          {/* Pipeline Health Tab */}
          <TabsContent value="pipeline">
            <PipelineHealthTab />
          </TabsContent>

          {/* Real-time Monitor Tab */}
          <TabsContent value="live">
            <RealTimeMonitorTab />
          </TabsContent>

          {/* Cron Jobs Tab */}
          <TabsContent value="jobs">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Scheduled Jobs</CardTitle>
                <CardDescription>View and manually trigger cron jobs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {CRON_JOBS.map(job => {
                    const lastRun = getLastRunForJob(job.name);
                    return (
                      <div 
                        key={job.name}
                        className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20"
                      >
                        <div className="space-y-1">
                          <div className="font-medium font-mono">{job.name}</div>
                          <div className="text-sm text-muted-foreground">{job.description}</div>
                          <div className="text-xs text-muted-foreground">Schedule: {job.schedule}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            {lastRun ? (
                              <>
                                {getStatusBadge(lastRun.status)}
                                <div className="text-xs text-muted-foreground mt-1">
                                  {new Date(lastRun.started_at).toLocaleString()}
                                </div>
                              </>
                            ) : (
                              <span className="text-muted-foreground text-sm">Never run</span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => triggerJob(job.name)}
                            disabled={triggeringJob === job.name}
                          >
                            {triggeringJob === job.name ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>Active and recent system alerts</CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>No alerts - system is healthy</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Severity</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alerts.map(alert => (
                        <TableRow key={alert.id} className={!alert.acknowledged ? 'bg-muted/30' : ''}>
                          <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                          <TableCell className="font-mono text-sm">{alert.alert_type}</TableCell>
                          <TableCell className="max-w-md truncate">{alert.message}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(alert.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {alert.acknowledged ? (
                              <Badge variant="outline">Acknowledged</Badge>
                            ) : (
                              <Badge variant="destructive">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!alert.acknowledged && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => acknowledgeAlert(alert.id)}
                              >
                                Acknowledge
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Job History Tab */}
          <TabsContent value="history">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Job Execution History</CardTitle>
                <CardDescription>Recent cron job executions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cronHistory.map(job => (
                        <TableRow key={job.id}>
                          <TableCell className="font-mono text-sm">{job.job_name}</TableCell>
                          <TableCell>{getStatusBadge(job.status)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(job.started_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {job.execution_time_ms ? `${job.execution_time_ms}ms` : '-'}
                          </TableCell>
                          <TableCell>{job.records_processed || 0}</TableCell>
                          <TableCell className="max-w-xs truncate text-red-400 text-sm">
                            {job.error_message || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ScraperAPI Tab */}
          <TabsContent value="scraper">
            <ScraperApiTab />
          </TabsContent>

          {/* GIS Health Tab */}
          <TabsContent value="gis-health">
            <GisHealthTab />
          </TabsContent>

          {/* API Costs Tab */}
          <TabsContent value="costs">
            <ApiCostTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
