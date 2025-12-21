import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, Zap, Wifi, Trash2, CheckCircle2, XCircle, AlertCircle, Cable } from "lucide-react";
import { DataGauge } from "./DataGauge";
import { ShowSourceButton } from "./ShowSourceButton";
import { cn } from "@/lib/utils";

interface UtilityLine {
  distance_ft?: number;
  provider?: string;
  diameter?: number;
  material?: string;
}

interface UtilitiesCardProps {
  score: number;
  waterLines?: UtilityLine[] | null;
  sewerLines?: UtilityLine[] | null;
  stormLines?: UtilityLine[] | null;
  powerKv?: number | null;
  fiberAvailable?: boolean | null;
  broadbandProviders?: any[] | null;
  waterCapacity?: number | null;
  sewerCapacity?: number | null;
  mudDistrict?: string | null;
  etjProvider?: string | null;
  wcidDistrict?: string | null;
  verdict?: string | null;
  className?: string;
  updatedAt?: string | null;
}

export function UtilitiesCard({
  score,
  waterLines,
  sewerLines,
  stormLines,
  powerKv,
  fiberAvailable,
  broadbandProviders,
  waterCapacity,
  sewerCapacity,
  mudDistrict,
  etjProvider,
  wcidDistrict,
  verdict,
  className,
  updatedAt
}: UtilitiesCardProps) {
  const getUtilityStatus = (lines?: UtilityLine[] | null) => {
    if (!lines || lines.length === 0) return { available: false, nearest: null };
    const nearest = Math.min(...lines.map(l => l.distance_ft || Infinity));
    return { available: nearest < 1000, nearest };
  };

  const water = getUtilityStatus(waterLines);
  const sewer = getUtilityStatus(sewerLines);
  const storm = getUtilityStatus(stormLines);

  const utilities = [
    { name: 'Water', icon: Droplets, status: water, color: 'blue', lines: waterLines },
    { name: 'Sewer', icon: Trash2, status: sewer, color: 'green', lines: sewerLines },
    { name: 'Storm', icon: Droplets, status: storm, color: 'cyan', lines: stormLines },
  ];

  const allAvailable = water.available && sewer.available;

  return (
    <Card className={cn(
      "glass-card overflow-hidden border-l-4",
      allAvailable ? 'border-l-green-500' : 'border-l-amber-500',
      className
    )}>
      {/* Header */}
      <CardHeader className="relative bg-gradient-to-r from-[hsl(var(--midnight-blue))] to-[hsl(var(--midnight-blue)/0.9)] text-white pb-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,hsl(var(--data-cyan)/0.3)_50%,transparent_100%)] animate-pulse" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Cable className="h-5 w-5 text-[hsl(var(--data-cyan))]" />
              Utilities Infrastructure
            </CardTitle>
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white text-xs font-mono">
              GIS VERIFIED
            </Badge>
          </div>
          
          {/* Status Strip */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {allAvailable ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-300">All Utilities Available</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-300">Extension May Be Required</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Score and Quick Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Score Gauge */}
          <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50">
            <DataGauge value={score} label="Utility Score" size="sm" />
            <span className="mt-2 text-sm font-medium text-muted-foreground">Utility Score</span>
          </div>

          {/* Utility Status Cards */}
          {utilities.map((util) => {
            const Icon = util.icon;
            return (
              <div 
                key={util.name}
                className={cn(
                  "p-4 rounded-xl border transition-all",
                  util.status.available 
                    ? "bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30"
                    : "bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={cn(
                    "h-5 w-5",
                    util.status.available ? "text-green-500" : "text-amber-500"
                  )} />
                  {util.status.available ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <p className="font-semibold">{util.name}</p>
                {util.status.nearest && util.status.nearest !== Infinity && (
                  <p className="text-sm text-muted-foreground font-mono">
                    {util.status.nearest.toLocaleString()} ft
                  </p>
                )}
                {!util.lines || util.lines.length === 0 && (
                  <p className="text-xs text-muted-foreground">No data</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Infrastructure Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Power */}
          {powerKv && (
            <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 rounded-xl border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium">Electrical Service</span>
              </div>
              <p className="text-2xl font-bold font-mono text-yellow-600 dark:text-yellow-400">
                {powerKv} <span className="text-sm">kV</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Nearby capacity</p>
            </div>
          )}

          {/* Fiber */}
          {typeof fiberAvailable === 'boolean' && (
            <div className={cn(
              "p-4 rounded-xl border",
              fiberAvailable 
                ? "bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-cyan-500/20"
                : "bg-gradient-to-br from-slate-500/10 to-slate-500/5 border-slate-500/20"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Wifi className={cn("h-5 w-5", fiberAvailable ? "text-cyan-500" : "text-slate-500")} />
                <span className="text-sm font-medium">Fiber Optic</span>
              </div>
              <Badge variant={fiberAvailable ? "default" : "secondary"} className="text-sm">
                {fiberAvailable ? '✓ Available' : 'Not Available'}
              </Badge>
            </div>
          )}

          {/* Capacity Metrics */}
          {waterCapacity && (
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Water Capacity</span>
              </div>
              <p className="text-xl font-bold font-mono">{waterCapacity} MGD</p>
            </div>
          )}

          {sewerCapacity && (
            <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Sewer Capacity</span>
              </div>
              <p className="text-xl font-bold font-mono">{sewerCapacity} MGD</p>
            </div>
          )}
        </div>

        {/* Special Districts */}
        {(mudDistrict || etjProvider || wcidDistrict) && (
          <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Cable className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Utility Districts & Providers</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              {mudDistrict && (
                <div>
                  <p className="text-xs text-muted-foreground">MUD District</p>
                  <p className="font-medium">{mudDistrict}</p>
                </div>
              )}
              {etjProvider && (
                <div>
                  <p className="text-xs text-muted-foreground">ETJ Provider</p>
                  <p className="font-medium">{etjProvider}</p>
                </div>
              )}
              {wcidDistrict && (
                <div>
                  <p className="text-xs text-muted-foreground">WCID</p>
                  <p className="font-medium">{wcidDistrict}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Broadband Providers */}
        {broadbandProviders && broadbandProviders.length > 0 && (
          <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Wifi className="h-4 w-4 text-[hsl(var(--data-cyan))]" />
              <span className="text-sm font-medium">Broadband Providers</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {broadbandProviders.map((provider: any, i: number) => (
                <Badge key={i} variant="outline" className="font-mono text-xs">
                  {typeof provider === 'string' ? provider : provider.name || `Provider ${i + 1}`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* AI Verdict */}
        {verdict && (
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--data-cyan))] animate-pulse" />
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
            Source: City of Houston GIS
          </span>
          <ShowSourceButton
            domain="utilities"
            title="Utilities Infrastructure"
            timestamp={updatedAt || undefined}
            rawData={{
              waterAvailable: water.available,
              sewerAvailable: sewer.available,
              stormAvailable: storm.available,
              waterNearestFt: water.nearest,
              sewerNearestFt: sewer.nearest,
              powerKv,
              fiberAvailable,
              waterCapacity,
              sewerCapacity,
              mudDistrict,
              etjProvider,
              wcidDistrict,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
