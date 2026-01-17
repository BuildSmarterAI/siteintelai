/**
 * Model Rotation Control
 * Rotation dial/slider for orienting the building
 */

import { useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RotateCw, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelRotationControlProps {
  rotationDeg: number;
  onRotationChange: (degrees: number) => void;
  className?: string;
}

const PRESET_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function ModelRotationControl({
  rotationDeg,
  onRotationChange,
  className,
}: ModelRotationControlProps) {
  const handleSliderChange = useCallback(
    (value: number[]) => {
      onRotationChange(value[0]);
    },
    [onRotationChange]
  );

  const handlePresetClick = useCallback(
    (angle: number) => {
      onRotationChange(angle);
    },
    [onRotationChange]
  );

  const handleRotate90 = useCallback(() => {
    const newAngle = (rotationDeg + 90) % 360;
    onRotationChange(newAngle);
  }, [rotationDeg, onRotationChange]);

  // Get compass direction for current angle
  const getDirection = (deg: number): string => {
    const normalized = ((deg % 360) + 360) % 360;
    if (normalized >= 337.5 || normalized < 22.5) return 'N';
    if (normalized >= 22.5 && normalized < 67.5) return 'NE';
    if (normalized >= 67.5 && normalized < 112.5) return 'E';
    if (normalized >= 112.5 && normalized < 157.5) return 'SE';
    if (normalized >= 157.5 && normalized < 202.5) return 'S';
    if (normalized >= 202.5 && normalized < 247.5) return 'SW';
    if (normalized >= 247.5 && normalized < 292.5) return 'W';
    return 'NW';
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <RotateCw className="h-4 w-4" />
          Rotation
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {Math.round(rotationDeg)}° {getDirection(rotationDeg)}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleRotate90}
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rotate 90°</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Compass visual */}
      <div className="flex justify-center py-2">
        <div className="relative w-20 h-20">
          {/* Compass ring */}
          <div className="absolute inset-0 rounded-full border-2 border-muted" />
          
          {/* Direction markers */}
          {['N', 'E', 'S', 'W'].map((dir, i) => (
            <div
              key={dir}
              className="absolute text-[10px] font-medium text-muted-foreground"
              style={{
                top: i === 0 ? '0' : i === 2 ? 'auto' : '50%',
                bottom: i === 2 ? '0' : 'auto',
                left: i === 3 ? '0' : i === 1 ? 'auto' : '50%',
                right: i === 1 ? '0' : 'auto',
                transform:
                  i === 0 || i === 2
                    ? 'translateX(-50%)'
                    : 'translateY(-50%)',
              }}
            >
              {dir}
            </div>
          ))}

          {/* Rotation indicator */}
          <div
            className="absolute top-1/2 left-1/2 w-8 h-0.5 bg-primary origin-left rounded-full"
            style={{
              transform: `translate(-50%, -50%) rotate(${rotationDeg - 90}deg)`,
            }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
          </div>

          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-muted-foreground" />
        </div>
      </div>

      {/* Slider */}
      <Slider
        value={[rotationDeg]}
        onValueChange={handleSliderChange}
        min={0}
        max={359}
        step={1}
        className="w-full"
      />

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1 justify-center">
        {[0, 90, 180, 270].map((angle) => (
          <Button
            key={angle}
            variant={rotationDeg === angle ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={() => handlePresetClick(angle)}
          >
            {angle}°
          </Button>
        ))}
      </div>
    </div>
  );
}
