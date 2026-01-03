/**
 * Parking Concept Form Step
 * Step 4: Configure conceptual parking estimates (optional)
 */

import { useWizardStore, selectTotalProgramGfa } from '@/stores/useWizardStore';
import { DEFAULT_PARKING_RATIOS, type ParkingType } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Car, ParkingCircle, Building2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export function ParkingConceptForm() {
  const { 
    parkingConfig, 
    setParkingEnabled, 
    setParkingType, 
    setParkingRatio,
    updateParkingEstimate,
    nextStep, 
    prevStep,
    selectedUseTypes,
  } = useWizardStore();
  
  const totalGfa = useWizardStore(selectTotalProgramGfa);
  
  // Update parking estimate when inputs change
  useEffect(() => {
    updateParkingEstimate(totalGfa);
  }, [totalGfa, parkingConfig.ratio, parkingConfig.enabled, updateParkingEstimate]);
  
  // Get average parking ratio from selected use types
  const avgRatio = selectedUseTypes.length > 0
    ? selectedUseTypes.reduce((sum, ut) => sum + DEFAULT_PARKING_RATIOS[ut], 0) / selectedUseTypes.length
    : 3.5;
  
  const parkingTypes: { value: ParkingType; label: string; icon: React.ElementType }[] = [
    { value: 'surface', label: 'Surface', icon: Car },
    { value: 'structured', label: 'Structured', icon: Building2 },
    { value: 'ignore', label: 'Ignore', icon: XCircle },
  ];
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="font-semibold text-lg">Parking (Conceptual)</h3>
        <p className="text-muted-foreground text-sm">
          Estimate parking requirements. This step is optional.
        </p>
      </div>
      
      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <ParkingCircle className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium text-sm">Include Parking Estimate</span>
        </div>
        <Switch
          checked={parkingConfig.enabled}
          onCheckedChange={setParkingEnabled}
        />
      </div>
      
      {parkingConfig.enabled && (
        <Card className="border-muted">
          <CardContent className="p-4 space-y-4">
            {/* Parking Type */}
            <div className="space-y-2">
              <Label className="text-sm">Parking Type</Label>
              <RadioGroup
                value={parkingConfig.type}
                onValueChange={(value) => setParkingType(value as ParkingType)}
                className="flex gap-2"
              >
                {parkingTypes.map(({ value, label, icon: Icon }) => (
                  <div key={value} className="flex-1">
                    <RadioGroupItem
                      value={value}
                      id={`parking-${value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`parking-${value}`}
                      className={cn(
                        "flex flex-col items-center gap-1 py-3 px-2 rounded-md border cursor-pointer transition-all",
                        parkingConfig.type === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            {parkingConfig.type !== 'ignore' && (
              <>
                {/* Parking Ratio Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Parking Ratio</Label>
                    <span className="font-medium">{parkingConfig.ratio} / 1,000 SF</span>
                  </div>
                  <Slider
                    value={[parkingConfig.ratio]}
                    min={0.5}
                    max={8}
                    step={0.5}
                    onValueChange={([value]) => setParkingRatio(value)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.5</span>
                    <span>Avg: {avgRatio.toFixed(1)}</span>
                    <span>8.0</span>
                  </div>
                </div>
                
                {/* Estimated Stalls */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Estimated Stalls</span>
                  </div>
                  <span className="text-lg font-semibold">
                    {parkingConfig.estimatedStalls.toLocaleString()}
                  </span>
                </div>
              </>
            )}
            
            {/* Info Note */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>
                Parking estimates are conceptual only. No layout geometry is generated.
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
