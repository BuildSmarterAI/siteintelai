import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, DollarSign, Briefcase, GraduationCap, Users, TrendingDown, Building } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExtendedDemographicsCardProps {
  medianHomeValue?: number | null;
  medianRent?: number | null;
  vacancyRate?: number | null;
  unemploymentRate?: number | null;
  medianAge?: number | null;
  collegeAttainmentPct?: number | null;
  totalHousingUnits?: number | null;
  laborForce?: number | null;
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Building className="h-5 w-5 text-indigo-400" />
              Housing & Employment
            </CardTitle>
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white text-xs font-mono">
              CENSUS ACS
            </Badge>
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
      </CardContent>
    </Card>
  );
}
