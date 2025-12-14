import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ScoreCircleProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showLabel?: boolean;
  animated?: boolean;
}

export function ScoreCircle({ score, size = 'md', className, showLabel = true, animated = true }: ScoreCircleProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Animate score count-up on mount
  useEffect(() => {
    if (!animated || hasAnimated) {
      setDisplayScore(score);
      return;
    }

    const duration = 1500; // ms
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        setHasAnimated(true);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score, animated, hasAnimated]);
  // Calculate score band
  const getScoreBand = (score: number): 'A' | 'B' | 'C' => {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    return 'C';
  };

  const band = getScoreBand(score);

  // Get color based on score
  const getColor = (band: string) => {
    switch (band) {
      case 'A':
        return 'text-green-600';
      case 'B':
        return 'text-yellow-600';
      case 'C':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getBgColor = (band: string) => {
    switch (band) {
      case 'A':
        return 'bg-green-100';
      case 'B':
        return 'bg-yellow-100';
      case 'C':
        return 'bg-red-100';
      default:
        return 'bg-muted';
    }
  };

  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'h-16 w-16 text-2xl';
      case 'lg':
        return 'h-32 w-32 text-5xl';
      case 'xl':
        return 'h-44 w-44 text-6xl';
      default:
        return 'h-24 w-24 text-4xl';
    }
  };

  const getLabelSize = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      case 'xl':
        return 'text-lg';
      default:
        return 'text-sm';
    }
  };

  const radius = size === 'sm' ? 28 : size === 'xl' ? 62 : size === 'lg' ? 58 : 43;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;
  const initialOffset = circumference;

  return (
    <motion.div 
      className={cn("flex flex-col items-center gap-2", className)}
      initial={animated ? { opacity: 0, scale: 0.8 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="relative">
        {/* Background circle */}
        <svg className={getSize()} viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            className={getColor(band)}
            initial={animated ? { strokeDashoffset: initialOffset } : { strokeDashoffset }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>

        {/* Score badge in center */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          getSize()
        )}>
          <motion.div 
            className={cn(
              "flex flex-col items-center justify-center rounded-full",
              getBgColor(band),
              size === 'sm' ? 'h-10 w-10' : size === 'xl' ? 'h-28 w-28' : size === 'lg' ? 'h-20 w-20' : 'h-14 w-14'
            )}
            initial={animated ? { scale: 0 } : false}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4, type: "spring", stiffness: 200 }}
          >
            <span className={cn("font-bold tabular-nums", getColor(band), size === 'sm' ? 'text-lg' : size === 'xl' ? 'text-5xl' : size === 'lg' ? 'text-3xl' : 'text-2xl')}>
              {displayScore}
            </span>
          </motion.div>
        </div>
      </div>

      {showLabel && (
        <motion.div 
          className="text-center"
          initial={animated ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <div className={cn("font-semibold", getColor(band), getLabelSize())}>
            Grade {band}
          </div>
          <div className={cn("text-muted-foreground", getLabelSize())}>
            Feasibility Score
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
