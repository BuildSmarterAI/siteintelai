import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiHealthMetrics } from "@/hooks/useApiHealthMetrics";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AlertTriangle, CheckCircle2, Clock, TrendingUp } from "lucide-react";

export function ApiPerformanceTab() {
  const { snapshots, bySource, overallStats, topErrors, isLoading, error } = useApiHealthMetrics('24h');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Error loading metrics: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data - group snapshots by hour
  const hourlyData: Record<string, Record<string, number | string>> = {};
  for (const snapshot of snapshots) {
    const hour = new Date(snapshot.hour).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (!hourlyData[hour]) {
      hourlyData[hour] = { hour };
    }
    const successRate = snapshot.total_calls > 0 
      ? (snapshot.successful_calls / snapshot.total_calls) * 100 
      : 100;
    hourlyData[hour][snapshot.source] = Math.round(successRate);
  }
  const chartData = Object.values(hourlyData);

  // Get unique sources for chart lines
  const sources = [...new Set(snapshots.map(s => s.source))];
  const colors = ['#10B981', '#FF7A00', '#06B6D4', '#8B5CF6', '#EF4444', '#F59E0B'];

  // Prepare latency chart data
  const latencyData = Object.entries(bySource).map(([source, stats]) => ({
    source: source.length > 15 ? source.substring(0, 15) + '...' : source,
    avgDuration: stats.avgDuration,
    successRate: stats.successRate,
  })).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total API Calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallStats.totalCalls.toLocaleString()}</div>
            <p className="text-muted-foreground text-sm">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Success Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${overallStats.successRate >= 95 ? 'text-green-400' : overallStats.successRate >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
              {overallStats.successRate.toFixed(1)}%
            </div>
            <p className="text-muted-foreground text-sm">{overallStats.errorCount} errors</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Latency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${overallStats.avgDuration < 500 ? 'text-green-400' : overallStats.avgDuration < 2000 ? 'text-yellow-400' : 'text-red-400'}`}>
              {overallStats.avgDuration}ms
            </div>
            <p className="text-muted-foreground text-sm">Mean response time</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              API Sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Object.keys(bySource).length}</div>
            <p className="text-muted-foreground text-sm">Unique sources tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>API Success Rate (24h)</CardTitle>
          <CardDescription>Success rate per API source over time</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                {sources.map((source, idx) => (
                  <Line
                    key={source}
                    type="monotone"
                    dataKey={source}
                    stroke={colors[idx % colors.length]}
                    strokeWidth={2}
                    dot={false}
                    name={source}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data available for the selected time range
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency by Source */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Latency by Source</CardTitle>
            <CardDescription>Average response time per API</CardDescription>
          </CardHeader>
          <CardContent>
            {latencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={latencyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis type="category" dataKey="source" width={100} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => `${value}ms`}
                  />
                  <Bar dataKey="avgDuration" fill="#FF7A00" name="Avg Duration (ms)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No latency data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Errors */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Top Errors</CardTitle>
            <CardDescription>Most frequent API errors</CardDescription>
          </CardHeader>
          <CardContent>
            {topErrors.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topErrors.slice(0, 5).map((err, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {err.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {err.message}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {err.count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mr-2 text-green-500" />
                No errors in the last 24 hours
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Source Health Grid */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>API Source Health</CardTitle>
          <CardDescription>Status of all tracked API sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(bySource).map(([source, stats]) => (
              <div 
                key={source}
                className={`p-3 rounded-lg border ${
                  stats.successRate >= 95 ? 'border-green-500/30 bg-green-500/10' :
                  stats.successRate >= 80 ? 'border-yellow-500/30 bg-yellow-500/10' :
                  'border-red-500/30 bg-red-500/10'
                }`}
              >
                <div className="font-mono text-xs truncate mb-1" title={source}>
                  {source}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-bold ${
                    stats.successRate >= 95 ? 'text-green-400' :
                    stats.successRate >= 80 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {stats.successRate.toFixed(0)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {stats.totalCalls} calls
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
