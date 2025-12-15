import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Landmark, CheckCircle2, XCircle, AlertCircle, Scale, Ruler, Building2 } from "lucide-react";
import { DataGauge } from "./DataGauge";
import { cn } from "@/lib/utils";

interface ZoningCardProps {
  score?: number;
  zoningCode?: string | null;
  zoningDescription?: string | null;
  lotCoverage?: number | null;
  farLimit?: number | null;
  heightLimit?: number | null;
  setbacks?: {
    front?: number;
    side?: number;
    rear?: number;
  } | null;
  permittedUses?: string[] | null;
  conditionalUses?: string[] | null;
  overlayDistricts?: string[] | null;
  verdict?: string | null;
  className?: string;
}

export function ZoningCard({
  score = 0,
  zoningCode,
  zoningDescription,
  lotCoverage,
  farLimit,
  heightLimit,
  setbacks,
  permittedUses,
  conditionalUses,
  overlayDistricts,
  verdict,
  className
}: ZoningCardProps) {
  const hasZoning = zoningCode && zoningCode !== 'None' && zoningCode !== 'N/A';
  const isHouston = !hasZoning; // Houston has no formal zoning

  return (
    <Card className={cn(
      "glass-card overflow-hidden border-l-4",
      hasZoning ? 'border-l-green-500' : 'border-l-amber-500',
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
              <Landmark className="h-5 w-5 text-[hsl(var(--data-cyan))]" />
              Zoning & Land Use
            </CardTitle>
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white text-xs font-mono">
              {isHouston ? 'DEED RESTRICTED' : 'MUNICIPAL GIS'}
            </Badge>
          </div>
          
          {/* Zoning Status Strip */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {hasZoning ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-300">Zoned Property</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-300">No Formal Zoning</span>
              </div>
            )}
            {zoningCode && (
              <Badge className="text-lg px-3 py-1 bg-[hsl(var(--data-cyan))] text-[hsl(var(--midnight-blue))]">
                {zoningCode}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Score and Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Score Gauge */}
          {score > 0 && (
            <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50">
              <DataGauge value={score} label="Zoning Score" size="sm" />
              <span className="mt-2 text-sm font-medium text-muted-foreground">Zoning Score</span>
            </div>
          )}

          {/* FAR Limit */}
          {farLimit && (
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">FAR Limit</span>
              </div>
              <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                {farLimit}:1
              </p>
              <p className="text-xs text-muted-foreground mt-1">Floor Area Ratio</p>
            </div>
          )}

          {/* Height Limit */}
          {heightLimit && (
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Height Limit</span>
              </div>
              <p className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
                {heightLimit} <span className="text-sm">ft</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Maximum height</p>
            </div>
          )}

          {/* Lot Coverage */}
          {lotCoverage && (
            <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Lot Coverage</span>
              </div>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {lotCoverage}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Maximum coverage</p>
            </div>
          )}
        </div>

        {/* Houston No-Zoning Alert */}
        {isHouston && (
          <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
                  Houston: No Traditional Zoning
                </p>
                <p className="text-sm text-muted-foreground">
                  Houston is the largest U.S. city without formal zoning. Development is governed by deed restrictions, 
                  platted setbacks, and Chapter 42 minimum standards. Review recorded restrictions for constraints.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Setbacks */}
        {setbacks && (setbacks.front || setbacks.side || setbacks.rear) && (
          <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              Required Setbacks
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              {setbacks.front && (
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Front</p>
                  <p className="text-xl font-bold font-mono">{setbacks.front}'</p>
                </div>
              )}
              {setbacks.side && (
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Side</p>
                  <p className="text-xl font-bold font-mono">{setbacks.side}'</p>
                </div>
              )}
              {setbacks.rear && (
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Rear</p>
                  <p className="text-xl font-bold font-mono">{setbacks.rear}'</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Permitted Uses */}
        {permittedUses && permittedUses.length > 0 && (
          <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <h4 className="font-semibold text-sm">Permitted Uses (By-Right)</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {permittedUses.slice(0, 8).map((use, i) => (
                <Badge key={i} variant="outline" className="bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400">
                  {use}
                </Badge>
              ))}
              {permittedUses.length > 8 && (
                <Badge variant="secondary">+{permittedUses.length - 8} more</Badge>
              )}
            </div>
          </div>
        )}

        {/* Conditional Uses */}
        {conditionalUses && conditionalUses.length > 0 && (
          <div className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl border border-amber-500/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <h4 className="font-semibold text-sm">Conditional Uses (Approval Required)</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {conditionalUses.slice(0, 6).map((use, i) => (
                <Badge key={i} variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400">
                  {use}
                </Badge>
              ))}
              {conditionalUses.length > 6 && (
                <Badge variant="secondary">+{conditionalUses.length - 6} more</Badge>
              )}
            </div>
          </div>
        )}

        {/* Overlay Districts */}
        {overlayDistricts && overlayDistricts.length > 0 && (
          <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Landmark className="h-4 w-4 text-purple-500" />
              <h4 className="font-semibold text-sm">Overlay Districts</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {overlayDistricts.map((district, i) => (
                <Badge key={i} variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400">
                  {district}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">
              Overlay districts may impose additional requirements beyond base zoning.
            </p>
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
      </CardContent>
    </Card>
  );
}
