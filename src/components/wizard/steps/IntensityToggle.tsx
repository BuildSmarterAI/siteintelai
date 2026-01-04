/**
 * Intensity Toggle
 * 3-state toggle for building intensity (conservative/optimal/aggressive)
 */

import type { IntensityLevel } from '@/types/buildingTypes';
import { INTENSITY_CONFIG } from '@/lib/archetypes/buildingTypeRegistry';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface IntensityToggleProps {
  value: IntensityLevel;
  onChange: (level: IntensityLevel) => void;
}

const LEVELS: IntensityLevel[] = ['conservative', 'optimal', 'aggressive'];

export function IntensityToggle({ value, onChange }: IntensityToggleProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Intensity</Label>
      <div className="flex rounded-lg border border-border overflow-hidden">
        {LEVELS.map((level) => {
          const config = INTENSITY_CONFIG[level];
          const isSelected = value === level;
          
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              className={cn(
                'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-inset',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-accent text-foreground'
              )}
            >
              <span className="block">{config.label}</span>
              <span className={cn(
                'block text-[10px] mt-0.5',
                isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}>
                {Math.round(config.multiplier * 100)}%
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {INTENSITY_CONFIG[value].description}
      </p>
    </div>
  );
}
