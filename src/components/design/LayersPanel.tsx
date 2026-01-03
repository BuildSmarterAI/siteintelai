/**
 * SiteIntel™ Design Mode - Layers Panel
 * 
 * Google Earth-style collapsible layers panel for toggling visibility
 * of 3D buildings, terrain, shadows, and design variants.
 * Enhanced with smooth framer-motion animations.
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Layers,
  Building2,
  Mountain,
  Sun,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  EyeIcon,
  PersonStanding,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDesignStore } from "@/stores/useDesignStore";
import { motion, AnimatePresence } from "framer-motion";
import { VARIANT_COLORS } from "@/lib/cesiumGeometry";

interface LayersPanelProps {
  className?: string;
  show3DBuildings?: boolean;
  onToggle3DBuildings?: (enabled: boolean) => void;
  showTerrain?: boolean;
  onToggleTerrain?: (enabled: boolean) => void;
  onEnterStreetView?: () => void;
}

// Map Cesium colors to Tailwind-safe hex values
const VARIANT_COLOR_HEX = [
  "#FF7A00", // Orange
  "#FACC15", // Gold  
  "#22D3EE", // Cyan
  "#F472B6", // Pink
  "#A3E635", // Lime
];

export function LayersPanel({
  className,
  show3DBuildings = true,
  onToggle3DBuildings,
  showTerrain = false,
  onToggleTerrain,
  onEnterStreetView,
}: LayersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    variants, 
    activeVariantId,
    setActiveVariantId,
    shadowsEnabled,
    basemap,
    setBasemap,
    buildings3dSource,
    setBuildings3dSource,
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

  const showAllVariants = () => {
    setVisibleVariants(new Set(variants.map(v => v.id)));
  };

  const hideAllVariants = () => {
    setVisibleVariants(new Set());
  };

  const isBuildings3dEnabled = buildings3dSource !== "none";
  const isGoogle3D = basemap === "google-3d";

  return (
    <div className={cn(
      "bg-background/95 backdrop-blur-md rounded-xl border shadow-xl overflow-hidden",
      "transition-all duration-300 ease-out",
      isOpen ? "w-60" : "w-auto",
      className
    )}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-2 justify-between px-3 py-2.5 h-auto",
          "hover:bg-muted/50 transition-colors"
        )}
      >
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Layers</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Divider */}
              <div className="h-px bg-border" />

              {/* Map Layers Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Map Layers
                </span>
                
                {/* 3D Buildings Toggle */}
                <motion.div 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "p-1.5 rounded-md",
                      isBuildings3dEnabled ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Building2 className={cn(
                        "h-3.5 w-3.5",
                        isBuildings3dEnabled ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <Label htmlFor="3d-buildings" className="text-sm cursor-pointer">
                      3D Buildings
                    </Label>
                    {isBuildings3dEnabled && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {buildings3dSource === "google" ? "Google" : "OSM"}
                      </span>
                    )}
                  </div>
                  <Switch
                    id="3d-buildings"
                    checked={isBuildings3dEnabled}
                    onCheckedChange={(checked) => {
                      setBuildings3dSource(checked ? "osm" : "none");
                      onToggle3DBuildings?.(checked);
                    }}
                  />
                </motion.div>

                {/* Terrain Toggle */}
                <motion.div 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "p-1.5 rounded-md",
                      showTerrain ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Mountain className={cn(
                        "h-3.5 w-3.5",
                        showTerrain ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <Label htmlFor="terrain" className="text-sm cursor-pointer">
                      Terrain
                    </Label>
                  </div>
                  <Switch
                    id="terrain"
                    checked={showTerrain}
                    onCheckedChange={onToggleTerrain}
                  />
                </motion.div>

                {/* Shadows Toggle */}
                <motion.div 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors opacity-50"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-muted">
                      <Sun className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <Label htmlFor="shadows" className="text-sm cursor-pointer">
                      Shadows
                    </Label>
                  </div>
                  <Switch
                    id="shadows"
                    checked={shadowsEnabled}
                    disabled
                  />
                </motion.div>

                {/* Street View Button */}
                {onEnterStreetView && (
                  <motion.button
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onEnterStreetView}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-muted">
                        <PersonStanding className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm">Street View</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      G
                    </span>
                  </motion.button>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-border" />

              {/* Design Variants Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Design Variants
                  </span>
                  {variants.length > 0 && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={showAllVariants}
                        title="Show all"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={hideAllVariants}
                        title="Hide all"
                      >
                        <EyeOff className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {variants.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">
                    No variants created yet
                  </p>
                ) : (
                  <div className="space-y-1">
                    {variants.map((variant, index) => {
                      const colorHex = VARIANT_COLOR_HEX[index % VARIANT_COLOR_HEX.length];
                      const isActive = variant.id === activeVariantId;
                      const isVisible = visibleVariants.has(variant.id);
                      
                      return (
                        <motion.div
                          key={variant.id}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-2 py-1.5",
                            "transition-all cursor-pointer",
                            isActive 
                              ? "bg-primary/10 ring-1 ring-primary/30" 
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => setActiveVariantId(variant.id)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          layout
                        >
                          <div className="flex items-center gap-2">
                            {/* Color chip with glow effect when active */}
                            <div 
                              className={cn(
                                "w-3.5 h-3.5 rounded-sm border transition-shadow",
                                isActive && "shadow-[0_0_8px_2px]"
                              )}
                              style={{ 
                                backgroundColor: colorHex,
                                borderColor: `${colorHex}80`,
                                boxShadow: isActive ? `0 0 8px 2px ${colorHex}40` : undefined
                              }}
                            />
                            <span className={cn(
                              "text-sm truncate max-w-[120px]",
                              isActive ? "font-medium" : "text-muted-foreground"
                            )}>
                              {variant.name}
                            </span>
                          </div>
                          
                          {/* Visibility toggle */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVariantVisibility(variant.id);
                            }}
                          >
                            {isVisible ? (
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5 text-muted-foreground/40" />
                            )}
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LayersPanel;
