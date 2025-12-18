import { motion } from 'framer-motion';
import { Map, Layers, MapPin, Database } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';

interface MapLoadingSkeletonProps {
  message?: string;
  county?: string;
}

export function MapLoadingSkeleton({ message = "Loading map...", county }: MapLoadingSkeletonProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { icon: Map, label: 'Initializing map' },
    { icon: Layers, label: 'Loading basemap' },
    { icon: Database, label: 'Fetching parcels' },
    { icon: MapPin, label: 'Rendering layers' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 15;
      });
    }, 200);

    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 800);

    return () => {
      clearInterval(timer);
      clearInterval(stepTimer);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-muted/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 overflow-hidden"
    >
      {/* Shimmer grid background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
          {Array.from({ length: 64 }).map((_, i) => (
            <motion.div
              key={i}
              className="border border-border/20"
              initial={{ opacity: 0.1 }}
              animate={{ 
                opacity: [0.1, 0.3, 0.1],
                backgroundColor: ['hsl(var(--muted))', 'hsl(var(--primary) / 0.1)', 'hsl(var(--muted))']
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                delay: (i % 8) * 0.1 + Math.floor(i / 8) * 0.05
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated map icon with glow */}
        <div className="relative mb-6">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-primary/30 rounded-full blur-2xl"
            style={{ width: 100, height: 100, left: -10, top: -10 }}
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="relative bg-background/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-border/50"
          >
            <Map className="h-12 w-12 text-primary" />
          </motion.div>
        </div>

        {/* Loading text */}
        <motion.p
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-base font-medium text-foreground mb-1"
        >
          {message}
        </motion.p>

        {/* County indicator */}
        {county && (
          <p className="text-sm text-muted-foreground mb-4">
            {county} County
          </p>
        )}

        {/* Progress bar */}
        <div className="w-48 mb-4">
          <Progress value={Math.min(progress, 95)} className="h-1.5" />
        </div>

        {/* Step indicators */}
        <div className="flex gap-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === currentStep;
            const isComplete = progress > (i + 1) * 25;
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0.4, scale: 0.9 }}
                animate={{ 
                  opacity: isActive ? 1 : isComplete ? 0.8 : 0.4,
                  scale: isActive ? 1.1 : 1,
                }}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive ? 'text-primary' : isComplete ? 'text-green-500' : 'text-muted-foreground'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  isActive ? 'bg-primary/10' : isComplete ? 'bg-green-500/10' : 'bg-muted'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-medium whitespace-nowrap">
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
