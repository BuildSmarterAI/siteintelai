import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricCardProps {
  label: string;
  value: string | number | undefined | null;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  tooltip?: string;
  variant?: "default" | "accent" | "data";
  className?: string;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  tooltip,
  variant = "default",
  className,
}: MetricCardProps) {
  const displayValue = value ?? "—";

  const variantStyles = {
    default: "bg-card hover:bg-muted/50",
    accent: "bg-gradient-to-br from-accent/5 to-accent/10 hover:from-accent/10 hover:to-accent/15 border-accent/20",
    data: "bg-gradient-to-br from-data-cyan/5 to-data-cyan/10 hover:from-data-cyan/10 hover:to-data-cyan/15 border-data-cyan/20",
  };

  const iconStyles = {
    default: "text-muted-foreground",
    accent: "text-accent",
    data: "text-data-cyan",
  };

  const content = (
    <div
      className={cn(
        "group relative rounded-lg border p-3 transition-all duration-200",
        "hover:shadow-soft hover:-translate-y-0.5",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">
            {label}
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground tabular-nums">
            {displayValue}
          </p>
        </div>
        <div
          className={cn(
            "flex-shrink-0 rounded-md p-1.5 transition-colors",
            "group-hover:bg-background/50",
            iconStyles[variant]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-status-success" : "text-status-error"
            )}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
          <span className="text-xs text-muted-foreground">vs avg</span>
        </div>
      )}
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs bg-popover text-popover-foreground"
          >
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
