import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Home, DollarSign, Briefcase, GraduationCap, Users, TrendingDown, Building, TrendingUp, Target, Sparkles, MapPin, ArrowUp, ArrowDown, Minus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCountyName } from "@/lib/texasCounties";

interface CountyComparison {
  avgMedianIncome?: number | null;
  avgMedianHomeValue?: number | null;
  avgVacancyRate?: number | null;
  avgUnemploymentRate?: number | null;
  avgMedianRent?: number | null;
  tractCount?: number | null;
}

interface ExtendedDemographicsCardProps {
  medianHomeValue?: number | null;
  medianRent?: number | null;
  vacancyRate?: number | null;
  unemploymentRate?: number | null;
  medianAge?: number | null;
  collegeAttainmentPct?: number | null;
  totalHousingUnits?: number | null;
  laborForce?: number | null;
  // New Census Data Moat fields
  retailSpendingIndex?: number | null;
  workforceAvailabilityScore?: number | null;
  growthPotentialIndex?: number | null;
  affluenceConcentration?: number | null;
  laborPoolDepth?: number | null;
  growthTrajectory?: string | null;
  marketOutlook?: string | null;
  demographicsSource?: string | null;
  // NEW: Tract identification
  censusGeoid?: string | null;
  countyFips?: string | null;
  acsVintage?: string | null;
  // NEW: County comparison metrics
  countyComparison?: CountyComparison | null;
  className?: string;
}

