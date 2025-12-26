import { cn } from "@/lib/utils";
import {
  Users,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Briefcase,
  Building2,
  MapPin,
  GraduationCap,
  Home,
  Clock,
} from "lucide-react";
import type { TradeAreaMetrics } from "@/hooks/useTradeAreaMetrics";
import { MetricCard } from "./MetricCard";
import { MetricsPanelSkeleton } from "./MetricCardSkeleton";
import { SiteIntelIndexCard } from "./SiteIntelIndexCard";
import { DataCoverageBadge } from "./DataCoverageBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricsSummaryPanelProps {
  metrics: TradeAreaMetrics | null;
  radiusMiles?: number;
  isLoading?: boolean;
  hexCount?: number;
  selectedAddress?: string;
}

function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toLocaleString();
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value.toLocaleString()}`;
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toFixed(1)}%`;
}

function calculateDataCoverage(metrics: TradeAreaMetrics | null): number {
  if (!metrics) return 0;
  const fields = [
    metrics.total_population,
    metrics.median_income,
    metrics.growth_rate_5yr,
    metrics.retail_spending_index,
    metrics.workforce_availability_score,
    metrics.total_housing_units,
    metrics.median_age,
    metrics.bachelor_degree_pct,
    metrics.unemployment_rate,
    metrics.median_home_value,
    metrics.owner_occupied_pct,
    metrics.vacancy_rate,
    metrics.growth_potential_index,
    metrics.affluence_concentration,
    metrics.labor_pool_depth,
  ];
  const filledCount = fields.filter((v) => v != null).length;
  return Math.round((filledCount / fields.length) * 100);
}

export function MetricsSummaryPanel({
  metrics,
  radiusMiles = 1,
  isLoading,
  hexCount,
  selectedAddress,
}: MetricsSummaryPanelProps) {
  if (isLoading) {
    return <MetricsPanelSkeleton />;
  }

  if (!metrics) {
    return (
      <div className="bg-muted/50 rounded-xl p-8 text-center border border-dashed">
        <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">
          Select a location to view market metrics
        </p>
      </div>
    );
  }

  const dataCoverage = calculateDataCoverage(metrics);

  return (
    <div className="space-y-4">
      {/* Location Card */}
      {selectedAddress && (
        <div className="rounded-lg border bg-card p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 rounded-full bg-accent/10 p-2">
              <MapPin className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Selected Location
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground truncate">
                {selectedAddress}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {radiusMiles}-mile trade area
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Coverage */}
      <DataCoverageBadge
        coverage={dataCoverage}
        hexCount={hexCount}
        source="Census"
      />

      {/* Primary Metrics Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Key Metrics
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Population"
            value={formatNumber(metrics.total_population)}
            icon={Users}
            variant="data"
            tooltip="Total population within the trade area based on Census block group data."
            trend={
              metrics.growth_rate_5yr
                ? {
                    value: parseFloat(metrics.growth_rate_5yr.toFixed(1)),
                    isPositive: metrics.growth_rate_5yr > 0,
                  }
                : undefined
            }
          />
          <MetricCard
            label="Median Income"
            value={formatCurrency(metrics.median_income)}
            icon={DollarSign}
            variant="accent"
            tooltip="Median household income in the trade area. Higher values indicate greater purchasing power."
          />
          <MetricCard
            label="Growth Rate"
            value={formatPercent(metrics.growth_rate_5yr)}
            icon={TrendingUp}
            tooltip="Projected 5-year population growth rate based on demographic trends."
          />
          <MetricCard
            label="Spending Index"
            value={metrics.retail_spending_index?.toFixed(0) || "—"}
            icon={ShoppingCart}
            tooltip="Retail spending index relative to national average (100 = average). Values above 100 indicate above-average consumer spending."
          />
        </div>
      </div>

      {/* SiteIntel Indices */}
      <SiteIntelIndexCard
        growthPotentialIndex={metrics.growth_potential_index}
        retailSpendingIndex={metrics.retail_spending_index}
        workforceAvailabilityScore={metrics.workforce_availability_score}
        affluenceConcentration={metrics.affluence_concentration}
      />

      {/* Demographics Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Demographics
        </h3>
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <MetricRow
            label="Median Age"
            value={metrics.median_age?.toFixed(0) || "—"}
            icon={<Users className="h-3.5 w-3.5" />}
            tooltip="Median age of residents in the trade area."
          />
          <MetricRow
            label="Bachelor's Degree+"
            value={formatPercent(metrics.bachelor_degree_pct)}
            icon={<GraduationCap className="h-3.5 w-3.5" />}
            tooltip="Percentage of adults with a bachelor's degree or higher."
          />
          <MetricRow
            label="Unemployment"
            value={formatPercent(metrics.unemployment_rate)}
            icon={<Briefcase className="h-3.5 w-3.5" />}
            tooltip="Current unemployment rate in the trade area."
          />
        </div>
      </div>

      {/* Housing Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Housing
        </h3>
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <MetricRow
            label="Median Home Value"
            value={formatCurrency(metrics.median_home_value)}
            icon={<Home className="h-3.5 w-3.5" />}
            tooltip="Median value of owner-occupied housing units."
          />
          <MetricRow
            label="Owner Occupied"
            value={formatPercent(metrics.owner_occupied_pct)}
            icon={<Building2 className="h-3.5 w-3.5" />}
            tooltip="Percentage of housing units that are owner-occupied vs. rented."
          />
          <MetricRow
            label="Vacancy Rate"
            value={formatPercent(metrics.vacancy_rate)}
            icon={<Clock className="h-3.5 w-3.5" />}
            tooltip="Percentage of housing units currently vacant."
          />
        </div>
      </div>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  tooltip?: string;
}

function MetricRow({ label, value, icon, tooltip }: MetricRowProps) {
  const content = (
    <div className="flex items-center justify-between group cursor-help hover:bg-muted/50 -mx-2 px-2 py-1 rounded transition-colors">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground tabular-nums">
        {value}
      </span>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent
            side="left"
            className="max-w-xs bg-popover text-popover-foreground"
          >
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
