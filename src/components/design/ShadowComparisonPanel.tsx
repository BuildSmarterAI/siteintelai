/**
 * Shadow Comparison Panel
 * Controls for comparing shadows at multiple times simultaneously
 */

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDesignStore } from "@/stores/useDesignStore";
import {
  Sun,
  Clock,
  Palette,
  RotateCcw,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SHADOW_COMPARISON_PRESETS } from "@/lib/shadowCalculator";

interface ShadowComparisonPanelProps {
  className?: string;
}

const TIME_COLORS = [
  "#3B82F6", // Blue
  "#EAB308", // Yellow
  "#F97316", // Orange
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#10B981", // Green
  "#EC4899", // Pink
];

export function ShadowComparisonPanel({ className }: ShadowComparisonPanelProps) {
  const {
    shadowComparisonMode,
    setShadowComparisonMode,
    shadowComparisonTimes,
    setShadowComparisonTimes,
    toggleShadowComparisonTime,
    updateShadowComparisonTime,
    shadowDateTime,
  } = useDesignStore();

  const handlePreset = (presetKey: keyof typeof SHADOW_COMPARISON_PRESETS) => {
    const preset = SHADOW_COMPARISON_PRESETS[presetKey];
    setShadowComparisonTimes(preset);
  };

  const handleColorChange = (timeId: string, color: string) => {
    updateShadowComparisonTime(timeId, { color });
  };

  const handleBackToTimeline = () => {
    setShadowComparisonMode(false);
  };

  if (!shadowComparisonMode) {
    return (
      <div className={cn(
        "bg-background/95 backdrop-blur-sm rounded-lg border shadow-lg p-3",
        className
      )}>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShadowComparisonMode(true)}
        >
          <Clock className="h-4 w-4 mr-2" />
          Compare Times
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-background/95 backdrop-blur-sm rounded-lg border shadow-lg min-w-[280px]",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-amber-500" />
          <h4 className="text-sm font-semibold">Shadow Comparison</h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToTimeline}
          className="h-7 px-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Timeline
        </Button>
      </div>

      {/* Time slots */}
      <div className="p-3 space-y-2">
        <Label className="text-xs text-muted-foreground">Time Slots</Label>
        
        <div className="space-y-1.5">
          {shadowComparisonTimes.map((time) => (
            <div
              key={time.id}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md border",
                time.visible ? "bg-muted/30" : "bg-muted/10 opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Visibility toggle */}
                <Switch
                  checked={time.visible}
                  onCheckedChange={() => toggleShadowComparisonTime(time.id)}
                  className="scale-75"
                />

                {/* Color indicator */}
                <div
                  className="w-4 h-4 rounded-full border-2 border-background shadow-sm"
                  style={{ backgroundColor: time.color }}
                />

                {/* Time label */}
                <span className="text-sm font-medium">{time.label}</span>
              </div>

              {/* Color picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <Palette className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="end">
                  <div className="grid grid-cols-4 gap-1">
                    {TIME_COLORS.map((color) => (
                      <button
                        key={color}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                          time.color === color
                            ? "border-foreground"
                            : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorChange(time.id, color)}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div className="px-3 pb-3 space-y-2">
        <Label className="text-xs text-muted-foreground">Quick Presets</Label>
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handlePreset("standard")}
          >
            Standard
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handlePreset("morning")}
          >
            Morning
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handlePreset("afternoon")}
          >
            Afternoon
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handlePreset("peak")}
          >
            Peak Hours
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-3 pb-3 pt-1 border-t">
        <div className="flex flex-wrap gap-2">
          {shadowComparisonTimes
            .filter((t) => t.visible)
            .map((time) => (
              <div
                key={time.id}
                className="flex items-center gap-1.5 text-xs"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: time.color }}
                />
                <span className="text-muted-foreground">{time.label}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Date indicator */}
      <div className="px-3 pb-3 text-center">
        <span className="text-xs text-muted-foreground">
          Shadows for {shadowDateTime.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
