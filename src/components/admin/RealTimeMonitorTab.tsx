import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRealTimeMonitor } from "@/hooks/useRealTimeMonitor";
import { CheckCircle2, XCircle, Wifi, WifiOff, Clock, Activity, AlertTriangle } from "lucide-react";

export function RealTimeMonitorTab() {
  const { recentCalls, activeApplications, errorStream, isConnected, lastUpdate } = useRealTimeMonitor();

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <Wifi className="w-5 h-5 text-green-400 animate-pulse" />
              <span className="text-green-400 font-medium">Live Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Connecting...</span>
            </>
          )}
        </div>
        {lastUpdate && (
          <span className="text-sm text-muted-foreground">
            Last update: {new Date(lastUpdate).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Applications */}
        <Card className="border-border/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Active Applications
            </CardTitle>
            <CardDescription>Currently processing</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {activeApplications.length > 0 ? (
                <div className="space-y-3">
                  {activeApplications.map((app) => (
                    <div 
                      key={app.id}
                      className="p-3 rounded-lg border border-border/50 bg-muted/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge 
                          variant="outline" 
                          className={`
                            ${app.status === 'queued' ? 'text-yellow-400 border-yellow-400/30' : ''}
                            ${app.status === 'enriching' ? 'text-blue-400 border-blue-400/30' : ''}
                            ${app.status === 'ai' ? 'text-purple-400 border-purple-400/30' : ''}
                            ${app.status === 'rendering' ? 'text-cyan-400 border-cyan-400/30' : ''}
                          `}
                        >
                          {app.status}
                        </Badge>
                        {app.status_percent != null && (
                          <span className="text-sm text-muted-foreground">
                            {app.status_percent}%
                          </span>
                        )}
                      </div>
                      <div className="text-sm truncate text-muted-foreground">
                        {app.formatted_address || app.id.substring(0, 8)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(app.updated_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  <Clock className="w-6 h-6 mr-2" />
                  No active applications
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Live API Feed */}
        <Card className="border-border/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Live API Feed
            </CardTitle>
            <CardDescription>Real-time API calls</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {recentCalls.length > 0 ? (
                <div className="space-y-2">
                  {recentCalls.map((call) => (
                    <div 
                      key={call.id}
                      className={`p-2 rounded border text-sm ${
                        call.success 
                          ? 'border-green-500/20 bg-green-500/5' 
                          : 'border-red-500/20 bg-red-500/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {call.success ? (
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-400" />
                          )}
                          <span className="font-mono text-xs truncate max-w-[120px]" title={call.source}>
                            {call.source}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {call.duration_ms}ms
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate" title={call.endpoint}>
                        {call.endpoint}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(call.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  Waiting for API calls...
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Error Stream */}
        <Card className="border-border/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Error Stream
            </CardTitle>
            <CardDescription>Recent API errors</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {errorStream.length > 0 ? (
                <div className="space-y-2">
                  {errorStream.map((err) => (
                    <div 
                      key={err.id}
                      className="p-2 rounded border border-red-500/20 bg-red-500/5 text-sm"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="w-3 h-3 text-red-400" />
                        <span className="font-mono text-xs text-red-400">{err.source}</span>
                      </div>
                      <div className="text-xs text-red-300 truncate" title={err.error_message || 'Unknown error'}>
                        {err.error_message || 'Unknown error'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(err.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  <CheckCircle2 className="w-6 h-6 mr-2 text-green-500" />
                  No recent errors
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{recentCalls.length}</div>
            <div className="text-sm text-muted-foreground">Recent Calls</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeApplications.length}</div>
            <div className="text-sm text-muted-foreground">Active Apps</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-400">{errorStream.length}</div>
            <div className="text-sm text-muted-foreground">Recent Errors</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {recentCalls.length > 0 
                ? ((recentCalls.filter(c => c.success).length / recentCalls.length) * 100).toFixed(0)
                : 100}%
            </div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
