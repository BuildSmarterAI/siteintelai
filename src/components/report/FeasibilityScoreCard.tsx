import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FeasibilityScoreCardProps {
  score: number;
  scoreBand: string;
  address: string;
}

function getScoreColor(score: number): string {
  if (score >= 75) return "text-[hsl(var(--verdict-proceed))]";
  if (score >= 50) return "text-[hsl(var(--verdict-conditional))]";
  return "text-[hsl(var(--verdict-blocked))]";
}

function getScoreBg(score: number): string {
  if (score >= 75) return "from-[hsl(var(--verdict-proceed)/0.1)] to-transparent";
  if (score >= 50) return "from-[hsl(var(--verdict-conditional)/0.1)] to-transparent";
  return "from-[hsl(var(--verdict-blocked)/0.1)] to-transparent";
}

function getScoreRing(score: number): string {
  if (score >= 75) return "stroke-[hsl(var(--verdict-proceed))]";
  if (score >= 50) return "stroke-[hsl(var(--verdict-conditional))]";
  return "stroke-[hsl(var(--verdict-blocked))]";
}

export function FeasibilityScoreCard({ score, scoreBand, address }: FeasibilityScoreCardProps) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  return (
    <div className={cn(
      "bg-gradient-to-br rounded-xl border border-[hsl(var(--border-subtle))] p-6",
      getScoreBg(score)
    )}>
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Score Circle */}
        <div className="relative">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              className={getScoreRing(score)}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={cn("text-4xl font-bold font-mono", getScoreColor(score))}
            >
              {score}
            </motion.span>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {scoreBand}
            </span>
          </div>
        </div>
        
        {/* Score Info */}
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-semibold font-heading text-foreground mb-1">
            Feasibility Score
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {address}
          </p>
          
          {/* Score Legend */}
          <div className="flex items-center gap-4 mt-4 justify-center md:justify-start">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--verdict-proceed))]" />
              <span className="text-muted-foreground">75+ Proceed</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--verdict-conditional))]" />
              <span className="text-muted-foreground">50-74 Conditional</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--verdict-blocked))]" />
              <span className="text-muted-foreground">&lt;50 High Risk</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
