import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MapLibreCanvas } from "@/components/MapLibreCanvas";
import { PresetSelector } from "./PresetSelector";
import { useMapPresets } from "@/hooks/useMapPresets";
import { MAP_PRESETS, LAYER_IDS } from "@/lib/mapPresets";
import { KillFactorItem } from "./KillFactorPanel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Map, Layers, AlertTriangle } from "lucide-react";

interface DecisionMapProps {
  center: [number, number];
  zoom?: number;
  parcel?: any;
  floodZones?: any[];
  utilities?: any[];
  waterLines?: any[];
  sewerLines?: any[];
  stormLines?: any[];
  wetlands?: any[];
  zoningDistricts?: any[];
  traffic?: any[];
  drawnParcels?: any[];
  killFactors?: {
    dealKillers: KillFactorItem[];
    conditionalRisks: KillFactorItem[];
    advisoryNotes: KillFactorItem[];
  };
  onKillFactorClick?: (factorId: string) => void;
  onGeometryClick?: (type: string, feature: any) => void;
  className?: string;
  propertyAddress?: string;
}

/**
 * DecisionMap - PRD-compliant map wrapper for report viewer
 * 
 * Features:
 * - Preset-based layer control (max 3-4 layers)
 * - Kill-factor ↔ geometry bidirectional sync
 * - No free-form layer toggles
 * - Decision Mode loads by default
 */
