import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getFeasibilitySnapshot, getFeasibilityJob, FeasibilitySnapshot, FeasibilityJob } from "@/services/feasibilityApi";
import { AlertCircle, Building, Droplet, Zap, Car, BarChart3, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProcessingStep {
  id: string;
  label: string;
  icon: React.ElementType;
  status: 'pending' | 'running' | 'complete';
}

const PROCESSING_STEPS: Omit<ProcessingStep, 'status'>[] = [
  { id: 'zoning', label: 'Zoning & Overlays', icon: Building },
  { id: 'flood', label: 'Flood & Environmental', icon: Droplet },
  { id: 'utilities', label: 'Utilities & Infrastructure', icon: Zap },
  { id: 'access', label: 'Access & Traffic', icon: Car },
  { id: 'scoring', label: 'Composite Scoring', icon: BarChart3 },
];

export default function FeasibilityProcessing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const snapshotId = searchParams.get("snapshot_id");

  const [snapshot, setSnapshot] = useState<FeasibilitySnapshot | null>(null);
  const [job, setJob] = useState<FeasibilityJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Load snapshot and job
  useEffect(() => {
    if (!snapshotId) return;

    const load = async () => {
      try {
        const [snap, j] = await Promise.all([
          getFeasibilitySnapshot(snapshotId),
          getFeasibilityJob(snapshotId),
        ]);
        setSnapshot(snap);
        setJob(j);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load feasibility data");
      }
    };

    load();
  }, [snapshotId]);

  // Simulate step progression (in production, poll job status)
  useEffect(() => {
    if (!snapshot || job?.status === 'completed') return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= PROCESSING_STEPS.length - 1) {
          clearInterval(interval);
          // In production, check job status and redirect when complete
          setTimeout(() => {
            // Navigate to report when done (using application_id if linked)
            if (snapshot.application_id) {
              navigate(`/report/${snapshot.application_id}`);
            }
          }, 1500);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [snapshot, job, navigate]);

  // Missing snapshot_id
  if (!snapshotId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground">Snapshot Required</h1>
          <p className="text-muted-foreground mt-2">
            A feasibility snapshot is required to view processing status.
          </p>
          <Button className="mt-6" onClick={() => navigate("/get-started")}>
            Start New Analysis
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground">Error</h1>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button className="mt-6" onClick={() => navigate("/get-started")}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const steps: ProcessingStep[] = PROCESSING_STEPS.map((step, index) => ({
    ...step,
    status: index < currentStep ? 'complete' : index === currentStep ? 'running' : 'pending',
  }));

  const isComplete = currentStep >= PROCESSING_STEPS.length - 1 && steps[steps.length - 1].status === 'complete';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-foreground">
            {isComplete ? "Analysis Complete" : "Running Feasibility Analysis"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isComplete 
              ? "Your feasibility report is ready." 
              : "Analyzing parcel data across multiple systems…"}
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border transition-all duration-300",
                  step.status === 'complete' && "bg-primary/5 border-primary/20",
                  step.status === 'running' && "bg-accent border-accent-foreground/20",
                  step.status === 'pending' && "bg-muted/50 border-border"
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                    step.status === 'complete' && "bg-primary text-primary-foreground",
                    step.status === 'running' && "bg-accent-foreground/10 text-accent-foreground",
                    step.status === 'pending' && "bg-muted text-muted-foreground"
                  )}
                >
                  {step.status === 'complete' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : step.status === 'running' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={cn(
                      "font-medium",
                      step.status === 'complete' && "text-foreground",
                      step.status === 'running' && "text-foreground",
                      step.status === 'pending' && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
                {step.status === 'complete' && (
                  <span className="text-xs text-primary font-medium">Complete</span>
                )}
                {step.status === 'running' && (
                  <span className="text-xs text-muted-foreground">Processing…</span>
                )}
              </div>
            );
          })}
        </div>

        {isComplete && (
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              onClick={() => {
                if (snapshot?.application_id) {
                  navigate(`/report/${snapshot.application_id}`);
                } else {
                  navigate("/dashboard");
                }
              }}
            >
              View Report
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
