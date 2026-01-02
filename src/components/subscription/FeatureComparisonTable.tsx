import { Check, X, Minus } from 'lucide-react';
import { SUBSCRIPTION_TIERS, TIER_ORDER } from '@/config/subscription-tiers';
import { cn } from '@/lib/utils';

interface Feature {
  name: string;
  values: Record<string, string | boolean | number>;
}

const FEATURES: Feature[] = [
  {
    name: 'AI Feasibility Reports',
    values: { starter: '5/mo', professional: '20/mo', team: '75/mo', enterprise: '250+/mo' },
  },
  {
    name: 'QuickChecks',
    values: { starter: 'Unlimited', professional: 'Unlimited', team: 'Unlimited', enterprise: 'Unlimited' },
  },
  {
    name: 'Active Parcels',
    values: { starter: '10', professional: '50', team: '150', enterprise: 'Unlimited' },
  },
  {
    name: 'Team Seats',
    values: { starter: '1', professional: '2', team: '5', enterprise: 'Unlimited' },
  },
  {
    name: 'Lender-Ready PDF',
    values: { starter: true, professional: true, team: true, enterprise: true },
  },
  {
    name: 'Share Reports via Links',
    values: { starter: false, professional: true, team: true, enterprise: true },
  },
  {
    name: 'CSV Export',
    values: { starter: false, professional: false, team: true, enterprise: true },
  },
  {
    name: 'API Access',
    values: { starter: false, professional: false, team: false, enterprise: true },
  },
  {
    name: 'SSO Integration',
    values: { starter: false, professional: false, team: false, enterprise: true },
  },
  {
    name: 'Custom Scoring Models',
    values: { starter: false, professional: false, team: false, enterprise: true },
  },
  {
    name: 'Report History',
    values: { starter: '90 days', professional: '365 days', team: 'Unlimited', enterprise: 'Unlimited' },
  },
  {
    name: 'Support',
    values: { starter: 'Email', professional: 'Priority', team: 'Priority', enterprise: 'Dedicated' },
  },
];

function renderValue(value: string | boolean | number) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-5 w-5 text-green-500 mx-auto" />
    ) : (
      <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />
    );
  }
  return <span className="text-sm">{value}</span>;
}

export function FeatureComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4 font-medium text-muted-foreground">Feature</th>
            {TIER_ORDER.map((tierId) => (
              <th 
                key={tierId} 
                className={cn(
                  'text-center p-4 font-semibold',
                  SUBSCRIPTION_TIERS[tierId].highlight && 'bg-primary/5'
                )}
              >
                {SUBSCRIPTION_TIERS[tierId].name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURES.map((feature, index) => (
            <tr 
              key={feature.name} 
              className={cn(
                'border-b',
                index % 2 === 0 && 'bg-muted/30'
              )}
            >
              <td className="p-4 font-medium">{feature.name}</td>
              {TIER_ORDER.map((tierId) => (
                <td 
                  key={tierId} 
                  className={cn(
                    'text-center p-4',
                    SUBSCRIPTION_TIERS[tierId].highlight && 'bg-primary/5'
                  )}
                >
                  {renderValue(feature.values[tierId])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
