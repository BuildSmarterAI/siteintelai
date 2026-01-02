/**
 * SiteIntel™ Design Mode - Toolbar
 * 
 * Drawing controls, height/floors adjustment, and preset selector.
 */

import { useDesignStore } from "@/stores/useDesignStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  PenTool, 
  Square, 
  Trash2, 
  RotateCcw,
  ArrowUpFromLine,
  Layers,
  Settings2
} from "lucide-react";
import { useState, useEffect } from "react";

interface DesignToolbarProps {
  onStartDrawing: () => void;
  onClearDrawing: () => void;
  onResetToEnvelope: () => void;
  onHeightChange: (height: number) => void;
  onFloorsChange: (floors: number) => void;
}

export function DesignToolbar({
  onStartDrawing,
  onClearDrawing,
  onResetToEnvelope,
  onHeightChange,
  onFloorsChange,
}: DesignToolbarProps) {
  const { 
    isDrawing, 
    setIsDrawing, 
    envelope,
    variants,
    activeVariantId,
    isSaving
  } = useDesignStore();

  const activeVariant = variants.find(v => v.id === activeVariantId);
  
  const [localHeight, setLocalHeight] = useState(activeVariant?.heightFt || 24);
  const [localFloors, setLocalFloors] = useState(activeVariant?.floors || 1);

  // Sync with active variant
  useEffect(() => {
    if (activeVariant) {
      setLocalHeight(activeVariant.heightFt);
      setLocalFloors(activeVariant.floors);
    }
  }, [activeVariant?.id, activeVariant?.heightFt, activeVariant?.floors]);

  const maxHeight = envelope?.heightCapFt || 100;

  const handleHeightChange = (value: number[]) => {
    const height = value[0];
    setLocalHeight(height);
    onHeightChange(height);
  };

  const handleFloorsChange = (value: number[]) => {
    const floors = value[0];
    setLocalFloors(floors);
    onFloorsChange(floors);
  };

  const handleDrawClick = () => {
    if (isDrawing) {
      setIsDrawing(false);
    } else {
      onStartDrawing();
      setIsDrawing(true);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-card border rounded-lg">
      <TooltipProvider>
        {/* Drawing tools */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isDrawing ? "default" : "outline"}
                size="icon"
                onClick={handleDrawClick}
                disabled={!activeVariant}
              >
                <PenTool className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isDrawing ? "Finish drawing (Esc)" : "Draw footprint (D)"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onClearDrawing}
                disabled={!activeVariant?.footprint}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear footprint</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onResetToEnvelope}
                disabled={!envelope}
              >
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Fill envelope (max footprint)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onResetToEnvelope}
                disabled={!activeVariant?.footprint}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset to envelope</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Height control */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ArrowUpFromLine className="h-4 w-4" />
              <span className="min-w-[3rem] text-left">{localHeight}'</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Building Height</Label>
                <span className="text-sm text-muted-foreground">
                  Max: {maxHeight}'
                </span>
              </div>
              <Slider
                value={[localHeight]}
                onValueChange={handleHeightChange}
                max={maxHeight}
                min={10}
                step={1}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={localHeight}
                  onChange={(e) => {
                    const val = Math.min(Number(e.target.value), maxHeight);
                    setLocalHeight(val);
                    onHeightChange(val);
                  }}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">feet</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Floors control */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Layers className="h-4 w-4" />
              <span className="min-w-[2rem] text-left">{localFloors}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Number of Floors</Label>
              </div>
              <Slider
                value={[localFloors]}
                onValueChange={handleFloorsChange}
                max={20}
                min={1}
                step={1}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={localFloors}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(Number(e.target.value), 20));
                    setLocalFloors(val);
                    onFloorsChange(val);
                  }}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">stories</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-8" />

        {/* Settings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Design settings</p>
          </TooltipContent>
        </Tooltip>

        {/* Saving indicator */}
        {isSaving && (
          <span className="text-xs text-muted-foreground animate-pulse">
            Saving...
          </span>
        )}
      </TooltipProvider>
    </div>
  );
}
