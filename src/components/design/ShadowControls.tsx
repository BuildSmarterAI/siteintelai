/**
 * Shadow Analysis Controls for 3D CesiumViewer
 * 
 * Provides time-of-day slider, date picker, and shadow animation controls.
 */

import { useState } from "react";
import { Sun, Play, Pause, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
    isShadowAnimating,
    setIsShadowAnimating,
  } = useDesignStore();

  const [isOpen, setIsOpen] = useState(false);

  // Get hours (0-24) from datetime
  const timeValue = shadowDateTime.getHours() + shadowDateTime.getMinutes() / 60;

  // Format time for display
  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
  };

  // Calculate sun position (simplified approximation)
  const calculateSunPosition = (date: Date) => {
    const hours = date.getHours() + date.getMinutes() / 60;
    // Simple approximation - sun moves from East to West
    const azimuth = ((hours - 6) / 12) * 180; // 0° at 6AM, 180° at 6PM
    // Altitude peaks at noon
    const altitude = Math.max(0, 90 - Math.abs(12 - hours) * 7.5);
    return { azimuth: Math.round(azimuth), altitude: Math.round(altitude) };
  };

  const sunPosition = calculateSunPosition(shadowDateTime);

  const handleTimeChange = (value: number[]) => {
    const hours = value[0];
    const newDate = new Date(shadowDateTime);
    newDate.setHours(Math.floor(hours));
    newDate.setMinutes(Math.round((hours - Math.floor(hours)) * 60));
    setShadowDateTime(newDate);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const newDateTime = new Date(date);
      newDateTime.setHours(shadowDateTime.getHours());
      newDateTime.setMinutes(shadowDateTime.getMinutes());
      setShadowDateTime(newDateTime);
    }
  };

  const toggleAnimation = () => {
    setIsShadowAnimating(!isShadowAnimating);
  };

  // Quick date presets
  const datePresets = [
    { label: "Spring", date: new Date(new Date().getFullYear(), 2, 20) }, // March 20
    { label: "Summer", date: new Date(new Date().getFullYear(), 5, 21) }, // June 21
    { label: "Fall", date: new Date(new Date().getFullYear(), 8, 22) }, // Sept 22
    { label: "Winter", date: new Date(new Date().getFullYear(), 11, 21) }, // Dec 21
  ];

  return (
    <div className={cn(
      "bg-background/95 backdrop-blur-sm rounded-lg border shadow-lg p-4 min-w-[280px]",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
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

      {shadowsEnabled && (
        <div className="space-y-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <div className="flex items-center gap-2">
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-start text-left font-normal h-8"
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
            </div>
            
            {/* Season Presets */}
            <div className="flex gap-1">
              {datePresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleDateChange(preset.date)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Time</Label>
              <span className="text-sm font-medium">{formatTime(timeValue)}</span>
            </div>
            <Slider
              value={[timeValue]}
              onValueChange={handleTimeChange}
              min={5}
              max={21}
              step={0.25}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>5 AM</span>
              <span>12 PM</span>
              <span>9 PM</span>
            </div>
          </div>

          {/* Sun Position Info */}
          <div className="bg-muted/50 rounded-md p-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Sun Azimuth:</span>
              <span className="font-medium text-foreground">{sunPosition.azimuth}°</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Sun Altitude:</span>
              <span className="font-medium text-foreground">{sunPosition.altitude}°</span>
            </div>
          </div>

          {/* Animate Button */}
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={toggleAnimation}
          >
            {isShadowAnimating ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Animation
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Animate Day
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
