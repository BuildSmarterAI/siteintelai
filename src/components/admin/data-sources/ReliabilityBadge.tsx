import { cn } from '@/lib/utils';

interface ReliabilityBadgeProps {
  score: number | null;
  showValue?: boolean;
  className?: string;
}

export function ReliabilityBadge({ score, showValue = true, className }: ReliabilityBadgeProps) {
  const getColor = () => {
    if (score === null) return 'bg-muted text-muted-foreground';
    if (score >= 80) return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
    if (score >= 50) return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
  };

  const getLabel = () => {
    if (score === null) return 'N/A';
    if (score >= 80) return 'High';
    if (score >= 50) return 'Medium';
    return 'Low';
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border',
        getColor(),
        className
      )}
    >
      {showValue && score !== null ? `${score}%` : getLabel()}
    </span>
  );
}
