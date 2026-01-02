/**
 * SiteIntel™ Design Mode - Metrics Bar
 * 
 * Real-time display of design metrics.
 * Updates in <100ms per PRD requirements.
 */

import { useDesignStore } from "@/stores/useDesignStore";
import { formatNumber, formatSqFt } from "@/lib/designMetrics";
import { cn } from "@/lib/utils";
import { 
  Building2, 
  Layers, 
  Maximize2, 
  ArrowUpFromLine,
  Target
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  progress?: number;
  progressColor?: "default" | "warning" | "danger";
  tooltip?: string;
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  subValue, 
  progress, 
  progressColor = "default",
  tooltip 
}: MetricCardProps) {
  const content = (
    <div className="bg-card border rounded-lg p-3 min-w-[120px]">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-lg font-semibold text-foreground">
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-muted-foreground">{subValue}</div>
      )}
      {progress !== undefined && (
        <Progress 
          value={Math.min(progress, 100)} 
          className={cn(
            "h-1.5 mt-2",
            progressColor === "warning" && "[&>div]:bg-amber-500",
            progressColor === "danger" && "[&>div]:bg-destructive"
          )}
        />
      )}
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

export function DesignMetricsBar() {
  const { variants, activeVariantId, envelope } = useDesignStore();
  const activeVariant = variants.find(v => v.id === activeVariantId);

  if (!activeVariant || !envelope) {
    return (
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
        <span className="text-sm text-muted-foreground">
          Select or create a variant to see metrics
        </span>
      </div>
    );
  }

  const metrics = activeVariant.metrics;
  
  if (!metrics) {
    return (
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
        <span className="text-sm text-muted-foreground">
          Draw a footprint to calculate metrics
        </span>
      </div>
    );
  }

  const getProgressColor = (pct: number): "default" | "warning" | "danger" => {
    if (pct > 100) return "danger";
    if (pct > 90) return "warning";
    return "default";
  };

  return (
    <div className="flex flex-wrap gap-3">
      <MetricCard
        icon={<Building2 className="h-3.5 w-3.5" />}
        label="Gross Floor Area"
        value={formatSqFt(metrics.grossFloorAreaSf)}
        subValue={`${formatNumber(metrics.footprintSf)} SF footprint`}
        tooltip="Total floor area across all stories"
      />

      <MetricCard
        icon={<Layers className="h-3.5 w-3.5" />}
        label="FAR Used"
        value={metrics.farUsed.toFixed(2)}
        subValue={`${metrics.farUsedPct}% of ${envelope.farCap} max`}
        progress={metrics.farUsedPct}
        progressColor={getProgressColor(metrics.farUsedPct)}
        tooltip="Floor Area Ratio: GFA ÷ Lot Area"
      />

      <MetricCard
        icon={<Maximize2 className="h-3.5 w-3.5" />}
        label="Lot Coverage"
        value={`${metrics.coveragePct}%`}
        subValue={`of ${envelope.coverageCapPct}% max`}
        progress={(metrics.coveragePct / envelope.coverageCapPct) * 100}
        progressColor={getProgressColor((metrics.coveragePct / envelope.coverageCapPct) * 100)}
        tooltip="Footprint area ÷ Parcel area"
      />

      <MetricCard
        icon={<ArrowUpFromLine className="h-3.5 w-3.5" />}
        label="Height Used"
        value={`${activeVariant.heightFt}'`}
        subValue={`${metrics.heightUsedPct}% of ${envelope.heightCapFt}' max`}
        progress={metrics.heightUsedPct}
        progressColor={getProgressColor(metrics.heightUsedPct)}
        tooltip="Building height vs maximum allowed"
      />

      <MetricCard
        icon={<Target className="h-3.5 w-3.5" />}
        label="Envelope Use"
        value={`${metrics.envelopeUtilizationPct}%`}
        subValue="of buildable area"
        progress={metrics.envelopeUtilizationPct}
        tooltip="How much of the buildable envelope is used"
      />
    </div>
  );
}
