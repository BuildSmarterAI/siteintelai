import { cn } from "@/lib/utils";

interface BudgetProgressBarProps {
  current: number;
  thresholdWarn: number;
  thresholdCritical: number;
  className?: string;
  showMarkers?: boolean;
}

export function BudgetProgressBar({
  current,
  thresholdWarn,
  thresholdCritical,
  className,
  showMarkers = true,
}: BudgetProgressBarProps) {
  const percentage = Math.min((current / thresholdCritical) * 100, 100);
  const warnPercentage = (thresholdWarn / thresholdCritical) * 100;

  // Determine color based on current value
  let barColor = 'bg-green-500';
  if (current >= thresholdCritical) {
    barColor = 'bg-red-500';
  } else if (current >= thresholdWarn) {
    barColor = 'bg-yellow-500';
  }

  return (
    <div className={cn("relative", className)}>
      {/* Background track */}
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        {/* Progress fill */}
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            barColor
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Threshold markers */}
      {showMarkers && (
        <>
          {/* Warning threshold marker */}
          <div
            className="absolute top-0 w-0.5 h-3 bg-yellow-600/70"
            style={{ left: `${warnPercentage}%` }}
          />
          {/* Critical threshold marker (at 100%) */}
          <div
            className="absolute top-0 right-0 w-0.5 h-3 bg-red-600/70"
          />
        </>
      )}

      {/* Marker labels */}
      {showMarkers && (
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>$0</span>
          <span style={{ position: 'absolute', left: `${warnPercentage}%`, transform: 'translateX(-50%)' }}>
            ${thresholdWarn}
          </span>
          <span>${thresholdCritical}</span>
        </div>
      )}
    </div>
  );
}
