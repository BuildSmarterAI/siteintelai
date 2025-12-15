import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RiskDriver {
  id: string;
  label: string;
  delta: number; // positive = benefit, negative = penalty
  sectionId: string; // for scroll-to navigation
}

interface RiskDriverListProps {
  positives: RiskDriver[];
  penalties: RiskDriver[];
  onScrollToSection?: (sectionId: string) => void;
}

function DriverRow({ 
  driver, 
  type,
  index,
  onScrollToSection 
}: { 
  driver: RiskDriver; 
  type: "positive" | "penalty";
  index: number;
  onScrollToSection?: (sectionId: string) => void;
}) {
  const isPositive = type === "positive";
  
  return (
    <motion.button
      initial={{ opacity: 0, x: isPositive ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      onClick={() => onScrollToSection?.(driver.sectionId)}
      className={cn(
        "w-full flex items-center justify-between gap-3 p-3 rounded-lg border transition-all",
        "hover:shadow-md hover:scale-[1.02] cursor-pointer",
        isPositive 
          ? "bg-[hsl(var(--verdict-proceed-bg))] border-[hsl(var(--verdict-proceed)/0.2)] hover:border-[hsl(var(--verdict-proceed)/0.4)]"
          : "bg-[hsl(var(--verdict-blocked-bg))] border-[hsl(var(--verdict-blocked)/0.2)] hover:border-[hsl(var(--verdict-blocked)/0.4)]"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-1.5 rounded-lg",
          isPositive ? "bg-[hsl(var(--verdict-proceed)/0.2)]" : "bg-[hsl(var(--verdict-blocked)/0.2)]"
        )}>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-[hsl(var(--verdict-proceed))]" />
          ) : (
            <TrendingDown className="h-4 w-4 text-[hsl(var(--verdict-blocked))]" />
          )}
        </div>
        <span className="text-sm font-medium text-foreground text-left">{driver.label}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-lg font-bold font-mono",
          isPositive ? "text-[hsl(var(--verdict-proceed))]" : "text-[hsl(var(--verdict-blocked))]"
        )}>
          {isPositive ? "+" : ""}{driver.delta}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </motion.button>
  );
}

export function RiskDriverList({ positives, penalties, onScrollToSection }: RiskDriverListProps) {
  // Limit to top 3 each
  const topPositives = positives.slice(0, 3);
  const topPenalties = penalties.slice(0, 3);
  
  return (
    <div className="bg-white rounded-xl border border-[hsl(var(--border-subtle))] p-5">
      <h3 className="text-lg font-semibold font-heading text-[hsl(var(--data-cyan))] mb-4">
        Score Drivers
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positives Column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-[hsl(var(--verdict-proceed))]" />
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Top Positives
            </h4>
          </div>
          
          <div className="space-y-2">
            {topPositives.length > 0 ? (
              topPositives.map((driver, i) => (
                <DriverRow
                  key={driver.id}
                  driver={driver}
                  type="positive"
                  index={i}
                  onScrollToSection={onScrollToSection}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic p-3">No significant positives identified</p>
            )}
          </div>
        </div>
        
        {/* Penalties Column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-[hsl(var(--verdict-blocked))]" />
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Top Penalties
            </h4>
          </div>
          
          <div className="space-y-2">
            {topPenalties.length > 0 ? (
              topPenalties.map((driver, i) => (
                <DriverRow
                  key={driver.id}
                  driver={driver}
                  type="penalty"
                  index={i}
                  onScrollToSection={onScrollToSection}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic p-3">No significant penalties identified</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
