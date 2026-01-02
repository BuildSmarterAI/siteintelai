/**
 * SiteIntel™ Design Mode - Compliance Panel
 * 
 * Real-time compliance status display.
 * Shows PASS/WARN/FAIL for each check with visual indicators.
 */

import { useDesignStore } from "@/stores/useDesignStore";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Shield
} from "lucide-react";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface ComplianceCheckItemProps {
  name: string;
  status: "PASS" | "WARN" | "FAIL";
  currentValue: number;
  limitValue: number;
  unit: string;
  message: string;
}

function ComplianceCheckItem({
  name,
  status,
  currentValue,
  limitValue,
  unit,
  message,
}: ComplianceCheckItemProps) {
  const statusConfig = {
    PASS: {
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
    },
    WARN: {
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    FAIL: {
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/20",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn(
      "rounded-lg border p-3",
      config.bg,
      config.border
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm">{name}</span>
            <span className="text-xs text-muted-foreground">
              {currentValue} / {limitValue} {unit}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function CompliancePanel() {
  const [isOpen, setIsOpen] = useState(true);
  const { variants, activeVariantId } = useDesignStore();
  const activeVariant = variants.find(v => v.id === activeVariantId);

  const complianceResult = activeVariant?.complianceResult;
  const overallStatus = activeVariant?.complianceStatus || "PENDING";

  const statusConfig = {
    PASS: {
      label: "Compliant",
      color: "bg-green-500",
      textColor: "text-green-600 dark:text-green-400",
    },
    WARN: {
      label: "Warning",
      color: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
    },
    FAIL: {
      label: "Violation",
      color: "bg-destructive",
      textColor: "text-destructive",
    },
    PENDING: {
      label: "Pending",
      color: "bg-muted",
      textColor: "text-muted-foreground",
    },
  };

  const config = statusConfig[overallStatus];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card border rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Compliance Status</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant="secondary"
                className={cn("text-xs", config.textColor)}
              >
                <span className={cn("w-2 h-2 rounded-full mr-2", config.color)} />
                {config.label}
              </Badge>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {!complianceResult ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Draw a design footprint to check compliance
              </div>
            ) : (
              <>
                {complianceResult.checks.map((check) => (
                  <ComplianceCheckItem
                    key={check.id}
                    name={check.name}
                    status={check.status}
                    currentValue={check.currentValue}
                    limitValue={check.limitValue}
                    unit={check.unit}
                    message={check.message}
                  />
                ))}

                {complianceResult.violations.length > 0 && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <h4 className="text-sm font-medium text-destructive mb-2">
                      {complianceResult.violations.length} Violation(s) Found
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {complianceResult.violations.map((v, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <XCircle className="h-3 w-3 mt-0.5 text-destructive flex-shrink-0" />
                          {v}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-xs text-muted-foreground text-right pt-2">
                  Last checked: {new Date(complianceResult.checkedAt).toLocaleTimeString()}
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
