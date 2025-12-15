import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Share2, 
  Printer, 
  Shield, 
  Clock,
  Database,
  Sparkles,
  Copy,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import siteintelLogo from "@/assets/siteintel-ai-logo-main.png";

interface ReportHeaderProps {
  address: string;
  parcelId?: string;
  jurisdiction?: string;
  zoningCode?: string;
  acreage?: number;
  createdAt: string;
  pdfUrl?: string | null;
  onDownloadPdf?: () => void;
  pdfGenerating?: boolean;
  pdfError?: boolean;
}

export function ReportHeader({
  address,
  parcelId,
  jurisdiction,
  zoningCode,
  acreage,
  createdAt,
  pdfUrl,
  onDownloadPdf,
  pdfGenerating,
  pdfError,
}: ReportHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [dataNodes, setDataNodes] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Generate random data verification nodes
    const nodes = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setDataNodes(nodes);
  }, []);

  const copyParcelId = () => {
    if (parcelId) {
      navigator.clipboard.writeText(parcelId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-[hsl(var(--midnight-blue))] text-white">
      {/* AI Grid Overlay */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--data-cyan) / 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--data-cyan) / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Animated Data Nodes */}
      <div className="absolute inset-0 overflow-hidden">
        {dataNodes.map((node) => (
          <motion.div
            key={node.id}
            className="absolute w-1 h-1 rounded-full bg-[hsl(var(--data-cyan))]"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3,
              delay: node.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Scan Line Effect */}
      <motion.div
        className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--data-cyan))] to-transparent opacity-30"
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 p-6 md:p-8">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <img src={siteintelLogo} alt="SiteIntel" className="h-8 md:h-10 drop-shadow-[0_0_10px_hsl(var(--feasibility-orange)/0.4)]" />
            <Badge className="bg-[hsl(var(--feasibility-orange))] text-white border-0 font-mono text-xs uppercase tracking-wider">
              <Shield className="h-3 w-3 mr-1" />
              Lender-Ready Report
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <Printer className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            {pdfUrl ? (
              <Button 
                onClick={onDownloadPdf}
                size="sm"
                className="bg-[hsl(var(--feasibility-orange))] hover:bg-[hsl(var(--feasibility-orange))]/90 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            ) : pdfGenerating ? (
              <Button size="sm" disabled className="bg-white/10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                </motion.div>
                Generating...
              </Button>
            ) : pdfError ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500/20 text-amber-300 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>PDF unavailable</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Address with Animation */}
          <motion.h1 
            className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {address}
          </motion.h1>

          {/* Property Intelligence Strip */}
          <motion.div 
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {parcelId && (
              <button
                onClick={copyParcelId}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors font-mono text-sm"
              >
                <span className="text-[hsl(var(--data-cyan))] text-xs uppercase tracking-wider">Parcel</span>
                <span>{parcelId}</span>
                {copied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            )}
            
            {jurisdiction && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 font-mono text-sm">
                <span className="text-[hsl(var(--data-cyan))] text-xs uppercase tracking-wider">Jurisdiction</span>
                <span>{jurisdiction}</span>
              </div>
            )}
            
            {zoningCode && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 font-mono text-sm">
                <span className="text-[hsl(var(--data-cyan))] text-xs uppercase tracking-wider">Zone</span>
                <span>{zoningCode}</span>
              </div>
            )}
            
            {acreage && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 font-mono text-sm">
                <span className="text-[hsl(var(--data-cyan))] text-xs uppercase tracking-wider">Size</span>
                <span>{acreage.toFixed(2)} AC</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom Meta Bar */}
        <motion.div 
          className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-white/10 text-xs text-white/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Generated {new Date(createdAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-[hsl(var(--data-cyan))]" />
            <span className="text-[hsl(var(--data-cyan))]">12 data sources verified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--feasibility-orange))]" />
            <span>AI-Enhanced Analysis</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
