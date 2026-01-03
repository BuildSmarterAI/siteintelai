/**
 * SiteIntel™ Design Mode - Tool Strip (Context-Aware)
 * 
 * Contextual toolbar showing relevant tools based on current state.
 * Per UX spec: Draw/Edit/Height/Measure + Undo/Redo, state-aware visibility.
 */

import { useDesignStore } from "@/stores/useDesignStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Pen,
  MousePointer2,
  Move,
  Maximize2,
  ArrowUpFromLine,
  Ruler,
  Undo2,
  Redo2,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { ToolState } from "@/types/design";

interface ToolStripProps {
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onHeightChange?: (height: number) => void;
  onFloorsChange?: (floors: number) => void;
  onClampToMaxChange?: (clamp: boolean) => void;
}

const toolConfig: {
  id: ToolState;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  requiresVariant: boolean;
  requiresEnvelope: boolean;
}[] = [
  { id: "drawing", label: "Draw", icon: Pen, shortcut: "D", requiresVariant: false, requiresEnvelope: true },
  { id: "editing", label: "Edit", icon: MousePointer2, shortcut: "E", requiresVariant: true, requiresEnvelope: true },
  { id: "moving", label: "Move", icon: Move, shortcut: "M", requiresVariant: true, requiresEnvelope: true },
  { id: "scaling", label: "Scale", icon: Maximize2, shortcut: "S", requiresVariant: true, requiresEnvelope: true },
  { id: "height_adjust", label: "Height", icon: ArrowUpFromLine, shortcut: "H", requiresVariant: true, requiresEnvelope: true },
  { id: "measuring", label: "Measure", icon: Ruler, shortcut: "R", requiresVariant: false, requiresEnvelope: false },
];

// Height snap points (in feet)
const heightSnapPoints = [12, 16, 20, 24, 28, 32, 36, 40, 45];

export function ToolStrip({
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onHeightChange,
  onFloorsChange,
  onClampToMaxChange,
}: ToolStripProps) {
  const {
    currentToolState,
    setCurrentToolState,
    activeVariantId,
    envelope,
    variants,
    isSaving,
    currentView,
    setIsDrawing,
    setMeasurementMode,
  } = useDesignStore();

  const activeVariant = variants.find(v => v.id === activeVariantId);
  const hasFootprint = !!activeVariant?.footprint;
  const isCompareMode = currentView === "compare";

  // Local height state
  const [localHeight, setLocalHeight] = useState(activeVariant?.heightFt || 28);
  const [localFloors, setLocalFloors] = useState(activeVariant?.floors || 1);
  const [clampToMax, setClampToMax] = useState(true);

  // Sync with active variant
  useEffect(() => {
    if (activeVariant) {
      setLocalHeight(activeVariant.heightFt);
      setLocalFloors(activeVariant.floors);
    }
  }, [activeVariant?.id, activeVariant?.heightFt, activeVariant?.floors]);

  const handleToolClick = (toolId: ToolState) => {
    if (currentToolState === toolId) {
      // Toggle off
      setCurrentToolState("idle");
      setIsDrawing(false);
      setMeasurementMode(null);
    } else {
      setCurrentToolState(toolId);
      if (toolId === "drawing") {
        setIsDrawing(true);
      } else {
        setIsDrawing(false);
      }
      if (toolId === "measuring") {
        setMeasurementMode("area");
      } else {
        setMeasurementMode(null);
      }
    }
  };

  const isToolDisabled = (tool: typeof toolConfig[0]) => {
    if (isCompareMode) return true;
    if (tool.requiresEnvelope && !envelope) return true;
    if (tool.requiresVariant && (!activeVariantId || !hasFootprint)) return true;
    return false;
  };

  const handleHeightCommit = () => {
    let finalHeight = localHeight;
    if (clampToMax && envelope) {
      finalHeight = Math.min(localHeight, envelope.heightCapFt);
    }
    setLocalHeight(finalHeight);
    onHeightChange?.(finalHeight);
  };

  const handleFloorsCommit = () => {
    onFloorsChange?.(localFloors);
  };

  const maxHeight = envelope?.heightCapFt || 60;

  return (
    <div className={cn(
      "flex items-center gap-1 p-1.5 bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg",
      isCompareMode && "opacity-50 pointer-events-none"
    )}>
      {/* Main Tools */}
      {toolConfig.map((tool) => {
        const Icon = tool.icon;
        const isActive = currentToolState === tool.id;
        const isDisabled = isToolDisabled(tool);

        // Special case for Height - render as Popover
        if (tool.id === "height_adjust") {
          return (
            <Popover key={tool.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="icon"
                      disabled={isDisabled}
                      className={cn(
                        "h-8 w-8",
                        isActive && "bg-primary/10 text-primary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{tool.label} {tool.shortcut && `(${tool.shortcut})`}</p>
                </TooltipContent>
              </Tooltip>

              <PopoverContent className="w-72" align="center">
                <div className="space-y-4">
                  {/* Height Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Height</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={localHeight}
                          onChange={(e) => setLocalHeight(Number(e.target.value))}
                          onBlur={handleHeightCommit}
                          className="w-16 h-7 text-sm text-right"
                          min={12}
                          max={maxHeight}
                        />
                        <span className="text-sm text-muted-foreground">ft</span>
                      </div>
                    </div>
                    <Slider
                      value={[localHeight]}
                      onValueChange={([v]) => setLocalHeight(v)}
                      onValueCommit={handleHeightCommit}
                      min={12}
                      max={maxHeight}
                      step={1}
                      className="w-full"
                    />
                    {/* Snap Points */}
                    <div className="flex flex-wrap gap-1">
                      {heightSnapPoints.filter(h => h <= maxHeight).map((h) => (
                        <Button
                          key={h}
                          variant={localHeight === h ? "secondary" : "outline"}
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            setLocalHeight(h);
                            onHeightChange?.(h);
                          }}
                        >
                          {h}'
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Floors */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Floors</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={localFloors}
                          onChange={(e) => setLocalFloors(Number(e.target.value))}
                          onBlur={handleFloorsCommit}
                          className="w-16 h-7 text-sm text-right"
                          min={1}
                          max={10}
                        />
                      </div>
                    </div>
                    <Slider
                      value={[localFloors]}
                      onValueChange={([v]) => setLocalFloors(v)}
                      onValueCommit={handleFloorsCommit}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <Separator />

                  {/* Clamp Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Clamp to max</Label>
                      <p className="text-xs text-muted-foreground">
                        Prevent exceeding height cap
                      </p>
                    </div>
                    <Switch
                      checked={clampToMax}
                      onCheckedChange={(checked) => {
                        setClampToMax(checked);
                        onClampToMaxChange?.(checked);
                      }}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          );
        }

        return (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                size="icon"
                disabled={isDisabled}
                onClick={() => handleToolClick(tool.id)}
                className={cn(
                  "h-8 w-8",
                  isActive && "bg-primary/10 text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{tool.label} {tool.shortcut && `(${tool.shortcut})`}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Undo/Redo */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={!canUndo}
            onClick={onUndo}
            className="h-8 w-8"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Undo (Cmd+Z)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={!canRedo}
            onClick={onRedo}
            className="h-8 w-8"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Redo (Cmd+Shift+Z)</p>
        </TooltipContent>
      </Tooltip>

      {/* Saving indicator */}
      {isSaving && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground px-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </div>
        </>
      )}
    </div>
  );
}
