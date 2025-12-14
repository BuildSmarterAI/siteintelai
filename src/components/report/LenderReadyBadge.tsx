import { motion } from "framer-motion";
import { Shield, Download, FileText, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LenderReadyBadgeProps {
  reportId: string;
  createdAt: string;
  pdfUrl?: string | null;
  onDownloadPdf?: () => void;
  className?: string;
}

export function LenderReadyBadge({
  reportId,
  createdAt,
  pdfUrl,
  onDownloadPdf,
  className,
}: LenderReadyBadgeProps) {
  const exportFormats = [
    { label: "PDF", available: !!pdfUrl },
    { label: "JSON", available: true },
    { label: "CSV", available: true },
  ];

  return (
    <motion.div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg",
        "bg-gradient-to-r from-[hsl(var(--midnight-blue))] to-[hsl(var(--midnight-blue)/0.9)]",
        "border border-[hsl(var(--feasibility-orange)/0.3)]",
        "shadow-[0_0_20px_hsl(var(--feasibility-orange)/0.1)]",
        className
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Left side - Certification */}
      <div className="flex items-center gap-3">
        <motion.div
          className="p-2 rounded-full bg-[hsl(var(--feasibility-orange)/0.2)]"
          animate={{ 
            boxShadow: [
              "0 0 0 0 hsl(var(--feasibility-orange) / 0.4)",
              "0 0 0 8px hsl(var(--feasibility-orange) / 0)",
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Shield className="h-5 w-5 text-[hsl(var(--feasibility-orange))]" />
        </motion.div>
        
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Lender-Ready Report</span>
            <Badge className="bg-[hsl(var(--status-success))] text-white border-0 text-[10px]">
              <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
              VERIFIED
            </Badge>
          </div>
          <p className="text-xs text-white/60 font-mono">
            Report ID: {reportId.slice(0, 8)}... • Generated {new Date(createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Right side - Export formats */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {exportFormats.map((format) => (
            <Badge
              key={format.label}
              variant="outline"
              className={cn(
                "text-[10px] border-white/20",
                format.available 
                  ? "text-white/80" 
                  : "text-white/40 opacity-50"
              )}
            >
              {format.label}
            </Badge>
          ))}
        </div>
        
        {pdfUrl && onDownloadPdf && (
          <Button
            onClick={onDownloadPdf}
            size="sm"
            className="bg-[hsl(var(--feasibility-orange))] hover:bg-[hsl(var(--feasibility-orange)/0.9)] text-white"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
        )}
      </div>
    </motion.div>
  );
}
