import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DataGaugeProps {
  value: number;
  label: string;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
  description?: string;
}

export function DataGauge({
  value,
  label,
  icon,
  size = "md",
  showValue = true,
  className,
  description,
}: DataGaugeProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));
  
  const sizeConfig = {
    sm: { width: 48, strokeWidth: 4, fontSize: "text-xs" },
    md: { width: 64, strokeWidth: 5, fontSize: "text-sm" },
    lg: { width: 80, strokeWidth: 6, fontSize: "text-base" },
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  const getColor = (val: number) => {
    if (val >= 80) return "hsl(var(--status-success))";
    if (val >= 60) return "hsl(var(--status-warning))";
    if (val >= 40) return "hsl(var(--feasibility-orange))";
    return "hsl(var(--status-error))";
  };

  const getGlowColor = (val: number) => {
    if (val >= 80) return "hsl(var(--status-success) / 0.4)";
    if (val >= 60) return "hsl(var(--status-warning) / 0.4)";
    if (val >= 40) return "hsl(var(--feasibility-orange) / 0.4)";
    return "hsl(var(--status-error) / 0.4)";
  };

  const gauge = (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div 
        className="relative"
        style={{ 
          width: config.width, 
          height: config.width,
          filter: `drop-shadow(0 0 8px ${getGlowColor(normalizedValue)})`
        }}
      >
        <svg
          className="transform -rotate-90"
          width={config.width}
          height={config.width}
        >
          {/* Background circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={config.strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={getColor(normalizedValue)}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {icon ? (
            <div className="text-muted-foreground">{icon}</div>
          ) : showValue ? (
            <motion.span
              className={cn("font-mono font-bold", config.fontSize)}
              style={{ color: getColor(normalizedValue) }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {normalizedValue}
            </motion.span>
          ) : null}
        </div>
      </div>
      
      <span className="text-xs text-muted-foreground uppercase tracking-wider text-center leading-tight">
        {label}
      </span>
    </div>
  );

  if (description) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {gauge}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">{label}: {normalizedValue}%</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return gauge;
}
