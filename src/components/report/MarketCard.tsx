import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Clock, MapPin, DollarSign, Building2, BarChart3 } from "lucide-react";
import { DataGauge } from "./DataGauge";
import { ShowSourceButton } from "./ShowSourceButton";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";

interface MarketCardProps {
  score: number;
  population1mi?: number | null;
  population3mi?: number | null;
  population5mi?: number | null;
  driveTime15min?: number | null;
  driveTime30min?: number | null;
  medianIncome?: number | null;
  households5mi?: number | null;
  growthRate5yr?: number | null;
  verdict?: string | null;
  className?: string;
  updatedAt?: string | null;
}

export function MarketCard({
  score,
  population1mi,
  population3mi,
  population5mi,
  driveTime15min,
  driveTime30min,
  medianIncome,
  households5mi,
  growthRate5yr,
  verdict,
  className,
  updatedAt
}: MarketCardProps) {
  const formatPopulation = (pop: number) => {
    if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M`;
    if (pop >= 1000) return `${(pop / 1000).toFixed(0)}K`;
    return pop.toLocaleString();
  };

  return (
    <Card className={cn(
      "glass-card overflow-hidden border-l-4 border-l-purple-500",
      className
    )}>
      {/* Header */}
      <CardHeader className="relative bg-gradient-to-r from-[hsl(var(--midnight-blue))] to-[hsl(var(--midnight-blue)/0.9)] text-white pb-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,hsl(280,80%,60%,0.3)_50%,transparent_100%)] animate-pulse" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-purple-400" />
              Market Demographics
            </CardTitle>
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white text-xs font-mono">
              CENSUS ACS
            </Badge>
          </div>
          
          {/* Key Metric Strip */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {driveTime15min && (
              <div className="px-4 py-2 rounded-lg bg-purple-500/20">
                <span className="text-2xl font-bold font-mono text-white">
                  {formatPopulation(driveTime15min)}
                </span>
                <span className="text-sm text-white/60 ml-2">15-min drive</span>
              </div>
            )}
            {medianIncome && (
              <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                ${(medianIncome / 1000).toFixed(0)}K median income
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Score and Drive Time Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Score Gauge */}
          <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50">
            <DataGauge value={score} label="Market Score" size="sm" />
            <span className="mt-2 text-sm font-medium text-muted-foreground">Market Score</span>
          </div>

          {/* 15-Min Drive Time */}
          {driveTime15min && (
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium">15-Minute Drive</span>
              </div>
              <p className="text-3xl font-bold font-mono text-purple-600 dark:text-purple-400">
                {driveTime15min.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Primary trade area</p>
              <Badge variant="outline" className="mt-2 text-xs">
                Highest conversion potential
              </Badge>
            </div>
          )}

          {/* 30-Min Drive Time */}
          {driveTime30min && (
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">30-Minute Drive</span>
              </div>
              <p className="text-3xl font-bold font-mono text-blue-600 dark:text-blue-400">
                {driveTime30min.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Extended market</p>
            </div>
          )}
        </div>

        {/* Concentric Ring Analysis */}
        {(population1mi || population3mi || population5mi) && (
          <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Concentric Ring Analysis
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {[
                { miles: 1, pop: population1mi, color: 'green' },
                { miles: 3, pop: population3mi, color: 'blue' },
                { miles: 5, pop: population5mi, color: 'purple' },
              ].map((ring) => ring.pop && (
                <div key={ring.miles} className="text-center p-4 bg-background/50 rounded-lg">
                  <div className={cn(
                    "inline-flex items-center justify-center w-12 h-12 rounded-full mb-2",
                    ring.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                    ring.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    'bg-purple-100 dark:bg-purple-900/30'
                  )}>
                    <span className={cn(
                      "text-lg font-bold",
                      ring.color === 'green' ? 'text-green-700 dark:text-green-400' :
                      ring.color === 'blue' ? 'text-blue-700 dark:text-blue-400' :
                      'text-purple-700 dark:text-purple-400'
                    )}>{ring.miles}</span>
                  </div>
                  <p className="text-2xl font-bold font-mono">{formatPopulation(ring.pop)}</p>
                  <p className="text-xs text-muted-foreground">within {ring.miles} mi</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Economic Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {medianIncome && (
            <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/5 rounded-xl border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Median Income</span>
              </div>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                ${medianIncome.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Annual household</p>
            </div>
          )}

          {households5mi && (
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-xl border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Households</span>
              </div>
              <p className="text-2xl font-bold font-mono">{households5mi.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Within 5 miles</p>
            </div>
          )}

          {growthRate5yr && (
            <div className={cn(
              "p-4 rounded-xl border",
              growthRate5yr > 0 
                ? "bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20"
                : "bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className={cn("h-4 w-4", growthRate5yr > 0 ? "text-green-500" : "text-red-500")} />
                <span className="text-sm font-medium">5-Year Growth</span>
              </div>
              <p className={cn(
                "text-2xl font-bold font-mono",
                growthRate5yr > 0 ? "text-green-600" : "text-red-600"
              )}>
                {growthRate5yr > 0 ? '+' : ''}{growthRate5yr.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Population trend</p>
            </div>
          )}
        </div>

        {/* Market Insights */}
        {driveTime15min && population3mi && (
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <h4 className="font-semibold text-sm">Market Reach Comparison</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {driveTime15min > population3mi ? (
                <>
                  <span className="font-semibold text-green-600">
                    {Math.round((driveTime15min / population3mi - 1) * 100)}% more people
                  </span>
                  {' '}accessible within 15-minute drive vs 3-mile radius — indicating good road connectivity.
                </>
              ) : (
                <>
                  3-mile radius captures{' '}
                  <span className="font-semibold">
                    {Math.round((population3mi / driveTime15min - 1) * 100)}% more people
                  </span>
                  {' '}than 15-min drive — suggesting dense urban environment with traffic.
                </>
              )}
            </p>
          </div>
        )}

        {/* AI Verdict */}
        {verdict && (
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">AI Analysis</span>
            </div>
            <div 
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(verdict) }}
            />
          </div>
        )}

        {/* Show Source Footer */}
        <div className="pt-4 border-t border-border/50 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Source: US Census ACS
          </span>
          <ShowSourceButton
            domain="market"
            title="Market Demographics"
            timestamp={updatedAt || undefined}
            rawData={{
              population1mi,
              population3mi,
              population5mi,
              driveTime15min,
              driveTime30min,
              medianIncome,
              households5mi,
              growthRate5yr,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
