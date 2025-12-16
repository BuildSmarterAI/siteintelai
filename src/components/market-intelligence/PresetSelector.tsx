import { cn } from '@/lib/utils';
import { MapPin, Clock, Pencil } from 'lucide-react';
import type { MarketPreset } from '@/hooks/useMarketPresets';

interface PresetSelectorProps {
  presets: MarketPreset[];
  selectedPresetId: string | null;
  onSelect: (presetId: string) => void;
  isLoading?: boolean;
}

const presetIcons: Record<string, typeof MapPin> = {
  radius: MapPin,
  drive_time: Clock,
  custom: Pencil,
};

export function PresetSelector({ 
  presets, 
  selectedPresetId, 
  onSelect,
  isLoading 
}: PresetSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i}
            className="h-10 w-24 bg-slate-200 animate-pulse rounded-full"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => {
        const Icon = presetIcons[preset.preset_type] || MapPin;
        const isSelected = selectedPresetId === preset.id;
        
        return (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.id)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              "border-2",
              isSelected
                ? "bg-[hsl(var(--data-cyan))] text-white border-[hsl(var(--data-cyan))] shadow-md"
                : "bg-white text-slate-700 border-slate-200 hover:border-[hsl(var(--data-cyan))] hover:text-[hsl(var(--data-cyan))]"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{preset.name}</span>
            {preset.radius_miles && (
              <span className="text-xs opacity-70">
                ({preset.radius_miles}mi)
              </span>
            )}
            {preset.drive_time_minutes && (
              <span className="text-xs opacity-70">
                ({preset.drive_time_minutes}min)
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
