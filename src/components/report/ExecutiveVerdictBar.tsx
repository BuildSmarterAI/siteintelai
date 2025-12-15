import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type VerdictType = "PROCEED" | "CONDITIONAL" | "DO_NOT_PROCEED";

interface ExecutiveVerdictBarProps {
  verdict: VerdictType;
  justification: string;
  confidence: number;
  timestamp: string;
  onScrollToKillFactors?: () => void;
}

const verdictConfig: Record<VerdictType, {
  label: string;
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
  borderClass: string;
  iconBgClass: string;
}> = {
  PROCEED: {
    label: "PROCEED",
    icon: <CheckCircle2 className="h-6 w-6" />,
    bgClass: "bg-[hsl(var(--verdict-proceed-bg))]",
    textClass: "text-[hsl(var(--verdict-proceed))]",
    borderClass: "border-[hsl(var(--verdict-proceed)/0.3)]",
    iconBgClass: "bg-[hsl(var(--verdict-proceed)/0.2)]",
  },
  CONDITIONAL: {
    label: "CONDITIONAL",
    icon: <AlertTriangle className="h-6 w-6" />,
    bgClass: "bg-[hsl(var(--verdict-conditional-bg))]",
    textClass: "text-[hsl(var(--verdict-conditional))]",
    borderClass: "border-[hsl(var(--verdict-conditional)/0.3)]",
    iconBgClass: "bg-[hsl(var(--verdict-conditional)/0.2)]",
  },
  DO_NOT_PROCEED: {
    label: "DO NOT PROCEED",
    icon: <XCircle className="h-6 w-6" />,
    bgClass: "bg-[hsl(var(--verdict-blocked-bg))]",
    textClass: "text-[hsl(var(--verdict-blocked))]",
    borderClass: "border-[hsl(var(--verdict-blocked)/0.3)]",
    iconBgClass: "bg-[hsl(var(--verdict-blocked)/0.2)]",
  },
};

export function ExecutiveVerdictBar({
  verdict,
  justification,
  confidence,
  timestamp,
  onScrollToKillFactors,
}: ExecutiveVerdictBarProps) {
  const config = verdictConfig[verdict];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "sticky top-0 z-40 w-full border-b-2 backdrop-blur-sm",
        config.bgClass,
        config.borderClass
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <button
          onClick={onScrollToKillFactors}
          className="w-full py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 cursor-pointer hover:opacity-90 transition-opacity"
        >
          {/* Left: Verdict + Justification */}
          <div className="flex items-center gap-4">
            <div className={cn("p-2.5 rounded-xl", config.iconBgClass)}>
              <span className={config.textClass}>{config.icon}</span>
            </div>
            
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h2 className={cn("text-xl md:text-2xl font-bold font-heading tracking-tight", config.textClass)}>
                  {config.label}
                </h2>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xl line-clamp-1">
                {justification}
              </p>
            </div>
          </div>
          
          {/* Right: Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className={cn("h-full rounded-full", config.textClass.replace("text-", "bg-"))}
                />
              </div>
              <span className="font-mono">{confidence}%</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-mono">{timestamp}</span>
            </div>
          </div>
        </button>
      </div>
    </motion.div>
  );
}
