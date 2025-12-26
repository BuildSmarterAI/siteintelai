import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface DataCoverageBadgeProps {
  coverage: number;
  hexCount?: number;
  source?: string;
  className?: string;
}

export function DataCoverageBadge({
  coverage,
  hexCount,
  source = "Census",
  className,
}: DataCoverageBadgeProps) {
  const getCoverageColor = (value: number) => {
    if (value >= 80) return "bg-status-success";
    if (value >= 50) return "bg-status-warning";
    return "bg-status-error";
  };

  const getCoverageGradient = (value: number) => {
    if (value >= 80) return "from-status-success to-data-cyan";
    if (value >= 50) return "from-status-warning to-feasibility-orange";
    return "from-status-error to-destructive";
  };

  return (
    <div className={cn("rounded-lg border bg-card p-3", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Data Coverage
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs bg-popover text-popover-foreground"
              >
                <p className="text-sm">
                  Percentage of requested metrics successfully retrieved from{" "}
                  {source} and other data sources for this trade area.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span
          className={cn(
            "text-sm font-bold tabular-nums",
            coverage >= 80
              ? "text-status-success"
              : coverage >= 50
              ? "text-status-warning"
              : "text-status-error"
          )}
        >
          {coverage}%
        </span>
      </div>

      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-500",
            getCoverageGradient(coverage)
          )}
          style={{ width: `${coverage}%` }}
        />
      </div>

      {hexCount != null && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="h-2 w-2 rounded bg-data-cyan/60" />
          <span className="text-xs text-muted-foreground">
            {hexCount} hexagons ({source})
          </span>
        </div>
      )}
    </div>
  );
}
