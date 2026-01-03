/**
 * SiteIntel™ Design Mode - Sticky Compliance Banner
 * 
 * Always-visible PASS/WARN/FAIL status with aggressive visual feedback.
 * Per UX spec: Sticky at top of right rail, blocks export on FAIL.
 */

import { useDesignStore } from "@/stores/useDesignStore";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  ChevronDown,
  ZoomIn,
  Wrench,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ComplianceBannerProps {
  onZoomToIssue?: () => void;
  onViewAll?: () => void;
  className?: string;
}

export function ComplianceBanner({ 
  onZoomToIssue,
  onViewAll,
  className 
}: ComplianceBannerProps) {
  const { variants, activeVariantId, envelope, updateVariant } = useDesignStore();
  const activeVariant = variants.find(v => v.id === activeVariantId);

  const complianceResult = activeVariant?.complianceResult;
  const status = activeVariant?.complianceStatus || "PENDING";

  // Calculate threshold meters
  const thresholds = envelope && activeVariant?.metrics ? [
    {
      id: "far",
      label: "FAR",
      current: activeVariant.metrics.farUsed || 0,
      max: envelope.farCap,
      unit: "",
    },
    {
      id: "height",
      label: "Height",
      current: activeVariant.heightFt,
      max: envelope.heightCapFt,
      unit: "'",
    },
    {
      id: "coverage",
      label: "Coverage",
      current: activeVariant.metrics.coveragePct || 0,
      max: envelope.coverageCapPct,
      unit: "%",
    },
  ] : [];

  // Auto-fix actions
  const autoFixes = [
    {
      id: "clamp_height",
      label: "Clamp height to max",
      description: `Reduce to ${envelope?.heightCapFt}'`,
      enabled: activeVariant && envelope && activeVariant.heightFt > envelope.heightCapFt,
      apply: () => {
        if (activeVariant && envelope) {
          updateVariant(activeVariant.id, { heightFt: envelope.heightCapFt });
        }
      },
    },
    {
      id: "reduce_floors",
      label: "Reduce floors",
      description: "Lower floor count to satisfy FAR",
      enabled: activeVariant && activeVariant.floors > 1 && 
        activeVariant.metrics?.farUsed && envelope?.farCap &&
        activeVariant.metrics.farUsed > envelope.farCap,
      apply: () => {
        if (activeVariant) {
          updateVariant(activeVariant.id, { floors: Math.max(1, activeVariant.floors - 1) });
        }
      },
    },
  ];

  const availableFixes = autoFixes.filter(f => f.enabled);

  const statusConfig = {
    PASS: {
      icon: CheckCircle2,
      label: "Compliant",
      message: "All constraints satisfied",
      bgClass: "bg-[hsl(var(--design-status-pass)_/_0.1)]",
      borderClass: "border-[hsl(var(--design-status-pass)_/_0.3)]",
      textClass: "text-[hsl(var(--design-status-pass))]",
      iconClass: "text-[hsl(var(--design-status-pass))]",
    },
    WARN: {
      icon: AlertTriangle,
      label: "Warning",
      message: complianceResult?.checks.find(c => c.status === "WARN")?.message || "Close to limit",
      bgClass: "bg-[hsl(var(--design-status-warn)_/_0.1)]",
      borderClass: "border-[hsl(var(--design-status-warn)_/_0.3)]",
      textClass: "text-[hsl(var(--design-status-warn))]",
      iconClass: "text-[hsl(var(--design-status-warn))]",
    },
    FAIL: {
      icon: XCircle,
      label: "Violation",
      message: complianceResult?.violations[0] || "Constraint exceeded",
      bgClass: "bg-[hsl(var(--design-status-fail)_/_0.1)]",
      borderClass: "border-[hsl(var(--design-status-fail)_/_0.3)]",
      textClass: "text-[hsl(var(--design-status-fail))]",
      iconClass: "text-[hsl(var(--design-status-fail))]",
    },
    PENDING: {
      icon: Loader2,
      label: "Pending",
      message: "Draw a footprint to check compliance",
      bgClass: "bg-muted/50",
      borderClass: "border-border",
      textClass: "text-muted-foreground",
      iconClass: "text-muted-foreground animate-spin",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        "rounded-lg border p-3 transition-all",
        config.bgClass,
        config.borderClass,
        status === "FAIL" && "animate-[compliance-pulse_0.5s_ease-in-out_2]",
        className
      )}
    >
      {/* Main Status Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon className={cn("h-5 w-5 flex-shrink-0", config.iconClass)} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={cn("text-xs font-semibold", config.textClass)}
              >
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground truncate">
                {config.message}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {status === "FAIL" && onZoomToIssue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomToIssue}
              className="h-7 text-xs gap-1"
            >
              <ZoomIn className="h-3 w-3" />
              Zoom
            </Button>
          )}

          {(status === "WARN" || status === "FAIL") && availableFixes.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("h-7 text-xs gap-1", config.textClass)}
                >
                  <Wrench className="h-3 w-3" />
                  Fix
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {availableFixes.map((fix) => (
                  <DropdownMenuItem 
                    key={fix.id}
                    onClick={fix.apply}
                    className="flex flex-col items-start gap-0.5"
                  >
                    <span className="font-medium">{fix.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {fix.description}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {onViewAll && status !== "PENDING" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="h-7 text-xs"
            >
              View all
            </Button>
          )}
        </div>
      </div>

      {/* Threshold Meters - Show when WARN or has data */}
      {thresholds.length > 0 && status !== "PENDING" && (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {thresholds.map((t) => {
            const percent = (t.current / t.max) * 100;
            const isNearLimit = percent >= 90 && percent < 100;
            const isOverLimit = percent > 100;

            return (
              <div key={t.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t.label}</span>
                  <span className={cn(
                    "font-mono",
                    isOverLimit && "text-[hsl(var(--design-status-fail))] font-semibold",
                    isNearLimit && "text-[hsl(var(--design-status-warn))]",
                    !isNearLimit && !isOverLimit && "text-foreground"
                  )}>
                    {typeof t.current === "number" 
                      ? t.current.toFixed(t.id === "far" ? 2 : 0) 
                      : t.current}
                    {t.unit}/{t.max}{t.unit}
                  </span>
                </div>
                <Progress 
                  value={Math.min(percent, 100)} 
                  className={cn(
                    "h-1.5",
                    isOverLimit && "[&>div]:bg-[hsl(var(--design-status-fail))]",
                    isNearLimit && "[&>div]:bg-[hsl(var(--design-status-warn))]",
                    !isNearLimit && !isOverLimit && "[&>div]:bg-[hsl(var(--design-status-pass))]"
                  )}
                />
                {isNearLimit && (
                  <span className="text-[10px] text-[hsl(var(--design-status-warn))]">
                    Near limit
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
