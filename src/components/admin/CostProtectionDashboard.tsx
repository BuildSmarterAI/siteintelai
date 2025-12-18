import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  Shield, 
  ShieldAlert, 
  ShieldCheck,
  Activity,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Zap,
  Clock,
  Trash2,
} from "lucide-react";
import { 
  useCostProtectionMetrics, 
  toggleEmergencyMode, 
  clearApiCache 
} from "@/hooks/useCostProtectionMetrics";
import { BudgetProgressBar } from "./BudgetProgressBar";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function CostProtectionDashboard() {
  const {
    emergencyMode,
    pausedCronJobs,
    todaySpend,
    monthlySpend,
    budgets,
    cacheMetrics,
    recentCostAlerts,
    circuitBreakerThreshold,
    isLoading,
    refetch,
  } = useCostProtectionMetrics();

  const [togglingEmergency, setTogglingEmergency] = useState(false);
  const [triggeringAggregation, setTriggeringAggregation] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  const handleToggleEmergencyMode = async (enabled: boolean) => {
    setTogglingEmergency(true);
    try {
      await toggleEmergencyMode(enabled);
      toast.success(enabled ? 'Emergency mode activated' : 'Emergency mode deactivated');
      refetch();
    } catch (error) {
      console.error('Error toggling emergency mode:', error);
      toast.error('Failed to toggle emergency mode');
    } finally {
      setTogglingEmergency(false);
    }
  };

  const handleTriggerAggregation = async () => {
    setTriggeringAggregation(true);
    try {
      await supabase.functions.invoke('aggregate-api-costs');
      toast.success('Cost aggregation triggered');
      refetch();
    } catch (error) {
      console.error('Error triggering aggregation:', error);
      toast.error('Failed to trigger cost aggregation');
    } finally {
      setTriggeringAggregation(false);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const count = await clearApiCache();
      toast.success(`Cleared ${count} expired cache entries`);
      refetch();
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    } finally {
      setClearingCache(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await supabase
        .from('system_alerts')
        .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
        .eq('id', alertId);
      toast.success('Alert acknowledged');
      refetch();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const dailyBudget = budgets.find(b => b.type === 'daily');
  const monthlyBudget = budgets.find(b => b.type === 'monthly');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-60" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Emergency Mode Banner */}
      {emergencyMode && (
        <Card className="border-red-500/50 bg-red-500/10 animate-pulse">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-red-500" />
                <div>
                  <h3 className="text-lg font-bold text-red-500">EMERGENCY MODE ACTIVE</h3>
                  <p className="text-sm text-muted-foreground">
                    Daily spend: ${todaySpend.toFixed(2)} | Paused jobs: {pausedCronJobs.length > 0 ? pausedCronJobs.join(', ') : 'None'}
                  </p>
                </div>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => handleToggleEmergencyMode(false)}
                disabled={togglingEmergency}
              >
                {togglingEmergency ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                Deactivate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Budget */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4" />
              Daily Budget
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dailyBudget ? (
              <>
                <BudgetProgressBar
                  current={dailyBudget.current}
                  thresholdWarn={dailyBudget.thresholdWarn}
                  thresholdCritical={dailyBudget.thresholdCritical}
                />
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">${dailyBudget.current.toFixed(2)}</span>
                  <Badge
                    className={
                      dailyBudget.status === 'critical'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : dailyBudget.status === 'warning'
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        : 'bg-green-500/20 text-green-400 border-green-500/30'
                    }
                  >
                    {dailyBudget.status === 'critical' ? (
                      <XCircle className="w-3 h-3 mr-1" />
                    ) : dailyBudget.status === 'warning' ? (
                      <AlertTriangle className="w-3 h-3 mr-1" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    )}
                    {dailyBudget.percentUsed.toFixed(0)}% used
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No daily budget configured</p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Budget */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4" />
              Monthly Budget
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {monthlyBudget ? (
              <>
                <BudgetProgressBar
                  current={monthlyBudget.current}
                  thresholdWarn={monthlyBudget.thresholdWarn}
                  thresholdCritical={monthlyBudget.thresholdCritical}
                />
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">${monthlyBudget.current.toFixed(2)}</span>
                  <Badge
                    className={
                      monthlyBudget.status === 'critical'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : monthlyBudget.status === 'warning'
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        : 'bg-green-500/20 text-green-400 border-green-500/30'
                    }
                  >
                    {monthlyBudget.status === 'critical' ? (
                      <XCircle className="w-3 h-3 mr-1" />
                    ) : monthlyBudget.status === 'warning' ? (
                      <AlertTriangle className="w-3 h-3 mr-1" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    )}
                    {monthlyBudget.percentUsed.toFixed(0)}% used
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No monthly budget configured</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Circuit Breaker Status */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-4 h-4" />
            Circuit Breaker Status
          </CardTitle>
          <CardDescription>Automatic protection against runaway API costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {emergencyMode ? (
                <ShieldAlert className="w-10 h-10 text-red-500" />
              ) : todaySpend >= (dailyBudget?.thresholdWarn || 50) ? (
                <Shield className="w-10 h-10 text-yellow-500" />
              ) : (
                <ShieldCheck className="w-10 h-10 text-green-500" />
              )}
              <div>
                <p className="font-semibold">
                  {emergencyMode ? 'TRIPPED' : todaySpend >= (dailyBudget?.thresholdWarn || 50) ? 'WARNING' : 'ARMED'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Threshold: ${circuitBreakerThreshold.toFixed(2)} / day
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${todaySpend.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Current spend</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Performance */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="w-4 h-4" />
            Cache Performance (Last 24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cacheMetrics.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No API calls recorded today</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>API Source</TableHead>
                  <TableHead className="text-right">Total Calls</TableHead>
                  <TableHead className="text-right">Cache Hits</TableHead>
                  <TableHead className="text-right">Hit Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cacheMetrics.map((metric) => (
                  <TableRow key={metric.source}>
                    <TableCell className="font-mono text-sm">{metric.source}</TableCell>
                    <TableCell className="text-right">{metric.totalCalls.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{metric.cacheHits.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${metric.hitRate >= 70 ? 'bg-green-500' : metric.hitRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${metric.hitRate}%` }}
                          />
                        </div>
                        <span className={metric.hitRate >= 70 ? 'text-green-400' : metric.hitRate >= 40 ? 'text-yellow-400' : 'text-red-400'}>
                          {metric.hitRate}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Cost Alerts */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-4 h-4" />
            Recent Cost Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentCostAlerts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-500" />
              <p>No cost alerts - spending is under control</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCostAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    alert.acknowledged ? 'border-border/30 bg-muted/10' : 'border-border/50 bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        alert.severity === 'critical'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : alert.severity === 'error'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }
                    >
                      {alert.severity}
                    </Badge>
                    <div>
                      <p className="font-mono text-sm">{alert.alert_type}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                    {!alert.acknowledged && (
                      <Button size="sm" variant="ghost" onClick={() => acknowledgeAlert(alert.id)}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Controls */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4" />
            Admin Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Emergency Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20">
              <div>
                <p className="font-medium">Emergency Mode</p>
                <p className="text-sm text-muted-foreground">
                  Manually activate/deactivate cost protection
                </p>
              </div>
              <Switch
                checked={emergencyMode}
                onCheckedChange={handleToggleEmergencyMode}
                disabled={togglingEmergency}
              />
            </div>

            {/* Trigger Aggregation */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20">
              <div>
                <p className="font-medium">Cost Aggregation</p>
                <p className="text-sm text-muted-foreground">
                  Manually trigger cost calculation
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerAggregation}
                disabled={triggeringAggregation}
              >
                {triggeringAggregation ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Clear Cache */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20 md:col-span-2">
              <div>
                <p className="font-medium">Clear Expired Cache</p>
                <p className="text-sm text-muted-foreground">
                  Remove expired entries from API cache
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={clearingCache}>
                    {clearingCache ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear API Cache</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all expired cache entries. Active cache entries will be preserved.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearCache}>Clear Cache</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
