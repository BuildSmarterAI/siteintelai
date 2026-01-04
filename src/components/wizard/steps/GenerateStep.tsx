/**
 * Generate Step
 * Step 7: Summary and variant generation
 * 
 * Uses unified compliance engine for preflight checks and server-side
 * atomic variant generation for consistent state.
 */

import { useState, useCallback, useMemo } from 'react';
import { useDesignStore } from '@/stores/useDesignStore';
import { useWizardStore, selectTotalProgramGfa } from '@/stores/useWizardStore';
import { useDesignSession } from '@/hooks/useDesignSession';
import { createEnvelopeSummary } from '@/lib/templateScoring';
import { checkTemplateCompliance } from '@/lib/complianceEngine';
import { createDesignIntentFromWizard } from '@/types/designIntent';
import { supabase } from '@/integrations/supabase/client';
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
  const envelope = useDesignStore((s) => s.envelope);
  const setActiveVariantId = useDesignStore((s) => s.setActiveVariantId);
  const setVariants = useDesignStore((s) => s.setVariants);
  const { 
    currentStep,
    maxReachedStep,
    siteConfirmed,
    programBuckets,
    selectedTemplates,
    selectedUseTypes,
    parkingConfig,
    sustainabilityEnabled,
    sustainabilityLevel,
    isGenerating,
    generationProgress,
    setGenerating,
    setGenerationProgress,
    setGeneratedVariantIds,
    closeWizard,
  } = useWizardStore();
  
  const totalGfa = useWizardStore(selectTotalProgramGfa);
  const summary = createEnvelopeSummary(envelope);
  
  const envelopeId = useDesignStore((s) => s.envelope?.id);
  const { session, createSession, isCreatingSession } = useDesignSession(envelopeId);
  
  const [generatedCount, setGeneratedCount] = useState(0);
  
  // Calculate metrics using UNIFIED COMPLIANCE ENGINE
  const farUsed = summary ? totalGfa / summary.parcelSqft : 0;
  const farPct = summary ? (farUsed / summary.farCap) * 100 : 0;
  
  const avgHeight = programBuckets.reduce((sum, b) => 
    sum + (b.targetStories * b.floorToFloorFt), 0
  ) / Math.max(programBuckets.length, 1);
  const heightPct = summary ? (avgHeight / summary.heightCapFt) * 100 : 0;
  
  // Preflight compliance check using unified engine
  const preflightCompliance = useMemo(() => {
    if (!summary) return null;
    return checkTemplateCompliance({
      estimatedGfa: totalGfa,
      estimatedHeight: avgHeight,
      estimatedCoverage: 50, // Assume 50% coverage for preflight
      envelope: {
        parcelSqft: summary.parcelSqft,
        farCap: summary.farCap,
        heightCapFt: summary.heightCapFt,
        coverageCapPct: summary.coverageCapPct,
      },
    });
  }, [summary, totalGfa, avgHeight]);
  
  // Generate variants using server-side atomic generation
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
      // Create design intent for persistence
      const designIntent = createDesignIntentFromWizard({
        currentStep,
        maxReachedStep,
        siteConfirmed,
        selectedUseTypes,
        programBuckets,
        parkingConfig,
        selectedTemplates,
        sustainabilityEnabled,
        sustainabilityLevel,
        isComplete: true,
      });
      
      setGenerationProgress(10);
      
      // Call server-side atomic generation endpoint
      console.log('[GenerateStep] Calling generate-variants edge function');
      
      const { data, error } = await supabase.functions.invoke('generate-variants', {
        body: {
          sessionId: activeSessionId,
          envelopeId,
          envelope: summary,
          buildablePolygon: envelope.buildableFootprint2d,
          selectedTemplates,
          programBuckets,
          sustainabilityLevel: sustainabilityEnabled ? sustainabilityLevel : null,
          designIntent,
        },
      });
      
      if (error) {
        console.error('[GenerateStep] Edge function error:', error);
        throw new Error(error.message || 'Failed to generate variants');
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Generation failed');
      }
      
      console.log('[GenerateStep] Generation complete:', data);
      
      setGenerationProgress(100);
      setGeneratedCount(data.variantsCount || 0);
      setGeneratedVariantIds(data.variants?.map((v: { id: string }) => v.id) || []);
      
      // Update store with new variants
      if (data.variants?.length > 0) {
        const formattedVariants = data.variants.map((v: any) => ({
          id: v.id,
          sessionId: v.session_id,
          name: v.name,
          footprint: v.footprint,
          heightFt: v.height_ft,
          floors: v.floors,
          presetType: v.preset_type,
          notes: v.notes || '',
          metrics: null,
          complianceStatus: v.compliance_status || 'PENDING',
          complianceResult: null,
          isBaseline: v.is_baseline || false,
          sortOrder: v.sort_order || 0,
          createdAt: v.created_at,
          updatedAt: v.updated_at,
        }));
        setVariants(formattedVariants);
      }
      
      // Set the best variant as active
      if (data.bestVariantId) {
        setActiveVariantId(data.bestVariantId);
      }
      
      toast.success(`Generated ${data.variantsCount} design variants!`, {
        description: data.bestVariantId ? 'Showing best overall variant' : undefined,
      });
      
      // Close wizard after short delay
      setTimeout(() => {
        closeWizard();
      }, 1000);
      
    } catch (error) {
      console.error('[GenerateStep] Generation error:', error);
      toast.error('Failed to generate variants', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setGenerating(false);
    }
  }, [
    envelope, 
    summary, 
    selectedTemplates,
    selectedUseTypes,
    programBuckets,
    parkingConfig,
    sustainabilityEnabled,
    sustainabilityLevel,
    siteConfirmed,
    currentStep,
    maxReachedStep,
    session,
    envelopeId,
    createSession,
    setGenerating,
    setGenerationProgress,
    setGeneratedVariantIds,
    setActiveVariantId,
    setVariants,
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
      
      {/* Warnings - using unified compliance preflight */}
      {preflightCompliance && preflightCompliance.status !== 'PASS' && (
        <div className={`flex items-start gap-2 p-3 rounded-lg ${
          preflightCompliance.status === 'FAIL' 
            ? 'bg-destructive/10 border border-destructive/30'
            : 'bg-amber-500/10 border border-amber-500/30'
        }`}>
          <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${
            preflightCompliance.status === 'FAIL' ? 'text-destructive' : 'text-amber-600'
          }`} />
          <div className="text-sm">
            <p className={`font-medium ${
              preflightCompliance.status === 'FAIL' ? 'text-destructive' : 'text-amber-700'
            }`}>
              {preflightCompliance.status === 'FAIL' ? 'Program Exceeds Limits' : 'Near Capacity'}
            </p>
            <p className={preflightCompliance.status === 'FAIL' ? 'text-destructive/80' : 'text-amber-600/80'}>
              {preflightCompliance.status === 'FAIL' 
                ? 'Some variants may be marked as non-compliant (FAIL).'
                : 'Program is close to regulatory limits. Consider reducing targets.'}
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
      
      {/* Generate Button */}
      <Button 
        onClick={handleGenerate} 
        disabled={isGenerating || isCreatingSession || selectedTemplates.length === 0}
        className="w-full gap-2"
        size="lg"
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
      
      {/* Disclaimer */}
      <p className="text-xs text-center text-muted-foreground">
        Conceptual Design — Not for Construction
      </p>
    </div>
  );
}
