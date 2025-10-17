import { X, Sparkles, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ParcelDetailsPopupProps {
  parcel: {
    id: string;
    address: string;
    owner: string;
    acreage: number;
    landValue: number;
    imprValue?: number;
  };
  onClose: () => void;
  onUseForAnalysis: (parcel: any) => void;
}

export function ParcelDetailsPopup({ parcel, onClose, onUseForAnalysis }: ParcelDetailsPopupProps) {
  return (
    <div className="absolute bottom-4 left-4 z-20 w-80 glass-ai-panel rounded-lg p-4 shadow-xl">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                {parcel.address || 'Address not available'}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                ID: {parcel.id}
              </p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 text-xs border-t border-border/50 pt-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Owner:</span>
          <span className="font-mono text-foreground text-right max-w-[60%] truncate">
            {parcel.owner}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Acreage:</span>
          <span className="font-mono text-foreground">{parcel.acreage.toFixed(2)} ac</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Land Value:</span>
          <span className="font-mono text-foreground">
            ${parcel.landValue?.toLocaleString() || 'N/A'}
          </span>
        </div>
        {parcel.imprValue && parcel.imprValue > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Improvement Value:</span>
            <span className="font-mono text-foreground">
              ${parcel.imprValue.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <Button
        onClick={() => onUseForAnalysis(parcel)}
        className="w-full mt-4"
        variant="default"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Run Feasibility Analysis
      </Button>
    </div>
  );
}
