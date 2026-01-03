/**
 * Program Targets Form Step
 * Step 3: Configure GFA, stories, and risk tolerance per use type
 */

import { useDesignStore } from '@/stores/useDesignStore';
import { useWizardStore } from '@/stores/useWizardStore';
import { createEnvelopeSummary } from '@/lib/templateScoring';
import { USE_TYPE_CONFIG, type UseType, type RiskTolerance } from '@/types/wizard';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProgramTargetsForm() {
  const envelope = useDesignStore((s) => s.envelope);
  const { programBuckets, updateProgramBucket } = useWizardStore();
  
  const summary = createEnvelopeSummary(envelope);
  const maxGfa = summary?.maxGfa || 200000;
  
  const totalGfa = programBuckets.reduce((sum, b) => sum + b.targetGfa, 0);
  const utilizationPct = (totalGfa / maxGfa) * 100;
  
  const canProceed = programBuckets.length > 0 && programBuckets.every(b => b.targetGfa > 0);
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="font-semibold text-lg">Program Targets</h3>
        <p className="text-muted-foreground text-sm">
          Set target GFA and risk tolerance for each use type.
        </p>
      </div>
      
      {/* Total Summary */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div>
          <div className="text-sm text-muted-foreground">Total Program</div>
          <div className="text-lg font-semibold">{totalGfa.toLocaleString()} SF</div>
        </div>
        <Badge variant={utilizationPct > 100 ? "destructive" : utilizationPct > 90 ? "outline" : "secondary"}>
          {Math.round(utilizationPct)}% of max
        </Badge>
      </div>
      
      {/* Program Buckets */}
      <div className="space-y-3">
        {programBuckets.map((bucket) => {
          const config = USE_TYPE_CONFIG[bucket.useType as UseType];
          const IconComponent = (Icons as any)[config.icon] || Icons.Building;
          
          return (
            <Card key={bucket.useType} className="border-muted">
              <CardContent className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                    <IconComponent className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">{config.label}</span>
                </div>
                
                {/* Target GFA Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Target GFA</Label>
                    <span className="font-medium">{bucket.targetGfa.toLocaleString()} SF</span>
                  </div>
                  <Slider
                    value={[bucket.targetGfa]}
                    min={10000}
                    max={maxGfa}
                    step={5000}
                    onValueChange={([value]) => 
                      updateProgramBucket(bucket.useType as UseType, { targetGfa: value })
                    }
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10K</span>
                    <span>{Math.round(maxGfa / 1000)}K (max)</span>
                  </div>
                </div>
                
                {/* Target Stories */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Target Stories</Label>
                    <span className="font-medium">{bucket.targetStories} floors</span>
                  </div>
                  <Slider
                    value={[bucket.targetStories]}
                    min={1}
                    max={Math.floor((summary?.heightCapFt || 55) / bucket.floorToFloorFt)}
                    step={1}
                    onValueChange={([value]) =>
                      updateProgramBucket(bucket.useType as UseType, { targetStories: value })
                    }
                  />
                </div>
                
                {/* Risk Tolerance */}
                <div className="space-y-2">
                  <Label className="text-sm">Risk Tolerance</Label>
                  <RadioGroup
                    value={bucket.riskTolerance}
                    onValueChange={(value) =>
                      updateProgramBucket(bucket.useType as UseType, { 
                        riskTolerance: value as RiskTolerance 
                      })
                    }
                    className="flex gap-2"
                  >
                    {(['safe', 'balanced', 'aggressive'] as RiskTolerance[]).map((level) => (
                      <div key={level} className="flex-1">
                        <RadioGroupItem
                          value={level}
                          id={`${bucket.useType}-${level}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`${bucket.useType}-${level}`}
                          className={cn(
                            "flex items-center justify-center py-2 px-3 rounded-md border cursor-pointer transition-all text-xs",
                            bucket.riskTolerance === level
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-muted-foreground/50"
                          )}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
    </div>
  );
}
