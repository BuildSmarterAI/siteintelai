/**
 * Building Type Selector Step
 * Step 3: Select a building archetype, pick a 3D model, and preview on the canvas
 */

import { useEffect, useMemo, useState } from 'react';
import { useDesignStore } from '@/stores/useDesignStore';
import { useWizardStore } from '@/stores/useWizardStore';
import { getAllArchetypes, getArchetypeById } from '@/lib/archetypes/buildingTypeRegistry';
import { generateBuildingPreview } from '@/lib/geometry/generateBuildingPreview';
import { BuildingTypeCard } from './BuildingTypeCard';
import { BuildingModelGallery } from './BuildingModelGallery';
import { IntensityToggle } from './IntensityToggle';
import { OrientationToggle } from './OrientationToggle';
import { ParkingModeSelector } from './ParkingModeSelector';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Info, Box } from 'lucide-react';
import * as turf from '@turf/turf';

export function BuildingTypeSelectorStep() {
  const envelope = useDesignStore((s) => s.envelope);
  const setPreviewGeometry = useDesignStore((s) => s.setPreviewGeometry);
  
  const {
    buildingTypeId,
    intensity,
    orientation,
    parkingMode,
    selectedModelId,
    setBuildingType,
    setIntensity,
    setOrientation,
    setParkingMode,
    setSelectedModel,
  } = useWizardStore();

  // Track view mode: 'archetypes' or 'models'
  const [viewMode, setViewMode] = useState<'archetypes' | 'models'>(
    buildingTypeId ? 'models' : 'archetypes'
  );

  const archetypes = useMemo(() => getAllArchetypes(), []);
  const selectedArchetype = useMemo(
    () => (buildingTypeId ? getArchetypeById(buildingTypeId) : null),
    [buildingTypeId]
  );

  // Calculate parcel sqft from envelope
  const parcelSqft = useMemo(() => {
    if (!envelope?.parcelGeometry) return 0;
    const parcelPolygon = turf.polygon(envelope.parcelGeometry.coordinates);
    const areaSqm = turf.area(parcelPolygon);
    return areaSqm * 10.7639; // Convert m² to ft²
  }, [envelope?.parcelGeometry]);

  // Generate preview when selection or parameters change
  useEffect(() => {
    if (!selectedArchetype || !envelope) {
      setPreviewGeometry({ 
        footprint: null, 
        heightFt: null, 
        stories: null,
        metrics: null,
      });
      return;
    }

    const result = generateBuildingPreview({
      envelope: {
        buildableFootprint2d: envelope.buildableFootprint2d,
        heightCapFt: envelope.heightCapFt,
        farCap: envelope.farCap,
        coverageCapPct: envelope.coverageCapPct,
        parcelSqft,
      },
      archetype: selectedArchetype,
      intensity,
      orientation,
    });

    setPreviewGeometry({
      footprint: result.footprint,
      heightFt: result.heightFt,
      stories: result.stories,
      metrics: result.isValid
        ? {
            gfa: result.gfa,
            far: result.far,
            coveragePct: result.coveragePct,
          }
        : null,
    });
  }, [buildingTypeId, intensity, orientation, envelope, selectedArchetype, parcelSqft, setPreviewGeometry]);

  // Switch to models view when archetype is selected
  useEffect(() => {
    if (buildingTypeId && viewMode === 'archetypes') {
      setViewMode('models');
    }
  }, [buildingTypeId, viewMode]);

  // Get current preview metrics
  const previewMetrics = useDesignStore((s) => s.previewMetrics);
  const previewStories = useDesignStore((s) => s.previewStories);
  const previewHeightFt = useDesignStore((s) => s.previewHeightFt);

  // Handle archetype change (back button)
  const handleChangeArchetype = () => {
    setViewMode('archetypes');
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="space-y-1 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {viewMode === 'archetypes' ? 'Building Type' : '3D Model Selection'}
          </h3>
          {selectedArchetype && viewMode === 'models' && (
            <button
              onClick={handleChangeArchetype}
              className="text-xs text-primary hover:underline"
            >
              Change type
            </button>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          {viewMode === 'archetypes' 
            ? 'Select a building archetype to preview on your site.'
            : `Choose a 3D model for your ${selectedArchetype?.name || 'building'}.`
          }
        </p>
      </div>

      {/* Selected Archetype Badge (when in models view) */}
      {selectedArchetype && viewMode === 'models' && (
        <div className="flex-shrink-0 flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
          <Box className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{selectedArchetype.name}</span>
          <Badge variant="outline" className="text-[10px] ml-auto">
            {selectedArchetype.category}
          </Badge>
        </div>
      )}

      {/* Preview Metrics (when type selected) */}
      {selectedArchetype && previewMetrics && (
        <div className="flex-shrink-0 p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Preview Metrics</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">GFA</span>
              <p className="font-medium">{previewMetrics.gfa.toLocaleString()} SF</p>
            </div>
            <div>
              <span className="text-muted-foreground">FAR</span>
              <p className="font-medium">{previewMetrics.far.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Coverage</span>
              <p className="font-medium">{previewMetrics.coveragePct}%</p>
            </div>
            <div>
              <span className="text-muted-foreground">Height</span>
              <p className="font-medium">{previewStories} fl / {previewHeightFt} ft</p>
            </div>
          </div>
        </div>
      )}

      {/* Envelope Warning */}
      {!envelope && (
        <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-700 dark:text-yellow-500">
              Regulatory envelope required for preview
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        {viewMode === 'archetypes' ? (
          /* Building Type Cards */
          <div className="grid grid-cols-1 gap-2 pb-4">
            {archetypes.map((archetype) => (
              <BuildingTypeCard
                key={archetype.id}
                archetype={archetype}
                isSelected={buildingTypeId === archetype.id}
                onSelect={() => setBuildingType(archetype.id)}
              />
            ))}
          </div>
        ) : (
          /* 3D Model Gallery */
          <div className="space-y-4 pb-4">
            <BuildingModelGallery
              archetypeId={buildingTypeId}
              selectedModelId={selectedModelId}
              onSelectModel={setSelectedModel}
            />
          </div>
        )}
      </div>

      {/* Controls (visible when type selected) */}
      {buildingTypeId && (
        <div className="flex-shrink-0 space-y-4 pt-4 border-t">
          <IntensityToggle value={intensity} onChange={setIntensity} />
          <OrientationToggle value={orientation} onChange={setOrientation} />
          <ParkingModeSelector value={parkingMode} onChange={setParkingMode} />
        </div>
      )}

      {/* Preview Disclaimer */}
      <div className="flex-shrink-0 pt-2">
        <p className="text-[10px] text-muted-foreground text-center">
          Conceptual Preview — Not a Final Design
        </p>
      </div>
    </div>
  );
}
