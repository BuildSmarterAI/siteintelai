import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Home, Sun, MapPin } from "lucide-react";

interface GrowthProjectionsCardProps {
  populationCagr?: number | null;
  daytimePopulationEstimate?: number | null;
  population5yrProjection?: number | null;
  medianIncome5yrProjection?: number | null;
  medianHomeValue5yrProjection?: number | null;
  populationDensitySqmi?: number | null;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString();
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function GrowthProjectionsCard({
  populationCagr,
  daytimePopulationEstimate,
  population5yrProjection,
  medianIncome5yrProjection,
  medianHomeValue5yrProjection,
  populationDensitySqmi,
}: GrowthProjectionsCardProps) {
  // Always display card, show "—" for missing data

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <TrendingUp className="h-5 w-5 text-primary" />
          Growth & Projections
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Metrics Column */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Current Metrics</h4>
            
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-lg p-4 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <p className="text-xs text-muted-foreground">Population CAGR</p>
              </div>
              <p className={`text-2xl font-bold ${populationCagr != null && populationCagr >= 0 ? 'text-emerald-500' : populationCagr != null ? 'text-destructive' : 'text-foreground'}`}>
                {formatPercent(populationCagr)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Compound Annual Growth Rate</p>
            </div>

            <div className="bg-background/50 rounded-lg p-4 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Sun className="h-4 w-4 text-amber-500" />
                <p className="text-xs text-muted-foreground">Daytime Population</p>
              </div>
              <p className="text-xl font-bold">{formatNumber(daytimePopulationEstimate)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Workers + Residents</p>
            </div>

            <div className="bg-background/50 rounded-lg p-4 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Population Density</p>
              </div>
              <p className="text-xl font-bold">{populationDensitySqmi != null ? formatNumber(Math.round(populationDensitySqmi)) : "—"}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">per sq. mile</p>
            </div>
          </div>

          {/* 5-Year Projections Column */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">5-Year Projections</h4>
            
            <div className="flex items-center justify-between py-3 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Population</span>
              </div>
              <span className="font-semibold text-lg">{formatNumber(population5yrProjection)}</span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-border/30">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-muted-foreground">Median Income</span>
              </div>
              <span className="font-semibold text-lg">{formatCurrency(medianIncome5yrProjection)}</span>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-violet-500" />
                <span className="text-sm text-muted-foreground">Home Value</span>
              </div>
              <span className="font-semibold text-lg">{formatCurrency(medianHomeValue5yrProjection)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}