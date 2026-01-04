/**
 * Parking Mode Selector
 * Radio group for parking visualization mode
 */

import { Car, Building2, EyeOff } from 'lucide-react';
import type { PreviewParkingMode } from '@/types/buildingTypes';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface ParkingModeSelectorProps {
  value: PreviewParkingMode;
  onChange: (mode: PreviewParkingMode) => void;
}

const MODES: { value: PreviewParkingMode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'surface',
    label: 'Surface',
    description: 'Show surface parking area',
    icon: <Car className="w-4 h-4" />,
  },
  {
    value: 'structured',
    label: 'Structured',
    description: 'Parking garage visualization',
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    value: 'ignored',
    label: 'Hidden',
    description: 'Hide parking from preview',
    icon: <EyeOff className="w-4 h-4" />,
  },
];

export function ParkingModeSelector({ value, onChange }: ParkingModeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Parking Preview</Label>
      <div className="grid grid-cols-3 gap-2">
        {MODES.map((mode) => {
          const isSelected = value === mode.value;
          
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => onChange(mode.value)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                'focus:outline-none focus:ring-2 focus:ring-primary/20',
                isSelected
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-background hover:bg-accent text-foreground'
              )}
            >
              {mode.icon}
              <span className="text-xs font-medium">{mode.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {MODES.find((m) => m.value === value)?.description}
      </p>
    </div>
  );
}
