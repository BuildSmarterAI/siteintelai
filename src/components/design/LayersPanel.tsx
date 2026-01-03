/**
 * SiteIntel™ Design Mode - Layers Panel
 * 
 * Google Earth-style collapsible layers panel for toggling visibility
 * of 3D buildings, terrain, shadows, and design variants.
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Layers,
  Building2,
  Mountain,
  Sun,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDesignStore } from "@/stores/useDesignStore";

interface LayersPanelProps {
  className?: string;
  show3DBuildings?: boolean;
  onToggle3DBuildings?: (enabled: boolean) => void;
  showTerrain?: boolean;
  onToggleTerrain?: (enabled: boolean) => void;
}

// Variant colors for multi-variant display
const VARIANT_COLORS = [
  { name: "Orange", bg: "bg-[#FF7A00]", hex: "#FF7A00" },
  { name: "Gold", bg: "bg-yellow-400", hex: "#FACC15" },
  { name: "Cyan", bg: "bg-cyan-400", hex: "#22D3EE" },
  { name: "Pink", bg: "bg-pink-400", hex: "#F472B6" },
  { name: "Lime", bg: "bg-lime-400", hex: "#A3E635" },
];

export function LayersPanel({
  className,
  show3DBuildings = true,
  onToggle3DBuildings,
  showTerrain = false,
  onToggleTerrain,
}: LayersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    variants, 
    activeVariantId,
    setActiveVariantId,
    shadowsEnabled,
    basemap,
    setBasemap,
  } = useDesignStore();

  // Track visible variants (for future multi-variant display)
  const [visibleVariants, setVisibleVariants] = useState<Set<string>>(
    new Set(variants.map(v => v.id))
  );

  const toggleVariantVisibility = (variantId: string) => {
    setVisibleVariants(prev => {
      const next = new Set(prev);
      if (next.has(variantId)) {
        next.delete(variantId);
      } else {
        next.add(variantId);
      }
      return next;
    });
  };

  const isGoogle3D = basemap === "google-3d";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "bg-background/95 backdrop-blur-sm rounded-xl border shadow-lg",
        "transition-all duration-200",
        isOpen ? "w-56" : "w-auto",
        className
      )}>
        {/* Toggle Button */}
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full flex items-center gap-2 justify-between px-3 py-2 h-auto",
              "hover:bg-muted/50"
            )}
          >
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Layers</span>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3">
            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Map Layers Section */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Map
              </span>
              
              {/* 3D Buildings Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="3d-buildings" className="text-sm cursor-pointer">
                    3D Buildings
                  </Label>
                </div>
                <Switch
                  id="3d-buildings"
                  checked={isGoogle3D}
                  onCheckedChange={(checked) => {
                    setBasemap(checked ? "google-3d" : "satellite");
                    onToggle3DBuildings?.(checked);
                  }}
                />
              </div>

              {/* Terrain Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mountain className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="terrain" className="text-sm cursor-pointer">
                    Terrain
                  </Label>
                </div>
                <Switch
                  id="terrain"
                  checked={showTerrain}
                  onCheckedChange={onToggleTerrain}
                />
              </div>

              {/* Shadows Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="shadows" className="text-sm cursor-pointer">
                    Shadows
                  </Label>
                </div>
                <Switch
                  id="shadows"
                  checked={shadowsEnabled}
                  disabled
                />
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Design Variants Section */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Design Variants
              </span>
              
              {variants.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No variants yet
                </p>
              ) : (
                <div className="space-y-1.5">
                  {variants.map((variant, index) => {
                    const color = VARIANT_COLORS[index % VARIANT_COLORS.length];
                    const isActive = variant.id === activeVariantId;
                    const isVisible = visibleVariants.has(variant.id);
                    
                    return (
                      <div
                        key={variant.id}
                        className={cn(
                          "flex items-center justify-between rounded-md px-2 py-1.5",
                          "transition-colors cursor-pointer",
                          isActive 
                            ? "bg-primary/10 border border-primary/20" 
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => setActiveVariantId(variant.id)}
                      >
                        <div className="flex items-center gap-2">
                          {/* Color chip */}
                          <div 
                            className={cn(
                              "w-3 h-3 rounded-sm border border-white/30",
                              color.bg
                            )}
                          />
                          <span className={cn(
                            "text-sm truncate max-w-[100px]",
                            isActive ? "font-medium" : ""
                          )}>
                            {variant.name}
                          </span>
                        </div>
                        
                        {/* Visibility toggle */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVariantVisibility(variant.id);
                          }}
                        >
                          {isVisible ? (
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground/50" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default LayersPanel;
