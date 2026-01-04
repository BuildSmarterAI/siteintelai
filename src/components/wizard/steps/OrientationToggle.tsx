/**
 * Orientation Toggle
 * 2-state toggle for building orientation (street/parcel)
 */

import { ArrowUpFromLine, Maximize2 } from 'lucide-react';
import type { OrientationMode } from '@/types/buildingTypes';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface OrientationToggleProps {
  value: OrientationMode;
  onChange: (mode: OrientationMode) => void;
}

const ORIENTATIONS: { value: OrientationMode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'street',
    label: 'Street-Facing',
    description: 'Align building to street frontage',
    icon: <ArrowUpFromLine className="w-4 h-4" />,
  },
  {
    value: 'parcel',
    label: 'Parcel-Aligned',
    description: 'Maximize parcel utilization',
    icon: <Maximize2 className="w-4 h-4" />,
  },
];

export function OrientationToggle({ value, onChange }: OrientationToggleProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Orientation</Label>
      <div className="flex rounded-lg border border-border overflow-hidden">
        {ORIENTATIONS.map((orientation) => {
          const isSelected = value === orientation.value;
          
          return (
            <button
              key={orientation.value}
              type="button"
              onClick={() => onChange(orientation.value)}
              className={cn(
                'flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-2',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-inset',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-accent text-foreground'
              )}
            >
              {orientation.icon}
              <span>{orientation.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {ORIENTATIONS.find((o) => o.value === value)?.description}
      </p>
    </div>
  );
}
