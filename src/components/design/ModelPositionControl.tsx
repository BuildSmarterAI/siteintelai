/**
 * Model Position Control
 * Nudge controls for fine-positioning the building within the parcel
 */

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Move,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelPositionControlProps {
  offsetX: number;
  offsetY: number;
  onOffsetChange: (offsetX: number, offsetY: number) => void;
  nudgeStep?: number; // meters per click
  maxOffset?: number; // max offset in meters
  className?: string;
}

export function ModelPositionControl({
  offsetX,
  offsetY,
  onOffsetChange,
  nudgeStep = 1, // 1 meter per click
  maxOffset = 50, // 50 meters max
  className,
}: ModelPositionControlProps) {
  const handleNudge = useCallback(
    (dx: number, dy: number) => {
      const newX = Math.max(-maxOffset, Math.min(maxOffset, offsetX + dx));
      const newY = Math.max(-maxOffset, Math.min(maxOffset, offsetY + dy));
      onOffsetChange(newX, newY);
    },
    [offsetX, offsetY, onOffsetChange, maxOffset]
  );

  const handleCenter = useCallback(() => {
    onOffsetChange(0, 0);
  }, [onOffsetChange]);

  const isCentered = offsetX === 0 && offsetY === 0;

  // Convert meters to feet for display
  const offsetXFt = offsetX * 3.28084;
  const offsetYFt = offsetY * 3.28084;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <Move className="h-4 w-4" />
          Position
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCenter}
                disabled={isCentered}
              >
                <Target className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Center on parcel</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Position indicator */}
      <div className="flex justify-center">
        <div className="relative w-24 h-24">
          {/* Grid background */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 border border-muted rounded-lg overflow-hidden">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-muted/50" />
            ))}
          </div>

          {/* Center cross */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-muted-foreground/30" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-muted-foreground/30" />

          {/* Position dot */}
          <div
            className="absolute w-3 h-3 rounded-full bg-primary border-2 border-background shadow-lg transition-all duration-150"
            style={{
              left: `calc(50% + ${(offsetX / maxOffset) * 40}%)`,
              top: `calc(50% - ${(offsetY / maxOffset) * 40}%)`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      </div>

      {/* Nudge controls */}
      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-1">
          {/* Top row */}
          <div />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleNudge(0, nudgeStep)}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <div />

          {/* Middle row */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleNudge(-nudgeStep, 0)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleCenter}
            disabled={isCentered}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleNudge(nudgeStep, 0)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Bottom row */}
          <div />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleNudge(0, -nudgeStep)}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <div />
        </div>
      </div>

      {/* Offset display */}
      <div className="flex justify-center gap-4 text-xs text-muted-foreground">
        <span>
          X: <span className="font-mono">{offsetXFt.toFixed(1)} ft</span>
        </span>
        <span>
          Y: <span className="font-mono">{offsetYFt.toFixed(1)} ft</span>
        </span>
      </div>
    </div>
  );
}
