/**
 * Use Type Selector Step
 * Step 2: Multi-select chips for building use types
 */

import { cn } from '@/lib/utils';
import { useWizardStore } from '@/stores/useWizardStore';
import { USE_TYPE_CONFIG, type UseType } from '@/types/wizard';
import * as Icons from 'lucide-react';
import { Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const USE_TYPES: UseType[] = ['industrial', 'multifamily', 'office', 'retail', 'medical', 'hotel'];

export function UseTypeSelector() {
  const { selectedUseTypes, toggleUseType, nextStep, prevStep } = useWizardStore();
  
  const canProceed = selectedUseTypes.length > 0;
  const atLimit = selectedUseTypes.length >= 3;
  
  const handleNext = () => {
    if (canProceed) {
      nextStep();
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="font-semibold text-lg">Select Use Types</h3>
        <p className="text-muted-foreground text-sm">
          Choose 1-3 building types to explore. Each creates a program bucket.
        </p>
      </div>
      
      {/* Use Type Chips */}
      <div className="grid grid-cols-2 gap-2">
        {USE_TYPES.map((useType) => {
          const config = USE_TYPE_CONFIG[useType];
          const isSelected = selectedUseTypes.includes(useType);
          const isDisabled = !isSelected && atLimit;
          const IconComponent = (Icons as any)[config.icon] || Icons.Building;
          
          return (
            <button
              key={useType}
              onClick={() => !isDisabled && toggleUseType(useType)}
              disabled={isDisabled}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-left",
                isSelected && "border-primary bg-primary/10 text-primary",
                !isSelected && !isDisabled && "border-border hover:border-muted-foreground/50 hover:bg-muted/50",
                isDisabled && "opacity-40 cursor-not-allowed border-border"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-md",
                  isSelected ? "bg-primary/20" : "bg-muted"
                )}
              >
                {isSelected ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <span className={cn(
                "text-sm font-medium",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {config.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Selection Info */}
      <div className="flex items-center gap-2 text-sm">
        {selectedUseTypes.length === 0 ? (
          <span className="text-muted-foreground">
            Select at least one use type to continue.
          </span>
        ) : (
          <span className="text-muted-foreground">
            {selectedUseTypes.length} of 3 use types selected
          </span>
        )}
        {atLimit && (
          <div className="flex items-center gap-1 text-amber-600">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-xs">Max reached</span>
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={prevStep} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!canProceed}
          className="flex-1"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
