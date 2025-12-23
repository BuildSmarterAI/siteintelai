/**
 * Parcel Verification Panel
 * Non-skippable verification gate with checklist.
 * User must explicitly confirm all three checks before proceeding.
 * 
 * Risk-tiered confirmation:
 * - Low confidence: Requires typed confirmation phrase
 * - Medium confidence: Warning banner, normal confirmation
 * - High confidence: Normal confirmation
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { 
  Shield, 
  CheckCircle, 
  MapPin, 
  Ruler, 
  User,
  Lock,
  AlertTriangle,
  Loader2,
  XCircle,
  Info,
  AlertOctagon,
} from "lucide-react";
import { useParcelSelection } from "@/contexts/ParcelSelectionContext";
import type { CandidateParcel, VerificationChecks } from "@/types/parcelSelection";

interface ParcelVerificationPanelProps {
  candidate: CandidateParcel;
  onConfirm: () => void;
  isLocking: boolean;
  warnings: string[];
}

const CONFIRMATION_PHRASE = "I confirm this parcel is correct";

export function ParcelVerificationPanel({ 
  candidate, 
  onConfirm, 
  isLocking,
  warnings,
}: ParcelVerificationPanelProps) {
  const { state, updateVerificationCheck, setTypedConfirmation } = useParcelSelection();
  const { verificationChecks, typedConfirmationPhrase } = state;

  const handleCheckChange = (check: keyof VerificationChecks, checked: boolean) => {
    updateVerificationCheck(check, checked);
  };

  const allChecked = verificationChecks.correctBoundary && 
                     verificationChecks.locationMatches && 
                     verificationChecks.understandsAnalysis;

  const isLowConfidence = candidate.confidence === 'low';
  const isMediumConfidence = candidate.confidence === 'medium';
  const isExternalSource = candidate.source === 'external';

  // For low confidence, require typed confirmation
  const confirmationValid = isLowConfidence 
    ? typedConfirmationPhrase.toLowerCase().trim() === CONFIRMATION_PHRASE.toLowerCase()
    : true;

  const canConfirm = allChecked && confirmationValid && !isLocking && candidate.geom;

  return (
    <TooltipProvider>
      <Card 
        className="border-primary/20"
        role="alertdialog"
        aria-labelledby="verification-title"
        aria-describedby="verification-description"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle id="verification-title" className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Lock this Parcel for Analysis
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant={candidate.source === 'canonical' ? 'default' : 'outline'}
                  className="cursor-help"
                >
                  {candidate.source === 'canonical' ? 'Verified Source' : 'External Source'}
                  {isExternalSource && <Info className="h-3 w-3 ml-1" />}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                {candidate.source === 'canonical' 
                  ? 'This parcel data comes from our verified county records database.'
                  : 'This parcel data comes from an external source. Please verify the boundary carefully.'}
              </TooltipContent>
            </Tooltip>
          </div>
          <p id="verification-description" className="text-xs text-muted-foreground mt-1">
            Review and confirm the parcel details below before proceeding with analysis.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Risk Banners - ABOVE everything else */}
          {isLowConfidence && (
            <Alert className="bg-destructive/10 border-destructive/30">
              <AlertOctagon className="h-4 w-4 text-destructive" />
              <AlertTitle className="text-destructive font-semibold">
                Low Geocoding Confidence
              </AlertTitle>
              <AlertDescription className="text-sm text-destructive/90">
                The location match confidence is low. Consider using CAD/APN search for more accurate results. 
                You must type the confirmation phrase below to proceed.
              </AlertDescription>
            </Alert>
          )}

          {isMediumConfidence && (
            <Alert className="bg-warning/10 border-warning/30">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertTitle className="text-warning font-semibold">
                Moderate Confidence
              </AlertTitle>
              <AlertDescription className="text-sm">
                Please review the parcel boundary on the map carefully before confirming.
              </AlertDescription>
            </Alert>
          )}

          {isExternalSource && !isLowConfidence && !isMediumConfidence && (
            <Alert className="bg-muted border-border">
              <Info className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-sm">
                External data source - verify boundary matches your intended parcel.
              </AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((warning, i) => (
                <Alert key={i} className="bg-warning/10 border-warning/30 py-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-xs">{warning}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Parcel Summary */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{candidate.situs_address || 'No address'}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="font-mono">{candidate.parcel_id}</span>
              {candidate.acreage && (
                <span className="flex items-center gap-1">
                  <Ruler className="h-3 w-3" /> {candidate.acreage.toFixed(2)} acres
                </span>
              )}
              {candidate.owner_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {candidate.owner_name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge 
                variant="outline" 
                className={
                  candidate.confidence === 'high' 
                    ? 'bg-green-500/10 text-green-700 border-green-500/30' 
                    : candidate.confidence === 'medium'
                    ? 'bg-warning/10 text-warning border-warning/30'
                    : 'bg-destructive/10 text-destructive border-destructive/30'
                }
              >
                {candidate.confidence.charAt(0).toUpperCase() + candidate.confidence.slice(1)} Confidence
              </Badge>
              <Badge variant="outline">{candidate.county}</Badge>
            </div>
          </div>

          {/* Verification Checklist - HARD GATE */}
          <div className="space-y-3 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Verification Required
            </p>
            
            <div className="space-y-3" role="group" aria-label="Verification checklist">
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="correctBoundary" 
                  checked={verificationChecks.correctBoundary}
                  onCheckedChange={(checked) => handleCheckChange('correctBoundary', !!checked)}
                  aria-describedby="correctBoundary-desc"
                />
                <div>
                  <Label htmlFor="correctBoundary" className="text-sm leading-snug cursor-pointer">
                    This is the correct parcel boundary
                  </Label>
                  <p id="correctBoundary-desc" className="text-xs text-muted-foreground">
                    I have verified the boundary on the map matches my property
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="locationMatches" 
                  checked={verificationChecks.locationMatches}
                  onCheckedChange={(checked) => handleCheckChange('locationMatches', !!checked)}
                  aria-describedby="locationMatches-desc"
                />
                <div>
                  <Label htmlFor="locationMatches" className="text-sm leading-snug cursor-pointer">
                    Location matches my intent
                  </Label>
                  <p id="locationMatches-desc" className="text-xs text-muted-foreground">
                    This is the property I want to analyze
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="understandsAnalysis" 
                  checked={verificationChecks.understandsAnalysis}
                  onCheckedChange={(checked) => handleCheckChange('understandsAnalysis', !!checked)}
                  aria-describedby="understandsAnalysis-desc"
                />
                <div>
                  <Label htmlFor="understandsAnalysis" className="text-sm leading-snug cursor-pointer">
                    I understand analysis will use this parcel
                  </Label>
                  <p id="understandsAnalysis-desc" className="text-xs text-muted-foreground">
                    Feasibility analysis will be based on this parcel's data
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Typed Confirmation for Low Confidence */}
          {isLowConfidence && (
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="confirmPhrase" className="text-sm font-medium text-destructive">
                Type "{CONFIRMATION_PHRASE}" to proceed
              </Label>
              <Input
                id="confirmPhrase"
                type="text"
                value={typedConfirmationPhrase}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                placeholder={CONFIRMATION_PHRASE}
                className={
                  typedConfirmationPhrase && !confirmationValid 
                    ? 'border-destructive focus-visible:ring-destructive' 
                    : confirmationValid && typedConfirmationPhrase
                    ? 'border-green-500 focus-visible:ring-green-500'
                    : ''
                }
                aria-invalid={typedConfirmationPhrase && !confirmationValid}
              />
              {typedConfirmationPhrase && !confirmationValid && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Phrase does not match
                </p>
              )}
              {confirmationValid && typedConfirmationPhrase && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Confirmation valid
                </p>
              )}
            </div>
          )}

          {/* Confirm Button */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => window.history.back()}
              disabled={isLocking}
            >
              Go Back
            </Button>
            <Button 
              onClick={onConfirm}
              disabled={!canConfirm}
              className="flex-1"
              size="lg"
            >
              {isLocking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Locking...
                </>
              ) : canConfirm ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Lock & Analyze
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete checks above
                </>
              )}
            </Button>
          </div>

          {!candidate.geom && (
            <p className="text-xs text-destructive text-center">
              Cannot lock: parcel geometry not available
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
