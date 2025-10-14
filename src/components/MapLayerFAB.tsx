import { useState } from 'react';
import { Layers, Eye, EyeOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LayerVisibility {
  parcel: boolean;
  flood: boolean;
  utilities: boolean;
  traffic: boolean;
  employment: boolean;
  drawnParcels: boolean;
}

interface MapLayerFABProps {
  layerVisibility: LayerVisibility;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
  hasFlood: boolean;
  hasUtilities: boolean;
  hasTraffic: boolean;
  hasEmployment: boolean;
  hasDrawnParcels: boolean;
}

/**
 * MapLayerFAB - Floating Action Button for mobile layer controls
 * 
 * Touch-optimized radial menu with 48px minimum touch targets
 * Renders only on mobile/tablet viewports (<1024px)
 * 
 * @accessibility 48px touch targets, clear labels, keyboard nav
 */
export function MapLayerFAB({
  layerVisibility,
  onToggleLayer,
  hasFlood,
  hasUtilities,
  hasTraffic,
  hasEmployment,
  hasDrawnParcels,
}: MapLayerFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const layers = [
    { key: 'parcel' as const, label: 'Parcel', show: true },
    { key: 'flood' as const, label: 'Flood Zones', show: hasFlood },
    { key: 'utilities' as const, label: 'Utilities', show: hasUtilities },
    { key: 'traffic' as const, label: 'Traffic', show: hasTraffic },
    { key: 'employment' as const, label: 'Employment', show: hasEmployment },
    { key: 'drawnParcels' as const, label: 'Drawn Parcels', show: hasDrawnParcels },
  ].filter(layer => layer.show);

  return (
    <div className="lg:hidden fixed bottom-6 right-6 z-20">
      {/* Radial Menu */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 p-2 bg-background/95 backdrop-blur-sm shadow-xl animate-scale-in min-w-[200px]">
          <div className="flex items-center justify-between mb-2 pb-2 border-b px-2">
            <span className="text-sm font-semibold">Map Layers</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {layers.map(layer => (
              <Button
                key={layer.key}
                variant={layerVisibility[layer.key] ? "default" : "outline"}
                size="sm"
                onClick={() => onToggleLayer(layer.key)}
                className="w-full justify-start gap-3 h-12 text-left"
              >
                {layerVisibility[layer.key] ? (
                  <Eye className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <EyeOff className="h-5 w-5 flex-shrink-0" />
                )}
                <span className="flex-1">{layer.label}</span>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* FAB Toggle Button - 56px for comfortable thumb reach */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
        aria-label="Toggle map layers"
      >
        <Layers className="h-6 w-6" />
      </Button>
    </div>
  );
}
