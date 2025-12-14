import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, TrendingUp, Clock, MapPin, Activity, Truck, ExternalLink } from "lucide-react";
import { DataGauge } from "./DataGauge";
import { cn } from "@/lib/utils";

interface TrafficCardProps {
  score: number;
  aadt?: number | null;
  roadName?: string | null;
  trafficYear?: number | null;
  truckPercent?: number | null;
  congestionLevel?: string | null;
  trafficDirection?: string | null;
  peakHourVolume?: number | null;
  trafficMapUrl?: string | null;
  verdict?: string | null;
  className?: string;
}

export function TrafficCard({
  score,
  aadt,
  roadName,
  trafficYear,
  truckPercent,
  congestionLevel,
  trafficDirection,
  peakHourVolume,
  trafficMapUrl,
  verdict,
  className
}: TrafficCardProps) {
  const getTrafficLevel = (aadt?: number | null) => {
    if (!aadt) return { level: 'Unknown', color: 'text-muted-foreground' };
    if (aadt > 30000) return { level: 'Very High', color: 'text-purple-600' };
    if (aadt > 20000) return { level: 'High', color: 'text-red-600' };
    if (aadt > 10000) return { level: 'Medium', color: 'text-amber-600' };
    return { level: 'Low', color: 'text-green-600' };
  };

  const traffic = getTrafficLevel(aadt);

  return (
    <Card className={cn(
      "glass-card overflow-hidden border-l-4 border-l-[hsl(var(--feasibility-orange))]",
      className
    )}>
      {/* Header */}
      <CardHeader className="relative bg-gradient-to-r from-[hsl(var(--midnight-blue))] to-[hsl(var(--midnight-blue)/0.9)] text-white pb-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,hsl(var(--feasibility-orange)/0.3)_50%,transparent_100%)] animate-pulse" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Car className="h-5 w-5 text-[hsl(var(--feasibility-orange))]" />
              Traffic & Access Analysis
            </CardTitle>
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white text-xs font-mono">
              TxDOT AADT
            </Badge>
          </div>
          
          {/* Traffic Level Strip */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {aadt && (
              <>
                <div className="px-4 py-2 rounded-lg bg-white/10">
                  <span className="text-2xl font-bold font-mono text-white">
                    {aadt.toLocaleString()}
                  </span>
                  <span className="text-sm text-white/60 ml-2">VPD</span>
                </div>
                <Badge className={cn(
                  "text-sm px-3 py-1",
                  traffic.level === 'Very High' ? 'bg-purple-600' :
                  traffic.level === 'High' ? 'bg-red-600' :
                  traffic.level === 'Medium' ? 'bg-amber-600' : 'bg-green-600'
                )}>
                  {traffic.level} Traffic
                </Badge>
              </>
            )}
            {roadName && (
              <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                {roadName}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Score and Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Score Gauge */}
          <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50">
            <DataGauge value={score} label="Traffic Score" size="sm" />
            <span className="mt-2 text-xs font-medium text-muted-foreground">Traffic Score</span>
          </div>

          {/* Daily Traffic */}
          {aadt && (
            <div className="p-4 bg-gradient-to-br from-[hsl(var(--feasibility-orange)/0.1)] to-[hsl(var(--feasibility-orange)/0.05)] rounded-xl border border-[hsl(var(--feasibility-orange)/0.3)]">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-[hsl(var(--feasibility-orange))]" />
                <span className="text-xs text-muted-foreground">Daily Traffic</span>
              </div>
              <p className="text-2xl font-bold font-mono">{aadt.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">vehicles/day</p>
            </div>
          )}

          {/* Truck Traffic */}
          {truckPercent !== null && truckPercent !== undefined && (
            <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-xl border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 text-amber-600" />
                <span className="text-xs text-muted-foreground">Truck Traffic</span>
              </div>
              <p className="text-2xl font-bold font-mono text-amber-600">{truckPercent}%</p>
              <p className="text-xs text-muted-foreground">commercial vehicles</p>
            </div>
          )}

          {/* Congestion */}
          {congestionLevel && (
            <div className={cn(
              "p-4 rounded-xl border",
              congestionLevel.toLowerCase() === 'high' 
                ? "bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20"
                : congestionLevel.toLowerCase() === 'moderate'
                ? "bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20"
                : "bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className={cn(
                  "h-4 w-4",
                  congestionLevel.toLowerCase() === 'high' ? "text-red-500" :
                  congestionLevel.toLowerCase() === 'moderate' ? "text-amber-500" : "text-green-500"
                )} />
                <span className="text-xs text-muted-foreground">Congestion</span>
              </div>
              <Badge variant={
                congestionLevel.toLowerCase() === 'high' ? 'destructive' :
                congestionLevel.toLowerCase() === 'moderate' ? 'secondary' : 'default'
              } className="text-lg px-3 py-1">
                {congestionLevel}
              </Badge>
            </div>
          )}
        </div>

        {/* Peak Hour Analysis */}
        {congestionLevel && (
          <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Peak Hour Analysis
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Morning Rush', time: '7-9 AM', level: congestionLevel.toLowerCase() === 'high' ? 'Heavy' : congestionLevel },
                { label: 'Midday', time: '11 AM-2 PM', level: congestionLevel.toLowerCase() === 'high' ? 'Moderate' : 'Light' },
                { label: 'Evening Rush', time: '4-6 PM', level: congestionLevel.toLowerCase() === 'high' ? 'Heavy' : congestionLevel },
                { label: 'Off-Peak', time: 'Other', level: 'Light' },
              ].map((period, i) => (
                <div key={i} className="p-3 bg-background/50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">{period.label}</p>
                  <p className="text-xs font-mono text-muted-foreground mb-2">{period.time}</p>
                  <Badge variant={
                    period.level === 'Heavy' ? 'destructive' :
                    period.level === 'Moderate' ? 'secondary' : 'outline'
                  } className="text-xs">
                    {period.level}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trafficDirection && (
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Traffic Flow</span>
              </div>
              <p className="text-lg font-semibold capitalize">{trafficDirection}</p>
              <p className="text-xs text-muted-foreground">Primary direction</p>
            </div>
          )}

          {trafficYear && (
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Data Year</span>
              </div>
              <p className="text-lg font-bold font-mono">{trafficYear}</p>
              <p className="text-xs text-muted-foreground">TxDOT count</p>
            </div>
          )}

          {trafficMapUrl && (
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Traffic Map</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => window.open(trafficMapUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                View Interactive Map
              </Button>
            </div>
          )}
        </div>

        {/* AI Verdict */}
        {verdict && (
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--feasibility-orange))] animate-pulse" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">AI Analysis</span>
            </div>
            <div 
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: verdict }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
