import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ApplicationProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  isDraftSaving?: boolean;
  lastSaved?: Date | null;
  className?: string;
  completedSteps?: number[];
}

const STEP_LABELS = [
  "Contact",
  "Property",
  "Building",
  "Context",
  "Review"
];

export function ApplicationProgress({
  currentStep,
  totalSteps,
  stepTitle,
  isDraftSaving,
  lastSaved,
  className,
  completedSteps = []
}: ApplicationProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={cn(
      "sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border",
      className
    )}>
      <div className="w-full px-4 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Step info */}
          <div className="flex items-center gap-4 min-w-0">
            <h1 className="font-heading text-lg font-semibold text-foreground truncate">
              {stepTitle}
            </h1>
            
            {/* Step indicators - hidden on mobile */}
            <div className="hidden md:flex items-center gap-1">
              {STEP_LABELS.map((label, idx) => {
                const isCompleted = completedSteps.includes(idx) || idx < currentStep;
                const isCurrent = idx === currentStep;
                const isPending = idx > currentStep && !completedSteps.includes(idx);
                
                return (
                  <motion.div
                    key={label}
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.05 : 1,
                    }}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors",
                      isCompleted && !isCurrent && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                      isCurrent && "bg-primary text-primary-foreground shadow-sm",
                      isPending && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted && !isCurrent ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </motion.div>
                    ) : (
                      <span className={cn(
                        "w-4 h-4 flex items-center justify-center text-[10px] rounded-full",
                        isCurrent && "bg-primary-foreground/20"
                      )}>
                        {idx + 1}
                      </span>
                    )}
                    <span className="hidden lg:inline">{label}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Center: Progress bar - visible on mobile */}
          <div className="flex-1 max-w-xs md:hidden">
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {currentStep}/{totalSteps}
              </span>
            </div>
          </div>

          {/* Right: Draft status */}
          <div className="flex items-center gap-2 text-sm flex-shrink-0">
            {isDraftSaving ? (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-muted-foreground flex items-center gap-1.5"
              >
                <Clock className="h-3.5 w-3.5 animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
              </motion.span>
            ) : lastSaved ? (
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-green-600 dark:text-green-400 flex items-center gap-1.5"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Draft saved</span>
              </motion.span>
            ) : null}
            
            {/* Desktop progress */}
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-border">
              <Progress value={progress} className="h-2 w-24" />
              <span className="text-xs text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
