/**
 * Shadow Analysis Controls for 3D CesiumViewer
 * 
 * Quick toggle and date picker for shadow analysis.
 * Enhanced timeline appears when shadows are enabled.
 */

import { useState } from "react";
import { Sun, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useDesignStore } from "@/stores/useDesignStore";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ShadowControlsProps {
  className?: string;
}

export function ShadowControls({ className }: ShadowControlsProps) {
  const {
    shadowsEnabled,
    setShadowsEnabled,
    shadowDateTime,
    setShadowDateTime,
  } = useDesignStore();

  const [isOpen, setIsOpen] = useState(false);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const newDateTime = new Date(date);
      newDateTime.setHours(shadowDateTime.getHours());
      newDateTime.setMinutes(shadowDateTime.getMinutes());
      setShadowDateTime(newDateTime);
    }
  };

  // Quick date presets
  const datePresets = [
    { label: "Spring", date: new Date(new Date().getFullYear(), 2, 20) },
    { label: "Summer", date: new Date(new Date().getFullYear(), 5, 21) },
    { label: "Fall", date: new Date(new Date().getFullYear(), 8, 22) },
    { label: "Winter", date: new Date(new Date().getFullYear(), 11, 21) },
  ];

  return (
    <div className={cn(
      "bg-background/95 backdrop-blur-sm rounded-lg border shadow-lg p-4 min-w-[260px]",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-amber-500" />
          <h4 className="text-sm font-semibold">Shadow Analysis</h4>
        </div>
        <Switch
          checked={shadowsEnabled}
          onCheckedChange={setShadowsEnabled}
          aria-label="Toggle shadows"
        />
      </div>

      {!shadowsEnabled && (
        <p className="text-xs text-muted-foreground">
          Enable to analyze sun & shadow patterns throughout the day.
        </p>
      )}

      {shadowsEnabled && (
        <div className="space-y-3">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left font-normal h-8"
                >
                  <Calendar className="h-3.5 w-3.5 mr-2" />
                  {format(shadowDateTime, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={shadowDateTime}
                  onSelect={(date) => {
                    handleDateChange(date);
                    setIsOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {/* Season Presets */}
            <div className="flex gap-1">
              {datePresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs flex-1"
                  onClick={() => handleDateChange(preset.date)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Keyboard hint */}
          <div className="text-[10px] text-muted-foreground text-center pt-1 border-t">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Space</kbd> to play/pause
          </div>
        </div>
      )}
    </div>
  );
}
