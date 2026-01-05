/**
 * CityEngine 3D Export Section
 * 
 * Allows users to queue CityEngine jobs for generating 3D models (GLB/OBJ)
 * and rendered views from their design variants.
 */

import { useState, useEffect } from "react";
import { useDesignStore } from "@/stores/useDesignStore";
import { useDesignSession } from "@/hooks/useDesignSession";
import { 
  useCityEngineJob, 
  useQueueCityEngineJob,
  useCancelCityEngineJob,
  getJobStatusInfo 
} from "@/hooks/useCityEngineJob";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  Box,
  Camera,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import type { ExportFormat, ViewType } from "@/types/cityengine";

interface CityEngineExportSectionProps {
  className?: string;
  applicationId?: string;
}

const FORMAT_OPTIONS: Array<{ id: ExportFormat; label: string; description: string }> = [
  { id: "glb", label: "GLB Model", description: "Web-ready 3D model for visualization" },
  { id: "obj", label: "OBJ Model", description: "Standard 3D format for CAD tools" },
];

const VIEW_OPTIONS: Array<{ id: ViewType; label: string }> = [
  { id: "axon", label: "Axonometric" },
  { id: "top", label: "Top/Plan" },
  { id: "street", label: "Street View" },
];

export function CityEngineExportSection({ className, applicationId }: CityEngineExportSectionProps) {
  const { activeVariantId, variants, envelope } = useDesignStore();
  const { session } = useDesignSession(applicationId);
  
  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>(["glb"]);
  const [selectedViews, setSelectedViews] = useState<ViewType[]>(["axon", "top", "street"]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  
  const { data: jobStatus, isLoading: isLoadingStatus } = useCityEngineJob(activeJobId);
  const queueJob = useQueueCityEngineJob();
  const cancelJob = useCancelCityEngineJob();

  // Determine which variant to export (active variant, or first)
  const targetVariant = variants.find(v => v.id === activeVariantId) || variants[0];

  const canExport = !!envelope && !!targetVariant && selectedFormats.length > 0;

  // Handle format toggle
  const toggleFormat = (format: ExportFormat) => {
    setSelectedFormats(prev => 
      prev.includes(format) 
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  // Handle view toggle
  const toggleView = (view: ViewType) => {
    setSelectedViews(prev =>
      prev.includes(view)
        ? prev.filter(v => v !== view)
        : [...prev, view]
    );
  };

  // Queue a new job
  const handleGenerate = async () => {
    if (!canExport) return;

    try {
      const result = await queueJob.mutateAsync({
        application_id: applicationId,
        session_id: session?.id,
        variant_id: targetVariant?.id,
        payload: {
          export: {
            formats: selectedFormats,
            views: selectedViews,
            png_size: [2400, 1350] as [number, number],
            include_manifest: true,
          },
        },
      });

      setActiveJobId(result.job_id);
      
      if (result.cached) {
        toast.success("Using cached 3D export");
      } else {
        toast.info("3D generation queued. This may take a few minutes.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to queue job");
    }
  };

  // Cancel pending job
  const handleCancel = async () => {
    if (!activeJobId) return;
    
    try {
      await cancelJob.mutateAsync(activeJobId);
      setActiveJobId(null);
      toast.info("Job cancelled");
    } catch (error) {
      toast.error("Failed to cancel job");
    }
  };

  // Download exports when complete
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const job = jobStatus?.job;
  const signedUrls = jobStatus?.signed_urls;
  const statusInfo = job ? getJobStatusInfo(job.status) : null;
  const isJobActive = job && ["queued", "processing", "exporting", "uploading"].includes(job.status);

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          CityEngine 3D Export
          <Badge variant="outline" className="ml-auto text-xs">Beta</Badge>
        </CardTitle>
        <CardDescription>
          Generate lender-ready 3D models and rendered views using CityEngine 2025.1
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current variant info */}
        {targetVariant && (
          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{targetVariant.name}</span>
              {targetVariant.id === activeVariantId && (
                <Badge variant="default" className="text-xs">Active Variant</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {targetVariant.metrics?.grossFloorAreaSf?.toLocaleString() || "—"} SF • 
              {targetVariant.floors || "—"} floors
            </p>
          </div>
        )}

        <Separator />

        {/* Format selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">3D Formats</Label>
          <div className="grid grid-cols-2 gap-2">
            {FORMAT_OPTIONS.map(option => (
              <div
                key={option.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedFormats.includes(option.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => toggleFormat(option.id)}
              >
                <Checkbox 
                  checked={selectedFormats.includes(option.id)}
                  onCheckedChange={() => toggleFormat(option.id)}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Rendered Views (PNG)</Label>
          <div className="flex flex-wrap gap-2">
            {VIEW_OPTIONS.map(option => (
              <Badge
                key={option.id}
                variant={selectedViews.includes(option.id) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedViews.includes(option.id) 
                    ? "" 
                    : "hover:bg-primary/10"
                )}
                onClick={() => toggleView(option.id)}
              >
                <Camera className="h-3 w-3 mr-1" />
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Job status display */}
        {job && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Generation Status</span>
              <Badge 
                variant="outline" 
                className={cn("text-xs", statusInfo?.color)}
              >
                {statusInfo?.isLoading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                {job.status === "complete" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {job.status === "failed" && <XCircle className="h-3 w-3 mr-1" />}
                {statusInfo?.label}
              </Badge>
            </div>

            {isJobActive && (
              <>
                <Progress value={job.progress || 0} className="h-2" />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {job.current_stage || "Processing..."}
                </p>
              </>
            )}

            {job.status === "failed" && job.error_message && (
              <Alert variant="destructive">
                <AlertDescription className="text-xs">
                  {job.error_message}
                </AlertDescription>
              </Alert>
            )}

            {/* Download buttons when complete */}
            {job.status === "complete" && signedUrls && (
              <div className="grid grid-cols-2 gap-2">
                {signedUrls.model_glb && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(signedUrls.model_glb!, "model.glb")}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    GLB Model
                  </Button>
                )}
                {signedUrls.model_obj && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(signedUrls.model_obj!, "model.obj")}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    OBJ Model
                  </Button>
                )}
                {signedUrls.view_axon && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(signedUrls.view_axon!, "view_axon.png")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Axon View
                  </Button>
                )}
                {signedUrls.view_top && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(signedUrls.view_top!, "view_top.png")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Top View
                  </Button>
                )}
                {signedUrls.view_street && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(signedUrls.view_street!, "view_street.png")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Street View
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {isJobActive ? (
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={cancelJob.isPending}
              className="flex-1"
            >
              {cancelJob.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Cancel
            </Button>
          ) : (
            <>
              <Button
                onClick={handleGenerate}
                disabled={!canExport || queueJob.isPending}
                className="flex-1"
              >
                {queueJob.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Queueing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate 3D
                  </>
                )}
              </Button>
              
              {job?.status === "complete" && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleGenerate}
                  disabled={queueJob.isPending}
                  title="Regenerate"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Info text */}
        <p className="text-xs text-muted-foreground text-center">
          Exports include a parameter manifest for lender traceability.
          Processing typically takes 2-5 minutes.
        </p>
      </CardContent>
    </Card>
  );
}
