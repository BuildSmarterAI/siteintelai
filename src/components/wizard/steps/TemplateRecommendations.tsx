/**
 * Template Recommendations Step
 * Step 5: Display template cards with scoring and hover preview
 */

import { useMemo } from 'react';
import { useDesignStore } from '@/stores/useDesignStore';
import { useWizardStore } from '@/stores/useWizardStore';
import { useDesignTemplates } from '@/hooks/useDesignTemplates';
import { rankTemplates, createEnvelopeSummary } from '@/lib/templateScoring';
import { TemplateCard } from '../TemplateCard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Plus } from 'lucide-react';

export function TemplateRecommendations() {
  const envelope = useDesignStore((s) => s.envelope);
  const { 
    selectedUseTypes, 
    programBuckets, 
    selectedTemplates,
    addTemplate,
    removeTemplate,
    setHoveredTemplate,
    nextStep, 
    prevStep 
  } = useWizardStore();
  
  const { data: templates, isLoading } = useDesignTemplates({ 
    useTypes: selectedUseTypes 
  });
  
  const summary = createEnvelopeSummary(envelope);
  
  // Score and rank templates for each bucket
  const rankedTemplates = useMemo(() => {
    if (!templates || !summary || programBuckets.length === 0) return null;
    
    // Use first bucket for scoring (primary use type)
    const primaryBucket = programBuckets[0];
    return rankTemplates(templates, summary, primaryBucket);
  }, [templates, summary, programBuckets]);
  
  const canProceed = selectedTemplates.length > 0;
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading templates...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="space-y-1 flex-shrink-0">
        <h3 className="font-semibold text-lg">Building Templates</h3>
        <p className="text-muted-foreground text-sm">
          Select building types to add to your program.
        </p>
      </div>
      
      {/* Selected Templates */}
      {selectedTemplates.length > 0 && (
        <div className="flex-shrink-0 space-y-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Selected ({selectedTemplates.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTemplates.map((st) => (
              <Badge
                key={st.templateKey}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => removeTemplate(st.templateKey)}
              >
                {st.template.name}
                <span className="ml-1 text-xs">×</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Template Cards */}
      <ScrollArea className="flex-1 -mx-1 px-1">
        <div className="space-y-4 pb-4">
          {/* Recommended */}
          {rankedTemplates?.recommended && rankedTemplates.recommended.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary uppercase tracking-wide">
                  Recommended
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2">
                {rankedTemplates.recommended.map((score) => {
                  const template = templates?.find(t => t.template_key === score.templateKey);
                  if (!template) return null;
                  
                  const isSelected = selectedTemplates.some(
                    st => st.templateKey === score.templateKey
                  );
                  
                  return (
                    <TemplateCard
                      key={score.templateKey}
                      template={template}
                      score={score}
                      isSelected={isSelected}
                      onHover={(key) => setHoveredTemplate(key)}
                      onAdd={() => addTemplate({ 
                        templateKey: template.template_key, 
                        template 
                      })}
                      onRemove={() => removeTemplate(template.template_key)}
                    />
                  );
                })}
              </div>
            </div>
          )}
          
          {/* More Options */}
          {rankedTemplates?.moreOptions && rankedTemplates.moreOptions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  More Options
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2">
                {rankedTemplates.moreOptions.map((score) => {
                  const template = templates?.find(t => t.template_key === score.templateKey);
                  if (!template) return null;
                  
                  const isSelected = selectedTemplates.some(
                    st => st.templateKey === score.templateKey
                  );
                  
                  return (
                    <TemplateCard
                      key={score.templateKey}
                      template={template}
                      score={score}
                      isSelected={isSelected}
                      onHover={(key) => setHoveredTemplate(key)}
                      onAdd={() => addTemplate({ 
                        templateKey: template.template_key, 
                        template 
                      })}
                      onRemove={() => removeTemplate(template.template_key)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Navigation */}
      <div className="flex gap-2 pt-2 flex-shrink-0">
        <Button variant="outline" onClick={prevStep} className="flex-1">
          Back
        </Button>
        <Button onClick={nextStep} disabled={!canProceed} className="flex-1">
          Next
        </Button>
      </div>
    </div>
  );
}
