/**
 * Generate Step
 * Step 7: Summary and variant generation
 */

import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
  Car,
  Leaf,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export function GenerateStep() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const envelope = useDesignStore((s) => s.envelope);
  const setActiveVariantId = useDesignStore((s) => s.setActiveVariantId);
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
  const { session, createSession, createVariant, isCreatingSession } = useDesignSession(envelopeId);
  
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
    
    // Ensure we have a session
    let activeSessionId = session?.id;
    
    if (!activeSessionId && envelopeId) {
      // Create a new session first
      try {
        await new Promise<void>((resolve, reject) => {
          createSession({ envelopeId, name: 'Wizard Design Session' }, {
            onSuccess: (data) => {
              activeSessionId = data.id;
              resolve();
            },
            onError: reject,
          });
        });
      } catch (error) {
        toast.error('Failed to create design session');
        return;
      }
    }
    
    if (!activeSessionId) {
      toast.error('No active design session');
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
      let bestVariantId: string | null = null;
      
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        const isBest = variant === bestVariant;
        
        // Short delay for UX
        await new Promise(resolve => setTimeout(resolve, 200));
        
        try {
          // Create variant in database
          const result = await new Promise<{ id: string }>((resolve, reject) => {
            createVariant({
              sessionId: activeSessionId!,
              name: isBest ? `★ ${variant.name}` : variant.name,
              footprint: variant.footprint,
              heightFt: variant.heightFt,
              floors: variant.floors,
              notes: `${variant.notes}${variant.sustainabilityLevel ? ` | Sustainability: ${variant.sustainabilityLevel}` : ''}`,
            }, {
              onSuccess: (data) => resolve({ id: data.id }),
              onError: reject,
            });
          });
          
          createdIds.push(result.id);
          if (isBest) {
            bestVariantId = result.id;
          }
        } catch (error) {
          console.error(`[Wizard] Failed to create variant ${variant.name}:`, error);
        }
        
        // Track progress
        setGeneratedCount(i + 1);
        setGenerationProgress(30 + ((i + 1) / variants.length) * 60);
      }
      
      setGenerationProgress(100);
      setGeneratedVariantIds(createdIds);
      
      // Set the best variant as active
      if (bestVariantId) {
        setActiveVariantId(bestVariantId);
      }
      
      toast.success(`Generated ${createdIds.length} design variants!`, {
        description: bestVariantId ? 'Showing best overall variant' : undefined,
      });
      
      // Close wizard after short delay
      setTimeout(() => {
        closeWizard();
      }, 1000);
      
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
    session,
    envelopeId,
    createSession,
    createVariant,
    setGenerating,
    setGenerationProgress,
    setGeneratedVariantIds,
    setActiveVariantId,
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
          disabled={isGenerating || isCreatingSession || selectedTemplates.length === 0}
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
