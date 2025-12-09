import { cn } from '@/lib/utils';
import { Circle } from 'lucide-react';

interface HealthStatusBadgeProps {
  status: string;
  color: string;
  className?: string;
}

export function HealthStatusBadge({ status, color, className }: HealthStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border',
        color,
        className
      )}
    >
      <Circle className="h-2 w-2 fill-current" />
      {status}
    </span>
  );
}
