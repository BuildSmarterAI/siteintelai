import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw,
  Zap,
  Calendar,
  BarChart3
} from "lucide-react";
import { useApiCostMetrics, useTriggerCostAggregation } from "@/hooks/useApiCostMetrics";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export function ApiCostTab() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const { data: metrics, isLoading, refetch } = useApiCostMetrics(timeRange);
  const triggerAggregation = useTriggerCostAggregation();
  const [isAggregating, setIsAggregating] = useState(false);

  const handleAggregate = async () => {
    setIsAggregating(true);
    try {
      await triggerAggregation();
      toast.success('Cost aggregation triggered');
      refetch();
    } catch (error) {
      toast.error('Failed to trigger aggregation');
    } finally {
      setIsAggregating(false);
    }
  };

  const getCostColor = (cost: number, warnThreshold: number, criticalThreshold: number) => {
    if (cost >= criticalThreshold) return 'text-red-500';
    if (cost >= warnThreshold) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusBadge = (cost: number, warnThreshold: number, criticalThreshold: number) => {
    if (cost >= criticalThreshold) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
    }
    if (cost >= warnThreshold) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Warning</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">OK</Badge>;
  };

  const dailyBudget = metrics?.budgetConfig.find(b => b.budget_type === 'daily' && !b.source);
  const warnThreshold = dailyBudget?.threshold_warn || 50;
  const criticalThreshold = dailyBudget?.threshold_critical || 100;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Format hourly data for chart
  const chartData = metrics?.hourlyTrend.map(h => ({
    hour: new Date(h.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cost: h.cost,
    calls: h.calls,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as '24h' | '7d' | '30d')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAggregate}
            disabled={isAggregating}
          >
            {isAggregating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Aggregate Now
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Spend */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Today's Spend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getCostColor(metrics?.todayTotal || 0, warnThreshold, criticalThreshold)}`}>
              ${(metrics?.todayTotal || 0).toFixed(2)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(metrics?.todayTotal || 0, warnThreshold, criticalThreshold)}
              <span className="text-xs text-muted-foreground">
                / ${warnThreshold} warn
              </span>
            </div>
          </CardContent>
        </Card>

        {/* MTD Spend */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              MTD Spend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${(metrics?.mtdTotal || 0).toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        {/* Projected Monthly */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Projected Monthly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${(metrics?.projectedMonthly || 0).toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              Based on current rate
            </p>
          </CardContent>
        </Card>

        {/* Highest Cost API */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Top Cost Driver
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {metrics?.highestCostSource || 'N/A'}
            </div>
            <p className="text-2xl font-bold text-primary">
              ${(metrics?.highestCostAmount || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Trend Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Cost Timeline
          </CardTitle>
          <CardDescription>Hourly API costs over time</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="hour" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(v) => `$${v.toFixed(2)}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'cost' ? `$${value.toFixed(4)}` : value.toLocaleString(),
                    name === 'cost' ? 'Cost' : 'Calls'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No cost data available. Run aggregation to populate.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Breakdown Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Cost Breakdown by API</CardTitle>
          <CardDescription>Detailed cost analysis per API source</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>API Source</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">Calls Today</TableHead>
                <TableHead className="text-right">Cost Today</TableHead>
                <TableHead className="text-right">Calls MTD</TableHead>
                <TableHead className="text-right">Cost MTD</TableHead>
                <TableHead className="text-right">$/Call</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics?.breakdown.map(row => (
                <TableRow key={row.source}>
                  <TableCell className="font-mono text-sm">
                    {row.source}
                    {row.isFree && (
                      <Badge variant="outline" className="ml-2 text-xs">Free</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.provider || '-'}</TableCell>
                  <TableCell className="text-right">{row.callsToday.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${row.costToday.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right">{row.callsMTD.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${row.costMTD.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    ${row.costPerCall.toFixed(6)}
                  </TableCell>
                </TableRow>
              ))}
              {(!metrics?.breakdown || metrics.breakdown.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No API calls recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Budget Configuration */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Budget Thresholds</CardTitle>
          <CardDescription>Current alert thresholds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics?.budgetConfig.map(budget => (
              <div key={budget.id} className="p-4 rounded-lg border border-border/50 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{budget.budget_type} Budget</span>
                  <Badge variant="outline">{budget.source || 'Global'}</Badge>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Warning:</span>
                    <span className="text-yellow-500">${budget.threshold_warn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Critical:</span>
                    <span className="text-red-500">${budget.threshold_critical}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
