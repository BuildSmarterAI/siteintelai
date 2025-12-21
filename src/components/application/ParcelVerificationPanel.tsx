/**
 * Parcel Verification Panel
 * Non-skippable verification gate with checklist.
 * User must explicitly confirm all three checks before proceeding.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  CheckCircle, 
  MapPin, 
  Ruler, 
  User,
  Lock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useParcelSelection } from "@/contexts/ParcelSelectionContext";
import type { CandidateParcel, VerificationChecks } from "@/types/parcelSelection";

interface ParcelVerificationPanelProps {
  candidate: CandidateParcel;
  onConfirm: () => void;
  isLocking: boolean;
  warnings: string[];
}

export function ParcelVerificationPanel({ 
  candidate, 
  onConfirm, 
  isLocking,
  warnings,
}: ParcelVerificationPanelProps) {
  const { state, updateVerificationCheck, canLock } = useParcelSelection();
  const { verificationChecks } = state;

  const handleCheckChange = (check: keyof VerificationChecks, checked: boolean) => {
    updateVerificationCheck(check, checked);
  };

  const allChecked = verificationChecks.correctBoundary && 
                     verificationChecks.locationMatches && 
                     verificationChecks.understandsAnalysis;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Verify Parcel
          </CardTitle>
          <Badge variant={candidate.source === 'canonical' ? 'default' : 'outline'}>
            {candidate.source === 'canonical' ? 'Verified Source' : 'External Source'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((warning, i) => (
              <Alert key={i} className="bg-warning/10 border-warning/30 py-2">
                <AlertTriangle className="h-3 w-3" />
                <AlertDescription className="text-xs">{warning}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Verification Checklist - HARD GATE */}
        <div className="space-y-3 pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Verification Required
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="correctBoundary" 
                checked={verificationChecks.correctBoundary}
                onCheckedChange={(checked) => handleCheckChange('correctBoundary', !!checked)}
              />
              <Label htmlFor="correctBoundary" className="text-sm leading-snug cursor-pointer">
                This is the correct parcel boundary
              </Label>
            </div>
            
            <div className="flex items-start gap-3">
              <Checkbox 
                id="locationMatches" 
                checked={verificationChecks.locationMatches}
                onCheckedChange={(checked) => handleCheckChange('locationMatches', !!checked)}
              />
              <Label htmlFor="locationMatches" className="text-sm leading-snug cursor-pointer">
                Location matches my intent
              </Label>
            </div>
            
            <div className="flex items-start gap-3">
              <Checkbox 
                id="understandsAnalysis" 
                checked={verificationChecks.understandsAnalysis}
                onCheckedChange={(checked) => handleCheckChange('understandsAnalysis', !!checked)}
              />
              <Label htmlFor="understandsAnalysis" className="text-sm leading-snug cursor-pointer">
                I understand analysis will use this parcel
              </Label>
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <Button 
          onClick={onConfirm}
          disabled={!allChecked || isLocking || !candidate.geom}
          className="w-full"
          size="lg"
        >
          {isLocking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Locking Parcel...
            </>
          ) : allChecked ? (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Confirm Parcel
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete all checks above
            </>
          )}
        </Button>

        {!candidate.geom && (
          <p className="text-xs text-destructive text-center">
            Cannot lock: parcel geometry not available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
