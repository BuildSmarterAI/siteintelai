/**
 * SiteIntel™ Design Mode - Variant Rail (Redesigned)
 * 
 * Left sidebar with variant list, "+ New" dropdown, search, and sorting.
 * Per UX spec: ≤2 clicks to create variant, Best Overall badge, hover preview.
 */

import { useState, useMemo } from "react";
import { useDesignStore, type DesignPreset } from "@/stores/useDesignStore";
import { useDesignSession } from "@/hooks/useDesignSession";
import { VariantCard } from "./VariantCard";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Stethoscope,
  ChevronDown,
  Search,
  Copy,
  GitBranch,
  SortAsc
} from "lucide-react";
import type { VariantSortMode } from "@/types/design";

const presetIcons: Record<string, React.ElementType> = {
  Warehouse,
  Building2,
  Store,
  Home,
  Factory,
  Stethoscope,
};

const sortOptions: { value: VariantSortMode; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest first" },
  { value: "starred", label: "Starred first" },
  { value: "compliance", label: "Compliance status" },
];

interface VariantRailProps {
  sessionId: string | undefined;
}

export function VariantRail({ sessionId }: VariantRailProps) {
  const { 
    presets, 
    currentView,
    activeVariantId,
    bestOverallVariantId,
    variantSortMode,
    setVariantSortMode,
    variantSearchQuery,
    setVariantSearchQuery,
    getSortedVariants,
    setShareModalOpen,
  } = useDesignStore();
  
  const { 
    createVariant, 
    deleteVariant, 
    duplicateVariant, 
    updateVariant,
    isCreatingVariant 
  } = useDesignSession(undefined);

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [variantName, setVariantName] = useState("");
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  // Get sorted and filtered variants
  const sortedVariants = useMemo(() => getSortedVariants(), [getSortedVariants]);
  const showSearch = sortedVariants.length > 6;

  // Generate auto-name based on count
  const generateAutoName = (presetName?: string) => {
    const letter = String.fromCharCode(65 + sortedVariants.length); // A, B, C...
    const base = `Option ${letter}`;
    return presetName ? `${base} — ${presetName}` : base;
  };

  const handleCreateFromScratch = () => {
    if (!sessionId) return;
    createVariant({
      sessionId,
      name: generateAutoName(),
    });
  };

  const handleDuplicateSelected = () => {
    if (!activeVariantId) return;
    const variant = sortedVariants.find(v => v.id === activeVariantId);
    if (variant) {
      duplicateVariant(variant);
    }
  };

  const handleBranchFromBest = () => {
    if (!bestOverallVariantId) return;
    const best = sortedVariants.find(v => v.id === bestOverallVariantId);
    if (best) {
      duplicateVariant(best);
    }
  };

  const handleCreateWithPreset = () => {
    if (!sessionId) return;

    const preset = presets.find(p => p.presetKey === selectedPreset);
    const name = variantName || generateAutoName(preset?.name);
    
    createVariant({
      sessionId,
      name,
      preset,
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

  const handleSaveRename = () => {
    if (editingVariantId && variantName.trim()) {
      updateVariant({ id: editingVariantId, updates: { name: variantName.trim() } });
    }
    setShowRenameDialog(false);
    setEditingVariantId(null);
    setVariantName("");
  };

  const groupedPresets = presets.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, DesignPreset[]>);

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Variants</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {sortedVariants.length}
          </span>
        </div>
        
        {/* New Button with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" disabled={!sessionId || isCreatingVariant}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              New
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleCreateFromScratch}>
              <Plus className="h-4 w-4 mr-2" />
              From Scratch
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDuplicateSelected}
              disabled={!activeVariantId}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate Selected
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleBranchFromBest}
              disabled={!bestOverallVariantId}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Branch from Best
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowNewDialog(true)}>
              <Building2 className="h-4 w-4 mr-2" />
              From Preset...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search & Sort Bar */}
      {showSearch && (
        <div className="px-3 py-2 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search variants..."
              value={variantSearchQuery}
              onChange={(e) => setVariantSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>
      )}

      {/* Sort Selector */}
      <div className="px-3 py-2 border-b flex items-center gap-2">
        <SortAsc className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={variantSortMode} onValueChange={setVariantSortMode}>
          <SelectTrigger className="h-7 text-xs flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Variant list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {sortedVariants.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No variants yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click "+ New" to start designing
              </p>
            </div>
          ) : (
            sortedVariants.map((variant) => (
              <VariantCard
                key={variant.id}
                variant={variant}
                onDuplicate={() => duplicateVariant(variant)}
                onDelete={() => deleteVariant(variant.id)}
                onRename={() => handleRename(variant.id, variant.name)}
                onShare={() => setShareModalOpen(true)}
                showCompareCheckbox={currentView === "compare"}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* New Variant with Preset Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create from Preset</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name (optional)</label>
              <Input
                placeholder={generateAutoName()}
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select preset</label>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a building type..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedPresets).map(([category, categoryPresets]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{preset.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {preset.defaultFloors} floor • {preset.defaultHeightFt}' height
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
              onClick={handleCreateWithPreset}
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
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveRename();
              }}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRename}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
