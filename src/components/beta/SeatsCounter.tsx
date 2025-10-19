import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface SeatsCounterProps {
  total?: number;
  claimed?: number;
}

export const SeatsCounter = ({ total = 250, claimed = 127 }: SeatsCounterProps) => {
  const [animatedClaimed, setAnimatedClaimed] = useState(0);
  const remaining = total - claimed;
  const percentage = (claimed / total) * 100;
  
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = claimed / steps;
    const stepDuration = duration / steps;
    
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= claimed) {
        setAnimatedClaimed(claimed);
        clearInterval(timer);
      } else {
        setAnimatedClaimed(Math.floor(current));
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, [claimed]);
  
  return (
    <div className="space-y-2">
      <p className="text-sm text-white/70 text-center">
        Only <span className="text-primary font-semibold">{remaining}</span> seats remaining • 
        <span className="text-white/60"> {animatedClaimed} claimed</span>
      </p>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary/80"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
        />
      </div>
    </div>
  );
};
