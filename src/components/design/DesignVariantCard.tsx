/**
 * SiteIntel™ Design Mode - Variant Card
 * 
 * Individual variant display with controls.
 */

import { useDesignStore, type DesignVariant } from "@/stores/useDesignStore";
import { cn } from "@/lib/utils";
import { formatSqFt } from "@/lib/designMetrics";
import { 
  MoreHorizontal, 
  Copy, 
  Trash2, 
  Pencil,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Square
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

/**
 * Safe number formatting - returns "—" for undefined/null/NaN values
 */
function formatFixed(value: unknown, digits: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }
  return value.toFixed(digits);
}

interface DesignVariantCardProps {
  variant: DesignVariant;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: () => void;
  showCompareCheckbox?: boolean;
}

export function DesignVariantCard({
  variant,
  onDuplicate,
  onDelete,
  onRename,
  showCompareCheckbox = false,
}: DesignVariantCardProps) {
  const { 
    activeVariantId, 
    setActiveVariantId,
    compareVariantIds,
    toggleCompareVariant,
    currentView
  } = useDesignStore();

  const isActive = activeVariantId === variant.id;
  const isSelected = compareVariantIds.includes(variant.id);

  const statusConfig = {
    PASS: {
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-500",
    },
    WARN: {
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500",
    },
    FAIL: {
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive",
    },
    PENDING: {
      icon: Loader2,
      color: "text-muted-foreground",
      bg: "bg-muted",
    },
  };

  const status = statusConfig[variant.complianceStatus];
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        "group relative rounded-lg border p-3 cursor-pointer transition-all",
        isActive && "border-primary bg-primary/5",
        !isActive && "hover:border-primary/50 hover:bg-muted/50",
        isSelected && currentView === "compare" && "ring-2 ring-primary/50"
      )}
      onClick={() => setActiveVariantId(variant.id)}
    >
      {/* Compare checkbox */}
      {showCompareCheckbox && (
        <div 
          className="absolute top-2 left-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleCompareVariant(variant.id)}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className={cn(showCompareCheckbox && "pl-6")}>
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{variant.name}</h4>
            {variant.isBaseline && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Baseline
              </Badge>
            )}
          </div>
          {variant.presetType && (
            <span className="text-xs text-muted-foreground">
              {variant.presetType.replace(/_/g, " ")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Status indicator */}
          <div className={cn("p-1 rounded", status.color)}>
            <StatusIcon className={cn(
              "h-3.5 w-3.5",
              variant.complianceStatus === "PENDING" && "animate-spin"
            )} />
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onRename}>
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Metrics preview */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">GFA</span>
          <div className="font-medium">
            {variant.metrics 
              ? formatSqFt(variant.metrics.grossFloorAreaSf)
              : "—"
            }
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">FAR</span>
          <div className="font-medium">
            {variant.metrics 
              ? formatFixed(variant.metrics.farUsed, 2)
              : "—"
            }
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Height</span>
          <div className="font-medium">{variant.heightFt}'</div>
        </div>
        <div>
          <span className="text-muted-foreground">Floors</span>
          <div className="font-medium">{variant.floors}</div>
        </div>
      </div>

      {/* Footprint indicator */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Square className="h-3 w-3" />
        <span>
          {variant.footprint ? "Footprint drawn" : "No footprint"}
        </span>
      </div>
    </div>
  );
}
