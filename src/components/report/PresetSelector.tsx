import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  MAP_PRESETS, 
  PRESET_ORDER, 
  DEFAULT_PRESET,
  PresetAudience 
} from "@/lib/mapPresets";
import { 
  Target, 
  ShieldAlert, 
  Zap, 
  Building2, 
  Car, 
  TrendingUp,
  RotateCcw,
  Info
} from "lucide-react";

interface PresetSelectorProps {
  activePresetId: string;
  onPresetChange: (presetId: string) => void;
  onResetToDefault?: () => void;
  className?: string;
  compact?: boolean;
}

// Icon mapping for each preset
const PRESET_ICONS: Record<string, React.ReactNode> = {
  decision_mode: <Target className="h-4 w-4" />,
  lender_risk: <ShieldAlert className="h-4 w-4" />,
  utilities_feasibility: <Zap className="h-4 w-4" />,
  zoning_entitlements: <Building2 className="h-4 w-4" />,
  access_traffic: <Car className="h-4 w-4" />,
  market_context: <TrendingUp className="h-4 w-4" />,
};

// Audience badge colors
const AUDIENCE_COLORS: Record<PresetAudience, string> = {
  DEVELOPER: "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]",
  LENDER: "bg-[hsl(var(--data-cyan)/0.1)] text-[hsl(var(--data-cyan))]",
  IC: "bg-[hsl(var(--muted))] text-muted-foreground",
};

/**
 * PresetSelector - Horizontal button group for switching map presets
 * 
 * Desktop: Full button row with labels
 * Mobile: Dropdown selector
 */
export function PresetSelector({
  activePresetId,
  onPresetChange,
  onResetToDefault,
  className,
  compact = false,
}: PresetSelectorProps) {
  const activePreset = MAP_PRESETS[activePresetId];
  const showResetButton = activePresetId !== DEFAULT_PRESET;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header with tooltip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Map Views</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs">
                  Each view answers a specific feasibility question.
                  Use <strong>Decision Mode</strong> to justify the verdict.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Reset button */}
        {showResetButton && onResetToDefault && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetToDefault}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Desktop: Button row */}
      {!compact && (
        <div className="hidden md:flex flex-wrap gap-1.5">
          {PRESET_ORDER.map((presetId) => {
            const preset = MAP_PRESETS[presetId];
            const isActive = presetId === activePresetId;
            
            return (
              <TooltipProvider key={presetId}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPresetChange(presetId)}
                      className={cn(
                        "h-8 gap-1.5 text-xs transition-all",
                        isActive && "bg-[hsl(var(--primary))] text-white shadow-md",
                        !isActive && "hover:bg-[hsl(var(--surface-raised))] hover:border-[hsl(var(--primary)/0.3)]"
                      )}
                    >
                      {PRESET_ICONS[presetId]}
                      <span className="hidden lg:inline">{preset.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{preset.label}</span>
                        <Badge 
                          variant="secondary" 
                          className={cn("text-[10px] px-1.5 py-0", AUDIENCE_COLORS[preset.audience])}
                        >
                          {preset.audience}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{preset.description}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      )}

      {/* Mobile / Compact: Dropdown */}
      <div className={cn("md:hidden", compact && "block md:block")}>
        <Select value={activePresetId} onValueChange={onPresetChange}>
          <SelectTrigger className="w-full h-9">
            <div className="flex items-center gap-2">
              {PRESET_ICONS[activePresetId]}
              <SelectValue placeholder="Select view" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {PRESET_ORDER.map((presetId) => {
              const preset = MAP_PRESETS[presetId];
              return (
                <SelectItem key={presetId} value={presetId}>
                  <div className="flex items-center gap-2">
                    {PRESET_ICONS[presetId]}
                    <span>{preset.label}</span>
                    <Badge 
                      variant="secondary" 
                      className={cn("text-[10px] px-1.5 py-0 ml-auto", AUDIENCE_COLORS[preset.audience])}
                    >
                      {preset.audience}
                    </Badge>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Active preset description */}
      {activePreset && (
        <p className="text-xs text-muted-foreground px-1">
          {activePreset.description}
        </p>
      )}
    </div>
  );
}
