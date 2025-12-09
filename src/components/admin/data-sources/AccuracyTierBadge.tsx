import { cn } from '@/lib/utils';

interface AccuracyTierBadgeProps {
  tier: string | null;
  className?: string;
}

const tierLabels: Record<string, string> = {
  T1: 'Tier 1 - Regulatory',
  T2: 'Tier 2 - Advisory',
  T3: 'Tier 3 - Approximate',
};

export function AccuracyTierBadge({ tier, className }: AccuracyTierBadgeProps) {
  const getColor = () => {
    switch (tier) {
      case 'T1':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'T2':
        return 'bg-accent/20 text-accent-foreground border-accent/30';
      case 'T3':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border',
        getColor(),
        className
      )}
      title={tier ? tierLabels[tier] : 'Unknown'}
    >
      {tier || 'N/A'}
    </span>
  );
}
