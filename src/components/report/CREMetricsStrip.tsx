import { motion } from "framer-motion";
import { 
  Ruler, 
  Building2, 
  Droplets, 
  Zap, 
  Car,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CREMetric {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  status?: "good" | "warning" | "critical" | "neutral";
}

interface CREMetricsStripProps {
  lotSize?: number;
  lotUnit?: string;
  zoningCode?: string;
  floodZone?: string;
  utilitiesAvailable?: boolean;
  trafficAADT?: number;
  marketValue?: number;
  className?: string;
}

export function CREMetricsStrip({
  lotSize,
  lotUnit = "AC",
  zoningCode,
  floodZone,
  utilitiesAvailable,
  trafficAADT,
  marketValue,
  className,
}: CREMetricsStripProps) {
  const getFloodStatus = (zone?: string): "good" | "warning" | "critical" | "neutral" => {
    if (!zone) return "neutral";
    if (zone.toLowerCase().includes("x") || zone === "X") return "good";
    if (zone.toLowerCase().includes("ae") || zone.toLowerCase().includes("a")) return "critical";
    return "warning";
  };

  const metrics: CREMetric[] = [
    {
      label: "Lot Size",
      value: lotSize ? lotSize.toFixed(2) : "—",
      unit: lotUnit,
      icon: <Ruler className="h-4 w-4" />,
      status: "neutral",
    },
    {
      label: "Zone",
      value: zoningCode || "—",
      icon: <Building2 className="h-4 w-4" />,
      status: "neutral",
    },
    {
      label: "Flood",
      value: floodZone || "—",
      icon: <Droplets className="h-4 w-4" />,
      status: getFloodStatus(floodZone),
    },
    {
      label: "Utilities",
      value: utilitiesAvailable === undefined ? "—" : utilitiesAvailable ? "Available" : "Limited",
      icon: <Zap className="h-4 w-4" />,
      status: utilitiesAvailable === undefined ? "neutral" : utilitiesAvailable ? "good" : "warning",
    },
    {
      label: "Traffic",
      value: trafficAADT ? trafficAADT.toLocaleString() : "—",
      unit: trafficAADT ? "AADT" : undefined,
      icon: <Car className="h-4 w-4" />,
      status: "neutral",
    },
    {
      label: "Market Value",
      value: marketValue ? `$${(marketValue / 1000).toFixed(0)}K` : "—",
      icon: <DollarSign className="h-4 w-4" />,
      status: "neutral",
    },
  ];

  const getStatusColor = (status: CREMetric["status"]) => {
    switch (status) {
      case "good":
        return "text-[hsl(var(--status-success))] bg-[hsl(var(--status-success)/0.1)] border-[hsl(var(--status-success)/0.2)]";
      case "warning":
        return "text-[hsl(var(--status-warning))] bg-[hsl(var(--status-warning)/0.1)] border-[hsl(var(--status-warning)/0.2)]";
      case "critical":
        return "text-[hsl(var(--status-error))] bg-[hsl(var(--status-error)/0.1)] border-[hsl(var(--status-error)/0.2)]";
      default:
        return "text-[hsl(var(--data-cyan))] bg-[hsl(var(--midnight-blue)/0.05)] border-[hsl(var(--midnight-blue)/0.1)]";
    }
  };

  const getIconColor = (status: CREMetric["status"]) => {
    switch (status) {
      case "good":
        return "text-[hsl(var(--status-success))]";
      case "warning":
        return "text-[hsl(var(--status-warning))]";
      case "critical":
        return "text-[hsl(var(--status-error))]";
      default:
        return "text-[hsl(var(--data-cyan))]";
    }
  };

  return (
    <motion.div 
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-card/50 backdrop-blur-sm",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Terminal-style header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-[hsl(var(--midnight-blue))] text-white">
        <TrendingUp className="h-4 w-4 text-[hsl(var(--feasibility-orange))]" />
        <span className="text-xs font-mono uppercase tracking-wider">Deal Metrics</span>
        <div className="ml-auto flex gap-1">
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--status-error))]" />
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--status-warning))]" />
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--status-success))]" />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-border">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            className="p-3 md:p-4 flex flex-col items-center text-center hover:bg-muted/50 transition-colors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <div className={cn("mb-1.5", getIconColor(metric.status))}>
              {metric.icon}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono font-bold text-sm md:text-base text-foreground">
                {metric.value}
              </span>
              {metric.unit && (
                <span className="text-xs text-muted-foreground">{metric.unit}</span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              {metric.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
