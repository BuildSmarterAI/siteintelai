/**
 * SiteIntel™ Design Mode - Compliance Dock (Google Earth Style)
 * 
 * Floating right panel that can be collapsed to a pill or expanded to a card.
 * Shows compliance status and "Fix it" actions.
 */

import { useState } from "react";
import { useDesignStore } from "@/stores/useDesignStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Wrench,
  ArrowDownToLine,
  Minus,
  Maximize2,
} from "lucide-react";

interface ComplianceDockProps {
  className?: string;
}

export function ComplianceDock({ className }: ComplianceDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { variants, activeVariantId, envelope, updateVariant } = useDesignStore();
  
  const activeVariant = variants.find((v) => v.id === activeVariantId);
  const complianceResult = activeVariant?.complianceResult;
  const overallStatus = activeVariant?.complianceStatus || "PENDING";

  const statusConfig = {
    PASS: {
      label: "Compliant",
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-500",
      pillBg: "bg-green-500/10 border-green-500/30",
    },
    WARN: {
      label: "Warning",
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500",
      pillBg: "bg-amber-500/10 border-amber-500/30",
    },
    FAIL: {
      label: "Violation",
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive",
      pillBg: "bg-destructive/10 border-destructive/30",
    },
    PENDING: {
      label: "Pending",
      icon: Shield,
      color: "text-muted-foreground",
      bg: "bg-muted-foreground",
      pillBg: "bg-muted/50 border-muted-foreground/30",
    },
  };

  const config = statusConfig[overallStatus];
  const StatusIcon = config.icon;

  // Fix actions
  const handleClampHeight = () => {
    if (!activeVariant || !envelope) return;
    updateVariant(activeVariant.id, { heightFt: envelope.heightCapFt });
  };

  const handleReduceFloors = () => {
    if (!activeVariant) return;
    const newFloors = Math.max(1, activeVariant.floors - 1);
    updateVariant(activeVariant.id, { floors: newFloors });
  };

  const handleFitToEnvelope = () => {
    if (!activeVariant || !envelope) return;
    updateVariant(activeVariant.id, {
      footprint: envelope.buildableFootprint2d,
    });
  };

  // Top 3 issues
  const topIssues = complianceResult?.checks
    .filter((c) => c.status !== "PASS")
    .slice(0, 3) || [];

  return (
    <div className={cn("fixed top-20 right-4 z-40", className)}>
      {/* Collapsed Pill */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-lg transition-all hover:shadow-xl",
            "bg-background/95 backdrop-blur-md",
            config.pillBg
          )}
        >
          <StatusIcon className={cn("h-4 w-4", config.color)} />
          <span className={cn("text-sm font-medium", config.color)}>
            {config.label}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* Expanded Card */}
      {isExpanded && (
        <div className="w-80 bg-background/95 backdrop-blur-md border shadow-xl rounded-xl overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setIsExpanded(false)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Compliance</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn("text-xs", config.color)}
              >
                <span className={cn("w-2 h-2 rounded-full mr-2", config.bg)} />
                {config.label}
              </Badge>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>

          {/* Content */}
          <ScrollArea className="max-h-[400px]">
            <div className="p-4 space-y-4">
              {!complianceResult ? (
                <div className="text-sm text-muted-foreground text-center py-6">
                  Draw a design footprint to check compliance
                </div>
              ) : (
                <>
                  {/* Status Overview */}
                  <div className="grid grid-cols-3 gap-2">
                    {complianceResult.checks.map((check) => {
                      const checkConfig = statusConfig[check.status];
                      const CheckIcon = checkConfig.icon;
                      return (
                        <div
                          key={check.id}
                          className={cn(
                            "flex flex-col items-center p-2 rounded-lg border text-center",
                            check.status === "PASS"
                              ? "bg-green-500/5 border-green-500/20"
                              : check.status === "WARN"
                              ? "bg-amber-500/5 border-amber-500/20"
                              : check.status === "FAIL"
                              ? "bg-destructive/5 border-destructive/20"
                              : "bg-muted/50 border-muted"
                          )}
                        >
                          <CheckIcon
                            className={cn("h-4 w-4 mb-1", checkConfig.color)}
                          />
                          <span className="text-xs font-medium truncate w-full">
                            {check.name.split(" ")[0]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(check.currentValue)}/{check.limitValue}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Top Issues */}
                  {topIssues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Issues
                      </h4>
                      {topIssues.map((issue) => {
                        const issueConfig = statusConfig[issue.status];
                        const IssueIcon = issueConfig.icon;
                        return (
                          <div
                            key={issue.id}
                            className={cn(
                              "flex items-start gap-2 p-2 rounded-lg text-sm",
                              issue.status === "WARN"
                                ? "bg-amber-500/5"
                                : "bg-destructive/5"
                            )}
                          >
                            <IssueIcon
                              className={cn(
                                "h-4 w-4 mt-0.5 flex-shrink-0",
                                issueConfig.color
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{issue.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {issue.message}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fix Actions */}
                  {(overallStatus === "WARN" || overallStatus === "FAIL") && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5" />
                        Quick Fixes
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start h-9"
                          onClick={handleClampHeight}
                        >
                          <ArrowDownToLine className="h-4 w-4 mr-2" />
                          Clamp to Max Height ({envelope?.heightCapFt}')
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start h-9"
                          onClick={handleReduceFloors}
                        >
                          <Minus className="h-4 w-4 mr-2" />
                          Reduce Floors
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start h-9"
                          onClick={handleFitToEnvelope}
                        >
                          <Maximize2 className="h-4 w-4 mr-2" />
                          Fit to Envelope
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Last checked */}
                  <div className="text-xs text-muted-foreground text-right pt-2 border-t">
                    Last checked:{" "}
                    {new Date(complianceResult.checkedAt).toLocaleTimeString()}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
