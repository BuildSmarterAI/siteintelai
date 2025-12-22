import { Maximize2, Minimize2, Download, Box, Map, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface MapControlsProps {
  mapRef: React.MutableRefObject<any>;
  isFullscreen: boolean;
  is3DMode: boolean;
  basemapStyle: 'streets' | 'satellite' | 'hybrid';
  propertyAddress: string;
  onToggleFullscreen: () => void;
  onToggle3D: () => void;
  onToggleBasemap: () => void;
  onExportPNG: () => void;
}

/**
 * MapControls - Control buttons for map (fullscreen, 3D, basemap, export)
 * Extracted from MapLibreCanvas for better separation of concerns
 */
export function MapControls({
  mapRef,
  isFullscreen,
  is3DMode,
  basemapStyle,
  propertyAddress,
  onToggleFullscreen,
  onToggle3D,
  onToggleBasemap,
  onExportPNG,
}: MapControlsProps) {
  const basemapLabels = {
    streets: 'Streets',
    satellite: 'Satellite',
    hybrid: 'Hybrid',
  };

  return (
    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
      {/* Basemap Toggle */}
      <Button
        size="sm"
        variant="secondary"
        className="h-8 w-8 p-0 bg-background/95 backdrop-blur-sm shadow-lg"
        onClick={onToggleBasemap}
        title={`Switch basemap (current: ${basemapLabels[basemapStyle]})`}
      >
        <Map className="h-4 w-4" />
      </Button>

      {/* 3D Buildings Toggle */}
      <Button
        size="sm"
        variant={is3DMode ? 'default' : 'secondary'}
        className="h-8 w-8 p-0 bg-background/95 backdrop-blur-sm shadow-lg"
        onClick={onToggle3D}
        title={is3DMode ? 'Disable 3D buildings' : 'Enable 3D buildings'}
      >
        <Box className="h-4 w-4" />
      </Button>

      {/* Export PNG */}
      <Button
        size="sm"
        variant="secondary"
        className="h-8 w-8 p-0 bg-background/95 backdrop-blur-sm shadow-lg"
        onClick={onExportPNG}
        title="Export map as PNG"
      >
        <Download className="h-4 w-4" />
      </Button>

      {/* Fullscreen Toggle */}
      <Button
        size="sm"
        variant="secondary"
        className="h-8 w-8 p-0 bg-background/95 backdrop-blur-sm shadow-lg"
        onClick={onToggleFullscreen}
        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}

/**
 * Helper functions for map control actions
 * These can be used by the parent component
 */
export const mapControlHelpers = {
  /**
   * Export map canvas as PNG
   */
  exportMapAsPNG: (mapRef: any, propertyAddress: string) => {
    if (!mapRef?.current) return;

    try {
      const canvas = mapRef.current.getCanvas();
      const link = document.createElement('a');
      link.download = `SiteIntel_Map_${propertyAddress.replace(/\s+/g, '_')}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 2.0);
      link.click();
      toast.success('Map exported as PNG');
      logger.debug('MapControls', 'Map exported successfully');
    } catch (error) {
      logger.error('Failed to export map:', error);
      toast.error('Export failed');
    }
  },

  /**
   * Toggle 3D buildings layer
   */
  toggle3DBuildings: (mapRef: any, is3D: boolean): boolean => {
    if (!mapRef?.current) return is3D;

    const map = mapRef.current;
    const newState = !is3D;

    try {
      // Toggle 3D layer visibility
      if (map.getLayer('3d-buildings')) {
        map.setLayoutProperty('3d-buildings', 'visibility', newState ? 'visible' : 'none');
      }

      // Adjust pitch for 3D effect
      map.easeTo({
        pitch: newState ? 45 : 0,
        duration: 500,
      });

      toast.success(newState ? '3D buildings enabled' : '3D buildings disabled');
      logger.debug('MapControls', `3D mode: ${newState}`);
      return newState;
    } catch (error) {
      logger.error('Failed to toggle 3D mode:', error);
      return is3D;
    }
  },
};
