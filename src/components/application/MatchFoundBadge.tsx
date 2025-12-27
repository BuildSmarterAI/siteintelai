/**
 * Match Found Badge - Floating badge that appears when a single parcel is found
 * Shows for 2.5s with enter/exit animations
 */
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";

interface MatchFoundBadgeProps {
  show: boolean;
  address?: string;
}

export function MatchFoundBadge({ show, address }: MatchFoundBadgeProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            duration: 0.4 
          }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 500 }}
            >
              <CheckCircle className="h-5 w-5 text-[hsl(var(--status-success))]" />
            </motion.div>
            <span className="font-medium text-sm">Match Found</span>
            {address && (
              <span className="text-xs text-primary-foreground/70 max-w-[200px] truncate">
                {address}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
