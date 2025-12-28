import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Building2, 
  DollarSign, 
  Ruler, 
  Calendar, 
  Sparkles, 
  Loader2,
  CheckCircle2,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CostIntakeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  onSubmitSuccess?: () => void;
  existingParams?: ConstructionParams | null;
}

export interface ConstructionParams {
  building_type: string;
  quality_tier: 'economy' | 'standard' | 'premium' | 'luxury';
  proposed_gfa_sf: number;
  num_stories: number;
  project_timeline_months: number;
  include_sitework: boolean;
  include_parking_structure: boolean;
  parking_spaces?: number;
}

const BUILDING_TYPES = [
  { value: 'retail_strip', label: 'Retail Strip Center', costRange: '$85-$150/SF' },
  { value: 'retail_freestanding', label: 'Freestanding Retail', costRange: '$100-$180/SF' },
  { value: 'office_low_rise', label: 'Office (Low-Rise)', costRange: '$120-$200/SF' },
  { value: 'office_mid_rise', label: 'Office (Mid-Rise)', costRange: '$150-$250/SF' },
  { value: 'industrial_warehouse', label: 'Warehouse/Distribution', costRange: '$60-$100/SF' },
  { value: 'industrial_flex', label: 'Flex Industrial', costRange: '$80-$140/SF' },
  { value: 'multifamily_garden', label: 'Multifamily (Garden Style)', costRange: '$130-$200/SF' },
  { value: 'multifamily_midrise', label: 'Multifamily (Mid-Rise)', costRange: '$160-$250/SF' },
  { value: 'hotel_select', label: 'Hotel (Select Service)', costRange: '$150-$220/SF' },
  { value: 'hotel_full', label: 'Hotel (Full Service)', costRange: '$200-$350/SF' },
  { value: 'medical_clinic', label: 'Medical Office/Clinic', costRange: '$180-$300/SF' },
  { value: 'healthcare_hospital', label: 'Hospital/ASC', costRange: '$350-$600/SF' },
];

const QUALITY_TIERS = [
  { value: 'economy', label: 'Economy', multiplier: 0.8, description: 'Basic finishes, minimal amenities' },
  { value: 'standard', label: 'Standard', multiplier: 1.0, description: 'Market-rate finishes, standard features' },
  { value: 'premium', label: 'Premium', multiplier: 1.25, description: 'High-end finishes, enhanced features' },
  { value: 'luxury', label: 'Luxury', multiplier: 1.5, description: 'Top-tier finishes, full amenities' },
];

