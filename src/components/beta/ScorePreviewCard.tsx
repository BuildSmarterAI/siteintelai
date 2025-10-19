import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ScorePreviewCardProps {
  score?: number;
  grade?: string;
}

export const ScorePreviewCard = ({ score = 87, grade = "A" }: ScorePreviewCardProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = score / steps;
    const stepDuration = duration / steps;
    
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, [score]);
  
  const subMetrics = [
    { label: "Zoning", value: 92, color: "hsl(var(--primary))" },
    { label: "Utilities", value: 84, color: "hsl(var(--accent))" },
    { label: "Environmental", value: 81, color: "hsl(var(--success))" }
  ];
  
  return (
    <div className="flex flex-col items-center gap-8 p-8">
      {/* Main Score Circle */}
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-white/10"
          />
          {/* Progress circle */}
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold text-white">{grade}</div>
          <div className="text-sm text-white/60 font-medium">{animatedScore}/100</div>
        </div>
      </div>
      
      {/* Sub-metrics */}
      <div className="grid grid-cols-3 gap-6 w-full">
        {subMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 className="w-4 h-4" style={{ color: metric.color }} />
              <span className="text-lg font-semibold text-white">{metric.value}</span>
            </div>
            <div className="text-xs text-white/60">{metric.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
