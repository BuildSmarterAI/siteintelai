/**
 * SiteIntel™ Design Mode - Export Panel
 * 
 * Per PRD: Only PNG, PDF, and CSV exports allowed.
 * All blocked formats show clear error message.
 */

import { useState } from "react";
import { useDesignStore } from "@/stores/useDesignStore";
import { 
  exportAsPDF, 
  exportAsCSV, 
  exportAsPNG, 
  isBlockedFormat,
  type AllowedExportFormat 
} from "@/lib/designExport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  Download, 
  FileImage, 
  FileText, 
  Table2,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Loader2
} from "lucide-react";

interface ExportPanelProps {
  className?: string;
}

const EXPORT_OPTIONS = [
  {
    id: "png" as const,
    label: "Map Snapshot",
    description: "PNG image of current map view with overlays",
    icon: FileImage,
    allowed: true,
  },
  {
    id: "pdf" as const,
    label: "Summary Report",
    description: "PDF document with all variants and metrics",
    icon: FileText,
    allowed: true,
  },
  {
    id: "csv" as const,
    label: "Metrics Table",
    description: "CSV spreadsheet of variant comparison data",
    icon: Table2,
    allowed: true,
  },
];

const BLOCKED_FORMATS = [
  { id: "dwg", label: "AutoCAD (.dwg)" },
  { id: "rvt", label: "Revit (.rvt)" },
  { id: "ifc", label: "IFC (.ifc)" },
  { id: "dxf", label: "DXF (.dxf)" },
];

export function ExportPanel({ className }: ExportPanelProps) {
  const { variants, envelope } = useDesignStore();
  const [selectedFormat, setSelectedFormat] = useState<AllowedExportFormat>("pdf");
  const [fileName, setFileName] = useState("siteintel-design");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!envelope) {
      toast.error("No envelope data available");
      return;
    }

    if (variants.length === 0) {
      toast.error("Create at least one variant to export");
      return;
    }

    setIsExporting(true);

    try {
      switch (selectedFormat) {
        case "png":
          await exportAsPNG("design-canvas", fileName);
          toast.success("Map snapshot exported");
          break;
        case "pdf":
          await exportAsPDF({ format: "pdf", variants, envelope, fileName });
          toast.success("PDF summary exported");
          break;
        case "csv":
          exportAsCSV({ format: "csv", variants, envelope, fileName });
          toast.success("CSV metrics exported");
          break;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleBlockedFormatClick = (format: string) => {
    toast.error(
      `${format} export is not available for conceptual designs. ` +
      "This tool produces conceptual designs only, not construction documents.",
      { duration: 5000 }
    );
  };

  return (
    <div className={cn("space-y-6 p-4", className)}>
      {/* Disclaimer banner */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Export Disclaimer</AlertTitle>
        <AlertDescription>
          All exports include a footer stating: "Conceptual design only. 
          Not for construction, permitting, or bidding."
        </AlertDescription>
      </Alert>

      {/* Allowed formats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Available Exports
          </CardTitle>
          <CardDescription>
            Choose a format for your design export
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            value={selectedFormat} 
            onValueChange={(v) => setSelectedFormat(v as AllowedExportFormat)}
          >
            {EXPORT_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                    selectedFormat === option.id 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setSelectedFormat(option.id)}
                >
                  <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                  <div className="flex-shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={option.id} className="font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Allowed
                  </Badge>
                </div>
              );
            })}
          </RadioGroup>

          <Separator />

          {/* File name input */}
          <div className="space-y-2">
            <Label htmlFor="fileName">File Name</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="siteintel-design"
            />
          </div>

          {/* Export button */}
          <Button 
            onClick={handleExport} 
            disabled={isExporting || variants.length === 0}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Blocked formats */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Ban className="h-5 w-5" />
            Unavailable Formats
          </CardTitle>
          <CardDescription>
            Construction-grade formats are not available for conceptual designs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {BLOCKED_FORMATS.map((format) => (
              <button
                key={format.id}
                onClick={() => handleBlockedFormatClick(format.label)}
                className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30 text-muted-foreground cursor-not-allowed opacity-60"
              >
                <Ban className="h-4 w-4" />
                <span className="text-sm">{format.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Per SiteIntel™ policy, CAD/BIM exports are blocked. 
            Design Mode produces conceptual test-fits only, not construction documents.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
