import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { TradeAreaMetrics } from "@/hooks/useTradeAreaMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DemographicBreakdownChartProps {
  metrics: TradeAreaMetrics | null;
  isLoading?: boolean;
}

// Using CSS variable colors via getComputedStyle would be ideal, but for Recharts we use HSL values
const COLORS = {
  dataCyan: "hsl(189, 94%, 43%)", // --data-cyan
  accent: "hsl(27, 100%, 50%)", // --feasibility-orange
  primary: "hsl(229, 67%, 11%)", // --midnight-blue
  muted: "hsl(215, 19%, 45%)", // --mid-gray
};

export function DemographicBreakdownChart({
  metrics,
  isLoading,
}: DemographicBreakdownChartProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  // Education breakdown data
  const educationData = [
    {
      name: "Bachelor's+",
      value: metrics.bachelor_degree_pct || 0,
      color: COLORS.dataCyan,
    },
    {
      name: "Workforce",
      value: metrics.workforce_availability_score || 0,
      color: COLORS.accent,
    },
    {
      name: "Labor Pool",
      value: metrics.labor_pool_depth || 0,
      color: COLORS.primary,
    },
  ];

  // Housing data
  const housingData = [
    { name: "Owner", value: metrics.owner_occupied_pct || 0 },
    { name: "Renter", value: metrics.renter_occupied_pct || 0 },
    { name: "Vacant", value: metrics.vacancy_rate || 0 },
  ];

  const customTooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.12)",
    padding: "8px 12px",
  };

  return (
    <div className="space-y-4">
      {/* Workforce & Education */}
      <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-foreground">
            Workforce & Education Indices
          </h4>
          <TooltipProvider>
            <UITooltip>
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
                  Comparative indices showing educational attainment, workforce
                  readiness, and labor pool depth in the trade area.
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={educationData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={customTooltipStyle}
                formatter={(value: number) => [
                  `${value.toFixed(1)}`,
                  "Score",
                ]}
                cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {educationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          {educationData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Housing Tenure */}
      <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-foreground">
            Housing Tenure Distribution
          </h4>
          <TooltipProvider>
            <UITooltip>
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
                  Distribution of housing units by ownership status. High
                  owner-occupied rates often indicate stable, established
                  neighborhoods.
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={housingData}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={customTooltipStyle}
                formatter={(value: number) => [
                  `${value.toFixed(1)}%`,
                  "Percentage",
                ]}
                cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
              />
              <Bar
                dataKey="value"
                fill={COLORS.dataCyan}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
