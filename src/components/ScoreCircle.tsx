import { cn } from "@/lib/utils";

interface ScoreCircleProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export function ScoreCircle({ score, size = 'md', className, showLabel = true }: ScoreCircleProps) {
  // Calculate score band
  const getScoreBand = (score: number): 'A' | 'B' | 'C' => {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    return 'C';
  };

  const band = getScoreBand(score);

  // Get color based on score
  const getColor = (band: string) => {
    switch (band) {
      case 'A':
        return 'text-green-600';
      case 'B':
        return 'text-yellow-600';
      case 'C':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getBgColor = (band: string) => {
    switch (band) {
      case 'A':
        return 'bg-green-100';
      case 'B':
        return 'bg-yellow-100';
      case 'C':
        return 'bg-red-100';
      default:
        return 'bg-muted';
    }
  };

  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'h-16 w-16 text-2xl';
      case 'lg':
        return 'h-32 w-32 text-5xl';
      default:
        return 'h-24 w-24 text-4xl';
    }
  };

  const getLabelSize = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  const radius = size === 'sm' ? 28 : size === 'lg' ? 58 : 43;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative">
        {/* Background circle */}
        <svg className={getSize()} viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            className={getColor(band)}
            style={{
              transition: 'stroke-dashoffset 1s ease-in-out'
            }}
          />
        </svg>

        {/* Score badge in center */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          getSize()
        )}>
          <div className={cn(
            "flex flex-col items-center justify-center rounded-full",
            getBgColor(band),
            size === 'sm' ? 'h-10 w-10' : size === 'lg' ? 'h-20 w-20' : 'h-14 w-14'
          )}>
            <span className={cn("font-bold", getColor(band), size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl')}>
              {score}
            </span>
          </div>
        </div>
      </div>

      {showLabel && (
        <div className="text-center">
          <div className={cn("font-semibold", getColor(band), getLabelSize())}>
            Grade {band}
          </div>
          <div className={cn("text-muted-foreground", getLabelSize())}>
            Feasibility Score
          </div>
        </div>
      )}
    </div>
  );
}
