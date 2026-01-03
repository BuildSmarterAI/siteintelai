/**
 * Site Confirmation Step
 * Step 1: Displays envelope summary and confirms site selection
 */

import { useDesignStore } from '@/stores/useDesignStore';
import { useWizardStore } from '@/stores/useWizardStore';
import { createEnvelopeSummary } from '@/lib/templateScoring';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Ruler, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function SiteConfirmationStep() {
  const envelope = useDesignStore((s) => s.envelope);
  const { siteConfirmed, confirmSite, nextStep } = useWizardStore();
  
  const summary = createEnvelopeSummary(envelope);
  
  if (!envelope || !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="font-semibold text-lg mb-2">No Envelope Found</h3>
        <p className="text-muted-foreground text-sm mb-4">
          A regulatory envelope is required before exploring building designs.
        </p>
        <Button variant="outline">
          Run Envelope Analysis
        </Button>
      </div>
    );
  }
  
  const handleConfirm = () => {
    confirmSite();
    nextStep();
  };
  
  const qualityColors = {
    high: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    medium: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    low: 'bg-red-500/10 text-red-600 border-red-500/30',
  };
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="font-semibold text-lg">Confirm Site</h3>
        <p className="text-muted-foreground text-sm">
          Review the parcel and regulatory envelope before proceeding.
        </p>
      </div>
      
      {/* Site Summary Card */}
      <Card className="border-muted">
        <CardContent className="p-4 space-y-4">
          {/* Address / Location */}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                Selected Parcel
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.parcelAcres.toFixed(2)} acres ({Math.round(summary.parcelSqft).toLocaleString()} SF)
              </p>
            </div>
            <Badge variant="outline" className={qualityColors[summary.envelopeQuality]}>
              {summary.envelopeQuality === 'high' && 'High Confidence'}
              {summary.envelopeQuality === 'medium' && 'Medium Confidence'}
              {summary.envelopeQuality === 'low' && 'Low Confidence'}
            </Badge>
          </div>
          
          {/* Envelope Caps */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/50">
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">
                {summary.farCap}
              </div>
              <div className="text-xs text-muted-foreground">Max FAR</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">
                {summary.heightCapFt}'
              </div>
              <div className="text-xs text-muted-foreground">Max Height</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">
                {summary.coverageCapPct}%
              </div>
              <div className="text-xs text-muted-foreground">Max Coverage</div>
            </div>
          </div>
          
          {/* Buildable Area */}
          <div className="flex items-center gap-3 pt-2 border-t border-border/50">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <span className="text-sm">Buildable Footprint</span>
            </div>
            <span className="text-sm font-medium">
              {Math.round(summary.buildableSqft).toLocaleString()} SF
            </span>
          </div>
          
          {/* Max GFA */}
          <div className="flex items-center gap-3">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <span className="text-sm">Max GFA Potential</span>
            </div>
            <span className="text-sm font-medium">
              {Math.round(summary.maxGfa).toLocaleString()} SF
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Confirmation */}
      <div className="flex flex-col gap-3 pt-2">
        {siteConfirmed ? (
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Site Confirmed</span>
          </div>
        ) : (
          <Button onClick={handleConfirm} className="w-full">
            Confirm Site
          </Button>
        )}
      </div>
    </div>
  );
}
