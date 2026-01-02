import { CheckCircle, AlertCircle, AlertTriangle, XCircle, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateBfeDelta } from "@/hooks/useElevationProfile";

interface BfeDeltaIndicatorProps {
  siteElevation?: number | null;
  baseFloodElevation?: number | null;
  className?: string;
}

export function BfeDeltaIndicator({
  siteElevation,
  baseFloodElevation,
  className
}: BfeDeltaIndicatorProps) {
  const bfeDelta = calculateBfeDelta(siteElevation, baseFloodElevation);

  if (!bfeDelta) return null;

  const config = {
    low: {
      icon: CheckCircle,
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-600 dark:text-green-400',
      iconColor: 'text-green-500'
    },
    moderate: {
      icon: AlertCircle,
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      iconColor: 'text-emerald-500'
    },
    high: {
      icon: AlertTriangle,
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-600 dark:text-amber-400',
      iconColor: 'text-amber-500'
    },
    critical: {
      icon: XCircle,
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-600 dark:text-red-400',
      iconColor: 'text-red-500'
    }
  };

  const style = config[bfeDelta.risk];
  const Icon = style.icon;
  const ArrowIcon = bfeDelta.status === 'above' ? ArrowUp : bfeDelta.status === 'below' ? ArrowDown : null;

  return (
    <div className={cn(
      "p-4 rounded-xl border",
      style.bg,
      style.border,
      className
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg shrink-0", style.bg)}>
          <Icon className={cn("h-5 w-5", style.iconColor)} />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Delta Display */}
          <div className="flex items-center gap-2 mb-1">
            {ArrowIcon && (
              <ArrowIcon className={cn("h-4 w-4", style.iconColor)} />
            )}
            <span className={cn("font-bold text-lg", style.text)}>
              {bfeDelta.status === 'at' ? 'AT' : bfeDelta.status === 'above' ? '+' : '-'}
              {bfeDelta.delta.toFixed(1)} ft
            </span>
            <span className={cn("text-sm font-medium", style.text)}>
              {bfeDelta.status === 'at' 
                ? 'Base Flood Elevation' 
                : `${bfeDelta.status.toUpperCase()} BFE`
              }
            </span>
          </div>

          {/* Elevation Comparison */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
            <span>Site: <span className="font-mono font-medium text-foreground">{siteElevation?.toFixed(1)} ft</span></span>
            <span>BFE: <span className="font-mono font-medium text-foreground">{baseFloodElevation?.toFixed(1)} ft</span></span>
          </div>

          {/* Insurance Impact */}
          <p className="text-sm text-muted-foreground">
            {bfeDelta.insuranceImpact}
          </p>
        </div>
      </div>
    </div>
  );
}
