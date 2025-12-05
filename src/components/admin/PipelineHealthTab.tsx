import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { usePipelineMetrics } from "@/hooks/usePipelineMetrics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Loader2, FileText } from "lucide-react";

const STATUS_CONFIG = {
  queued: { label: 'Queued', color: '#F59E0B', icon: Clock },
  enriching: { label: 'Enriching', color: '#3B82F6', icon: Loader2 },
  ai: { label: 'AI Gen', color: '#8B5CF6', icon: FileText },
  rendering: { label: 'Rendering', color: '#06B6D4', icon: FileText },
  complete: { label: 'Complete', color: '#10B981', icon: CheckCircle2 },
  error: { label: 'Error', color: '#EF4444', icon: XCircle },
};

export function PipelineHealthTab() {
  const { statusCounts, phaseStats, recentErrors, avgPipelineTime, isLoading, error } = usePipelineMetrics();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24" />)}
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

  // Prepare pie chart data
  const pieData = Object.entries(statusCounts)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status,
      value: count,
      color: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || '#888',
    }));

  const totalApplications = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  // Prepare phase stats chart data
  const phaseChartData = phaseStats.map(stat => ({
    phase: stat.phase.length > 12 ? stat.phase.substring(0, 12) + '...' : stat.phase,
    fullPhase: stat.phase,
    successRate: stat.successRate,
    avgDuration: stat.avgDuration,
  }));

  // Format time
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, config]) => {
          const count = statusCounts[key] || 0;
          const Icon = config.icon;
          return (
            <Card key={key} className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: config.color }} />
                  {config.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" style={{ color: count > 0 ? config.color : undefined }}>
                  {count}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Average Pipeline Time */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Average Pipeline Time
          </CardTitle>
          <CardDescription>Time from submission to completion (last 7 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {avgPipelineTime > 0 ? formatDuration(avgPipelineTime) : 'N/A'}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Current application status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {totalApplications > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm">{item.name}</span>
                      <span className="text-sm text-muted-foreground ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No applications in system
              </div>
            )}
          </CardContent>
        </Card>

        {/* Phase Success Rates */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Phase Success Rates</CardTitle>
            <CardDescription>Success rate by pipeline phase (7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {phaseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={phaseChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis type="category" dataKey="phase" width={80} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Bar dataKey="successRate" fill="#10B981" name="Success Rate" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No phase metrics recorded yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Phase Statistics Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Phase Performance</CardTitle>
          <CardDescription>Detailed metrics for each pipeline phase</CardDescription>
        </CardHeader>
        <CardContent>
          {phaseStats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phase</TableHead>
                  <TableHead>Total Runs</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Avg Duration</TableHead>
                  <TableHead>Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phaseStats.map((stat) => (
                  <TableRow key={stat.phase}>
                    <TableCell className="font-mono text-sm">{stat.phase}</TableCell>
                    <TableCell>{stat.totalRuns}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={stat.successRate} 
                          className="w-20 h-2"
                        />
                        <span className={`text-sm ${
                          stat.successRate >= 95 ? 'text-green-400' :
                          stat.successRate >= 80 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {stat.successRate.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDuration(stat.avgDuration)}</TableCell>
                    <TableCell>
                      {stat.errorCount > 0 ? (
                        <Badge variant="destructive">{stat.errorCount}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-400 border-green-400/30">0</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No phase metrics recorded yet. Run some applications to see data.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Recent Pipeline Errors
          </CardTitle>
          <CardDescription>Latest errors from pipeline phases</CardDescription>
        </CardHeader>
        <CardContent>
          {recentErrors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phase</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentErrors.slice(0, 10).map((err, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {err.phase}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-sm text-red-400">
                      {err.error_message}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {err.application_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(err.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
              No pipeline errors in the last 7 days
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
