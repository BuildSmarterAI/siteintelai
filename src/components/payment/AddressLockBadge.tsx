import { MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddressLockBadgeProps {
  propertyAddress: string;
  coordinates?: { lat: number; lng: number };
  onChangeAddress?: () => void;
}

export const AddressLockBadge = ({
  propertyAddress,
  coordinates,
  onChangeAddress,
}: AddressLockBadgeProps) => {
  return (
    <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-5 w-5 text-primary" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-heading text-xs font-semibold text-primary uppercase tracking-wide">
              Property Verified & Locked
            </span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="font-semibold text-foreground break-words">{propertyAddress}</p>
              {coordinates && (
                <p className="font-mono text-xs text-muted-foreground mt-0.5 tabular-nums">
                  {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>
          {onChangeAddress && (
            <Button
              variant="link"
              size="sm"
              onClick={onChangeAddress}
              className="h-auto p-0 mt-2 text-xs text-muted-foreground hover:text-primary"
            >
              Need to change? Select different property
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3 pl-12">
        This ensures your analysis is generated for the correct parcel.
      </p>
    </div>
  );
};
