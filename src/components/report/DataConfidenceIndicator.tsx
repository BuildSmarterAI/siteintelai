import { motion } from "framer-motion";
import { 
  Sparkles, 
  Database, 
  Clock, 
  CheckCircle2,
  AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DataConfidenceIndicatorProps {
  confidence: number; // 0-100
  dataSourcesCount: number;
  lastUpdated?: string;
  dataFreshness?: "fresh" | "recent" | "stale";
  className?: string;
}

export function DataConfidenceIndicator({
  confidence,
  dataSourcesCount,
  lastUpdated,
  dataFreshness = "fresh",
  className,
}: DataConfidenceIndicatorProps) {
  const getConfidenceColor = (val: number) => {
    if (val >= 85) return "hsl(var(--status-success))";
    if (val >= 70) return "hsl(var(--data-cyan))";
    if (val >= 50) return "hsl(var(--status-warning))";
    return "hsl(var(--status-error))";
  };

  const getConfidenceLabel = (val: number) => {
    if (val >= 85) return "High Confidence";
    if (val >= 70) return "Good Confidence";
    if (val >= 50) return "Moderate Confidence";
    return "Low Confidence";
  };

  const getFreshnessIcon = (freshness: string) => {
    switch (freshness) {
      case "fresh":
        return <CheckCircle2 className="h-3 w-3 text-[hsl(var(--status-success))]" />;
      case "recent":
        return <Clock className="h-3 w-3 text-[hsl(var(--status-warning))]" />;
      default:
        return <AlertCircle className="h-3 w-3 text-[hsl(var(--status-error))]" />;
    }
  };

  return (
    <motion.div
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg",
        "bg-gradient-to-r from-[hsl(var(--midnight-blue)/0.05)] to-[hsl(var(--data-cyan)/0.05)]",
        "border border-[hsl(var(--data-cyan)/0.2)]",
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* AI Confidence Meter */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <motion.div
                className="relative"
                animate={{ 
                  boxShadow: [
                    `0 0 0 0 ${getConfidenceColor(confidence)}40`,
                    `0 0 0 4px ${getConfidenceColor(confidence)}00`,
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles 
                  className="h-5 w-5" 
                  style={{ color: getConfidenceColor(confidence) }}
                />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  AI Confidence
                </span>
                <div className="flex items-center gap-2">
                  <span 
                    className="font-mono font-bold text-sm"
                    style={{ color: getConfidenceColor(confidence) }}
                  >
                    {confidence}%
                  </span>
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: getConfidenceColor(confidence) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${confidence}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{getConfidenceLabel(confidence)}</p>
            <p className="text-xs text-muted-foreground">
              Based on data completeness and source reliability
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Divider */}
      <div className="w-px h-8 bg-border" />

      {/* Data Sources */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[hsl(var(--data-cyan))]" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Sources
                </span>
                <span className="font-mono font-bold text-sm text-foreground">
                  {dataSourcesCount} verified
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{dataSourcesCount} Data Sources</p>
            <p className="text-xs text-muted-foreground">
              FEMA, HCAD, TxDOT, Census, EPA, and more
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Divider */}
      <div className="w-px h-8 bg-border" />

      {/* Data Freshness */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {getFreshnessIcon(dataFreshness)}
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Data Status
                </span>
                <span className="font-mono text-sm text-foreground capitalize">
                  {dataFreshness}
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">Data {dataFreshness}</p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Last synced: {new Date(lastUpdated).toLocaleDateString()}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}
