import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, TrendingUp, Clock, MapPin, Activity, Truck, ExternalLink, Gauge, CircleDot, TrafficCone, AlertCircle } from "lucide-react";
import { DataGauge } from "./DataGauge";
import { ShowSourceButton } from "./ShowSourceButton";
import { TrafficSpeedometer } from "./TrafficSpeedometer";
import { TrafficVolumeChart } from "./TrafficVolumeChart";
import { TruckMixDonut } from "./TruckMixDonut";
import { PeakHourHeatmap } from "./PeakHourHeatmap";
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
  designHourlyVolume?: number | null;
  trafficMapUrl?: string | null;
  speedLimit?: number | null;
  surfaceType?: string | null;
  nearestSignalDistanceFt?: number | null;
  singleTruckAadt?: number | null;
  comboTruckAadt?: number | null;
  directionalFactor?: number | null;
  roadClassification?: string | null;
  verdict?: string | null;
  className?: string;
  updatedAt?: string | null;
}

function NoDataIndicator({ label }: { label: string }) {
  return (
    <div className="p-4 bg-muted/20 rounded-xl border border-dashed border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="h-4 w-4 text-muted-foreground/50" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm text-muted-foreground/70 italic">No data available</p>
    </div>
  );
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
  designHourlyVolume,
  trafficMapUrl,
  speedLimit,
  surfaceType,
  nearestSignalDistanceFt,
  singleTruckAadt,
  comboTruckAadt,
  directionalFactor,
  roadClassification,
  verdict,
  className,
  updatedAt
}: TrafficCardProps) {
  const getTrafficLevel = (aadt?: number | null) => {
    if (!aadt) return { level: 'Unknown', color: 'text-muted-foreground' };
    if (aadt > 30000) return { level: 'Very High', color: 'text-purple-600' };
    if (aadt > 20000) return { level: 'High', color: 'text-red-600' };
    if (aadt > 10000) return { level: 'Medium', color: 'text-amber-600' };
    return { level: 'Low', color: 'text-green-600' };
  };

  const traffic = getTrafficLevel(aadt);
  
  // Determine if we have minimal data
  const hasTrafficData = aadt !== null && aadt !== undefined;
  const hasSpeedLimit = speedLimit !== null && speedLimit !== undefined;
  const hasTruckData = truckPercent !== null && truckPercent !== undefined;

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
            {hasTrafficData ? (
              <>
                <div className="px-4 py-2 rounded-lg bg-white/10">
                  <span className="text-2xl font-bold font-mono text-white">
                    {aadt!.toLocaleString()}
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
            ) : (
              <div className="px-4 py-2 rounded-lg bg-white/10">
                <span className="text-lg text-white/60">No traffic count data</span>
              </div>
            )}
            {roadName && (
              <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                {roadName}
              </Badge>
            )}
            {roadClassification && (
              <Badge variant="outline" className="bg-white/10 border-white/20 text-white capitalize">
                {roadClassification}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Visual Dashboard - Speedometer + Volume Chart */}
        {hasTrafficData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Traffic Speedometer */}
            <div className="p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50">
              <TrafficSpeedometer aadt={aadt!} />
            </div>
            
            {/* Volume Comparison Chart */}
            <TrafficVolumeChart siteAadt={aadt!} />
          </div>
        )}

        {/* Score and Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Score Gauge */}
          <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50">
            <DataGauge value={score} label="Traffic Score" size="sm" />
            <span className="mt-2 text-xs font-medium text-muted-foreground">Traffic Score</span>
          </div>

          {/* Speed Limit */}
          {hasSpeedLimit ? (
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Speed Limit</span>
              </div>
              <p className="text-2xl font-bold font-mono text-blue-600">{speedLimit}</p>
              <p className="text-xs text-muted-foreground">MPH</p>
            </div>
          ) : (
            <NoDataIndicator label="Speed Limit" />
          )}

          {/* Surface Type */}
          {surfaceType ? (
            <div className="p-4 bg-gradient-to-br from-slate-500/10 to-slate-500/5 rounded-xl border border-slate-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CircleDot className="h-4 w-4 text-slate-500" />
                <span className="text-xs text-muted-foreground">Surface Type</span>
              </div>
              <p className="text-lg font-bold">{surfaceType}</p>
              <p className="text-xs text-muted-foreground">pavement</p>
            </div>
          ) : (
            <NoDataIndicator label="Surface Type" />
          )}

          {/* Congestion */}
          {congestionLevel ? (
            <div className={cn(
              "p-4 rounded-xl border",
              congestionLevel.toLowerCase() === 'high' || congestionLevel.toLowerCase() === 'severe'
                ? "bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20"
                : congestionLevel.toLowerCase() === 'moderate'
                ? "bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20"
                : "bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className={cn(
                  "h-4 w-4",
                  congestionLevel.toLowerCase() === 'high' || congestionLevel.toLowerCase() === 'severe' ? "text-red-500" :
                  congestionLevel.toLowerCase() === 'moderate' ? "text-amber-500" : "text-green-500"
                )} />
                <span className="text-xs text-muted-foreground">Congestion</span>
              </div>
              <Badge variant={
                congestionLevel.toLowerCase() === 'high' || congestionLevel.toLowerCase() === 'severe' ? 'destructive' :
                congestionLevel.toLowerCase() === 'moderate' ? 'secondary' : 'default'
              } className="text-lg px-3 py-1 capitalize">
                {congestionLevel}
              </Badge>
            </div>
          ) : (
            <NoDataIndicator label="Congestion" />
          )}
        </div>

        {/* Peak Hour & DHV Row */}
        {(peakHourVolume || designHourlyVolume || nearestSignalDistanceFt !== null) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Peak Hour Volume */}
            {peakHourVolume && (
              <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 rounded-xl border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-medium">Peak Hour Volume</span>
                </div>
                <p className="text-2xl font-bold font-mono text-indigo-600">{peakHourVolume.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {designHourlyVolume ? 'TxDOT DHV' : 'Est. (10% K-factor)'}
                </p>
              </div>
            )}

            {/* Nearest Traffic Signal */}
            {nearestSignalDistanceFt !== null && nearestSignalDistanceFt !== undefined && (
              <div className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrafficCone className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Nearest Signal</span>
                </div>
                <p className="text-2xl font-bold font-mono text-red-600">{nearestSignalDistanceFt.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">feet away</p>
              </div>
            )}

            {/* Directional Split */}
            {directionalFactor && directionalFactor > 0 && (
              <div className="p-4 bg-gradient-to-br from-teal-500/10 to-teal-500/5 rounded-xl border border-teal-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-teal-500" />
                  <span className="text-sm font-medium">Directional Split</span>
                </div>
                <p className="text-lg font-bold text-teal-600">
                  {directionalFactor}% / {100 - directionalFactor}%
                </p>
                <p className="text-xs text-muted-foreground">peak direction factor</p>
              </div>
            )}
          </div>
        )}

        {/* Truck Mix Donut Chart & Peak Hour Heatmap */}
        {(hasTruckData || hasTrafficData) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Truck Mix Donut */}
            {hasTruckData && hasTrafficData && (
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  Vehicle Mix
                </h4>
                <TruckMixDonut 
                  totalAadt={aadt!} 
                  truckPercent={truckPercent!}
                  singleUnitPercent={singleTruckAadt && aadt ? (singleTruckAadt / aadt) * 100 : undefined}
                  combinationPercent={comboTruckAadt && aadt ? (comboTruckAadt / aadt) * 100 : undefined}
                />
              </div>
            )}

            {/* Peak Hour Heatmap */}
            {hasTrafficData && (
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                <PeakHourHeatmap 
                  aadt={aadt!} 
                  peakHourVolume={peakHourVolume ?? undefined}
                  congestionLevel={congestionLevel ?? undefined}
                />
              </div>
            )}
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
                View TxDOT Map
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

        {/* Show Source Footer */}
        <div className="pt-4 border-t border-border/50 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Source: TxDOT AADT {trafficYear && `(${trafficYear})`}
          </span>
          <ShowSourceButton
            domain="traffic"
            title="Traffic & Access Analysis"
            timestamp={updatedAt || undefined}
            rawData={{
              aadt,
              roadName,
              roadClassification,
              trafficYear,
              truckPercent,
              singleTruckAadt,
              comboTruckAadt,
              congestionLevel,
              trafficDirection,
              peakHourVolume,
              designHourlyVolume,
              nearestSignalDistanceFt,
              directionalFactor,
              speedLimit,
              surfaceType,
              trafficMapUrl,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
