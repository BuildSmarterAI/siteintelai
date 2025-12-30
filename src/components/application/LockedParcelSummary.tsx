/**
 * Locked Parcel Summary
 * Compact display of verified parcel info for the left panel.
 * Shows key facts + geometry hash with option to change selection.
 */

import { CheckCircle, MapPin, Hash, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SelectedParcel } from "@/types/parcelSelection";

interface LockedParcelSummaryProps {
  parcel: SelectedParcel;
  onChangeParcel: () => void;
}

export function LockedParcelSummary({ parcel, onChangeParcel }: LockedParcelSummaryProps) {
  // Format the verification timestamp
  const verifiedAt = new Date(parcel.verification_timestamp);
  const formattedDate = verifiedAt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = verifiedAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  // County-specific label for parcel ID
  const getParcelIdLabel = () => {
    const county = parcel.county.toLowerCase();
    if (county === 'harris') return 'HCAD Account #';
    if (county === 'fort bend') return 'FBCAD Prop #';
    if (county === 'montgomery') return 'MCAD #';
    return 'Parcel ID';
  };

  return (
    <div className="space-y-4">
      {/* Verified Badge */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[hsl(var(--status-success)/0.15)] flex items-center justify-center shrink-0">
          <CheckCircle className="h-5 w-5 text-[hsl(var(--status-success))]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Parcel Verified</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate} · {formattedTime}
          </p>
        </div>
      </div>
      
      {/* Parcel Identity */}
      <div className="space-y-3 pt-3 border-t border-border/50">
        {/* Parcel ID */}
        <div>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {getParcelIdLabel()}
          </span>
          <p className="font-mono text-sm text-foreground">{parcel.parcel_id}</p>
        </div>
        
        {/* Situs Address */}
        {parcel.situs_address && (
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Situs Address
            </span>
            <p className="text-sm text-foreground flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
              {parcel.situs_address}
            </p>
          </div>
        )}
        
        {/* Acreage & County */}
        <div className="flex gap-4">
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Acreage
            </span>
            <p className="text-sm text-foreground">{parcel.acreage.toFixed(2)} ac</p>
          </div>
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              County
            </span>
            <p className="text-sm text-foreground capitalize">{parcel.county}</p>
          </div>
        </div>
        
        {/* Owner (if available) */}
        {parcel.owner_name && (
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Owner of Record
            </span>
            <p className="text-sm text-foreground">{parcel.owner_name}</p>
          </div>
        )}
        
        {/* Geometry Integrity Hash */}
        <div>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Hash className="h-3 w-3" />
            Geometry Integrity
          </span>
          <p className="font-mono text-xs text-muted-foreground">
            {parcel.geometry_hash.slice(0, 16)}...
          </p>
        </div>
        
        {/* Confidence Badge */}
        <div className="pt-2">
          <Badge 
            variant={parcel.confidence === 'high' ? 'default' : 'secondary'}
            className={parcel.confidence === 'high' 
              ? 'bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))] border-[hsl(var(--status-success)/0.3)]' 
              : ''
            }
          >
            {parcel.confidence === 'high' ? 'High' : parcel.confidence === 'medium' ? 'Medium' : 'Low'} confidence match
          </Badge>
        </div>
      </div>
      
      {/* Change Parcel Button */}
      <div className="pt-3 border-t border-border/50">
        <Button 
          variant="outline" 
          onClick={onChangeParcel}
          className="w-full text-muted-foreground hover:text-foreground"
          size="sm"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-2" />
          Change Parcel
        </Button>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          You can change your selection until payment
        </p>
      </div>
    </div>
  );
}
