/**
 * Model Customization Step
 * Allows users to adjust scale, rotation, and position of selected 3D model
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useDesignStore } from '@/stores/useDesignStore';
import { useWizardStore } from '@/stores/useWizardStore';
import { useBuildingModel, DEFAULT_TRANSFORM, type ModelTransform } from '@/hooks/useBuildingModels';
import { ModelScaleControls } from '@/components/design/ModelScaleControls';
import { ModelRotationControl } from '@/components/design/ModelRotationControl';
import { ModelPositionControl } from '@/components/design/ModelPositionControl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  Box, 
  RotateCw, 
  Move,
  Ruler,
  Info,
} from 'lucide-react';
import * as turf from '@turf/turf';

export function ModelCustomizationStep() {
  const envelope = useDesignStore((s) => s.envelope);
  const { selectedModelId, modelTransform, setModelTransform } = useWizardStore();
  
  const { data: model, isLoading } = useBuildingModel(selectedModelId);

  // Calculate parcel sqft from envelope
  const parcelSqft = useMemo(() => {
    if (!envelope?.parcelGeometry) return 0;
    const parcelPolygon = turf.polygon(envelope.parcelGeometry.coordinates);
    const areaSqm = turf.area(parcelPolygon);
    return areaSqm * 10.7639; // Convert m² to ft²
  }, [envelope?.parcelGeometry]);

  // Constraints from envelope
  const constraints = useMemo(() => {
    if (!envelope) return undefined;
    return {
      maxHeightFt: envelope.heightCapFt,
      maxCoveragePct: envelope.coverageCapPct,
      maxFar: envelope.farCap,
      parcelSqft,
    };
  }, [envelope, parcelSqft]);

  // Initialize transform if needed
  useEffect(() => {
    if (!modelTransform) {
      setModelTransform(DEFAULT_TRANSFORM);
    }
  }, [modelTransform, setModelTransform]);

  const handleTransformChange = useCallback(
    (newTransform: ModelTransform) => {
      setModelTransform(newTransform);
    },
    [setModelTransform]
  );

  const handleRotationChange = useCallback(
    (degrees: number) => {
      if (modelTransform) {
        setModelTransform({ ...modelTransform, rotationDeg: degrees });
      }
    },
    [modelTransform, setModelTransform]
  );

  const handleOffsetChange = useCallback(
    (offsetX: number, offsetY: number) => {
      if (modelTransform) {
        setModelTransform({ ...modelTransform, offsetX, offsetY });
      }
    },
    [modelTransform, setModelTransform]
  );

  if (!selectedModelId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <Box className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">
          Select a 3D model in the previous step
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive/50 mb-4" />
        <p className="text-destructive">Model not found</p>
      </div>
    );
  }

  const transform = modelTransform || DEFAULT_TRANSFORM;

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="space-y-1 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Customize Model</h3>
          <Badge variant="outline" className="text-xs">
            {model.name}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Adjust dimensions, rotation, and position to fit your site.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex-shrink-0 p-3 rounded-lg bg-muted/50 border flex items-start gap-2">
        <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Changes are previewed in real-time on the 3D map. Use the tabs below to access different controls.
        </p>
      </div>

      {/* Tabbed controls */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        <Tabs defaultValue="scale" className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-9">
            <TabsTrigger value="scale" className="text-xs">
              <Ruler className="h-3.5 w-3.5 mr-1" />
              Scale
            </TabsTrigger>
            <TabsTrigger value="rotate" className="text-xs">
              <RotateCw className="h-3.5 w-3.5 mr-1" />
              Rotate
            </TabsTrigger>
            <TabsTrigger value="position" className="text-xs">
              <Move className="h-3.5 w-3.5 mr-1" />
              Position
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scale" className="mt-4">
            <ModelScaleControls
              model={model}
              transform={transform}
              onTransformChange={handleTransformChange}
              constraints={constraints}
            />
          </TabsContent>

          <TabsContent value="rotate" className="mt-4">
            <ModelRotationControl
              rotationDeg={transform.rotationDeg}
              onRotationChange={handleRotationChange}
            />
          </TabsContent>

          <TabsContent value="position" className="mt-4">
            <ModelPositionControl
              offsetX={transform.offsetX}
              offsetY={transform.offsetY}
              onOffsetChange={handleOffsetChange}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Disclaimer */}
      <div className="flex-shrink-0 pt-2 border-t">
        <p className="text-[10px] text-muted-foreground text-center">
          3D preview is conceptual — verify with architect before finalizing
        </p>
      </div>
    </div>
  );
}
