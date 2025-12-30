/**
 * Traffic Speedometer
 * Semi-circular gauge showing traffic intensity level
 */

import { motion } from "framer-motion";
import { useMemo } from "react";

interface TrafficSpeedometerProps {
  aadt: number;
  maxAadt?: number;
}

export function TrafficSpeedometer({ aadt, maxAadt = 50000 }: TrafficSpeedometerProps) {
  const { percentage, level, color, rotation } = useMemo(() => {
    const pct = Math.min((aadt / maxAadt) * 100, 100);
    
    let lvl: string;
    let clr: string;
    
    if (pct < 25) {
      lvl = "Low";
      clr = "hsl(142, 76%, 36%)"; // green
    } else if (pct < 50) {
      lvl = "Moderate";
      clr = "hsl(48, 96%, 53%)"; // yellow
    } else if (pct < 75) {
      lvl = "High";
      clr = "hsl(25, 95%, 53%)"; // orange
    } else {
      lvl = "Very High";
      clr = "hsl(0, 84%, 60%)"; // red
    }
    
    // Convert percentage to rotation (-90 to 90 degrees for semi-circle)
    const rot = -90 + (pct / 100) * 180;
    
    return { percentage: pct, level: lvl, color: clr, rotation: rot };
  }, [aadt, maxAadt]);

  return (
    <div className="relative w-full max-w-[200px] mx-auto">
      {/* SVG Gauge */}
      <svg viewBox="0 0 200 120" className="w-full h-auto">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
          strokeLinecap="round"
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(142, 76%, 36%)" />
            <stop offset="33%" stopColor="hsl(48, 96%, 53%)" />
            <stop offset="66%" stopColor="hsl(25, 95%, 53%)" />
            <stop offset="100%" stopColor="hsl(0, 84%, 60%)" />
          </linearGradient>
        </defs>
        
        {/* Colored arc showing progress */}
        <motion.path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: percentage / 100 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        
        {/* Needle */}
        <motion.g
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          style={{ transformOrigin: "100px 100px" }}
        >
          <polygon
            points="100,30 95,100 105,100"
            fill={color}
            className="drop-shadow-md"
          />
          <circle cx="100" cy="100" r="8" fill={color} />
        </motion.g>
        
        {/* Center cover */}
        <circle cx="100" cy="100" r="6" fill="hsl(var(--background))" />
        
        {/* Labels */}
        <text x="20" y="115" fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="start">
          Low
        </text>
        <text x="180" y="115" fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="end">
          High
        </text>
      </svg>
      
      {/* Center value display */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <p className="text-2xl font-bold font-mono" style={{ color }}>
          {aadt.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">VPD</p>
        <p className="text-sm font-medium mt-1" style={{ color }}>
          {level} Traffic
        </p>
      </div>
    </div>
  );
}
