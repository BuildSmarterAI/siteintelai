/**
 * Enhanced Shadow Timeline Control
 * 
 * Visual timeline scrubber with playback controls for shadow analysis.
 */

import { useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  FastForward,
  Sunrise,
  Sunset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useDesignStore } from "@/stores/useDesignStore";
import { cn } from "@/lib/utils";
import { calculateSunPosition, calculateShadowMetrics, formatSolarTime } from "@/lib/solarPosition";

interface ShadowTimelineProps {
  className?: string;
  latitude?: number;
  longitude?: number;
}

type PlaybackSpeed = 0.5 | 1 | 2 | 4;

const SPEED_LABELS: Record<PlaybackSpeed, string> = {
  0.5: "0.5×",
  1: "1×",
  2: "2×",
  4: "4×",
};

const SPEED_CYCLE: PlaybackSpeed[] = [0.5, 1, 2, 4];

export function ShadowTimeline({ 
  className, 
  latitude = 29.76, 
  longitude = -95.36 
}: ShadowTimelineProps) {
  const {
    shadowDateTime,
    setShadowDateTime,
    isShadowAnimating,
    setIsShadowAnimating,
    shadowPlaybackSpeed,
    setShadowPlaybackSpeed,
  } = useDesignStore();

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Get current time value (0-24)
  const timeValue = shadowDateTime.getHours() + shadowDateTime.getMinutes() / 60;

  // Calculate sun metrics
  const sunPosition = calculateSunPosition(shadowDateTime, latitude, longitude);
  const shadowMetrics = calculateShadowMetrics(shadowDateTime, latitude, longitude);

  // Format time for display
  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
  };

  // Handle animation loop
  useEffect(() => {
    if (!isShadowAnimating) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Calculate interval based on speed
    // At 1x speed: advance 1 hour every 2 seconds (1 minute every 33ms)
    const minutesPerSecond = 30 * shadowPlaybackSpeed;
    const msPerMinute = 1000 / minutesPerSecond;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastTimeRef.current;

      if (elapsed >= msPerMinute) {
        const minutesToAdd = Math.floor(elapsed / msPerMinute);
        lastTimeRef.current = timestamp;

        setShadowDateTime((prev: Date) => {
          const newDate = new Date(prev);
          newDate.setMinutes(newDate.getMinutes() + minutesToAdd);

          // Loop back to 6 AM if past 8 PM
          if (newDate.getHours() >= 20) {
            newDate.setHours(6, 0, 0, 0);
          }
          // Skip to 6 AM if before
          if (newDate.getHours() < 6) {
            newDate.setHours(6, 0, 0, 0);
          }

          return newDate;
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isShadowAnimating, shadowPlaybackSpeed, setShadowDateTime]);

  const handleTimeChange = (value: number[]) => {
    const hours = value[0];
    const newDate = new Date(shadowDateTime);
    newDate.setHours(Math.floor(hours));
    newDate.setMinutes(Math.round((hours - Math.floor(hours)) * 60));
    setShadowDateTime(newDate);
  };

  const handleSkipBack = () => {
    const newDate = new Date(shadowDateTime);
    newDate.setHours(newDate.getHours() - 1);
    if (newDate.getHours() < 6) {
      newDate.setHours(6);
    }
    setShadowDateTime(newDate);
  };

  const handleSkipForward = () => {
    const newDate = new Date(shadowDateTime);
    newDate.setHours(newDate.getHours() + 1);
    if (newDate.getHours() > 20) {
      newDate.setHours(20);
    }
    setShadowDateTime(newDate);
  };

  const cycleSpeed = () => {
    const currentIndex = SPEED_CYCLE.indexOf(shadowPlaybackSpeed);
    const nextIndex = (currentIndex + 1) % SPEED_CYCLE.length;
    setShadowPlaybackSpeed(SPEED_CYCLE[nextIndex]);
  };

  const toggleAnimation = () => {
    setIsShadowAnimating(!isShadowAnimating);
  };

  // Hour markers for the timeline
  const hourMarkers = [6, 9, 12, 15, 18];

  return (
    <div className={cn(
      "bg-background/95 backdrop-blur-sm rounded-lg border shadow-lg p-3",
      className
    )}>
      {/* Current Time Display */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-semibold tabular-nums">
            {formatTime(timeValue)}
          </div>
          {sunPosition.altitude > 0 ? (
            <div className="flex items-center gap-1 text-xs text-amber-500">
              <Sunrise className="h-3 w-3" />
              <span>{sunPosition.altitude}°</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sunset className="h-3 w-3" />
              <span>Below horizon</span>
            </div>
          )}
        </div>
        
        {/* Speed Control */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs font-mono"
          onClick={cycleSpeed}
        >
          <FastForward className="h-3 w-3 mr-1" />
          {SPEED_LABELS[shadowPlaybackSpeed]}
        </Button>
      </div>

      {/* Timeline Slider */}
      <div className="relative mb-2">
        <Slider
          value={[timeValue]}
          onValueChange={handleTimeChange}
          min={5}
          max={21}
          step={0.0833} // 5-minute increments
          className="w-full"
          disabled={isShadowAnimating}
        />
        
        {/* Hour Markers */}
        <div className="flex justify-between mt-1 px-1">
          {hourMarkers.map((hour) => (
            <div
              key={hour}
              className="text-[10px] text-muted-foreground"
              style={{
                marginLeft: hour === 6 ? 0 : undefined,
                marginRight: hour === 18 ? 0 : undefined,
              }}
            >
              {hour === 12 ? "Noon" : hour < 12 ? `${hour}AM` : `${hour - 12}PM`}
            </div>
          ))}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleSkipBack}
          disabled={timeValue <= 6}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        
        <Button
          variant="default"
          size="icon"
          className="h-10 w-10"
          onClick={toggleAnimation}
        >
          {isShadowAnimating ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleSkipForward}
          disabled={timeValue >= 20}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Sun Info Row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Sunrise className="h-3 w-3" />
          <span>{formatSolarTime(shadowMetrics.sunrise)}</span>
        </div>
        <div>
          {shadowMetrics.directSunlightHours}h daylight
        </div>
        <div className="flex items-center gap-1">
          <Sunset className="h-3 w-3" />
          <span>{formatSolarTime(shadowMetrics.sunset)}</span>
        </div>
      </div>
    </div>
  );
}
