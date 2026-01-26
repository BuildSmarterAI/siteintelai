import { Check, X } from 'lucide-react';
import { SUBSCRIPTION_TIERS, TIER_ORDER } from '@/config/subscription-tiers';
import { cn } from '@/lib/utils';

interface Feature {
  name: string;
  values: Record<string, string | boolean | number>;
}

const FEATURES: Feature[] = [
  {
    name: 'AI Feasibility Reports',
    values: { starter: '5/mo', pro: '15/mo', unlimited: 'Unlimited' },
  },
  {
    name: 'PDF Download',
    values: { starter: true, pro: true, unlimited: true },
  },
  {
    name: 'Dashboard & History',
    values: { starter: true, pro: true, unlimited: true },
  },
  {
    name: 'Excel Export',
    values: { starter: false, pro: true, unlimited: true },
  },
  {
    name: '3D Design Mode',
    values: { starter: false, pro: true, unlimited: true },
  },
  {
    name: 'CAD/DXF Export',
    values: { starter: false, pro: true, unlimited: true },
  },
  {
    name: 'API Access',
    values: { starter: false, pro: false, unlimited: true },
  },
  {
    name: 'Priority Support',
    values: { starter: false, pro: true, unlimited: true },
  },
  {
    name: 'Dedicated Account Manager',
    values: { starter: false, pro: false, unlimited: true },
  },
  {
    name: 'Team Seats',
    values: { starter: '1', pro: '3', unlimited: '10' },
  },
  {
    name: 'Active Parcels',
    values: { starter: '25', pro: '100', unlimited: 'Unlimited' },
  },
  {
    name: 'Report History',
    values: { starter: '90 days', pro: '365 days', unlimited: 'Unlimited' },
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
