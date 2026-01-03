/**
 * SiteIntel™ Design Mode - Map Contents Panel (Google Earth Style)
 * 
 * Collapsible left overlay panel for variants and layer toggles.
 * Has 3 states: expanded (280px), collapsed (48px rail), hidden.
 */

import { useState } from "react";
import { useDesignStore, type DesignPreset } from "@/stores/useDesignStore";
import { useDesignSession } from "@/hooks/useDesignSession";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Layers,
  Plus,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  MoreVertical,
  Copy,
  Trash2,
  Share2,
  Download,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff,
  Map,
  Building2,
  Droplets,
  Grid3X3,
  Box,
  Warehouse,
  Store,
  Home,
  Factory,
  Stethoscope,
} from "lucide-react";

export type LeftPanelState = "expanded" | "collapsed" | "hidden";

const presetIcons: Record<string, React.ElementType> = {
  Warehouse,
  Building2,
  Store,
  Home,
  Factory,
  Stethoscope,
};

const statusConfig = {
  PASS: {
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500",
  },
  WARN: {
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500",
  },
  FAIL: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive",
  },
  PENDING: {
    icon: Box,
    color: "text-muted-foreground",
    bg: "bg-muted-foreground",
  },
};

interface MapContentsPanelProps {
  className?: string;
  sessionId?: string;
  panelState: LeftPanelState;
  setPanelState: (state: LeftPanelState) => void;
}

