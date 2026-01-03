/**
 * Design Wizard Panel
 * Main container for the 7-step wizard flow
 */

import { useWizardStore, selectCanProceed } from '@/stores/useWizardStore';
import { WizardStepper } from './WizardStepper';
import { SiteConfirmationStep } from './steps/SiteConfirmationStep';
import { UseTypeSelector } from './steps/UseTypeSelector';
import { ProgramTargetsForm } from './steps/ProgramTargetsForm';
import { ParkingConceptForm } from './steps/ParkingConceptForm';
import { TemplateRecommendations } from './steps/TemplateRecommendations';
import { SustainabilityStep } from './steps/SustainabilityStep';
import { GenerateStep } from './steps/GenerateStep';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export function DesignWizardPanel() {
  const { isOpen, currentStep, closeWizard, resetWizard, nextStep, prevStep } = useWizardStore();
  const canProceed = useWizardStore(selectCanProceed);
  
  const handleClose = () => {
    closeWizard();
    // Reset after animation completes
    setTimeout(resetWizard, 300);
  };
  
  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <SiteConfirmationStep />;
      case 2:
        return <UseTypeSelector />;
      case 3:
        return <ProgramTargetsForm />;
      case 4:
        return <ParkingConceptForm />;
      case 5:
        return <TemplateRecommendations />;
      case 6:
        return <SustainabilityStep />;
      case 7:
        return <GenerateStep />;
      default:
        return <SiteConfirmationStep />;
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 z-50 h-full w-[480px] bg-background border-l border-border shadow-xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Explore Designs</h2>
              <Badge variant="outline" className="text-xs">
                Step {currentStep}/7
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Disclaimer Banner */}
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex-shrink-0">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-xs text-amber-700">
              Conceptual Design — Not for Construction
            </span>
          </div>
          
          {/* Main Content */}
          <div className="flex flex-1 min-h-0">
            {/* Stepper */}
            <div className="w-[100px] p-2 border-r border-border flex-shrink-0 bg-muted/30">
              <WizardStepper />
            </div>
            
            {/* Step Content */}
            <div className="flex-1 min-w-0 flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {renderStepContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </div>
          </div>
          
          {/* Navigation Footer - Always visible */}
          {currentStep < 7 && (
            <div className="flex gap-2 p-4 border-t border-border flex-shrink-0 bg-background">
              <Button 
                variant="outline" 
                onClick={prevStep} 
                disabled={currentStep === 1}
                className="flex-1 gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={nextStep} 
                disabled={!canProceed}
                className="flex-1 gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}