export function ExtendedDemographicsCard({
  medianHomeValue,
  medianRent,
  vacancyRate,
  unemploymentRate,
  medianAge,
  collegeAttainmentPct,
  totalHousingUnits,
  laborForce,
  retailSpendingIndex,
  workforceAvailabilityScore,
  growthPotentialIndex,
  affluenceConcentration,
  laborPoolDepth,
  growthTrajectory,
  marketOutlook,
  demographicsSource,
  censusGeoid,
  countyFips,
  acsVintage,
  countyComparison,
  className
}: ExtendedDemographicsCardProps) {
  // Check if we have any data to display
  const hasData = medianHomeValue || medianRent || vacancyRate !== null || 
                  unemploymentRate !== null || medianAge || collegeAttainmentPct !== null;
  
  if (!hasData) return null;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const getVacancyBadge = (rate: number) => {
    if (rate < 5) return { label: 'Tight Market', color: 'bg-green-500/20 text-green-700 dark:text-green-400' };
    if (rate < 10) return { label: 'Balanced', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400' };
    return { label: 'High Vacancy', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-400' };
  };

  const getUnemploymentBadge = (rate: number) => {
    if (rate < 4) return { label: 'Strong Labor', color: 'bg-green-500/20 text-green-700 dark:text-green-400' };
    if (rate < 7) return { label: 'Moderate', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400' };
    return { label: 'High Unemployment', color: 'bg-red-500/20 text-red-700 dark:text-red-400' };
  };

  // Calculate delta percentage between tract and county values
  const calcDelta = (tractVal: number | null | undefined, countyVal: number | null | undefined) => {
    if (!tractVal || !countyVal || countyVal === 0) return null;
    return ((tractVal - countyVal) / countyVal) * 100;
  };

  const DeltaIndicator = ({ delta }: { delta: number | null }) => {
    if (delta === null) return null;
    const isPositive = delta > 0;
    const isNeutral = Math.abs(delta) < 2;
    
    if (isNeutral) {
      return (
        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
          <Minus className="h-3 w-3" />
          ~0%
        </span>
      );
    }
    
    return (
      <span className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
      )}>
        {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {isPositive ? '+' : ''}{delta.toFixed(0)}%
      </span>
    );
  };

  const countyName = formatCountyName(countyFips);
  const hasCountyComparison = countyComparison && (
    countyComparison.avgMedianHomeValue ||
    countyComparison.avgVacancyRate ||
    countyComparison.avgUnemploymentRate
  );

  return (
    <Card className={cn(
      "glass-card overflow-hidden border-l-4 border-l-indigo-500",
      className
    )}>
      {/* Header */}
      <CardHeader className="relative bg-gradient-to-r from-[hsl(var(--midnight-blue))] to-[hsl(var(--midnight-blue)/0.9)] text-white pb-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,hsl(240,80%,60%,0.3)_50%,transparent_100%)] animate-pulse" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-white">
              <Building className="h-5 w-5 text-indigo-400" />
              Housing & Employment
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Census Tract GEOID Badge */}
              {censusGeoid && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs font-mono bg-white/10 border-white/20 text-white cursor-help">
                        <MapPin className="h-3 w-3 mr-1" />
                        Tract {censusGeoid.slice(-6)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">Census Tract {censusGeoid}</p>
                      <p className="text-xs text-muted-foreground">
                        This report uses demographic data from Census Tract {censusGeoid}, 
                        the statistical area containing your parcel.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {/* ACS Vintage Badge */}
              {acsVintage && (
                <Badge variant="outline" className="text-xs font-mono bg-white/10 border-white/20 text-white">
                  ACS {acsVintage}
                </Badge>
              )}
              
              {/* Source Badge */}
              <Badge variant="outline" className={cn(
                "text-xs font-mono",
                demographicsSource === "canonical" 
                  ? "bg-[hsl(var(--feasibility-orange)/0.2)] border-[hsl(var(--feasibility-orange)/0.4)] text-[hsl(var(--feasibility-orange))]"
                  : "bg-white/10 border-white/20 text-white"
              )}>
                {demographicsSource === "canonical" ? "SITEINTEL CENSUS MOAT" : "CENSUS ACS"}
              </Badge>
            </div>
          </div>
          
          {/* Key Metrics Strip */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {medianHomeValue && (
              <div className="px-4 py-2 rounded-lg bg-indigo-500/20">
                <span className="text-2xl font-bold font-mono text-white">
                  {formatCurrency(medianHomeValue)}
                </span>
                <span className="text-sm text-white/60 ml-2">median home</span>
              </div>
            )}
            {unemploymentRate !== null && unemploymentRate !== undefined && (
              <Badge variant="outline" className={cn("border-white/20", getUnemploymentBadge(unemploymentRate).color)}>
                {unemploymentRate.toFixed(1)}% unemployment
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* County Comparison Section */}
        {hasCountyComparison && (
          <div className="p-4 bg-gradient-to-r from-[hsl(var(--data-cyan)/0.1)] to-[hsl(var(--data-cyan)/0.05)] rounded-xl border border-[hsl(var(--data-cyan)/0.2)]">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-[hsl(var(--data-cyan))]" />
              <h4 className="font-semibold text-sm">Tract vs. {countyName}</h4>
              {countyComparison?.tractCount && (
                <span className="text-xs text-muted-foreground">
                  ({countyComparison.tractCount} tracts in county)
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Median Home Value Comparison */}
              {medianHomeValue && countyComparison?.avgMedianHomeValue && (
                <div className="p-3 bg-white/50 dark:bg-white/5 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Median Home</p>
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-sm">{formatCurrency(medianHomeValue)}</span>
                    <DeltaIndicator delta={calcDelta(medianHomeValue, countyComparison.avgMedianHomeValue)} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    vs {formatCurrency(countyComparison.avgMedianHomeValue)} avg
                  </p>
                </div>
              )}
              
              {/* Vacancy Rate Comparison */}
              {vacancyRate !== null && vacancyRate !== undefined && countyComparison?.avgVacancyRate && (
                <div className="p-3 bg-white/50 dark:bg-white/5 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Vacancy Rate</p>
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-sm">{vacancyRate.toFixed(1)}%</span>
                    <DeltaIndicator delta={calcDelta(vacancyRate, countyComparison.avgVacancyRate) ? -calcDelta(vacancyRate, countyComparison.avgVacancyRate)! : null} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    vs {countyComparison.avgVacancyRate.toFixed(1)}% avg
                  </p>
                </div>
              )}
              
              {/* Unemployment Comparison */}
              {unemploymentRate !== null && unemploymentRate !== undefined && countyComparison?.avgUnemploymentRate && (
                <div className="p-3 bg-white/50 dark:bg-white/5 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Unemployment</p>
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-sm">{unemploymentRate.toFixed(1)}%</span>
                    <DeltaIndicator delta={calcDelta(unemploymentRate, countyComparison.avgUnemploymentRate) ? -calcDelta(unemploymentRate, countyComparison.avgUnemploymentRate)! : null} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    vs {countyComparison.avgUnemploymentRate.toFixed(1)}% avg
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Housing Market */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {medianHomeValue && (
            <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 rounded-xl border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium">Median Home Value</span>
              </div>
              <p className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {formatCurrency(medianHomeValue)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Owner-occupied housing</p>
            </div>
          )}

          {medianRent && (
            <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-xl border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-cyan-500" />
                <span className="text-sm font-medium">Median Rent</span>
              </div>
              <p className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
                ${medianRent.toLocaleString()}/mo
              </p>
              <p className="text-xs text-muted-foreground mt-1">Gross monthly rent</p>
            </div>
          )}

          {vacancyRate !== null && vacancyRate !== undefined && (
            <div className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Vacancy Rate</span>
              </div>
              <p className="text-2xl font-bold font-mono">
                {vacancyRate.toFixed(1)}%
              </p>
              <Badge className={cn("mt-2 text-xs", getVacancyBadge(vacancyRate).color)}>
                {getVacancyBadge(vacancyRate).label}
              </Badge>
            </div>
          )}
        </div>

        {/* Demographics & Employment */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {medianAge && (
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 text-center">
              <Users className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold font-mono">{medianAge.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Median Age</p>
            </div>
          )}

          {collegeAttainmentPct !== null && collegeAttainmentPct !== undefined && (
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 text-center">
              <GraduationCap className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold font-mono">{collegeAttainmentPct.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">College Degree</p>
            </div>
          )}

          {unemploymentRate !== null && unemploymentRate !== undefined && (
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 text-center">
              <Briefcase className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold font-mono">{unemploymentRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Unemployment</p>
            </div>
          )}

          {laborForce && (
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 text-center">
              <Briefcase className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold font-mono">{laborForce.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Labor Force</p>
            </div>
          )}
        </div>

        {/* Housing Inventory */}
        {totalHousingUnits && (
          <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-4 w-4 text-indigo-500" />
              <h4 className="font-semibold text-sm">Housing Inventory</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{totalHousingUnits.toLocaleString()}</span> total housing units in census tract
              {vacancyRate !== null && vacancyRate !== undefined && (
                <> with <span className="font-semibold text-foreground">{vacancyRate.toFixed(1)}%</span> vacancy rate</>
              )}
            </p>
          </div>
        )}

        {/* Proprietary CRE Indices */}
        {(retailSpendingIndex || workforceAvailabilityScore || growthPotentialIndex) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[hsl(var(--feasibility-orange))]" />
              <h4 className="font-semibold text-sm">Proprietary CRE Indices</h4>
              <Badge variant="outline" className="text-xs bg-[hsl(var(--feasibility-orange)/0.1)] border-[hsl(var(--feasibility-orange)/0.3)] text-[hsl(var(--feasibility-orange))]">
                SITEINTEL EXCLUSIVE
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {retailSpendingIndex !== null && retailSpendingIndex !== undefined && (
                <div className="p-3 bg-gradient-to-br from-[hsl(var(--feasibility-orange)/0.1)] to-transparent rounded-lg border border-[hsl(var(--feasibility-orange)/0.2)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Retail Spending</span>
                    <Target className="h-3 w-3 text-[hsl(var(--feasibility-orange))]" />
                  </div>
                  <p className="text-xl font-bold font-mono text-[hsl(var(--feasibility-orange))]">{retailSpendingIndex.toFixed(0)}</p>
                  <div className="w-full h-1 bg-muted rounded-full mt-1">
                    <div className="h-full bg-[hsl(var(--feasibility-orange))] rounded-full" style={{ width: `${retailSpendingIndex}%` }} />
                  </div>
                </div>
              )}
              {workforceAvailabilityScore !== null && workforceAvailabilityScore !== undefined && (
                <div className="p-3 bg-gradient-to-br from-[hsl(var(--data-cyan)/0.1)] to-transparent rounded-lg border border-[hsl(var(--data-cyan)/0.2)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Workforce</span>
                    <Briefcase className="h-3 w-3 text-[hsl(var(--data-cyan))]" />
                  </div>
                  <p className="text-xl font-bold font-mono text-[hsl(var(--data-cyan))]">{workforceAvailabilityScore.toFixed(0)}</p>
                  <div className="w-full h-1 bg-muted rounded-full mt-1">
                    <div className="h-full bg-[hsl(var(--data-cyan))] rounded-full" style={{ width: `${workforceAvailabilityScore}%` }} />
                  </div>
                </div>
              )}
              {growthPotentialIndex !== null && growthPotentialIndex !== undefined && (
                <div className="p-3 bg-gradient-to-br from-green-500/10 to-transparent rounded-lg border border-green-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Growth Potential</span>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  </div>
                  <p className="text-xl font-bold font-mono text-green-600 dark:text-green-400">{growthPotentialIndex.toFixed(0)}</p>
                  <div className="w-full h-1 bg-muted rounded-full mt-1">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${growthPotentialIndex}%` }} />
                  </div>
                </div>
              )}
            </div>
            {(growthTrajectory || marketOutlook) && (
              <div className="flex gap-2 mt-2">
                {growthTrajectory && (
                  <Badge className={cn(
                    "text-xs",
                    growthTrajectory === "rapid" && "bg-green-500/20 text-green-700 dark:text-green-400",
                    growthTrajectory === "steady" && "bg-blue-500/20 text-blue-700 dark:text-blue-400",
                    growthTrajectory === "stable" && "bg-gray-500/20 text-gray-700 dark:text-gray-400",
                    growthTrajectory === "declining" && "bg-red-500/20 text-red-700 dark:text-red-400"
                  )}>
                    {growthTrajectory.charAt(0).toUpperCase() + growthTrajectory.slice(1)} Growth
                  </Badge>
                )}
                {marketOutlook && (
                  <Badge variant="outline" className="text-xs">
                    {marketOutlook.charAt(0).toUpperCase() + marketOutlook.slice(1)} Market
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
