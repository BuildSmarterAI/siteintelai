/**
 * Design Measurement Result Panel
 * Shows measurement results with copy and clear options
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDesignStore } from "@/stores/useDesignStore";
import { Copy, X, Ruler, Square, ArrowUpDown, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DesignMeasurementResultPanelProps {
  className?: string;
}

export function DesignMeasurementResultPanel({ className }: DesignMeasurementResultPanelProps) {
  const {
    measurementMode,
    measurementResult,
    measurementPoints,
    clearMeasurement,
    addMeasurementAnnotation,
    measurementAnnotations,
    lastSnappedSource,
  } = useDesignStore();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  if (!measurementMode) return null;

  const canSave = measurementResult && measurementPoints.length >= 2;

  const generateDefaultLabel = () => {
    const count = measurementAnnotations.filter(a => a.type === measurementMode).length + 1;
    switch (measurementMode) {
      case "distance":
        return `Distance ${count}`;
      case "area":
        return `Area ${count}`;
      case "height":
        return `Height ${count}`;
      default:
        return `Measurement ${count}`;
    }
  };

  const handleSaveAnnotation = () => {
    if (!measurementResult || !measurementMode) return;

    const annotation = {
      id: crypto.randomUUID(),
      type: measurementMode,
      points: [...measurementPoints],
      result: { ...measurementResult },
      label: newLabel.trim() || generateDefaultLabel(),
      color: "#FF7A00",
      visible: true,
      createdAt: new Date().toISOString(),
    };

    addMeasurementAnnotation(annotation);
    clearMeasurement();
    setSaveDialogOpen(false);
    setNewLabel("");
    toast.success("Measurement saved as annotation");
  };

  const handleCopy = () => {
    let text = "";
    
    if (measurementResult?.feet) {
      text = `Distance: ${measurementResult.feet.toFixed(1)} ft (${measurementResult.miles?.toFixed(3)} mi)`;
    } else if (measurementResult?.sqft) {
      text = `Area: ${measurementResult.sqft.toLocaleString()} sq ft (${measurementResult.acres?.toFixed(3)} acres)`;
    } else if (measurementResult?.heightFt) {
      text = `Height: ${measurementResult.heightFt.toFixed(1)} ft`;
    }

    if (text) {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    }
  };

  const getModeIcon = () => {
    switch (measurementMode) {
      case "distance":
        return <Ruler className="h-4 w-4" />;
      case "area":
        return <Square className="h-4 w-4" />;
      case "height":
        return <ArrowUpDown className="h-4 w-4" />;
    }
  };

  const getModeLabel = () => {
    switch (measurementMode) {
      case "distance":
        return "Distance";
      case "area":
        return "Area";
      case "height":
        return "Height";
    }
  };

  const getHint = () => {
    if (measurementMode === "height") {
      return measurementPoints.length === 0 
        ? "Click first point" 
        : measurementPoints.length === 1 
        ? "Click second point" 
        : "";
    }
    if (measurementMode === "area") {
      return measurementPoints.length < 3 
        ? `Click ${3 - measurementPoints.length} more point${3 - measurementPoints.length !== 1 ? "s" : ""}`
        : "Click to add more points";
    }
    return measurementPoints.length === 0 
      ? "Click first point" 
      : "Click to continue measuring";
  };

  return (
    <div className={cn(
      "bg-card/90 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden",
      className
    )}>
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          {getModeIcon()}
          <span className="text-sm font-medium">{getModeLabel()}</span>
        </div>
        <div className="flex items-center gap-1">
          {measurementResult && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMeasurement}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {/* Result display */}
        {measurementResult ? (
          <div className="space-y-1">
            {measurementResult.feet !== undefined && (
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground">Distance:</span>
                <span className="font-mono font-semibold">
                  {measurementResult.feet.toFixed(1)} <span className="text-xs text-muted-foreground">ft</span>
                </span>
              </div>
            )}
            {measurementResult.miles !== undefined && measurementResult.miles > 0.1 && (
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground"></span>
                <span className="font-mono text-sm text-muted-foreground">
                  ({measurementResult.miles.toFixed(3)} mi)
                </span>
              </div>
            )}
            {measurementResult.sqft !== undefined && (
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground">Area:</span>
                <span className="font-mono font-semibold">
                  {measurementResult.sqft.toLocaleString()} <span className="text-xs text-muted-foreground">sq ft</span>
                </span>
              </div>
            )}
            {measurementResult.acres !== undefined && (
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground"></span>
                <span className="font-mono text-sm text-muted-foreground">
                  ({measurementResult.acres.toFixed(3)} acres)
                </span>
              </div>
            )}
            {measurementResult.heightFt !== undefined && (
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground">Height:</span>
                <span className="font-mono font-semibold">
                  {measurementResult.heightFt.toFixed(1)} <span className="text-xs text-muted-foreground">ft</span>
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{getHint()}</p>
        )}

        {/* Points counter and snap info */}
        <div className="text-xs text-muted-foreground pt-1 border-t space-y-1">
          <div>{measurementPoints.length} point{measurementPoints.length !== 1 ? "s" : ""} placed</div>
          {lastSnappedSource && (
            <div className="flex items-center gap-1.5 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Snapped to: {lastSnappedSource}
            </div>
          )}
        </div>

        {/* Save button */}
        {canSave && (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs mt-2"
            onClick={() => setSaveDialogOpen(true)}
          >
            <Save className="h-3 w-3 mr-1.5" />
            Save as Annotation
          </Button>
        )}
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Save Measurement</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={generateDefaultLabel()}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveAnnotation();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAnnotation}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
