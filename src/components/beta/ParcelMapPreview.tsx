import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ParcelMapPreviewProps {
  layers?: string[];
}

export const ParcelMapPreview = ({ layers = ["zoning", "flood", "utilities"] }: ParcelMapPreviewProps) => {
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    zoning: true,
    flood: true,
    utilities: true
  });
  const [copied, setCopied] = useState(false);
  
  const coordinates = "29.7604° N, 95.3698° W";
  
  const handleCopy = () => {
    navigator.clipboard.writeText(coordinates);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const layerConfig = {
    zoning: { color: "rgba(34, 197, 94, 0.3)", label: "Zoning" },
    flood: { color: "rgba(59, 130, 246, 0.3)", label: "Flood Zone" },
    utilities: { color: "rgba(255, 122, 0, 0.3)", label: "Utilities" }
  };
  
  return (
    <div className="space-y-4">
      {/* Map Preview Area */}
      <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
        {/* Static map representation */}
        <div className="w-full h-full bg-gradient-to-br from-muted-foreground/5 to-muted-foreground/10 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-sm mb-2">Interactive Parcel Preview</div>
            <div className="text-xs opacity-60">Live map integration in production</div>
          </div>
        </div>
        
        {/* Layer Overlays */}
        {Object.entries(activeLayers).map(([layer, active]) => 
          active && layerConfig[layer as keyof typeof layerConfig] ? (
            <div
              key={layer}
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{ backgroundColor: layerConfig[layer as keyof typeof layerConfig].color }}
            />
          ) : null
        )}
        
        {/* Parcel Boundary */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-2/3 h-2/3 border-2 border-primary rounded-sm animate-pulse" />
        </div>
      </div>
      
      {/* Layer Controls */}
      <div className="grid grid-cols-3 gap-4">
        {layers.map(layer => (
          <div key={layer} className="flex items-center space-x-2">
            <Switch
              id={`layer-${layer}`}
              checked={activeLayers[layer]}
              onCheckedChange={(checked) => 
                setActiveLayers(prev => ({ ...prev, [layer]: checked }))
              }
            />
            <Label 
              htmlFor={`layer-${layer}`}
              className="text-sm cursor-pointer"
            >
              {layerConfig[layer as keyof typeof layerConfig]?.label || layer}
            </Label>
          </div>
        ))}
      </div>
      
      {/* Coordinates Display */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
        <code className="text-sm font-mono text-muted-foreground">{coordinates}</code>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-8 w-8 p-0"
          aria-label="Copy coordinates"
        >
          {copied ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
