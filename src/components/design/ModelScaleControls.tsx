/**
 * Model Scale Controls
 * Interactive sliders for adjusting building model dimensions
 */

import { useCallback, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  ArrowsUpFromLine, 
  MoveHorizontal, 
  MoveVertical,
  Lock,
  Unlock,
  Maximize2,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { BuildingModel, ModelTransform } from '@/hooks/useBuildingModels';
import { calculateFinalDimensions } from '@/hooks/useBuildingModels';
import { cn } from '@/lib/utils';

interface ModelScaleControlsProps {
  model: BuildingModel;
  transform: ModelTransform;
  onTransformChange: (transform: ModelTransform) => void;
  constraints?: {
    maxHeightFt: number;
    maxCoveragePct: number;
    maxFar: number;
    parcelSqft: number;
  };
  className?: string;
}

export function ModelScaleControls({
  model,
  transform,
  onTransformChange,
  constraints,
  className,
}: ModelScaleControlsProps) {
  // Calculate final dimensions
  const dimensions = useMemo(
    () => calculateFinalDimensions(model, transform),
    [model, transform]
  );

  // Calculate compliance status
  const compliance = useMemo(() => {
    if (!constraints) return null;

    const coveragePct = (dimensions.footprintSqft / constraints.parcelSqft) * 100;
    const far = dimensions.gfa / constraints.parcelSqft;

    return {
      height: {
        value: dimensions.heightFt,
        max: constraints.maxHeightFt,
        ok: dimensions.heightFt <= constraints.maxHeightFt,
        pct: (dimensions.heightFt / constraints.maxHeightFt) * 100,
      },
      coverage: {
        value: coveragePct,
        max: constraints.maxCoveragePct,
        ok: coveragePct <= constraints.maxCoveragePct,
        pct: (coveragePct / constraints.maxCoveragePct) * 100,
      },
      far: {
        value: far,
        max: constraints.maxFar,
        ok: far <= constraints.maxFar,
        pct: (far / constraints.maxFar) * 100,
      },
    };
  }, [dimensions, constraints]);

  // Lock aspect ratio state
  const isLocked = transform.scaleX === transform.scaleY;

  // Update handlers
  const handleWidthChange = useCallback(
    (value: number[]) => {
      const newScaleX = value[0];
      onTransformChange({
        ...transform,
        scaleX: newScaleX,
        scaleY: isLocked ? newScaleX : transform.scaleY,
      });
    },
    [transform, onTransformChange, isLocked]
  );

  const handleDepthChange = useCallback(
    (value: number[]) => {
      const newScaleY = value[0];
      onTransformChange({
        ...transform,
        scaleY: newScaleY,
        scaleX: isLocked ? newScaleY : transform.scaleX,
      });
    },
    [transform, onTransformChange, isLocked]
  );

  const handleHeightChange = useCallback(
    (value: number[]) => {
      onTransformChange({
        ...transform,
        scaleZ: value[0],
      });
    },
    [transform, onTransformChange]
  );

  const handleLockToggle = useCallback(() => {
    if (!isLocked) {
      // When locking, average the scales
      const avg = (transform.scaleX + transform.scaleY) / 2;
      onTransformChange({
        ...transform,
        scaleX: avg,
        scaleY: avg,
      });
    }
  }, [transform, onTransformChange, isLocked]);

  const handleReset = useCallback(() => {
    onTransformChange({
      ...transform,
      scaleX: 1.0,
      scaleY: 1.0,
      scaleZ: 1.0,
    });
  }, [transform, onTransformChange]);

  const handleFitToEnvelope = useCallback(() => {
    if (!constraints) return;

    // Calculate max scale that fits all constraints
    const maxCoverageScale = Math.sqrt(
      (constraints.parcelSqft * constraints.maxCoveragePct) /
        100 /
        (model.base_width_ft * model.base_depth_ft)
    );
    const maxHeightScale = constraints.maxHeightFt / model.base_height_ft;

    // Use 90% of max to leave buffer
    const safeScale = Math.min(maxCoverageScale, maxHeightScale, model.max_scale) * 0.9;

    onTransformChange({
      ...transform,
      scaleX: safeScale,
      scaleY: safeScale,
      scaleZ: Math.min(maxHeightScale * 0.9, model.max_scale),
    });
  }, [constraints, model, transform, onTransformChange]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Scale & Dimensions</h4>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset to default</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {constraints && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleFitToEnvelope}
                  >
                    <Maximize2 className="h-3.5 w-3.5 mr-1" />
                    Fit
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fit to regulatory envelope (90%)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Width slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs flex items-center gap-1.5">
            <MoveHorizontal className="h-3.5 w-3.5" />
            Width
          </Label>
          <span className="text-xs font-mono text-muted-foreground">
            {Math.round(dimensions.widthFt)} ft
          </span>
        </div>
        <Slider
          value={[transform.scaleX]}
          onValueChange={handleWidthChange}
          min={model.min_scale}
          max={model.max_scale}
          step={0.05}
          className="w-full"
        />
      </div>

      {/* Depth slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs flex items-center gap-1.5">
            <MoveVertical className="h-3.5 w-3.5" />
            Depth
          </Label>
          <span className="text-xs font-mono text-muted-foreground">
            {Math.round(dimensions.depthFt)} ft
          </span>
        </div>
        <Slider
          value={[transform.scaleY]}
          onValueChange={handleDepthChange}
          min={model.min_scale}
          max={model.max_scale}
          step={0.05}
          className="w-full"
        />
      </div>

      {/* Lock aspect ratio */}
      <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
        <Label className="text-xs flex items-center gap-1.5 cursor-pointer">
          {isLocked ? (
            <Lock className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          Lock aspect ratio
        </Label>
        <Switch checked={isLocked} onCheckedChange={handleLockToggle} />
      </div>

      {/* Height slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs flex items-center gap-1.5">
            <ArrowsUpFromLine className="h-3.5 w-3.5" />
            Height
          </Label>
          <span className="text-xs font-mono text-muted-foreground">
            {Math.round(dimensions.heightFt)} ft
          </span>
        </div>
        <Slider
          value={[transform.scaleZ]}
          onValueChange={handleHeightChange}
          min={model.min_scale}
          max={model.max_scale}
          step={0.05}
          className="w-full"
        />
      </div>

      {/* Metrics summary */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
        <div className="text-xs">
          <span className="text-muted-foreground">Footprint</span>
          <p className="font-medium">{dimensions.footprintSqft.toLocaleString()} SF</p>
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground">GFA</span>
          <p className="font-medium">{dimensions.gfa.toLocaleString()} SF</p>
        </div>
      </div>

      {/* Compliance indicators */}
      {compliance && (
        <div className="space-y-2 pt-2 border-t">
          <h5 className="text-xs font-medium text-muted-foreground">Compliance</h5>
          
          <ComplianceRow
            label="Height"
            value={`${Math.round(compliance.height.value)} ft`}
            max={`${compliance.height.max} ft`}
            pct={compliance.height.pct}
            ok={compliance.height.ok}
          />
          
          <ComplianceRow
            label="Coverage"
            value={`${compliance.coverage.value.toFixed(1)}%`}
            max={`${compliance.coverage.max}%`}
            pct={compliance.coverage.pct}
            ok={compliance.coverage.ok}
          />
          
          <ComplianceRow
            label="FAR"
            value={compliance.far.value.toFixed(2)}
            max={compliance.far.max.toFixed(2)}
            pct={compliance.far.pct}
            ok={compliance.far.ok}
          />
        </div>
      )}
    </div>
  );
}

interface ComplianceRowProps {
  label: string;
  value: string;
  max: string;
  pct: number;
  ok: boolean;
}

function ComplianceRow({ label, value, max, pct, ok }: ComplianceRowProps) {
  const isWarning = pct > 90 && ok;
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 text-xs text-muted-foreground">{label}</div>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            ok
              ? isWarning
                ? 'bg-yellow-500'
                : 'bg-green-500'
              : 'bg-destructive'
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex items-center gap-1 min-w-[80px] justify-end">
        <span className="text-[10px] font-mono">
          {value} / {max}
        </span>
        {ok ? (
          isWarning ? (
            <AlertTriangle className="h-3 w-3 text-yellow-500" />
          ) : (
            <CheckCircle2 className="h-3 w-3 text-green-500" />
          )
        ) : (
          <AlertTriangle className="h-3 w-3 text-destructive" />
        )}
      </div>
    </div>
  );
}
