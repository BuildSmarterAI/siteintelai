/**
 * Parcel Lock Confirmation Modal
 * MANDATORY CONFIRMATION GATE - Non-skippable decision point
 * Forces explicit acknowledgment before irreversible parcel lock.
 * Displays dynamic warnings based on data quality.
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Lock, MapPin, AlertCircle } from "lucide-react";
import { ParcelMapSnapshot } from "./ParcelMapSnapshot";
import type { CandidateParcel } from "@/types/parcelSelection";

interface ParcelLockConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: CandidateParcel;
  onConfirm: () => void;
  isConfirming: boolean;
  confidence?: number;
}

export function ParcelLockConfirmationModal({
  open,
  onOpenChange,
  candidate,
  onConfirm,
  isConfirming,
  confidence,
}: ParcelLockConfirmationModalProps) {
  // Extract display values with fallbacks
  const address = candidate.situs_address || null;
  const cadId = candidate.parcel_id || "—";
  const acreage = candidate.acreage 
    ? `${candidate.acreage.toFixed(2)} ac` 
    : "—";
  const county = candidate.county 
    ? `${candidate.county} County` 
    : "County not specified";
  
  // Determine warnings
  const hasAddressWarning = !address;
  const hasConfidenceWarning = confidence !== undefined && confidence < 0.7;
  const hasAnyWarning = hasAddressWarning || hasConfidenceWarning;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md bg-background border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-heading font-semibold flex items-center gap-2">
            <Lock className="h-5 w-5 text-[hsl(var(--feasibility-orange))]" />
            Confirm Parcel Selection
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Map Snapshot with parcel boundary */}
              <ParcelMapSnapshot
                geometry={candidate.geom as GeoJSON.Geometry}
                className="w-full"
                width={400}
                height={160}
              />

              {/* Parcel Summary Box */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <p className="text-sm text-muted-foreground">
                  You are about to run feasibility analysis on:
                </p>
                <p className="font-semibold text-foreground text-base">
                  {county} – {acreage}
                </p>
                {address ? (
                  <p className="text-sm text-foreground">{address.toUpperCase()}</p>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Address unavailable – parcel identified by boundary only</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground font-mono">
                  CAD Account: #{cadId}
                </p>
              </div>

              {/* Dynamic Warnings */}
              {hasAnyWarning && (
                <div className="space-y-2">
                  {hasAddressWarning && (
                    <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 py-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                      <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Address data is incomplete.</strong> Some counties do not provide situs addresses. This increases verification risk.
                      </AlertDescription>
                    </Alert>
                  )}
                  {hasConfidenceWarning && (
                    <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 py-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                      <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Match confidence is below threshold</strong> ({Math.round((confidence || 0) * 100)}%). Please verify this is the correct parcel.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Irreversibility Warning */}
              <div className="flex items-start gap-2.5 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium leading-snug">
                  This analysis will assume this parcel is correct. Selection <strong>CANNOT</strong> be changed after checkout.
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
            ← Choose Different Parcel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isConfirming}
            className="flex-1 sm:flex-none bg-[hsl(var(--feasibility-orange))] hover:bg-[hsl(var(--feasibility-orange)/0.9)] text-white font-semibold gap-2"
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Locking...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Confirm & Lock Parcel
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}