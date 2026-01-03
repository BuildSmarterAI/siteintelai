/**
 * SiteIntel™ Design Mode - Map Micro Overlay
 * 
 * Always-visible compact overlay showing top 3 metrics + top 3 constraints.
 * Per UX spec: Anchored top-left of map, semi-transparent.
 */

import { useDesignStore } from "@/stores/useDesignStore";
import { cn } from "@/lib/utils";
import { formatSqFt } from "@/lib/designMetrics";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface MapMicroOverlayProps {
  className?: string;
}

export function MapMicroOverlay({ className }: MapMicroOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { variants, activeVariantId, envelope } = useDesignStore();
  const activeVariant = variants.find(v => v.id === activeVariantId);

  if (!activeVariant || !envelope) {
    return null;
  }

  const metrics = activeVariant.metrics;
  const status = activeVariant.complianceStatus;

  // Calculate percentages
  const farPct = metrics?.farUsed ? (metrics.farUsed / envelope.farCap) * 100 : 0;
  const heightPct = (activeVariant.heightFt / envelope.heightCapFt) * 100;
  const coveragePct = metrics?.coveragePct 
    ? (metrics.coveragePct / envelope.coverageCapPct) * 100 
    : 0;

  const statusColors = {
    PASS: "bg-[hsl(var(--design-status-pass))]",
    WARN: "bg-[hsl(var(--design-status-warn))]",
    FAIL: "bg-[hsl(var(--design-status-fail))]",
    PENDING: "bg-muted-foreground",
  };

  const statusLabels = {
    PASS: "Compliant",
    WARN: "Near Limit",
    FAIL: "Violation",
    PENDING: "Pending",
  };

  return (
    <div 
      className={cn(
        "absolute top-3 left-3 z-10",
        "bg-card/90 backdrop-blur-sm border rounded-lg shadow-lg",
        "transition-all duration-200",
        isExpanded ? "w-64" : "w-48",
        className
      )}
    >
      {/* Compact Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2.5 hover:bg-muted/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", statusColors[status])} />
          <span className="text-xs font-medium">{statusLabels[status]}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Metrics Grid */}
      <div className={cn(
        "px-2.5 pb-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5",
        !isExpanded && "text-xs"
      )}>
        {/* GFA */}
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground text-[10px]">GFA</span>
          <span className="font-mono font-medium text-xs">
            {metrics ? formatSqFt(metrics.grossFloorAreaSf) : "—"}
          </span>
        </div>

        {/* FAR */}
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground text-[10px]">FAR</span>
          <span className={cn(
            "font-mono font-medium text-xs",
            farPct > 100 && "text-[hsl(var(--design-status-fail))]",
            farPct >= 90 && farPct <= 100 && "text-[hsl(var(--design-status-warn))]"
          )}>
            {metrics?.farUsed?.toFixed(2) || "—"}/{envelope.farCap}
          </span>
        </div>

        {/* Height */}
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground text-[10px]">Height</span>
          <span className={cn(
            "font-mono font-medium text-xs",
            heightPct > 100 && "text-[hsl(var(--design-status-fail))]",
            heightPct >= 90 && heightPct <= 100 && "text-[hsl(var(--design-status-warn))]"
          )}>
            {activeVariant.heightFt}'/{envelope.heightCapFt}'
          </span>
        </div>

        {/* Coverage */}
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground text-[10px]">Coverage</span>
          <span className={cn(
            "font-mono font-medium text-xs",
            coveragePct > 100 && "text-[hsl(var(--design-status-fail))]",
            coveragePct >= 90 && coveragePct <= 100 && "text-[hsl(var(--design-status-warn))]"
          )}>
            {metrics?.coveragePct?.toFixed(0) || "—"}%/{envelope.coverageCapPct}%
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-2.5 pb-2.5 pt-1 border-t space-y-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Floors</span>
            <span className="font-medium">{activeVariant.floors}</span>
          </div>
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Footprint</span>
            <span className="font-medium">
              {metrics ? formatSqFt(metrics.footprintSf) : "—"}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Envelope Util</span>
            <span className="font-medium">
              {metrics?.envelopeUtilizationPct?.toFixed(0) || "—"}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
