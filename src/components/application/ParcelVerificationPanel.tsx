/**
 * Selected Parcel Panel (formerly ParcelVerificationPanel)
 * Clean panel showing selected parcel details.
 * Selection is the decision - no checkboxes or confidence language.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MapPin, 
  Ruler, 
  User,
  Building2,
  Loader2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import type { CandidateParcel } from "@/types/parcelSelection";

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
  const canConfirm = !isLocking && candidate.geom;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Selected Parcel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address - Primary */}
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">
            {candidate.situs_address || 'No address on file'}
          </p>
          <Badge variant="outline" className="text-xs">
            {candidate.county}
          </Badge>
        </div>

        {/* Parcel Facts - Read Only */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">CAD/APN</span>
              <p className="font-mono text-foreground">{candidate.parcel_id}</p>
            </div>
            {candidate.acreage && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Acreage</span>
                <p className="flex items-center gap-1 text-foreground">
                  <Ruler className="h-3 w-3 text-muted-foreground" />
                  {candidate.acreage.toFixed(2)} ac
                </p>
              </div>
            )}
          </div>
          
          {candidate.owner_name && (
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Owner</span>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                {candidate.owner_name}
              </p>
            </div>
          )}

          {candidate.zoning && (
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Zoning</span>
              <p className="flex items-center gap-1 text-sm text-foreground">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                {candidate.zoning}
              </p>
            </div>
          )}
        </div>

        {/* Map Helper Text */}
        <p className="text-xs text-muted-foreground text-center italic">
          Confirm the highlighted parcel boundary matches your intended site.
        </p>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((warning, i) => (
              <Alert key={i} className="bg-[hsl(var(--status-warning)/0.1)] border-[hsl(var(--status-warning)/0.3)] py-2">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-warning))]" />
                <AlertDescription className="text-xs">{warning}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* CTA Button */}
        <Button 
          onClick={onConfirm}
          disabled={!canConfirm}
          className="w-full"
          size="lg"
        >
          {isLocking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Run Feasibility Analysis
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          Uses this parcel's boundary and data
        </p>

        {!candidate.geom && (
          <p className="text-xs text-destructive text-center">
            Cannot proceed: parcel boundary data not available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
