import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface SeatsCounterProps {
  total?: number;
  claimed?: number;
}

export const SeatsCounter = ({ total = 250, claimed = 127 }: SeatsCounterProps) => {
  const [animatedClaimed, setAnimatedClaimed] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);
  const remaining = total - claimed;
  const percentage = (claimed / total) * 100;
  
  useEffect(() => {
    // Animate the counter with easeOut
    let startTime: number | null = null;
    const duration = 2000;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // easeOut curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedClaimed(Math.floor(easeOut * claimed));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [claimed]);

  useEffect(() => {
    // Show urgency if less than 50 seats remain
    setIsUrgent(remaining < 50);
  }, [remaining]);
  
  return (
    <motion.div 
      className="space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <div className="flex items-center justify-center gap-2 text-sm text-white/70">
        {isUrgent && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
          </motion.div>
        )}
        <p className="text-center">
          Only <motion.span 
            className="text-primary font-semibold"
            animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {remaining}
          </motion.span> seats remaining
          {" • "}
          <span className="text-white/60">{animatedClaimed} claimed</span>
        </p>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-primary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.8 }}
        />
      </div>
    </motion.div>
  );
};
