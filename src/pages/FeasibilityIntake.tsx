import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createFeasibilitySnapshot, IntendedUse, ProjectType } from "@/services/feasibilityApi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Building2, Hammer, AlertCircle } from "lucide-react";

const INTENDED_USE_OPTIONS: { value: IntendedUse; label: string }[] = [
  { value: "industrial", label: "Industrial" },
  { value: "retail", label: "Retail" },
  { value: "office", label: "Office" },
  { value: "medical", label: "Medical" },
  { value: "multifamily", label: "Multifamily" },
  { value: "hotel", label: "Hotel" },
  { value: "other", label: "Other" },
];

export default function FeasibilityIntake() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // parcel_id must already be selected & locked
  const parcelId = searchParams.get("parcel_id");

  const [intendedUse, setIntendedUse] = useState<IntendedUse | "">("");
  const [projectType, setProjectType] = useState<ProjectType | "">("");
  const [approxSqFt, setApproxSqFt] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Missing parcel - show error state
  if (!parcelId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground">Parcel Required</h1>
          <p className="text-muted-foreground mt-2">
            A parcel must be selected before starting feasibility analysis.
          </p>
          <Button 
            className="mt-6" 
            onClick={() => navigate("/get-started")}
          >
            Select a Parcel
          </Button>
        </div>
      </div>
    );
  }

  const canSubmit = intendedUse !== "" && projectType !== "" && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);

    try {
      const snapshot = await createFeasibilitySnapshot({
        parcel_id: parcelId,
        intended_use: intendedUse,
        project_type: projectType,
        approx_sqft: approxSqFt === "" ? null : Number(approxSqFt),
      });

      toast.success("Feasibility snapshot created");
      
      // Route directly into processing state
      navigate(`/app/feasibility/run?snapshot_id=${snapshot.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create feasibility snapshot";
      toast.error(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            Feasibility Intake
          </h1>
          <p className="text-muted-foreground mt-2">
            Provide the minimum assumptions required to evaluate feasibility.
            These inputs will be locked once submitted.
          </p>
        </div>

        {/* Intended Use */}
        <div className="space-y-2">
          <Label htmlFor="intended-use">
            Intended Use <span className="text-destructive">*</span>
          </Label>
          <Select
            value={intendedUse}
            onValueChange={(value) => setIntendedUse(value as IntendedUse)}
          >
            <SelectTrigger id="intended-use" className="w-full">
              <SelectValue placeholder="Select intended use" />
            </SelectTrigger>
            <SelectContent>
              {INTENDED_USE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Project Type */}
        <div className="mt-6 space-y-3">
          <Label>
            Project Type <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={projectType}
            onValueChange={(value) => setProjectType(value as ProjectType)}
            className="flex gap-4"
          >
            <div className="flex-1">
              <RadioGroupItem
                value="ground_up"
                id="ground_up"
                className="peer sr-only"
              />
              <Label
                htmlFor="ground_up"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
              >
                <Building2 className="h-6 w-6 mb-2" />
                <span className="font-medium">Ground-Up</span>
                <span className="text-xs text-muted-foreground mt-1">New construction</span>
              </Label>
            </div>
            <div className="flex-1">
              <RadioGroupItem
                value="tenant_improvement"
                id="tenant_improvement"
                className="peer sr-only"
              />
              <Label
                htmlFor="tenant_improvement"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
              >
                <Hammer className="h-6 w-6 mb-2" />
                <span className="font-medium">Tenant Improvement</span>
                <span className="text-xs text-muted-foreground mt-1">Existing structure</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Approx Square Footage */}
        <div className="mt-6 space-y-2">
          <Label htmlFor="approx-sqft">
            Approx. Building Size (SF)
            <span className="text-muted-foreground ml-1 font-normal">(optional)</span>
          </Label>
          <Input
            id="approx-sqft"
            type="number"
            min={0}
            value={approxSqFt}
            onChange={(e) => setApproxSqFt(e.target.value)}
            placeholder="e.g. 50000"
            className="w-full"
          />
        </div>

        {/* Submit */}
        <div className="mt-10 flex justify-end">
          <Button
            disabled={!canSubmit}
            onClick={handleSubmit}
            size="lg"
          >
            {submitting ? "Starting Feasibility…" : "Run Feasibility"}
          </Button>
        </div>
      </div>
    </div>
  );
}
