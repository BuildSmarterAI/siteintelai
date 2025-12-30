import { motion } from 'framer-motion';
import { Map, Layers, MapPin, Database, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type LoadingStep = 'init' | 'basemap' | 'parcels' | 'ready';

interface MapLoadingSkeletonProps {
  message?: string;
  county?: string;
  step?: LoadingStep;
  hasError?: boolean;
  onRetry?: () => void;
}

const steps = [
  { key: 'init', icon: Map, label: 'Initializing' },
  { key: 'basemap', icon: Layers, label: 'Loading basemap' },
  { key: 'parcels', icon: Database, label: 'Fetching parcels' },
  { key: 'ready', icon: MapPin, label: 'Rendering' },
] as const;

function getStepIndex(step: LoadingStep): number {
  return steps.findIndex(s => s.key === step);
}

export function MapLoadingSkeleton({ 
  message = "Loading map...", 
  county,
  step = 'init',
  hasError = false,
  onRetry
}: MapLoadingSkeletonProps) {
  const currentStepIndex = getStepIndex(step);

  // Error state
  if (hasError) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-muted/90 backdrop-blur-sm flex flex-col items-center justify-center z-10"
      >
        <div className="flex flex-col items-center text-center px-4">
          <div className="bg-destructive/10 rounded-full p-4 mb-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <p className="text-base font-medium text-foreground mb-1">
            Failed to load map
          </p>
          <p className="text-sm text-muted-foreground mb-4 max-w-[240px]">
            There was a problem loading the map. Please check your connection and try again.
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-muted/90 backdrop-blur-sm flex flex-col items-center justify-center z-10"
    >
      {/* Main content */}
      <div className="flex flex-col items-center">
        {/* Animated map icon with subtle glow */}
        <div className="relative mb-6">
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
            style={{ width: 80, height: 80, left: -8, top: -8 }}
          />
          <div className="relative bg-background/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-border/50">
            <Map className="h-10 w-10 text-primary" />
          </div>
        </div>

        {/* Loading text */}
        <p className="text-base font-medium text-foreground mb-1">
          {message}
        </p>

        {/* County indicator */}
        {county && (
          <p className="text-sm text-muted-foreground mb-4">
            {county} County
          </p>
        )}

        {/* Step indicators - show actual progress */}
        <div className="flex gap-3 mt-4">
          {steps.map((stepItem, i) => {
            const Icon = stepItem.icon;
            const isActive = i === currentStepIndex;
            const isComplete = i < currentStepIndex;
            
            return (
              <motion.div
                key={stepItem.key}
                initial={{ opacity: 0.4 }}
                animate={{ 
                  opacity: isActive ? 1 : isComplete ? 0.8 : 0.4,
                  scale: isActive ? 1.05 : 1,
                }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col items-center gap-1 ${
                  isActive ? 'text-primary' : isComplete ? 'text-[hsl(var(--status-success))]' : 'text-muted-foreground'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  isActive ? 'bg-primary/10' : isComplete ? 'bg-[hsl(var(--status-success)/0.1)]' : 'bg-muted'
                }`}>
                  {isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Icon className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className="text-[10px] font-medium whitespace-nowrap">
                  {stepItem.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
