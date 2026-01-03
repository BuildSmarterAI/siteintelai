/**
 * Parcel Confirmation Gate
 * The DECISION GATE - Only place where orange appears.
 * This is the first irreversible act in SiteIntel.
 * Shows locked indicator after parcel is confirmed.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Lock,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Ruler,
} from "lucide-react";
import type { CandidateParcel } from "@/types/parcelSelection";

interface ParcelConfirmationGateProps {
  candidate: CandidateParcel;
  onConfirm: () => void;
  isLocking: boolean;
  canConfirm: boolean;
  warnings: string[];
  isLocked?: boolean;
}

export function ParcelConfirmationGate({
  candidate,
  onConfirm,
  isLocking,
  canConfirm,
  warnings,
  isLocked = false,
}: ParcelConfirmationGateProps) {
  // Locked State Display
  if (isLocked) {
    return (
      <Card className="border-2 border-green-500/40 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-700 dark:text-green-300">
                  Parcel Locked for Analysis
                </span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Confirmed
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                All feasibility calculations will use this parcel boundary
              </p>
            </div>
          </div>
          
          {/* Locked parcel summary */}
          <div className="bg-white/60 dark:bg-background/40 rounded-lg p-3 space-y-1.5 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">
                {candidate.situs_address || "Address unavailable – boundary only"}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{candidate.county} County</span>
              {candidate.acreage && (
                <span className="flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  {candidate.acreage.toFixed(2)} ac
                </span>
              )}
              <span className="font-mono">#{candidate.parcel_id}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Warnings - Must be reviewed before proceeding */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, i) => (
            <Alert 
              key={i} 
              className="bg-[hsl(var(--status-warning)/0.08)] border-[hsl(var(--status-warning)/0.25)] py-2"
            >
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-warning))]" />
              <AlertDescription className="text-xs text-foreground/90">
                {warning}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Decision Framing Panel */}
      <Card className="border border-border/60 bg-background shadow-md">
        <CardContent className="p-4 space-y-4">
          {/* Consequence-focused copy - no marketing language */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-[hsl(var(--commitment-orange-subtle))] flex items-center justify-center">
              <Lock className="h-5 w-5 text-[hsl(var(--feasibility-orange))]" />
            </div>
            <p className="text-sm text-foreground font-medium">
              Confirm selection
            </p>
            {candidate.geom && (
              <p className="text-[10px] font-mono text-muted-foreground">
                Boundary: {(candidate.geom as any).coordinates?.[0]?.length || '?'} vertices
              </p>
            )}
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
              All feasibility calculations, reports, and analysis will use this parcel's boundary and data.
            </p>
          </div>

          {/* Irreversibility Warning - Always visible above CTA */}
          <div className="flex items-start gap-2.5 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium leading-snug">
              This parcel boundary will be used for all analysis and cannot be changed after purchase.
            </p>
          </div>

          {/* Primary CTA - ONLY orange element on screen */}
          <Button 
            onClick={onConfirm}
            disabled={!canConfirm || isLocking}
            className="w-full bg-[hsl(var(--feasibility-orange))] hover:bg-[hsl(var(--feasibility-orange)/0.9)] text-white shadow-[var(--shadow-glow)] transition-all duration-200 font-heading font-semibold"
            size="lg"
          >
            {isLocking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Finalizing...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Lock & Finalize Parcel
              </>
            )}
          </Button>

          {/* Cannot proceed message */}
          {!canConfirm && !isLocking && (
            <p className="text-xs text-destructive text-center">
              Resolve validation errors before continuing
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
