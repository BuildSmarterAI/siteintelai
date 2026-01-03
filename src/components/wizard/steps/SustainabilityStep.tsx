/**
 * Sustainability Step
 * Step 6: Optional sustainability assumptions
 */

import { useWizardStore } from '@/stores/useWizardStore';
import { type SustainabilityLevel } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Leaf, Sun, Zap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUSTAINABILITY_LEVELS: {
  value: SustainabilityLevel;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: 'low',
    label: 'Low',
    description: 'Code minimum, standard construction',
    icon: Leaf,
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'Energy-efficient systems, LED lighting',
    icon: Zap,
  },
  {
    value: 'high',
    label: 'High',
    description: 'LEED-targeted, high-performance envelope',
    icon: Sun,
  },
];

export function SustainabilityStep() {
  const { 
    sustainabilityEnabled, 
    setSustainabilityEnabled,
    sustainabilityLevel,
    setSustainabilityLevel,
    nextStep, 
    prevStep 
  } = useWizardStore();
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="font-semibold text-lg">Sustainability</h3>
        <p className="text-muted-foreground text-sm">
          Add sustainability assumptions. This step is optional.
        </p>
      </div>
      
      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-emerald-600" />
          <span className="font-medium text-sm">Include Sustainability Tags</span>
        </div>
        <Switch
          checked={sustainabilityEnabled}
          onCheckedChange={setSustainabilityEnabled}
        />
      </div>
      
      {sustainabilityEnabled && (
        <Card className="border-muted">
          <CardContent className="p-4 space-y-4">
            {/* Level Selection */}
            <RadioGroup
              value={sustainabilityLevel}
              onValueChange={(value) => setSustainabilityLevel(value as SustainabilityLevel)}
              className="space-y-2"
            >
              {SUSTAINABILITY_LEVELS.map(({ value, label, description, icon: Icon }) => (
                <div key={value}>
                  <RadioGroupItem
                    value={value}
                    id={`sustainability-${value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`sustainability-${value}`}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      sustainabilityLevel === value
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0",
                      sustainabilityLevel === value 
                        ? "bg-emerald-500/20" 
                        : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        sustainabilityLevel === value 
                          ? "text-emerald-600" 
                          : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1">
                      <div className={cn(
                        "font-medium text-sm",
                        sustainabilityLevel === value && "text-emerald-700"
                      )}>
                        {label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {description}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            {/* Info Note */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>
                Sustainability levels are metadata tags only. No building system design or energy modeling is performed.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Navigation */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={prevStep} className="flex-1">
          Back
        </Button>
        <Button onClick={nextStep} className="flex-1">
          Next
        </Button>
      </div>
    </div>
  );
}
