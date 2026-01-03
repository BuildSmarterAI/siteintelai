/**
 * WizardStepper Component
 * Vertical step navigation for the design wizard
 */

import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';
import * as Icons from 'lucide-react';
import { WIZARD_STEPS } from '@/types/wizard';
import { useWizardStore, selectCanProceed } from '@/stores/useWizardStore';

export function WizardStepper() {
  const { currentStep, maxReachedStep, setStep } = useWizardStore();
  const canProceed = useWizardStore(selectCanProceed);
  
  return (
    <nav className="flex flex-col gap-1">
      {WIZARD_STEPS.map((step, idx) => {
        const isActive = currentStep === step.id;
        const isComplete = step.id < currentStep;
        const isAccessible = step.id <= maxReachedStep;
        const isLast = idx === WIZARD_STEPS.length - 1;
        
        // Get icon component
        const IconComponent = (Icons as any)[step.icon] || Circle;
        
        return (
          <div key={step.id} className="relative">
            <button
              onClick={() => isAccessible && setStep(step.id)}
              disabled={!isAccessible}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all text-left",
                isActive && "bg-primary/10 text-primary",
                !isActive && isComplete && "text-muted-foreground hover:bg-muted/50",
                !isActive && !isComplete && isAccessible && "text-muted-foreground hover:bg-muted/50",
                !isAccessible && "opacity-40 cursor-not-allowed"
              )}
            >
              {/* Step indicator */}
              <div
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full border-2 transition-colors",
                  isActive && "border-primary bg-primary text-primary-foreground",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  !isActive && !isComplete && "border-muted-foreground/30"
                )}
              >
                {isComplete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <IconComponent className="h-3.5 w-3.5" />
                )}
              </div>
              
              {/* Step label */}
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "text-sm font-medium truncate",
                  isActive && "text-primary"
                )}>
                  {step.label}
                </span>
                {step.isOptional && (
                  <span className="text-xs text-muted-foreground ml-1">(optional)</span>
                )}
              </div>
            </button>
            
            {/* Connector line */}
            {!isLast && (
              <div 
                className={cn(
                  "absolute left-[22px] top-[42px] w-0.5 h-4 -translate-x-1/2",
                  isComplete ? "bg-primary" : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
