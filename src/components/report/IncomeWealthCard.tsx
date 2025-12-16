import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, Scale } from "lucide-react";

interface IncomeWealthCardProps {
  medianIncome?: number | null;
  perCapitaIncome?: number | null;
  meanHouseholdIncome?: number | null;
  povertyRate?: number | null;
  giniIndex?: number | null;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toFixed(1)}%`;
}

export function IncomeWealthCard({
  medianIncome,
  perCapitaIncome,
  meanHouseholdIncome,
  povertyRate,
  giniIndex,
}: IncomeWealthCardProps) {
  // Always display card, show "—" for missing data

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <DollarSign className="h-5 w-5 text-primary" />
          Income & Wealth
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-background/50 rounded-lg p-4 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1">Median Household Income</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(medianIncome)}</p>
          </div>
          
          <div className="bg-background/50 rounded-lg p-4 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1">Per Capita Income</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(perCapitaIncome)}</p>
          </div>
          
          <div className="bg-background/50 rounded-lg p-4 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1">Mean Household Income</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(meanHouseholdIncome)}</p>
          </div>
          
          <div className="bg-background/50 rounded-lg p-4 border border-border/30">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Poverty Rate</p>
            </div>
            <p className={`text-xl font-bold ${povertyRate != null && povertyRate > 15 ? 'text-destructive' : povertyRate != null && povertyRate > 10 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {formatPercent(povertyRate)}
            </p>
          </div>
          
          <div className="bg-background/50 rounded-lg p-4 border border-border/30">
            <div className="flex items-center gap-1.5 mb-1">
              <Scale className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Gini Index</p>
            </div>
            <p className="text-xl font-bold text-foreground">{giniIndex != null ? giniIndex.toFixed(3) : "—"}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Income Inequality</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
