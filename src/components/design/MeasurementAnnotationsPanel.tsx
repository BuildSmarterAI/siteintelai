/**
 * Measurement Annotations Panel
 * Manages saved measurement annotations with labels, colors, and visibility
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDesignStore } from "@/stores/useDesignStore";
import {
  Ruler,
  Square,
  ArrowUpDown,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Bookmark,
  Download,
  ChevronDown,
  ChevronUp,
  Save,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MeasurementAnnotationsPanelProps {
  className?: string;
}

const ANNOTATION_COLORS = [
  "#FF7A00", // Orange (primary)
  "#3B82F6", // Blue
  "#10B981", // Green
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F59E0B", // Amber
  "#EC4899", // Pink
];

export function MeasurementAnnotationsPanel({ className }: MeasurementAnnotationsPanelProps) {
  const {
    measurementAnnotations,
    measurementResult,
    measurementPoints,
    measurementMode,
    addMeasurementAnnotation,
    updateMeasurementAnnotation,
    removeMeasurementAnnotation,
    toggleAnnotationVisibility,
    clearMeasurement,
  } = useDesignStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [selectedColor, setSelectedColor] = useState(ANNOTATION_COLORS[0]);

  const canSave = measurementResult && measurementPoints.length >= 2;

  const handleSaveAnnotation = () => {
    if (!measurementResult || !measurementMode) return;

    const annotation = {
      id: crypto.randomUUID(),
      type: measurementMode,
      points: [...measurementPoints],
      result: { ...measurementResult },
      label: newLabel || generateDefaultLabel(),
      color: selectedColor,
      visible: true,
      createdAt: new Date().toISOString(),
    };

    addMeasurementAnnotation(annotation);
    clearMeasurement();
    setSaveDialogOpen(false);
    setNewLabel("");
    toast.success("Measurement saved");
  };

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

  const getModeIcon = (type: string) => {
    switch (type) {
      case "distance":
        return <Ruler className="h-3.5 w-3.5" />;
      case "area":
        return <Square className="h-3.5 w-3.5" />;
      case "height":
        return <ArrowUpDown className="h-3.5 w-3.5" />;
      default:
        return <Ruler className="h-3.5 w-3.5" />;
    }
  };

  const formatResult = (annotation: typeof measurementAnnotations[0]) => {
    const { result } = annotation;
    if (result.feet !== undefined) {
      return `${result.feet.toFixed(1)} ft`;
    }
    if (result.sqft !== undefined) {
      return `${result.sqft.toLocaleString()} sq ft`;
    }
    if (result.heightFt !== undefined) {
      return `${result.heightFt.toFixed(1)} ft`;
    }
    return "";
  };

  const handleExport = () => {
    const data = measurementAnnotations.map(a => ({
      label: a.label,
      type: a.type,
      value: formatResult(a),
      ...a.result,
      points: a.points,
    }));

    const csv = [
      ["Label", "Type", "Value", "Points"].join(","),
      ...data.map(d => [
        `"${d.label}"`,
        d.type,
        `"${d.value}"`,
        `"${JSON.stringify(d.points)}"`,
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "measurements.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported measurements");
  };

  if (measurementAnnotations.length === 0 && !canSave) {
    return null;
  }

  return (
    <>
      <div className={cn(
        "bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden",
        className
      )}>
        {/* Header */}
        <div 
          className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Annotations</span>
            <span className="text-xs text-muted-foreground">
              ({measurementAnnotations.length})
            </span>
          </div>
          <div className="flex items-center gap-1">
            {measurementAnnotations.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExport();
                }}
                className="h-6 w-6 p-0"
                title="Export CSV"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="p-2 space-y-2">
            {/* Save current measurement button */}
            {canSave && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={() => setSaveDialogOpen(true)}
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save Current Measurement
              </Button>
            )}

            {/* Annotations list */}
            {measurementAnnotations.length > 0 && (
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-1">
                  {measurementAnnotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className={cn(
                        "flex items-center justify-between px-2 py-1.5 rounded-md",
                        "hover:bg-muted/50 transition-colors group",
                        !annotation.visible && "opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: annotation.color }}
                        />
                        {getModeIcon(annotation.type)}
                        
                        {editingId === annotation.id ? (
                          <Input
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            onBlur={() => {
                              if (newLabel.trim()) {
                                updateMeasurementAnnotation(annotation.id, { label: newLabel });
                              }
                              setEditingId(null);
                              setNewLabel("");
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                if (newLabel.trim()) {
                                  updateMeasurementAnnotation(annotation.id, { label: newLabel });
                                }
                                setEditingId(null);
                                setNewLabel("");
                              }
                            }}
                            className="h-5 text-xs px-1"
                            autoFocus
                          />
                        ) : (
                          <span className="text-xs truncate">{annotation.label}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatResult(annotation)}
                        </span>

                        <div className="hidden group-hover:flex items-center gap-0.5">
                          {/* Color picker */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                              >
                                <Palette className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2">
                              <div className="grid grid-cols-4 gap-1">
                                {ANNOTATION_COLORS.map((color) => (
                                  <button
                                    key={color}
                                    className={cn(
                                      "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110",
                                      annotation.color === color
                                        ? "border-foreground"
                                        : "border-transparent"
                                    )}
                                    style={{ backgroundColor: color }}
                                    onClick={() =>
                                      updateMeasurementAnnotation(annotation.id, { color })
                                    }
                                  />
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>

                          {/* Edit label */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => {
                              setEditingId(annotation.id);
                              setNewLabel(annotation.label);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              removeMeasurementAnnotation(annotation.id);
                              toast.success("Annotation removed");
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Visibility toggle */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => toggleAnnotationVisibility(annotation.id)}
                        >
                          {annotation.visible ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Save Measurement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                placeholder={generateDefaultLabel()}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {ANNOTATION_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                      selectedColor === color
                        ? "border-foreground ring-2 ring-foreground/20"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAnnotation}>
              Save Annotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
