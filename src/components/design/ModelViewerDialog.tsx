import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { ModelViewer3D } from "./ModelViewer3D";
import { cn } from "@/lib/utils";

export interface ModelViewerDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** URL to the GLB file */
  src: string;
  /** Optional poster image */
  poster?: string;
  /** Title for the dialog */
  title?: string;
  /** Optional download URL (defaults to src if not provided) */
  downloadUrl?: string;
  /** Filename for download */
  downloadFilename?: string;
  /** Additional class names */
  className?: string;
}

export function ModelViewerDialog({
  open,
  onOpenChange,
  src,
  poster,
  title = "3D Model Preview",
  downloadUrl,
  downloadFilename = "model.glb",
  className,
}: ModelViewerDialogProps) {
  const handleDownload = () => {
    const url = downloadUrl || src;
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadFilename;
    link.target = "_blank";
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-4xl w-[90vw] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden",
          className
        )}
      >
        <DialogHeader className="px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold">
              {title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="h-8"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download GLB
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 p-4 bg-secondary/20">
          <ModelViewer3D
            src={src}
            poster={poster}
            alt={title}
            aspectRatio="auto"
            autoRotate
            showControls
            className="h-full w-full"
          />
        </div>

        {/* Model Info Footer */}
        <div className="px-4 py-2 border-t border-border bg-muted/30 flex-shrink-0">
          <p className="text-xs text-muted-foreground">
            Use mouse to orbit • Scroll to zoom • Shift+drag to pan
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ModelViewerDialog;
