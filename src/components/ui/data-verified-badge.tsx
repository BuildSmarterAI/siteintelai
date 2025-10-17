/**
 * Data Verified Badge
 * Micro-interaction for data validation feedback
 * Reinforces "data-backed" brand promise
 */

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataVerifiedBadgeProps {
  delay?: number;
  className?: string;
}

export const DataVerifiedBadge = ({ delay = 0, className }: DataVerifiedBadgeProps) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay, duration: 0.3, ease: "easeOut" }}
    className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20",
      className
    )}
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: delay + 0.1, duration: 0.3, ease: "easeOut" }}
    >
      <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
    </motion.div>
    <span className="text-xs font-mono text-green-700 dark:text-green-300">Verified</span>
  </motion.div>
);
