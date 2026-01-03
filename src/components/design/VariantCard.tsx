/**
 * SiteIntel™ Design Mode - Variant Card (Redesigned)
 * 
 * Compact card (72-88px height) with hover actions.
 * Per UX spec: Best Overall badge, hover preview, quick actions.
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
  Star,
  Pin,
  Share2,
  Download,
  Crown
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

/**
 * Safe number formatting - returns "—" for undefined/null/NaN values
 */
function formatFixed(value: unknown, digits: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }
  return value.toFixed(digits);
}

interface VariantCardProps {
  variant: DesignVariant;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: () => void;
  onShare?: () => void;
  onExport?: () => void;
  showCompareCheckbox?: boolean;
}

export function VariantCard({
  variant,
  onDuplicate,
  onDelete,
  onRename,
  onShare,
  onExport,
  showCompareCheckbox = false,
}: VariantCardProps) {
  const { 
    activeVariantId, 
    setActiveVariantId,
    compareVariantIds,
    toggleCompareVariant,
    currentView,
    bestOverallVariantId,
    starredVariantIds,
    pinnedVariantIds,
    toggleStarVariant,
    togglePinVariant,
    setHoveredVariantId,
  } = useDesignStore();

  const isActive = activeVariantId === variant.id;
  const isSelected = compareVariantIds.includes(variant.id);
  const isBestOverall = bestOverallVariantId === variant.id;
  const isStarred = starredVariantIds.includes(variant.id);
  const isPinned = pinnedVariantIds.includes(variant.id);

  const statusConfig = {
    PASS: {
      icon: CheckCircle2,
      color: "text-[hsl(var(--design-status-pass))]",
      label: "Pass",
    },
    WARN: {
      icon: AlertTriangle,
      color: "text-[hsl(var(--design-status-warn))]",
      label: "Warn",
    },
    FAIL: {
      icon: XCircle,
      color: "text-[hsl(var(--design-status-fail))]",
      label: "Fail",
    },
    PENDING: {
      icon: Loader2,
      color: "text-muted-foreground",
      label: "Pending",
    },
  };

  const status = statusConfig[variant.complianceStatus];
  const StatusIcon = status.icon;

  const timeAgo = formatDistanceToNow(new Date(variant.updatedAt), { addSuffix: true });

  return (
    <div
      className={cn(
        "group relative rounded-lg border transition-all cursor-pointer",
        "py-2.5 px-3", // Compact padding
        isActive && "border-primary bg-primary/5 shadow-sm",
        !isActive && "hover:border-primary/50 hover:bg-muted/50",
        isSelected && currentView === "compare" && "ring-2 ring-primary/50"
      )}
      onClick={() => setActiveVariantId(variant.id)}
      onMouseEnter={() => setHoveredVariantId(variant.id)}
      onMouseLeave={() => setHoveredVariantId(null)}
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

      {/* Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div className={cn("min-w-0 flex-1", showCompareCheckbox && "pl-6")}>
          <div className="flex items-center gap-1.5">
            {/* Best Overall Badge */}
            {isBestOverall && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Best Overall — Highest compliant score</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {/* Star indicator */}
            {isStarred && (
              <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
            )}

            {/* Pin indicator */}
            {isPinned && (
              <Pin className="h-3 w-3 text-primary flex-shrink-0" />
            )}

            <h4 className="font-medium text-sm truncate">{variant.name}</h4>
          </div>
          
          {/* Preset caption */}
          {variant.presetType && (
            <span className="text-[11px] text-muted-foreground">
              {variant.presetType.replace(/_/g, " ")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Status indicator with label */}
          <Badge 
            variant="secondary" 
            className={cn("h-5 text-[10px] gap-1 px-1.5", status.color)}
          >
            <StatusIcon className={cn(
              "h-3 w-3",
              variant.complianceStatus === "PENDING" && "animate-spin"
            )} />
            {status.label}
          </Badge>

          {/* Actions menu (visible on hover) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onRename}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-3.5 w-3.5 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleStarVariant(variant.id)}>
                <Star className={cn(
                  "h-3.5 w-3.5 mr-2",
                  isStarred && "fill-amber-400 text-amber-400"
                )} />
                {isStarred ? "Unstar" : "Star"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => togglePinVariant(variant.id)}>
                <Pin className={cn(
                  "h-3.5 w-3.5 mr-2",
                  isPinned && "text-primary"
                )} />
                {isPinned ? "Unpin" : "Pin to top"}
              </DropdownMenuItem>
              {onShare && (
                <DropdownMenuItem onClick={onShare}>
                  <Share2 className="h-3.5 w-3.5 mr-2" />
                  Share
                </DropdownMenuItem>
              )}
              {onExport && (
                <DropdownMenuItem onClick={onExport}>
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Export
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Metrics Row - Inline compact */}
      <div className="mt-2 flex items-center gap-3 text-xs">
        <span className="text-muted-foreground">
          GFA <span className="text-foreground font-medium">
            {variant.metrics ? formatSqFt(variant.metrics.grossFloorAreaSf) : "—"}
          </span>
        </span>
        <span className="text-muted-foreground">
          FAR <span className="text-foreground font-medium">
            {variant.metrics ? formatFixed(variant.metrics.farUsed, 2) : "—"}
          </span>
        </span>
        <span className="text-muted-foreground">
          H <span className="text-foreground font-medium">{variant.heightFt}'</span>
        </span>
      </div>

      {/* Updated timestamp */}
      <div className="mt-1.5 text-[10px] text-muted-foreground">
        Updated {timeAgo}
      </div>

      {/* Hover Actions Bar */}
      <div className={cn(
        "absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full",
        "flex items-center gap-0.5 p-1 bg-popover border rounded-lg shadow-lg",
        "opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto",
        "z-10"
      )}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Duplicate</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7", isStarred && "text-amber-400")}
              onClick={(e) => {
                e.stopPropagation();
                toggleStarVariant(variant.id);
              }}
            >
              <Star className={cn("h-3.5 w-3.5", isStarred && "fill-current")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{isStarred ? "Unstar" : "Star"}</TooltipContent>
        </Tooltip>

        {onShare && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Share</TooltipContent>
          </Tooltip>
        )}

        {onExport && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onExport();
                }}
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Export</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
