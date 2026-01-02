/**
 * SiteIntel™ Design Mode - Preset Selector
 * 
 * Quick presets for common building types (warehouse, office, retail, etc.)
 * Per PRD: Does not replace architects - just provides starting points.
 */

import { useDesignStore, type DesignPreset } from "@/stores/useDesignStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  Warehouse, 
  Building2, 
  Store, 
  Home, 
  Zap,
  Check 
} from "lucide-react";
import { useState } from "react";

// Default presets matching database seed
const DEFAULT_PRESETS: DesignPreset[] = [
  {
    id: "preset-warehouse",
    name: "1-Story Warehouse",
    description: "Maximum footprint, clear height 24-32ft. Ideal for distribution, manufacturing.",
    presetKey: "warehouse_1story",
    category: "industrial",
    defaultHeightFt: 28,
    defaultFloors: 1,
    coverageTargetPct: 85,
    farTargetPct: 60,
    icon: "warehouse",
  },
  {
    id: "preset-office-2",
    name: "2-Story Office Shell",
    description: "Professional services, medical office. Moderate coverage, structured parking.",
    presetKey: "office_2story",
    category: "office",
    defaultHeightFt: 35,
    defaultFloors: 2,
    coverageTargetPct: 60,
    farTargetPct: 100,
    icon: "building",
  },
  {
    id: "preset-retail",
    name: "Retail Strip",
    description: "Frontage-focused, single story. Neighborhood service retail.",
    presetKey: "retail_strip",
    category: "retail",
    defaultHeightFt: 22,
    defaultFloors: 1,
    coverageTargetPct: 80,
    farTargetPct: 50,
    icon: "store",
  },
  {
    id: "preset-multifamily",
    name: "3-Story Multifamily",
    description: "Garden-style apartments. Wood-frame over podium optional.",
    presetKey: "multifamily_3story",
    category: "residential",
    defaultHeightFt: 40,
    defaultFloors: 3,
    coverageTargetPct: 55,
    farTargetPct: 120,
    icon: "home",
  },
];

const ICONS: Record<string, React.ElementType> = {
  warehouse: Warehouse,
  building: Building2,
  store: Store,
  home: Home,
};

interface DesignPresetSelectorProps {
  onSelect: (preset: DesignPreset) => void;
  className?: string;
}

export function DesignPresetSelector({ onSelect, className }: DesignPresetSelectorProps) {
  const { presets: storePresets, envelope } = useDesignStore();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Use store presets if available, otherwise defaults
  const presets = storePresets.length > 0 ? storePresets : DEFAULT_PRESETS;

  const handleSelect = (preset: DesignPreset) => {
    setSelectedPreset(preset.id);
    onSelect(preset);
    setOpen(false);
  };

  // Group presets by category
  const groupedPresets = presets.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, DesignPreset[]>);

  const categoryLabels: Record<string, string> = {
    industrial: "Industrial",
    office: "Office",
    retail: "Retail",
    residential: "Residential",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={cn("gap-2", className)}>
          <Zap className="h-4 w-4" />
          Apply Preset
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Design Presets</DialogTitle>
          <DialogDescription>
            Quick-start configurations for common building types. 
            These set initial height, floors, and coverage targets within your envelope.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {Object.entries(groupedPresets).map(([category, categoryPresets]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  {categoryLabels[category] || category}
                </h4>
                <div className="grid gap-3">
                  {categoryPresets.map((preset) => {
                    const Icon = ICONS[preset.icon] || Building2;
                    const isCompatible = 
                      (!envelope?.heightCapFt || preset.defaultHeightFt <= envelope.heightCapFt) &&
                      (!envelope?.coverageCapPct || preset.coverageTargetPct <= envelope.coverageCapPct);

                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleSelect(preset)}
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-lg border text-left transition-colors",
                          "hover:bg-accent hover:border-primary/50",
                          selectedPreset === preset.id && "border-primary bg-primary/5",
                          !isCompatible && "opacity-50"
                        )}
                      >
                        <div className={cn(
                          "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                          "bg-muted"
                        )}>
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{preset.name}</span>
                            {selectedPreset === preset.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                            {!isCompatible && (
                              <Badge variant="secondary" className="text-xs">
                                Exceeds envelope
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {preset.description}
                          </p>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Height: {preset.defaultHeightFt}'</span>
                            <span>Floors: {preset.defaultFloors}</span>
                            <span>Coverage: {preset.coverageTargetPct}%</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-xs text-muted-foreground max-w-md">
            Presets are starting points only. All designs remain constrained by 
            your regulatory envelope.
          </p>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