export function CostIntakeModal({
  open,
  onOpenChange,
  applicationId,
  onSubmitSuccess,
  existingParams,
}: CostIntakeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form state
  const [buildingType, setBuildingType] = useState(existingParams?.building_type || '');
  const [qualityTier, setQualityTier] = useState<string>(existingParams?.quality_tier || 'standard');
  const [proposedGfa, setProposedGfa] = useState(existingParams?.proposed_gfa_sf?.toString() || '');
  const [numStories, setNumStories] = useState(existingParams?.num_stories || 1);
  const [projectTimeline, setProjectTimeline] = useState(existingParams?.project_timeline_months || 18);
  const [includeSitework, setIncludeSitework] = useState(existingParams?.include_sitework ?? true);
  const [includeParkingStructure, setIncludeParkingStructure] = useState(existingParams?.include_parking_structure ?? false);
  const [parkingSpaces, setParkingSpaces] = useState(existingParams?.parking_spaces?.toString() || '');

  const handleSubmit = async () => {
    if (!buildingType || !proposedGfa) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const constructionParams: ConstructionParams = {
        building_type: buildingType,
        quality_tier: qualityTier as ConstructionParams['quality_tier'],
        proposed_gfa_sf: parseInt(proposedGfa, 10),
        num_stories: numStories,
        project_timeline_months: projectTimeline,
        include_sitework: includeSitework,
        include_parking_structure: includeParkingStructure,
        parking_spaces: parkingSpaces ? parseInt(parkingSpaces, 10) : undefined,
      };

      const { error } = await supabase.functions.invoke('save-construction-params', {
        body: {
          application_id: applicationId,
          construction_params: constructionParams,
        },
      });

      if (error) throw error;

      toast.success("Construction parameters saved! Generating refined cost estimate...");
      onOpenChange(false);
      onSubmitSuccess?.();
    } catch (err: any) {
      console.error('[CostIntakeModal] Error:', err);
      toast.error(err.message || "Failed to save construction parameters");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBuildingType = BUILDING_TYPES.find(t => t.value === buildingType);
  const selectedQuality = QUALITY_TIERS.find(t => t.value === qualityTier);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--feasibility-orange)/0.1)] border border-[hsl(var(--feasibility-orange)/0.2)]">
              <Sparkles className="h-5 w-5 text-[hsl(var(--feasibility-orange))]" />
            </div>
            <div>
              <DialogTitle className="text-xl">Refine Your Cost Estimate</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Provide construction details for a more accurate cost range
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  step === s
                    ? "bg-[hsl(var(--feasibility-orange))] text-white"
                    : step > s
                    ? "bg-[hsl(var(--status-success))] text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Building Type */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Building Type <span className="text-destructive">*</span>
                  </Label>
                  <Select value={buildingType} onValueChange={setBuildingType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select building type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BUILDING_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center justify-between w-full gap-4">
                            <span>{type.label}</span>
                            <Badge variant="outline" className="text-xs font-mono">
                              {type.costRange}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBuildingType && (
                    <p className="text-xs text-muted-foreground">
                      Typical hard cost range: {selectedBuildingType.costRange}
                    </p>
                  )}
                </div>

                {/* Quality Tier */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    Quality Tier
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {QUALITY_TIERS.map((tier) => (
                      <button
                        key={tier.value}
                        onClick={() => setQualityTier(tier.value)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all",
                          qualityTier === tier.value
                            ? "border-[hsl(var(--feasibility-orange))] bg-[hsl(var(--feasibility-orange)/0.05)]"
                            : "border-border hover:border-[hsl(var(--feasibility-orange)/0.5)]"
                        )}
                      >
                        <div className="font-medium text-sm">{tier.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {tier.multiplier}x base
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedQuality && (
                    <p className="text-xs text-muted-foreground">
                      {selectedQuality.description}
                    </p>
                  )}
                </div>

                {/* Proposed GFA */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    Proposed Gross Floor Area (SF) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g., 50000"
                    value={proposedGfa}
                    onChange={(e) => setProposedGfa(e.target.value)}
                    className="font-mono"
                  />
                  {proposedGfa && (
                    <p className="text-xs text-muted-foreground">
                      {parseInt(proposedGfa, 10).toLocaleString()} SF = ~{(parseInt(proposedGfa, 10) / 43560).toFixed(2)} acres footprint (single story)
                    </p>
                  )}
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => setStep(2)}
                  disabled={!buildingType || !proposedGfa}
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Number of Stories */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Number of Stories: <span className="font-mono font-bold">{numStories}</span>
                  </Label>
                  <Slider
                    value={[numStories]}
                    onValueChange={([val]) => setNumStories(val)}
                    min={1}
                    max={12}
                    step={1}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 story</span>
                    <span>12 stories</span>
                  </div>
                </div>

                {/* Project Timeline */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Construction Timeline: <span className="font-mono font-bold">{projectTimeline} months</span>
                  </Label>
                  <Slider
                    value={[projectTimeline]}
                    onValueChange={([val]) => setProjectTimeline(val)}
                    min={6}
                    max={36}
                    step={1}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>6 months</span>
                    <span>36 months</span>
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-3">
                  <Label className="text-muted-foreground">Additional Scope (Optional)</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeSitework}
                        onChange={(e) => setIncludeSitework(e.target.checked)}
                        className="w-4 h-4 rounded border-border"
                      />
                      <div>
                        <span className="font-medium text-sm">Include Sitework</span>
                        <p className="text-xs text-muted-foreground">Grading, paving, landscaping, utilities</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeParkingStructure}
                        onChange={(e) => setIncludeParkingStructure(e.target.checked)}
                        className="w-4 h-4 rounded border-border"
                      />
                      <div>
                        <span className="font-medium text-sm">Include Parking Structure</span>
                        <p className="text-xs text-muted-foreground">Structured parking (vs surface lot)</p>
                      </div>
                    </label>
                  </div>
                </div>

                {includeParkingStructure && (
                  <div className="space-y-2">
                    <Label>Parking Spaces</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 200"
                      value={parkingSpaces}
                      onChange={(e) => setParkingSpaces(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                )}

                {/* Info Box */}
                <div className="p-4 rounded-lg bg-[hsl(var(--data-cyan)/0.1)] border border-[hsl(var(--data-cyan)/0.2)]">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-[hsl(var(--data-cyan))] shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-[hsl(var(--data-cyan))]">Benchmark-Based Estimates</p>
                      <p className="text-muted-foreground mt-1">
                        Cost ranges are derived from 2024 RSMeans data for Houston MSA, adjusted for 
                        quality tier and building type. Actual costs may vary based on market conditions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-1 bg-[hsl(var(--feasibility-orange))] hover:bg-[hsl(var(--feasibility-orange)/0.9)]" 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Refined Estimate
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
