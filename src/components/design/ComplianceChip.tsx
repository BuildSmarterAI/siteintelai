/**
 * SiteIntel™ Design Mode - Collapsible Compliance Chip
 * 
 * Single compact chip showing overall compliance status.
 * Expands to show detailed metrics on click.
 */

import { useState } from "react";
import { useDesignStore } from "@/stores/useDesignStore";
import { formatNumber, formatSqFt } from "@/lib/designMetrics";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  Layers,
  Maximize2,
  ArrowUpFromLine,
  Target,
} from "lucide-react";

interface ComplianceChipProps {
  className?: string;
}

export function ComplianceChip({ className }: ComplianceChipProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { variants, activeVariantId, envelope } = useDesignStore();
  const activeVariant = variants.find((v) => v.id === activeVariantId);

  // No variant or envelope - show placeholder
  if (!activeVariant || !envelope) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-full border",
          "bg-background/95 backdrop-blur-md shadow-lg",
          className
        )}
      >
        <span className="text-sm text-muted-foreground">
          Select a variant
        </span>
      </div>
    );
  }

  const metrics = activeVariant.metrics;
  const status = activeVariant.complianceStatus;

  // Determine status display
  const statusConfig = {
    PASS: {
      icon: CheckCircle2,
      label: "Compliant",
      bgColor: "bg-green-500/10 border-green-500/30",
      textColor: "text-green-600 dark:text-green-400",
    },
    WARN: {
      icon: AlertTriangle,
      label: "Warning",
      bgColor: "bg-amber-500/10 border-amber-500/30",
      textColor: "text-amber-600 dark:text-amber-400",
    },
    FAIL: {
      icon: XCircle,
      label: "Non-Compliant",
      bgColor: "bg-destructive/10 border-destructive/30",
      textColor: "text-destructive",
    },
    PENDING: {
      icon: Target,
      label: "Draw footprint",
      bgColor: "bg-muted border-border",
      textColor: "text-muted-foreground",
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  // Helper for metric status
  const getMetricStatus = (pct: number): "normal" | "warning" | "danger" => {
    if (pct > 100) return "danger";
    if (pct > 90) return "warning";
    return "normal";
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className={cn(
          "bg-background/95 backdrop-blur-md shadow-lg rounded-xl border overflow-hidden transition-all",
          className
        )}
      >
        {/* Collapsed header - always visible */}
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full flex items-center justify-between gap-2 px-3 py-2 h-auto rounded-xl",
              config.bgColor
            )}
          >
            <div className="flex items-center gap-2">
              <StatusIcon className={cn("h-4 w-4", config.textColor)} />
              <span className={cn("text-sm font-medium", config.textColor)}>
                {config.label}
              </span>
              {metrics && status !== "PENDING" && (
                <span className="text-xs text-muted-foreground">
                  • {formatSqFt(metrics.grossFloorAreaSf)} GFA
                </span>
              )}
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>

        {/* Expanded content */}
        <CollapsibleContent>
          {metrics && (
            <div className="px-3 pb-3 pt-1 space-y-2">
              {/* Metric rows */}
              <MetricRow
                icon={<Building2 className="h-3.5 w-3.5" />}
                label="GFA"
                value={formatSqFt(metrics.grossFloorAreaSf)}
                detail={`${formatNumber(metrics.footprintSf)} SF × ${activeVariant.floors} floors`}
              />
              <MetricRow
                icon={<Layers className="h-3.5 w-3.5" />}
                label="FAR"
                value={metrics.farUsed.toFixed(2)}
                progress={metrics.farUsedPct}
                status={getMetricStatus(metrics.farUsedPct)}
                detail={`of ${envelope.farCap} max`}
              />
              <MetricRow
                icon={<Maximize2 className="h-3.5 w-3.5" />}
                label="Coverage"
                value={`${metrics.coveragePct}%`}
                progress={(metrics.coveragePct / envelope.coverageCapPct) * 100}
                status={getMetricStatus((metrics.coveragePct / envelope.coverageCapPct) * 100)}
                detail={`of ${envelope.coverageCapPct}% max`}
              />
              <MetricRow
                icon={<ArrowUpFromLine className="h-3.5 w-3.5" />}
                label="Height"
                value={`${activeVariant.heightFt}'`}
                progress={metrics.heightUsedPct}
                status={getMetricStatus(metrics.heightUsedPct)}
                detail={`of ${envelope.heightCapFt}' max`}
              />
              <MetricRow
                icon={<Target className="h-3.5 w-3.5" />}
                label="Envelope"
                value={`${metrics.envelopeUtilizationPct}%`}
                progress={metrics.envelopeUtilizationPct}
                detail="utilization"
              />
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface MetricRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
  progress?: number;
  status?: "normal" | "warning" | "danger";
}

function MetricRow({ icon, label, value, detail, progress, status = "normal" }: MetricRowProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="text-muted-foreground">{icon}</div>
      <span className="text-muted-foreground w-16">{label}</span>
      <span
        className={cn(
          "font-medium",
          status === "warning" && "text-amber-600 dark:text-amber-400",
          status === "danger" && "text-destructive"
        )}
      >
        {value}
      </span>
      {progress !== undefined && (
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-16">
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
      {detail && (
        <span className="text-xs text-muted-foreground">{detail}</span>
      )}
    </div>
  );
}
