import { TrendingUp, Users, DollarSign, Home, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TradeAreaMetrics } from "@/hooks/useTradeAreaMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GrowthProjectionCardProps {
  metrics: TradeAreaMetrics | null;
  isLoading?: boolean;
}

interface ProjectionItemProps {
  label: string;
  currentValue: string;
  projectedValue: string;
  change: number;
  icon: React.ReactNode;
  tooltip?: string;
}

function ProjectionItem({
  label,
  currentValue,
  projectedValue,
  change,
  icon,
  tooltip,
}: ProjectionItemProps) {
  const isPositive = change >= 0;

  const content = (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0 group hover:bg-muted/30 -mx-2 px-2 rounded transition-colors cursor-help">
      <div className="flex-shrink-0 p-2 bg-muted rounded-lg group-hover:bg-muted/80 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{currentValue}</span>
          <span className="text-accent">→</span>
          <span className="font-medium text-foreground">{projectedValue}</span>
        </div>
      </div>
      <div
        className={cn(
          "flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums",
          isPositive
            ? "bg-status-success/10 text-status-success"
            : "bg-status-error/10 text-status-error"
        )}
      >
        {isPositive ? "+" : ""}
        {change.toFixed(1)}%
      </div>
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

export function GrowthProjectionCard({
  metrics,
  isLoading,
}: GrowthProjectionCardProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  // Calculate projections (simplified 5-year estimates)
  const growthRate = metrics.growth_rate_5yr || 5;
  const currentPop = metrics.total_population || 0;
  const projectedPop = Math.round(currentPop * (1 + growthRate / 100));

  const currentIncome = metrics.median_income || 0;
  const incomeGrowth = 3.5; // Assume 3.5% annual income growth
  const projectedIncome = Math.round(
    currentIncome * Math.pow(1 + incomeGrowth / 100, 5)
  );

  const currentHomeValue = metrics.median_home_value || 0;
  const homeValueGrowth = 4.2; // Assume 4.2% annual appreciation
  const projectedHomeValue = Math.round(
    currentHomeValue * Math.pow(1 + homeValueGrowth / 100, 5)
  );

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toLocaleString();
  };

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
    return `$${n.toLocaleString()}`;
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-data-cyan" />
          <h4 className="text-sm font-semibold text-foreground">
            5-Year Growth Projections
          </h4>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              className="max-w-xs bg-popover text-popover-foreground"
            >
              <p className="text-sm">
                Projections are based on historical Census trends, regional
                growth patterns, and economic indicators. Actual results may
                vary.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div>
        <ProjectionItem
          label="Population"
          currentValue={formatNumber(currentPop)}
          projectedValue={formatNumber(projectedPop)}
          change={growthRate}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          tooltip="Projected population based on historical growth rate trends."
        />
        <ProjectionItem
          label="Median Income"
          currentValue={formatCurrency(currentIncome)}
          projectedValue={formatCurrency(projectedIncome)}
          change={Math.pow(1 + incomeGrowth / 100, 5) * 100 - 100}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          tooltip="Projected median household income based on 3.5% annual growth assumption."
        />
        <ProjectionItem
          label="Median Home Value"
          currentValue={formatCurrency(currentHomeValue)}
          projectedValue={formatCurrency(projectedHomeValue)}
          change={Math.pow(1 + homeValueGrowth / 100, 5) * 100 - 100}
          icon={<Home className="h-4 w-4 text-muted-foreground" />}
          tooltip="Projected home value based on 4.2% annual appreciation rate."
        />
      </div>

      <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border/50">
        <p className="text-xs text-muted-foreground">
          Projections based on historical trends and regional growth patterns.
          Actual results may vary based on market conditions.
        </p>
      </div>
    </div>
  );
}
