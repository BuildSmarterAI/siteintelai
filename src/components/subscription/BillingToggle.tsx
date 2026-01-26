import { cn } from '@/lib/utils';
import { BillingCycle } from '@/config/subscription-tiers';

interface BillingToggleProps {
  value: BillingCycle;
  onChange: (value: BillingCycle) => void;
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onChange('quarterly')}
        className={cn(
          'px-6 py-3 rounded-full text-sm font-medium transition-all duration-200',
          value === 'quarterly'
            ? 'bg-primary text-primary-foreground shadow-lg'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        )}
      >
        Quarterly
      </button>
      <button
        onClick={() => onChange('annual')}
        className={cn(
          'px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 relative',
          value === 'annual'
            ? 'bg-primary text-primary-foreground shadow-lg'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        )}
      >
        Annual
        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
          Save 33%
        </span>
      </button>
    </div>
  );
}
