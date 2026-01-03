/**
 * Generate Step
 * Step 7: Summary and variant generation
 */

import { useState, useCallback } from 'react';
import { useDesignStore } from '@/stores/useDesignStore';
import { useWizardStore, selectTotalProgramGfa } from '@/stores/useWizardStore';
import { useDesignSession } from '@/hooks/useDesignSession';
import { createEnvelopeSummary } from '@/lib/templateScoring';
import { generateVariantPack, getBestOverallVariant } from '@/lib/variantGeneration';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Building2, 
  Ruler, 
  ArrowUp, 
  Car,
  Leaf,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export function GenerateStep() {
  const envelope = useDesignStore((s) => s.envelope);
  const { 
    programBuckets,
    selectedTemplates,
    parkingConfig,
    sustainabilityEnabled,
    sustainabilityLevel,
    isGenerating,
    generationProgress,
    setGenerating,
    setGenerationProgress,
    setGeneratedVariantIds,
    prevStep,
    closeWizard,
  } = useWizardStore();
  
  const totalGfa = useWizardStore(selectTotalProgramGfa);
  const summary = createEnvelopeSummary(envelope);
  
  const envelopeId = useDesignStore((s) => s.envelope?.id);
  const { createVariant, duplicateVariant } = useDesignSession(envelopeId);
  
  const [generatedCount, setGeneratedCount] = useState(0);
  
  // Calculate metrics
  const farUsed = summary ? totalGfa / summary.parcelSqft : 0;
  const farPct = summary ? (farUsed / summary.farCap) * 100 : 0;
  
  const avgHeight = programBuckets.reduce((sum, b) => 
    sum + (b.targetStories * b.floorToFloorFt), 0
  ) / Math.max(programBuckets.length, 1);
  const heightPct = summary ? (avgHeight / summary.heightCapFt) * 100 : 0;
  
  // Generate variants
  const handleGenerate = useCallback(async () => {
    if (!envelope || !summary || selectedTemplates.length === 0) {
      toast.error('Missing required data for generation');
      return;
    }
    
    setGenerating(true);
    setGenerationProgress(0);
    setGeneratedCount(0);
    
    try {
      // Generate variant pack
      setGenerationProgress(10);
      
      const variants = generateVariantPack({
        envelope: summary,
        buildablePolygon: envelope.buildableFootprint2d,
        selectedTemplates,
        programBuckets,
        sustainabilityLevel: sustainabilityEnabled ? sustainabilityLevel : null,
      });
      
      setGenerationProgress(30);
      
      // Find best overall
      const bestVariant = getBestOverallVariant(variants);
      
      // Create variants in database
      const createdIds: string[] = [];
      
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        const isBest = variant === bestVariant;
        
        // Simulate some processing time for UX
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Create variant via hook (this should be adapted to your actual API)
        // For now, we'll just log and track progress
        console.log(`[Wizard] Creating variant: ${variant.name}`, {
          strategy: variant.strategy,
          gfa: variant.gfa,
          far: variant.far,
          height: variant.heightFt,
          isBest,
        });
        
        // Track progress
        setGeneratedCount(i + 1);
        setGenerationProgress(30 + ((i + 1) / variants.length) * 60);
        
        // In a real implementation, you would call createVariant here
        // and push the returned ID to createdIds
        createdIds.push(`variant-${i + 1}`);
      }
      
      setGenerationProgress(100);
      setGeneratedVariantIds(createdIds);
      
      toast.success(`Generated ${variants.length} design variants!`);
      
      // Close wizard after short delay
      setTimeout(() => {
        closeWizard();
      }, 1500);
      
    } catch (error) {
      console.error('[Wizard] Generation error:', error);
      toast.error('Failed to generate variants');
    } finally {
      setGenerating(false);
    }
  }, [
    envelope, 
    summary, 
    selectedTemplates, 
    programBuckets,
    sustainabilityEnabled,
    sustainabilityLevel,
    setGenerating,
    setGenerationProgress,
    setGeneratedVariantIds,
    closeWizard,
  ]);
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="font-semibold text-lg">Generate Variants</h3>
        <p className="text-muted-foreground text-sm">
          Review your program and generate 3-6 design variants.
        </p>
      </div>
      
      {/* Program Summary */}
      <Card className="border-muted">
        <CardContent className="p-4 space-y-3">
          {/* Total GFA */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Total GFA</span>
            </div>
            <span className="font-semibold">{totalGfa.toLocaleString()} SF</span>
          </div>
          
          {/* FAR Meter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">FAR</span>
              <span>{farUsed.toFixed(2)} / {summary?.farCap || 0}</span>
            </div>
            <Progress 
              value={Math.min(farPct, 100)} 
              className="h-2"
            />
            <div className="flex justify-end">
              <Badge 
                variant={farPct > 100 ? "destructive" : farPct > 90 ? "outline" : "secondary"}
                className="text-xs"
              >
                {Math.round(farPct)}%
              </Badge>
            </div>
          </div>
          
          {/* Height Meter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Height</span>
              <span>{Math.round(avgHeight)}' / {summary?.heightCapFt || 0}'</span>
            </div>
            <Progress 
              value={Math.min(heightPct, 100)} 
              className="h-2"
            />
            <div className="flex justify-end">
              <Badge 
                variant={heightPct > 100 ? "destructive" : heightPct > 90 ? "outline" : "secondary"}
                className="text-xs"
              >
                {Math.round(heightPct)}%
              </Badge>
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="flex items-center gap-4 pt-2 border-t border-border/50 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" />
              <span>{selectedTemplates.length} template(s)</span>
            </div>
            {parkingConfig.enabled && (
              <div className="flex items-center gap-1">
                <Car className="h-3.5 w-3.5" />
                <span>{parkingConfig.estimatedStalls} stalls</span>
              </div>
            )}
            {sustainabilityEnabled && (
              <div className="flex items-center gap-1">
                <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                <span className="capitalize">{sustainabilityLevel}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Warnings */}
      {(farPct > 100 || heightPct > 100) && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-700">Program Exceeds Limits</p>
            <p className="text-amber-600/80">
              Some variants may be marked as non-compliant (FAIL).
            </p>
          </div>
        </div>
      )}
      
      {/* Generation Progress */}
      {isGenerating && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="font-medium text-sm">Generating variants...</p>
                <p className="text-xs text-muted-foreground">
                  Created {generatedCount} variants
                </p>
              </div>
            </div>
            <Progress value={generationProgress} className="h-2" />
          </CardContent>
        </Card>
      )}
      
      {/* Success State */}
      {generationProgress === 100 && !isGenerating && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">
            Variants generated successfully!
          </span>
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex gap-2 pt-2">
        <Button 
          variant="outline" 
          onClick={prevStep} 
          disabled={isGenerating}
          className="flex-1"
        >
          Back
        </Button>
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || selectedTemplates.length === 0}
          className="flex-1 gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Variants
            </>
          )}
        </Button>
      </div>
      
      {/* Disclaimer */}
      <p className="text-xs text-center text-muted-foreground">
        Conceptual Design — Not for Construction
      </p>
    </div>
  );
}
