/**
 * SiteIntel™ Design Mode - Metrics Chips Bar (Google Earth Style)
 * 
 * Compact horizontal chip row for key metrics, anchored to bottom-left.
 * Chips are clickable and show tooltips.
 */

import { useDesignStore } from "@/stores/useDesignStore";
import { formatNumber, formatSqFt } from "@/lib/designMetrics";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  Layers,
  Maximize2,
  ArrowUpFromLine,
  Target,
} from "lucide-react";

interface MetricChipProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
  progress?: number;
  status?: "normal" | "warning" | "danger";
}

function MetricChip({
  icon,
  label,
  value,
  detail,
  progress,
  status = "normal",
}: MetricChipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all hover:shadow-md",
              "bg-background/95 backdrop-blur-md shadow-lg",
              status === "warning" && "border-amber-500/30",
              status === "danger" && "border-destructive/30"
            )}
          >
            <div className="text-muted-foreground">{icon}</div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground leading-none">
                {label}
              </span>
              <span
                className={cn(
                  "font-semibold text-sm leading-tight",
                  status === "warning" && "text-amber-600 dark:text-amber-400",
                  status === "danger" && "text-destructive"
                )}
              >
                {value}
              </span>
            </div>
            {progress !== undefined && (
              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    status === "warning"
                      ? "bg-amber-500"
                      : status === "danger"
                      ? "bg-destructive"
                      : "bg-primary"
                  )}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{label}</p>
            {detail && (
              <p className="text-xs text-muted-foreground">{detail}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface MetricsChipsBarProps {
  className?: string;
}

export function MetricsChipsBar({ className }: MetricsChipsBarProps) {
  const { variants, activeVariantId, envelope } = useDesignStore();
  const activeVariant = variants.find((v) => v.id === activeVariantId);

  if (!activeVariant || !envelope) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-lg border",
          "bg-background/95 backdrop-blur-md shadow-lg",
          className
        )}
      >
        <span className="text-sm text-muted-foreground">
          Select a variant to see metrics
        </span>
      </div>
    );
  }

  const metrics = activeVariant.metrics;

  if (!metrics) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-lg border",
          "bg-background/95 backdrop-blur-md shadow-lg",
          className
        )}
      >
        <span className="text-sm text-muted-foreground">
          Draw a footprint to calculate metrics
        </span>
      </div>
    );
  }

  const getStatus = (pct: number): "normal" | "warning" | "danger" => {
    if (pct > 100) return "danger";
    if (pct > 90) return "warning";
    return "normal";
  };

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <MetricChip
        icon={<Building2 className="h-4 w-4" />}
        label="GFA"
        value={formatSqFt(metrics.grossFloorAreaSf)}
        detail={`${formatNumber(metrics.footprintSf)} SF footprint × ${activeVariant.floors} floors`}
      />

      <MetricChip
        icon={<Layers className="h-4 w-4" />}
        label="FAR"
        value={metrics.farUsed.toFixed(2)}
        detail={`${metrics.farUsedPct}% of ${envelope.farCap} maximum`}
        progress={metrics.farUsedPct}
        status={getStatus(metrics.farUsedPct)}
      />

      <MetricChip
        icon={<Maximize2 className="h-4 w-4" />}
        label="Coverage"
        value={`${metrics.coveragePct}%`}
        detail={`of ${envelope.coverageCapPct}% maximum allowed`}
        progress={(metrics.coveragePct / envelope.coverageCapPct) * 100}
        status={getStatus((metrics.coveragePct / envelope.coverageCapPct) * 100)}
      />

      <MetricChip
        icon={<ArrowUpFromLine className="h-4 w-4" />}
        label="Height"
        value={`${activeVariant.heightFt}'`}
        detail={`${metrics.heightUsedPct}% of ${envelope.heightCapFt}' maximum`}
        progress={metrics.heightUsedPct}
        status={getStatus(metrics.heightUsedPct)}
      />

      <MetricChip
        icon={<Target className="h-4 w-4" />}
        label="Envelope"
        value={`${metrics.envelopeUtilizationPct}%`}
        detail="Utilization of buildable envelope area"
        progress={metrics.envelopeUtilizationPct}
      />
    </div>
  );
}
