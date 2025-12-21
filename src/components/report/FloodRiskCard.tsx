import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Droplets, TrendingUp, Shield, FileText, Activity } from "lucide-react";
import { DataGauge } from "./DataGauge";
import { ShowSourceButton } from "./ShowSourceButton";
import { cn } from "@/lib/utils";

interface FloodRiskCardProps {
  score: number;
  floodZone?: string | null;
  baseFloodElevation?: number | null;
  bfeSource?: string | null;
  firmPanel?: string | null;
  historicalEvents?: any[] | null;
  nfipClaims?: number | null;
  verdict?: string | null;
  className?: string;
  updatedAt?: string | null;
}

export function FloodRiskCard({
  score,
  floodZone,
  baseFloodElevation,
  bfeSource,
  firmPanel,
  historicalEvents = [],
  nfipClaims,
  verdict,
  className,
  updatedAt
}: FloodRiskCardProps) {
  const getRiskLevel = (zone?: string | null) => {
    if (!zone) return { level: 'Unknown', color: 'text-muted-foreground', bg: 'bg-muted' };
    const z = zone.toUpperCase();
    if (z === 'X' || z === 'C') return { level: 'Minimal', color: 'text-green-600', bg: 'bg-green-500/10' };
    if (z.includes('A') || z.includes('V')) return { level: 'High', color: 'text-red-600', bg: 'bg-red-500/10' };
    if (z === 'B' || z === 'X500') return { level: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-500/10' };
    return { level: 'Unknown', color: 'text-muted-foreground', bg: 'bg-muted' };
  };

  const risk = getRiskLevel(floodZone);

  return (
    <Card className={cn(
      "glass-card overflow-hidden border-l-4",
      risk.level === 'High' ? 'border-l-red-500' : 
      risk.level === 'Moderate' ? 'border-l-amber-500' : 
      risk.level === 'Minimal' ? 'border-l-green-500' : 'border-l-muted',
      className
    )}>
      {/* Header with AI scan effect */}
      <CardHeader className="relative bg-gradient-to-r from-[hsl(var(--midnight-blue))] to-[hsl(var(--midnight-blue)/0.9)] text-white pb-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,hsl(var(--data-cyan)/0.3)_50%,transparent_100%)] animate-pulse" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Droplets className="h-5 w-5 text-[hsl(var(--data-cyan))]" />
              Flood Risk Analysis
            </CardTitle>
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white text-xs font-mono">
              FEMA NFHL
            </Badge>
          </div>
          
          {/* Risk Level Strip */}
          <div className="mt-4 flex items-center gap-4">
            <div className={cn("px-4 py-2 rounded-lg", risk.bg)}>
              <span className={cn("text-sm font-bold uppercase", risk.color)}>
                {risk.level} Risk
              </span>
            </div>
            {floodZone && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">Zone</span>
                <Badge className={cn(
                  "font-mono text-lg px-3",
                  floodZone.toUpperCase() === 'X' ? 'bg-green-600' :
                  floodZone.toUpperCase().includes('A') ? 'bg-red-600' : 'bg-amber-600'
                )}>
                  {floodZone}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Score and Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Flood Score Gauge */}
          <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50">
            <DataGauge value={score} label="Flood Score" size="md" />
            <span className="mt-2 text-sm font-medium text-muted-foreground">Flood Score</span>
          </div>

          {/* Base Flood Elevation */}
          {baseFloodElevation && (
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-xl border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Base Flood Elevation</span>
              </div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                {baseFloodElevation} <span className="text-lg">ft</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">NAVD88</p>
              {bfeSource && (
                <Badge variant="outline" className="mt-2 text-xs">
                  {bfeSource}
                </Badge>
              )}
            </div>
          )}

          {/* FIRM Panel */}
          {firmPanel && (
            <div className="p-4 bg-gradient-to-br from-slate-500/10 to-slate-500/5 rounded-xl border border-slate-500/20">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">FIRM Panel</span>
              </div>
              <p className="text-lg font-bold font-mono break-all">
                {firmPanel}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Flood Insurance Rate Map
              </p>
            </div>
          )}
        </div>

        {/* Insurance Impact Alert */}
        {floodZone && floodZone.toUpperCase() !== 'X' && (
          <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
                  Flood Insurance Required
                </p>
                <p className="text-sm text-muted-foreground">
                  Properties in Zone {floodZone} require NFIP flood insurance for federally-backed mortgages. 
                  Elevation certificate recommended to potentially reduce premiums.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Historical Events */}
        {historicalEvents && historicalEvents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">Historical Flood Events ({historicalEvents.length})</h4>
            </div>
            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {historicalEvents.slice(0, 5).map((event: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{event.title || event.incident_type}</p>
                    {event.county && <p className="text-xs text-muted-foreground">{event.county}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {event.disaster_number && (
                      <Badge variant="outline" className="font-mono text-xs">
                        DR-{event.disaster_number}
                      </Badge>
                    )}
                    {event.declaration_date && (
                      <Badge variant="secondary" className="text-xs">
                        {new Date(event.declaration_date).getFullYear()}
                      </Badge>
                    )}
                  </div>
                </div>
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
            Source: FEMA NFHL
          </span>
          <ShowSourceButton
            domain="flood"
            title="Flood Risk Analysis"
            timestamp={updatedAt || undefined}
            rawData={{
              floodZone,
              baseFloodElevation,
              bfeSource,
              firmPanel,
              nfipClaims,
              historicalEventsCount: historicalEvents?.length || 0,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
