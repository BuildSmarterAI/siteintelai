/**
 * SiteIntel™ Design Mode - Variant List Sidebar
 * 
 * Lists all variants with controls for creation and management.
 */

import { useState } from "react";
import { useDesignStore, type DesignPreset } from "@/stores/useDesignStore";
import { useDesignSession } from "@/hooks/useDesignSession";
import { DesignVariantCard } from "./DesignVariantCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Plus, 
  Layers,
  Warehouse,
  Building2,
  Store,
  Home,
  Factory,
  Stethoscope
} from "lucide-react";

const presetIcons: Record<string, React.ElementType> = {
  Warehouse,
  Building2,
  Store,
  Home,
  Factory,
  Stethoscope,
};

interface DesignVariantListProps {
  sessionId: string | undefined;
}

export function DesignVariantList({ sessionId }: DesignVariantListProps) {
  const { variants, presets, currentView } = useDesignStore();
  const { createVariant, deleteVariant, duplicateVariant, isCreatingVariant } = 
    useDesignSession(undefined);

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [variantName, setVariantName] = useState("");
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  const handleCreateVariant = () => {
    if (!sessionId) return;

    const preset = presets.find(p => p.presetKey === selectedPreset);
    
    createVariant({
      sessionId,
      name: variantName || undefined,
      preset: preset,
    });

    setShowNewDialog(false);
    setVariantName("");
    setSelectedPreset("");
  };

  const handleRename = (variantId: string, currentName: string) => {
    setEditingVariantId(variantId);
    setVariantName(currentName);
    setShowRenameDialog(true);
  };

  const groupedPresets = presets.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, DesignPreset[]>);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Variants</span>
          <span className="text-xs text-muted-foreground">
            ({variants.length})
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => setShowNewDialog(true)}
          disabled={!sessionId}
        >
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>

      {/* Variant list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {variants.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No variants yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a variant to start designing
              </p>
            </div>
          ) : (
            variants.map((variant) => (
              <DesignVariantCard
                key={variant.id}
                variant={variant}
                onDuplicate={() => duplicateVariant(variant)}
                onDelete={() => deleteVariant(variant.id)}
                onRename={() => handleRename(variant.id, variant.name)}
                showCompareCheckbox={currentView === "compare"}
              />
            ))
          )}
        </div>
      </ScrollArea>

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
                  {Object.entries(groupedPresets).map(([category, categoryPresets]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase">
                        {category}
                      </div>
                      {categoryPresets.map((preset) => {
                        const Icon = presetIcons[preset.icon] || Building2;
                        return (
                          <SelectItem 
                            key={preset.presetKey} 
                            value={preset.presetKey}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div>{preset.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {preset.defaultFloors} floor, {preset.defaultHeightFt}' height
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPreset && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <p className="text-muted-foreground">
                  {presets.find(p => p.presetKey === selectedPreset)?.description}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateVariant}
              disabled={isCreatingVariant}
            >
              Create Variant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Variant</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Input
              placeholder="Variant name"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // TODO: Implement rename
                setShowRenameDialog(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
