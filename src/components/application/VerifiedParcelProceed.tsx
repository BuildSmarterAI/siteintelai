/**
 * Verified Parcel Proceed Panel
 * Right panel CTA for proceeding to payment after parcel verification.
 * Emphasizes that changes are still possible until payment.
 */

import { CheckCircle, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SelectedParcel } from "@/types/parcelSelection";

interface VerifiedParcelProceedProps {
  parcel: SelectedParcel;
  onContinue: () => void;
  onChangeParcel: () => void;
}

export function VerifiedParcelProceed({ parcel, onContinue, onChangeParcel }: VerifiedParcelProceedProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6">
      {/* Success Icon */}
      <div className="w-16 h-16 rounded-full bg-[hsl(var(--status-success)/0.15)] flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-[hsl(var(--status-success))]" />
      </div>
      
      {/* Title & Description */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Ready for Analysis</h3>
        <p className="text-sm text-muted-foreground max-w-[240px]">
          This parcel will be used for your feasibility calculations.
        </p>
      </div>
      
      {/* Parcel Summary */}
      <div className="w-full bg-muted/30 rounded-lg p-3 space-y-1">
        <p className="text-sm font-medium text-foreground truncate">
          {parcel.situs_address || parcel.parcel_id}
        </p>
        <p className="text-xs text-muted-foreground">
          {parcel.acreage.toFixed(2)} acres · {parcel.county} County
        </p>
      </div>
      
      {/* Primary CTA */}
      <Button 
        onClick={onContinue}
        className="w-full bg-[hsl(var(--feasibility-orange))] hover:bg-[hsl(var(--feasibility-orange)/0.9)] text-white"
        size="lg"
      >
        Continue to Payment
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
      
      {/* Secondary CTA */}
      <Button 
        variant="ghost" 
        onClick={onChangeParcel}
        className="w-full text-muted-foreground hover:text-foreground"
        size="sm"
      >
        <RefreshCw className="h-3.5 w-3.5 mr-2" />
        Change Parcel
      </Button>
      
      {/* Reassurance Text */}
      <div className="pt-4 border-t border-border/50 w-full">
        <p className="text-[11px] text-muted-foreground">
          You can change your selection until payment.
          <br />
          The parcel becomes locked after checkout.
        </p>
      </div>
    </div>
  );
}
