import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, MapPin, Train, Building2, Navigation, CheckCircle2, AlertCircle, Route } from "lucide-react";
import { DataGauge } from "./DataGauge";
import { AccessDistanceVisual } from "./AccessDistanceVisual";
import { RoadClassificationBadge } from "./RoadClassificationBadge";
import { DriveTimeRings } from "./DriveTimeRings";
import { cn } from "@/lib/utils";
interface AccessCardProps {
  score?: number;
  distanceHighwayFt?: number | null;
  distanceTransitFt?: number | null;
  nearestHighway?: string | null;
  nearestTransitStop?: string | null;
  nearestSignalDistanceFt?: number | null;
  roadClassification?: string | null;
  driveTimeData?: any;
  verdict?: string | null;
  className?: string;
}

export function AccessCard({
  score = 0,
  distanceHighwayFt,
  distanceTransitFt,
  nearestHighway,
  nearestTransitStop,
  nearestSignalDistanceFt,
  roadClassification,
  driveTimeData,
  verdict,
  className
}: AccessCardProps) {
  const feetToMiles = (ft: number) => (ft / 5280).toFixed(2);
  
  const getAccessQuality = () => {
    if (distanceHighwayFt && distanceHighwayFt < 2640) return { level: 'Excellent', color: 'green' };
    if (distanceHighwayFt && distanceHighwayFt < 5280) return { level: 'Good', color: 'blue' };
    if (distanceHighwayFt && distanceHighwayFt < 10560) return { level: 'Moderate', color: 'amber' };
    return { level: 'Limited', color: 'red' };
  };

  const access = getAccessQuality();

  return (
    <Card className={cn(
      "glass-card overflow-hidden border-l-4 border-l-[hsl(var(--data-cyan))]",
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
              <Route className="h-5 w-5 text-[hsl(var(--data-cyan))]" />
              Site Access & Connectivity
            </CardTitle>
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white text-xs font-mono">
              GIS ANALYSIS
            </Badge>
          </div>
          
          {/* Access Quality Strip */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full",
              access.color === 'green' ? 'bg-green-500/20' :
              access.color === 'blue' ? 'bg-blue-500/20' :
              access.color === 'amber' ? 'bg-amber-500/20' : 'bg-red-500/20'
            )}>
              {access.color === 'green' || access.color === 'blue' ? (
                <CheckCircle2 className={cn(
                  "h-4 w-4",
                  access.color === 'green' ? 'text-green-400' : 'text-blue-400'
                )} />
              ) : (
                <AlertCircle className={cn(
                  "h-4 w-4",
                  access.color === 'amber' ? 'text-amber-400' : 'text-red-400'
                )} />
              )}
              <span className={cn(
                "text-sm font-medium",
                access.color === 'green' ? 'text-green-300' :
                access.color === 'blue' ? 'text-blue-300' :
                access.color === 'amber' ? 'text-amber-300' : 'text-red-300'
              )}>
                {access.level} Access
              </span>
            </div>
            {nearestHighway && (
              <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                Near {nearestHighway}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Visual Dashboard - Distance Radial + Drive Time Rings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Access Distance Visual */}
          {(distanceHighwayFt || distanceTransitFt || nearestSignalDistanceFt) && (
            <div className="p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50">
              <h4 className="font-semibold text-sm mb-2 text-center">Distance to Infrastructure</h4>
              <AccessDistanceVisual 
                distanceHighwayFt={distanceHighwayFt ?? undefined}
                distanceTransitFt={distanceTransitFt ?? undefined}
                nearestSignalDistanceFt={nearestSignalDistanceFt ?? undefined}
              />
            </div>
          )}

          {/* Drive Time Rings or Score */}
          {driveTimeData ? (
            <div className="p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50">
              <DriveTimeRings driveTimeData={driveTimeData} />
            </div>
          ) : score > 0 ? (
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50">
              <DataGauge value={score} label="Access Score" size="md" />
              <span className="mt-3 text-sm font-medium text-muted-foreground">Overall Access Score</span>
            </div>
          ) : null}
        </div>

        {/* Key Distances Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Highway Distance */}
          {distanceHighwayFt && (
            <div className={cn(
              "p-4 rounded-xl border",
              distanceHighwayFt < 5280 
                ? "bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20"
                : "bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Car className={cn(
                  "h-4 w-4",
                  distanceHighwayFt < 5280 ? "text-green-500" : "text-amber-500"
                )} />
                <span className="text-xs text-muted-foreground">Highway</span>
              </div>
              <p className="text-2xl font-bold font-mono">
                {feetToMiles(distanceHighwayFt)} <span className="text-sm">mi</span>
              </p>
              {nearestHighway && (
                <p className="text-xs text-muted-foreground mt-1 truncate">{nearestHighway}</p>
              )}
            </div>
          )}

          {/* Transit Distance */}
          {distanceTransitFt && (
            <div className={cn(
              "p-4 rounded-xl border",
              distanceTransitFt < 2640
                ? "bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20"
                : "bg-gradient-to-br from-slate-500/10 to-slate-500/5 border-slate-500/20"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Train className={cn(
                  "h-4 w-4",
                  distanceTransitFt < 2640 ? "text-blue-500" : "text-slate-500"
                )} />
                <span className="text-xs text-muted-foreground">Transit</span>
              </div>
              <p className="text-2xl font-bold font-mono">
                {feetToMiles(distanceTransitFt)} <span className="text-sm">mi</span>
              </p>
              {nearestTransitStop && (
                <p className="text-xs text-muted-foreground mt-1 truncate">{nearestTransitStop}</p>
              )}
            </div>
          )}

          {/* Signal Distance */}
          {nearestSignalDistanceFt && (
            <div className="p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Signal</span>
              </div>
              <p className="text-2xl font-bold font-mono">
                {nearestSignalDistanceFt.toLocaleString()} <span className="text-sm">ft</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Signalized intersection</p>
            </div>
          )}

          {/* Road Classification Badge */}
          {roadClassification && (
            <div className="p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50">
              <RoadClassificationBadge classification={roadClassification} size="md" />
            </div>
          )}
        </div>

        {/* Access Summary */}
        <div className="p-4 bg-gradient-to-r from-[hsl(var(--data-cyan)/0.1)] to-[hsl(var(--data-cyan)/0.05)] rounded-xl border border-[hsl(var(--data-cyan)/0.3)]">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-[hsl(var(--data-cyan))]" />
            <h4 className="font-semibold text-sm">Access Assessment</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Highway Access</span>
                {distanceHighwayFt ? (
                  <Badge variant={distanceHighwayFt < 5280 ? 'default' : 'secondary'}>
                    {distanceHighwayFt < 2640 ? 'Excellent' : distanceHighwayFt < 5280 ? 'Good' : 'Moderate'}
                  </Badge>
                ) : (
                  <Badge variant="outline">N/A</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Transit Access</span>
                {distanceTransitFt ? (
                  <Badge variant={distanceTransitFt < 2640 ? 'default' : 'secondary'}>
                    {distanceTransitFt < 1320 ? 'Excellent' : distanceTransitFt < 2640 ? 'Good' : 'Limited'}
                  </Badge>
                ) : (
                  <Badge variant="outline">N/A</Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Signal Proximity</span>
                {nearestSignalDistanceFt ? (
                  <Badge variant={nearestSignalDistanceFt < 1000 ? 'default' : 'secondary'}>
                    {nearestSignalDistanceFt < 500 ? 'Adjacent' : nearestSignalDistanceFt < 1000 ? 'Near' : 'Distant'}
                  </Badge>
                ) : (
                  <Badge variant="outline">N/A</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Overall</span>
                <Badge variant={access.level === 'Excellent' || access.level === 'Good' ? 'default' : 'secondary'}>
                  {access.level}
                </Badge>
              </div>
            </div>
          </div>
        </div>

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
      </CardContent>
    </Card>
  );
}
