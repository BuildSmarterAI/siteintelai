/**
 * Parcel Confirmation Gate
 * The DECISION GATE - Only place where orange appears.
 * This is the first irreversible act in SiteIntel.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Lock,
  Loader2,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import type { CandidateParcel } from "@/types/parcelSelection";

interface ParcelConfirmationGateProps {
  candidate: CandidateParcel;
  onConfirm: () => void;
  onChangeParcel: () => void;
  isLocking: boolean;
  canConfirm: boolean;
  warnings: string[];
}

export function ParcelConfirmationGate({
  candidate,
  onConfirm,
  onChangeParcel,
  isLocking,
  canConfirm,
  warnings,
}: ParcelConfirmationGateProps) {
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
              This parcel will be locked
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
              All feasibility calculations, reports, and analysis will use this parcel's boundary and data.
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
                Locking Parcel...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Lock Parcel & Continue
              </>
            )}
          </Button>

          {/* Secondary Escape Action - Ghost button, cyan text */}
          <Button
            variant="ghost"
            onClick={onChangeParcel}
            disabled={isLocking}
            className="w-full text-[hsl(var(--data-cyan))] hover:text-[hsl(var(--data-cyan))] hover:bg-[hsl(var(--exploration-cyan-subtle))]"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Change Parcel
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
