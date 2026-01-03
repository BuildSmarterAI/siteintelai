/**
 * Street View HUD Overlay
 * 
 * Minimal heads-up display for street-level navigation.
 */

import { Compass, MapPin, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StreetViewHUDProps {
  className?: string;
  heading: number;
  eyeHeight: number;
  walkSpeed: "slow" | "medium" | "fast";
  onExit: () => void;
  onSpeedChange: (speed: "slow" | "medium" | "fast") => void;
  onHeightChange: (height: number) => void;
}

const SPEED_LABELS = {
  slow: "Walk",
  medium: "Jog",
  fast: "Run",
};

const HEIGHT_PRESETS = [
  { label: "Eye Level", value: 1.7, icon: "👤" },
  { label: "Elevated", value: 3.0, icon: "🏗️" },
  { label: "Drone", value: 15.0, icon: "🚁" },
];

export function StreetViewHUD({
  className,
  heading,
  eyeHeight,
  walkSpeed,
  onExit,
  onSpeedChange,
  onHeightChange,
}: StreetViewHUDProps) {
  // Get cardinal direction from heading
  const getCardinalDirection = (deg: number): string => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  const cycleSpeed = () => {
    const speeds: Array<"slow" | "medium" | "fast"> = ["slow", "medium", "fast"];
    const currentIndex = speeds.indexOf(walkSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    onSpeedChange(speeds[nextIndex]);
  };

  return (
    <div className={cn("pointer-events-none", className)}>
      {/* Top Bar - Exit + Compass */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-auto">
        {/* Exit Button */}
        <Button
          variant="destructive"
          size="sm"
          className="gap-2 shadow-lg"
          onClick={onExit}
        >
          <X className="h-4 w-4" />
          Exit Street View
        </Button>
      </div>

      {/* Compass - Top Right */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <div className="bg-background/90 backdrop-blur-sm rounded-full p-3 shadow-lg border">
          <div 
            className="relative w-12 h-12"
            style={{ transform: `rotate(${-heading}deg)` }}
          >
            <Compass className="w-12 h-12 text-muted-foreground" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-xs font-bold text-red-500">
              N
            </div>
          </div>
          <div className="text-center text-xs font-medium mt-1">
            {getCardinalDirection(heading)} {Math.round(heading)}°
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
        {/* Speed Toggle */}
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 shadow-lg"
          onClick={cycleSpeed}
        >
          <User className="h-4 w-4" />
          {SPEED_LABELS[walkSpeed]}
        </Button>

        {/* Height Presets */}
        <div className="flex gap-1 bg-background/90 backdrop-blur-sm rounded-lg p-1 shadow-lg border">
          {HEIGHT_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              variant={Math.abs(eyeHeight - preset.value) < 0.5 ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => onHeightChange(preset.value)}
            >
              <span className="mr-1">{preset.icon}</span>
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Instructions - Bottom Left */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 shadow-lg border text-xs">
          <div className="font-semibold mb-1 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Controls
          </div>
          <div className="space-y-0.5 text-muted-foreground">
            <div>WASD / Arrows — Move</div>
            <div>Right-click drag — Look around</div>
            <div>ESC — Exit street view</div>
          </div>
        </div>
      </div>
    </div>
  );
}