export function DecisionMap({
  center,
  zoom = 15,
  parcel,
  floodZones = [],
  utilities = [],
  waterLines = [],
  sewerLines = [],
  stormLines = [],
  wetlands = [],
  zoningDistricts = [],
  traffic = [],
  drawnParcels = [],
  killFactors,
  onKillFactorClick,
  onGeometryClick,
  className,
  propertyAddress,
}: DecisionMapProps) {
  const mapRef = useRef<any>(null);
  
  // Preset management
  const {
    activePresetId,
    activePreset,
    setPreset,
    resetToDecisionMode,
    highlightedFeatures,
    highlightKillFactor,
    clearHighlights,
    getLayerVisibility,
    isLayerEnabled,
  } = useMapPresets({
    onPresetChange: (preset) => {
      console.log('[DecisionMap] Preset changed:', preset.id);
    },
  });

  // Convert preset layer visibility to MapLibreCanvas format
  const getMapLayerVisibility = useCallback(() => {
    const visibility = getLayerVisibility();
    
    // Map to MapLibreCanvas layer names
    return {
      parcel: visibility[LAYER_IDS.parcel] ?? true,
      flood: visibility[LAYER_IDS.floodZones] ?? false,
      floodZones: visibility[LAYER_IDS.floodZones] ?? false,
      wetlands: visibility[LAYER_IDS.wetlands] ?? false,
      utilities: visibility[LAYER_IDS.waterLines] || visibility[LAYER_IDS.sewerLines] || visibility[LAYER_IDS.utilityBuffers],
      waterLines: visibility[LAYER_IDS.waterLines] ?? false,
      sewerLines: visibility[LAYER_IDS.sewerLines] ?? false,
      stormLines: visibility[LAYER_IDS.stormLines] ?? false,
      zoningDistricts: visibility[LAYER_IDS.zoningDistricts] ?? false,
      traffic: visibility[LAYER_IDS.trafficCounts] ?? false,
      drawnParcels: true, // Always show user's drawn parcels
      hcadParcels: false, // Controlled by preset
      stormManholes: false,
      forceMain: false,
      employment: false,
      topography: false,
    };
  }, [getLayerVisibility]);

  // Handle geometry click from map - sync to kill-factors
  const handleGeometryClick = useCallback((type: string, feature: any) => {
    console.log('[DecisionMap] Geometry clicked:', type, feature);
    
    // Notify parent
    onGeometryClick?.(type, feature);
    
    // If sync is enabled for this preset, scroll to related section
    if (activePreset.interactionRules.syncWithKillFactors) {
      // Map geometry types to section IDs
      const sectionMap: Record<string, string> = {
        flood: 'section-flood',
        floodway: 'section-flood',
        wetlands: 'section-environmental',
        utilities: 'section-utilities',
        zoning: 'section-zoning',
      };
      
      const sectionId = sectionMap[type];
      if (sectionId) {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [activePreset, onGeometryClick]);

  // Handle kill-factor click - highlight on map
  const handleKillFactorHighlight = useCallback((factorId: string) => {
    highlightKillFactor(factorId);
    onKillFactorClick?.(factorId);
  }, [highlightKillFactor, onKillFactorClick]);

  // Count active layers for display
  const activeLayerCount = activePreset.layers.on.length;

  return (
    <Card className={cn(
      "overflow-hidden border-[hsl(var(--border-subtle))]",
      "bg-[hsl(var(--surface-default))]",
      className
    )}>
      {/* Header with preset selector */}
      <div className="p-4 border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-raised))]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-[hsl(var(--primary))]" />
            <h3 className="font-semibold text-foreground">Decision Map</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className="text-xs bg-[hsl(var(--surface-sunken))]"
            >
              <Layers className="h-3 w-3 mr-1" />
              {activeLayerCount} layers
            </Badge>
            
            {highlightedFeatures.length > 0 && (
              <Badge 
                variant="outline" 
                className="text-xs border-[hsl(var(--primary)/0.3)] text-[hsl(var(--primary))]"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {highlightedFeatures.length} highlighted
              </Badge>
            )}
          </div>
        </div>
        
        <PresetSelector
          activePresetId={activePresetId}
          onPresetChange={setPreset}
          onResetToDefault={resetToDecisionMode}
        />
      </div>

      {/* Map container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative h-[400px] md:h-[500px]"
      >
        <MapLibreCanvas
          center={center}
          zoom={activePreset.defaultZoom || zoom}
          parcel={parcel}
          floodZones={isLayerEnabled(LAYER_IDS.floodZones) ? floodZones : []}
          waterLines={isLayerEnabled(LAYER_IDS.waterLines) ? waterLines : []}
          sewerLines={isLayerEnabled(LAYER_IDS.sewerLines) ? sewerLines : []}
          stormLines={isLayerEnabled(LAYER_IDS.stormLines) ? stormLines : []}
          zoningDistricts={isLayerEnabled(LAYER_IDS.zoningDistricts) ? zoningDistricts : []}
          traffic={isLayerEnabled(LAYER_IDS.trafficCounts) ? traffic : []}
          drawnParcels={drawnParcels}
          propertyAddress={propertyAddress}
          className="w-full h-full"
          intentType={null}
        />

        {/* Overlay: Advisory warning for market context */}
        {activePresetId === 'market_context' && (
          <div className="absolute bottom-4 left-4 right-4 bg-[hsl(var(--verdict-conditional-bg))] border border-[hsl(var(--verdict-conditional)/0.3)] rounded-lg p-3 backdrop-blur-sm">
            <p className="text-xs text-[hsl(var(--verdict-conditional))] font-medium">
              ⚠️ Advisory Only: Market data does not override feasibility constraints.
            </p>
          </div>
        )}

        {/* Overlay: Layer count limit reminder */}
        {activeLayerCount > 4 && (
          <div className="absolute top-4 right-4 bg-[hsl(var(--verdict-blocked-bg))] border border-[hsl(var(--verdict-blocked)/0.3)] rounded-lg p-2">
            <p className="text-xs text-[hsl(var(--verdict-blocked))]">
              Warning: More than 4 layers active
            </p>
          </div>
        )}
      </motion.div>

      {/* Footer with data sources */}
      <div className="px-4 py-2 bg-[hsl(var(--surface-sunken))] border-t border-[hsl(var(--border-subtle))]">
        <p className="text-[10px] text-muted-foreground">
          Data: FEMA NFHL, TxDOT, County CAD, City GIS • 
          Preset: <span className="font-medium">{activePreset.label}</span>
        </p>
      </div>
    </Card>
  );
}
