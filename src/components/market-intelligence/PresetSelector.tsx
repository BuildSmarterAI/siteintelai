import { cn } from "@/lib/utils";
import { MapPin, Clock, Pencil } from "lucide-react";
import type { MarketPreset } from "@/hooks/useMarketPresets";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const presetTooltips: Record<string, string> = {
  radius: "Circular trade area based on distance from the selected location.",
  drive_time:
    "Trade area based on driving time from the selected location, accounting for road networks.",
  custom: "Custom-drawn trade area polygon.",
};

export function PresetSelector({
  presets,
  selectedPresetId,
  onSelect,
  isLoading,
}: PresetSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => {
        const Icon = presetIcons[preset.preset_type] || MapPin;
        const isSelected = selectedPresetId === preset.id;
        const tooltipText =
          presetTooltips[preset.preset_type] ||
          "Select this trade area configuration.";

        return (
          <TooltipProvider key={preset.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSelect(preset.id)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
                    "border-2 transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-data-cyan/50 focus:ring-offset-2",
                    isSelected
                      ? "bg-data-cyan text-data-cyan-foreground border-data-cyan shadow-md scale-[1.02]"
                      : [
                          "bg-card text-foreground border-border",
                          "hover:border-data-cyan hover:text-data-cyan hover:shadow-soft hover:-translate-y-0.5",
                        ]
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isSelected && "scale-110"
                    )}
                  />
                  <span>{preset.name}</span>
                  {preset.radius_miles && (
                    <span
                      className={cn(
                        "text-xs",
                        isSelected ? "opacity-80" : "text-muted-foreground"
                      )}
                    >
                      ({preset.radius_miles}mi)
                    </span>
                  )}
                  {preset.drive_time_minutes && (
                    <span
                      className={cn(
                        "text-xs",
                        isSelected ? "opacity-80" : "text-muted-foreground"
                      )}
                    >
                      ({preset.drive_time_minutes}min)
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="max-w-xs bg-popover text-popover-foreground"
              >
                <p className="text-sm">{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
