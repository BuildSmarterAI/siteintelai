import { Info, TrendingUp, Briefcase, DollarSign, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IndexItem {
  name: string;
  value: number | null | undefined;
  description: string;
}

interface SiteIntelIndexCardProps {
  growthPotentialIndex?: number | null;
  retailSpendingIndex?: number | null;
  workforceAvailabilityScore?: number | null;
  affluenceConcentration?: number | null;
  className?: string;
}

const SITEINTEL_INDICES: {
  key: keyof Omit<SiteIntelIndexCardProps, "className">;
  label: string;
  description: string;
  icon: typeof TrendingUp;
}[] = [
  {
    key: "growthPotentialIndex",
    label: "Growth Potential",
    description:
      "Composite score (0-100) measuring population growth trajectory, economic indicators, and development momentum in the trade area.",
    icon: TrendingUp,
  },
  {
    key: "retailSpendingIndex",
    label: "Retail Spending",
    description:
      "Index comparing local retail expenditure to national average (100 = average). Higher values indicate stronger consumer spending power.",
    icon: DollarSign,
  },
  {
    key: "workforceAvailabilityScore",
    label: "Workforce Availability",
    description:
      "Score (0-100) measuring labor pool depth, unemployment rate, and commute patterns to assess hiring potential.",
    icon: Briefcase,
  },
  {
    key: "affluenceConcentration",
    label: "Affluence Concentration",
    description:
      "Index measuring concentration of high-income households relative to regional average. Higher values indicate greater purchasing power.",
    icon: Sparkles,
  },
];

function getScoreColor(value: number): string {
  if (value >= 70) return "text-status-success";
  if (value >= 40) return "text-status-warning";
  return "text-status-error";
}

function getScoreBg(value: number): string {
  if (value >= 70) return "bg-status-success/10";
  if (value >= 40) return "bg-status-warning/10";
  return "bg-status-error/10";
}

export function SiteIntelIndexCard({
  growthPotentialIndex,
  retailSpendingIndex,
  workforceAvailabilityScore,
  affluenceConcentration,
  className,
}: SiteIntelIndexCardProps) {
  const values: Record<string, number | null | undefined> = {
    growthPotentialIndex,
    retailSpendingIndex,
    workforceAvailabilityScore,
    affluenceConcentration,
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-gradient-to-br from-midnight-blue/5 to-midnight-blue/10 p-4",
        "border-midnight-blue/20 shadow-soft",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            SiteIntel™ Indices
          </h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs bg-popover text-popover-foreground"
              >
                <p className="text-sm">
                  Proprietary indices calculated by SiteIntel™ using census,
                  economic, and geospatial data. Scores are normalized 0-100.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SITEINTEL_INDICES.map(({ key, label, description, icon: Icon }) => {
          const value = values[key];
          const displayValue = value != null ? Math.round(value) : null;

          return (
            <TooltipProvider key={key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "group relative rounded-md p-3 transition-all duration-200",
                      "hover:shadow-soft hover:-translate-y-0.5 cursor-help",
                      displayValue != null
                        ? getScoreBg(displayValue)
                        : "bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon
                        className={cn(
                          "h-3.5 w-3.5",
                          displayValue != null
                            ? getScoreColor(displayValue)
                            : "text-muted-foreground"
                        )}
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        {label}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "text-xl font-bold tabular-nums",
                        displayValue != null
                          ? getScoreColor(displayValue)
                          : "text-muted-foreground"
                      )}
                    >
                      {displayValue ?? "—"}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs bg-popover text-popover-foreground"
                >
                  <p className="text-sm font-medium mb-1">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}
