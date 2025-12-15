import { useState, useCallback, useEffect } from 'react';
import { 
  MAP_PRESETS, 
  DEFAULT_PRESET, 
  MapLayerPreset,
  LAYER_IDS,
  getVisibleLayers 
} from '@/lib/mapPresets';

interface HighlightedFeature {
  type: string;
  id: string;
  geometry?: any;
}

interface UseMapPresetsOptions {
  initialPreset?: string;
  onPresetChange?: (preset: MapLayerPreset) => void;
  persistToStorage?: boolean;
}

interface UseMapPresetsReturn {
  activePresetId: string;
  activePreset: MapLayerPreset;
  setPreset: (presetId: string) => void;
  resetToDecisionMode: () => void;
  highlightedFeatures: HighlightedFeature[];
  highlightKillFactor: (factorId: string, geometry?: any) => void;
  clearHighlights: () => void;
  getLayerVisibility: () => Record<string, boolean>;
  isLayerEnabled: (layerId: string) => boolean;
}

const STORAGE_KEY = 'siteintel_map_preset';

/**
 * useMapPresets - Manages map layer presets for decision-driven visualization
 * 
 * Features:
 * - Preset switching with clean state reset
 * - Kill-factor geometry highlighting
 * - Layer visibility management
 * - Persistent preset preference
 */
export function useMapPresets(options: UseMapPresetsOptions = {}): UseMapPresetsReturn {
  const { 
    initialPreset = DEFAULT_PRESET, 
    onPresetChange,
    persistToStorage = true 
  } = options;

  // Load from storage or use default
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    if (persistToStorage) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && MAP_PRESETS[stored]) {
        return stored;
      }
    }
    return initialPreset;
  });

  const [highlightedFeatures, setHighlightedFeatures] = useState<HighlightedFeature[]>([]);

  // Get the active preset object
  const activePreset = MAP_PRESETS[activePresetId] || MAP_PRESETS[DEFAULT_PRESET];

  // Persist to localStorage
  useEffect(() => {
    if (persistToStorage) {
      localStorage.setItem(STORAGE_KEY, activePresetId);
    }
  }, [activePresetId, persistToStorage]);

  /**
   * Switch to a new preset
   * Clears highlights and resets map state
   */
  const setPreset = useCallback((presetId: string) => {
    if (!MAP_PRESETS[presetId]) {
      console.warn(`[useMapPresets] Unknown preset: ${presetId}`);
      return;
    }

    // Clear any existing highlights
    setHighlightedFeatures([]);
    
    // Update preset
    setActivePresetId(presetId);
    
    // Notify callback
    const newPreset = MAP_PRESETS[presetId];
    onPresetChange?.(newPreset);

    console.log(`[useMapPresets] Switched to preset: ${presetId}`, {
      layersOn: newPreset.layers.on,
      layersOff: newPreset.layers.off,
    });
  }, [onPresetChange]);

  /**
   * Reset to Decision Mode (default)
   */
  const resetToDecisionMode = useCallback(() => {
    setPreset(DEFAULT_PRESET);
  }, [setPreset]);

  /**
   * Highlight a kill-factor's geometry on the map
   */
  const highlightKillFactor = useCallback((factorId: string, geometry?: any) => {
    // Map factor IDs to layer types
    const factorToLayerMap: Record<string, string> = {
      'floodway': LAYER_IDS.floodway,
      'flood_zone': LAYER_IDS.floodZones,
      'wetlands': LAYER_IDS.wetlands,
      'utilities': LAYER_IDS.utilityBuffers,
      'environmental': LAYER_IDS.environmental,
    };

    const layerType = factorToLayerMap[factorId] || factorId;

    setHighlightedFeatures(prev => {
      // Check if already highlighted
      const exists = prev.some(f => f.id === factorId);
      if (exists) {
        // Toggle off
        return prev.filter(f => f.id !== factorId);
      }
      // Add highlight
      return [...prev, { type: layerType, id: factorId, geometry }];
    });
  }, []);

  /**
   * Clear all highlights
   */
  const clearHighlights = useCallback(() => {
    setHighlightedFeatures([]);
  }, []);

  /**
   * Get layer visibility object for MapLibreCanvas
   */
  const getLayerVisibility = useCallback((): Record<string, boolean> => {
    const visibility: Record<string, boolean> = {};
    
    // Set all layers off first
    Object.values(LAYER_IDS).forEach(layerId => {
      visibility[layerId] = false;
    });

    // Enable layers from current preset
    activePreset.layers.on.forEach(layerId => {
      visibility[layerId] = true;
    });

    return visibility;
  }, [activePreset]);

  /**
   * Check if a specific layer is enabled in current preset
   */
  const isLayerEnabled = useCallback((layerId: string): boolean => {
    return activePreset.layers.on.includes(layerId);
  }, [activePreset]);

  return {
    activePresetId,
    activePreset,
    setPreset,
    resetToDecisionMode,
    highlightedFeatures,
    highlightKillFactor,
    clearHighlights,
    getLayerVisibility,
    isLayerEnabled,
  };
}
