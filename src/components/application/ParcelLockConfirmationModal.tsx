/**
 * Parcel Lock Confirmation Modal
 * Critical UX gate - forces conscious decision before irreversible parcel lock.
 * User must explicitly confirm before proceeding to checkout.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Loader2, MapPin } from "lucide-react";
import type { CandidateParcel } from "@/types/parcelSelection";

interface ParcelLockConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: CandidateParcel;
  onConfirm: () => void;
  isConfirming: boolean;
}

export function ParcelLockConfirmationModal({
  open,
  onOpenChange,
  candidate,
  onConfirm,
  isConfirming,
}: ParcelLockConfirmationModalProps) {
  // Extract display values with fallbacks
  const address = candidate.situs_address || "Address not available";
  const cadId = candidate.parcel_id || "—";
  const acreage = candidate.acreage 
    ? `${candidate.acreage.toFixed(2)} ac` 
    : "—";
  const county = candidate.county 
    ? `${candidate.county} County` 
    : "County not specified";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md bg-background border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-heading font-semibold">
            Confirm Parcel Selection
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Map Snapshot Placeholder */}
              <div className="w-full h-[160px] rounded-lg bg-muted/50 border border-border flex items-center justify-center overflow-hidden">
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--feasibility-orange))]" />
                  <p className="text-xs font-mono">
                    {(candidate.geom as any)?.coordinates?.[0]?.length || '?'} vertex boundary
                  </p>
                </div>
              </div>

              {/* Parcel Details */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  You're about to lock this parcel for analysis:
                </p>
                
                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-base">
                    {address.toUpperCase()}
                  </p>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <p>CAD Account: <span className="font-mono">#{cadId}</span></p>
                    <p>Acreage: {acreage}</p>
                    <p>County: {county}</p>
                  </div>
                </div>
              </div>

              {/* Irreversibility Warning */}
              <div className="flex items-start gap-2.5 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium leading-snug">
                  This selection <strong>CANNOT</strong> be changed after checkout. All feasibility calculations, reports, and analysis will use this exact parcel boundary.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-row justify-between sm:justify-between gap-3 mt-2">
          <AlertDialogCancel 
            className="mt-0 flex-1 sm:flex-none"
            disabled={isConfirming}
          >
            ← Review Selection
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isConfirming}
            className="flex-1 sm:flex-none bg-[hsl(var(--feasibility-orange))] hover:bg-[hsl(var(--feasibility-orange)/0.9)] text-white font-semibold"
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Finalizing...
              </>
            ) : (
              "Confirm & Continue →"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