export function MapContentsPanel({
  className,
  sessionId,
  panelState,
  setPanelState,
}: MapContentsPanelProps) {
  const {
    variants,
    activeVariantId,
    setActiveVariantId,
    presets,
    hoveredVariantId,
    setHoveredVariantId,
    envelope,
    buildings3dSource,
    setBuildings3dSource,
  } = useDesignStore();

  const { createVariant, deleteVariant, duplicateVariant, isCreatingVariant } =
    useDesignSession(undefined);

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [variantName, setVariantName] = useState("");
  const [layersOpen, setLayersOpen] = useState(true);
  const [designsOpen, setDesignsOpen] = useState(true);

  // Layer visibility state (local for now, could be in store)
  const [layers, setLayers] = useState({
    parcel: true,
    envelope: true,
    footprint: true,
    violations: true,
    zoning: false,
    flood: false,
    terrain: true,
    shadows: false,
  });

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreateVariant = () => {
    if (!sessionId) return;
    const preset = presets.find((p) => p.presetKey === selectedPreset);
    createVariant({ sessionId, name: variantName || undefined, preset });
    setShowNewDialog(false);
    setVariantName("");
    setSelectedPreset("");
  };

  const groupedPresets = presets.reduce((acc, preset) => {
    if (!acc[preset.category]) acc[preset.category] = [];
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, DesignPreset[]>);

  if (panelState === "hidden") return null;

  const isCollapsed = panelState === "collapsed";

  return (
    <>
      <div
        className={cn(
          "fixed top-20 left-4 bottom-20 z-40 flex transition-all duration-200 ease-in-out",
          isCollapsed ? "w-12" : "w-72",
          className
        )}
      >
        <div className="flex-1 bg-background/95 backdrop-blur-md border shadow-xl rounded-xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Map Contents</span>
              </div>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      setPanelState(isCollapsed ? "expanded" : "collapsed")
                    }
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{isCollapsed ? "Expand panel ([)" : "Collapse panel ([)"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Content */}
          {!isCollapsed && (
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {/* Designs Section */}
                <Collapsible open={designsOpen} onOpenChange={setDesignsOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 text-sm font-medium hover:text-foreground transition-colors">
                    <div className="flex items-center gap-2">
                      {designsOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span>Designs</span>
                      <Badge variant="secondary" className="text-xs px-1.5">
                        {variants.length}
                      </Badge>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNewDialog(true);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="pt-2 space-y-2">
                    {variants.length === 0 ? (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        <Box className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No variants yet</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => setShowNewDialog(true)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Create first
                        </Button>
                      </div>
                    ) : (
                      variants.map((variant) => {
                        const config = statusConfig[variant.complianceStatus];
                        const StatusIcon = config.icon;
                        const isActive = variant.id === activeVariantId;
                        const isHovered = variant.id === hoveredVariantId;

                        return (
                          <div
                            key={variant.id}
                            className={cn(
                              "group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all",
                              isActive
                                ? "bg-primary/10 border border-primary/30"
                                : "hover:bg-muted/50 border border-transparent",
                              isHovered && !isActive && "bg-muted/30"
                            )}
                            onClick={() => setActiveVariantId(variant.id)}
                            onMouseEnter={() => setHoveredVariantId(variant.id)}
                            onMouseLeave={() => setHoveredVariantId(null)}
                          >
                            {/* Status indicator */}
                            <div
                              className={cn(
                                "w-1.5 h-8 rounded-full flex-shrink-0",
                                config.bg
                              )}
                            />

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-sm truncate">
                                  {variant.name}
                                </span>
                                <StatusIcon
                                  className={cn("h-3.5 w-3.5 flex-shrink-0", config.color)}
                                />
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {variant.metrics
                                  ? `${Math.round(variant.metrics.grossFloorAreaSf).toLocaleString()} SF • FAR ${variant.metrics.farUsed.toFixed(2)}`
                                  : "No footprint"}
                              </div>
                            </div>

                            {/* Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => duplicateVariant(variant)}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Export
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => deleteVariant(variant.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Layers Section */}
                <Collapsible open={layersOpen} onOpenChange={setLayersOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 text-sm font-medium hover:text-foreground transition-colors">
                    {layersOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span>Layers</span>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="pt-2 space-y-1">
                    {[
                      { key: "parcel", label: "Parcel Boundary", icon: Map },
                      { key: "envelope", label: "Regulatory Envelope", icon: Box },
                      { key: "footprint", label: "Design Footprint", icon: Building2 },
                      { key: "violations", label: "Violation Zones", icon: AlertTriangle },
                      { key: "zoning", label: "Zoning", icon: Grid3X3 },
                      { key: "flood", label: "Flood Zones", icon: Droplets },
                      { key: "shadows", label: "Shadow Analysis", icon: Box },
                    ].map(({ key, label, icon: Icon }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{label}</span>
                        </div>
                        <Switch
                          checked={layers[key as keyof typeof layers]}
                          onCheckedChange={() =>
                            toggleLayer(key as keyof typeof layers)
                          }
                          className="h-5 w-9"
                        />
                      </div>
                    ))}
                    
                    {/* 3D Buildings with source selector */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">3D Buildings</span>
                        </div>
                        <Switch
                          checked={buildings3dSource !== "none"}
                          onCheckedChange={(checked) => 
                            setBuildings3dSource(checked ? "osm" : "none")
                          }
                          className="h-5 w-9"
                        />
                      </div>
                      
                      {/* Source selector - only shown when enabled */}
                      {buildings3dSource !== "none" && (
                        <div className="ml-6 space-y-1">
                          <button
                            className={cn(
                              "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm transition-colors",
                              buildings3dSource === "osm" 
                                ? "bg-primary/10 text-primary" 
                                : "hover:bg-muted/50"
                            )}
                            onClick={() => setBuildings3dSource("osm")}
                          >
                            <div className={cn(
                              "w-3 h-3 rounded-full border-2",
                              buildings3dSource === "osm" 
                                ? "border-primary bg-primary" 
                                : "border-muted-foreground"
                            )} />
                            <span>Cesium OSM</span>
                            <Badge variant="secondary" className="ml-auto text-xs">Free</Badge>
                          </button>
                          
                          <button
                            className={cn(
                              "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm transition-colors",
                              buildings3dSource === "google" 
                                ? "bg-primary/10 text-primary" 
                                : "hover:bg-muted/50"
                            )}
                            onClick={() => setBuildings3dSource("google")}
                          >
                            <div className={cn(
                              "w-3 h-3 rounded-full border-2",
                              buildings3dSource === "google" 
                                ? "border-primary bg-primary" 
                                : "border-muted-foreground"
                            )} />
                            <span>Google 3D</span>
                            <Badge variant="outline" className="ml-auto text-xs">Premium</Badge>
                          </button>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </ScrollArea>
          )}

          {/* Collapsed state - just icons */}
          {isCollapsed && (
            <div className="flex flex-col items-center py-3 gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowNewDialog(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">New variant</TooltipContent>
                </Tooltip>

                <div className="w-6 h-px bg-border" />

                {variants.slice(0, 5).map((variant, i) => {
                  const config = statusConfig[variant.complianceStatus];
                  const isActive = variant.id === activeVariantId;

                  return (
                    <Tooltip key={variant.id}>
                      <TooltipTrigger asChild>
                        <button
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                          onClick={() => setActiveVariantId(variant.id)}
                        >
                          {i + 1}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn("w-2 h-2 rounded-full", config.bg)}
                          />
                          {variant.name}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>

      {/* New Variant Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Variant</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name (optional)</label>
              <Input
                placeholder="e.g., Maximum Coverage"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start from preset</label>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a preset (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedPresets).map(
                    ([category, categoryPresets]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase">
                          {category}
                        </div>
                        {categoryPresets.map((preset) => {
                          const Icon = presetIcons[preset.icon] || Building2;
                          return (
                            <SelectItem key={preset.presetKey} value={preset.presetKey}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{preset.name}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </div>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateVariant} disabled={isCreatingVariant}>
              Create Variant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
