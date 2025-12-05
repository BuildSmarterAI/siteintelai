import { motion } from 'framer-motion';
import { Map, Layers, MapPin } from 'lucide-react';

interface MapLoadingSkeletonProps {
  message?: string;
  county?: string;
}

export function MapLoadingSkeleton({ message = "Loading map...", county }: MapLoadingSkeletonProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-muted/80 backdrop-blur-sm flex flex-col items-center justify-center z-10"
    >
      {/* Animated map icon */}
      <div className="relative mb-4">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
          style={{ width: 80, height: 80 }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="relative"
        >
          <Map className="h-12 w-12 text-primary" />
        </motion.div>
      </div>

      {/* Loading text */}
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-sm font-medium text-foreground"
      >
        {message}
      </motion.p>

      {/* County indicator */}
      {county && (
        <p className="text-xs text-muted-foreground mt-1">
          {county} County
        </p>
      )}

      {/* Progress indicators */}
      <div className="flex gap-2 mt-4">
        {[Layers, MapPin, Map].map((Icon, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.5, duration: 0.5 }}
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <Icon className="h-3 w-3" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
