/**
 * Candidate Parcel List
 * Displays ranked parcel candidates as selectable decision cards.
 * Selection is the decision - clean, simple cards.
 */

import { Card } from "@/components/ui/card";
import { MapPin, User, Ruler, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CandidateParcel } from "@/types/parcelSelection";

interface CandidateParcelListProps {
  candidates: CandidateParcel[];
  selectedId: string | null;
  onSelect: (candidate: CandidateParcel) => void;
}

export function CandidateParcelList({ candidates, selectedId, onSelect }: CandidateParcelListProps) {
  if (candidates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Search for a property to see results</p>
      </div>
    );
  }

  const hasMultiple = candidates.length > 1;

  return (
    <div className="space-y-2">
      <div className="mb-3">
        {hasMultiple ? (
          <>
            <h3 className="text-sm font-medium text-foreground">
              Multiple parcels match this address
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Please select the correct one from the list.
            </p>
          </>
        ) : (
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[hsl(var(--status-success))]" />
            Match Found
          </h3>
        )}
      </div>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {candidates.map((candidate) => {
          const isSelected = selectedId === candidate.parcel_id;
          
          return (
            <Card
              key={candidate.parcel_id}
              className={cn(
                "p-3 cursor-pointer transition-all duration-[180ms] hover:shadow-md hover:-translate-y-0.5 border-l-2",
                isSelected 
                  ? "border-l-[hsl(var(--feasibility-orange))] bg-[hsl(var(--feasibility-orange)/0.05)] shadow-sm" 
                  : "border-l-transparent hover:border-l-[hsl(var(--feasibility-orange)/0.5)]",
                selectedId && !isSelected && "opacity-60"
              )}
              onClick={() => onSelect(candidate)}
            >
              <div className="flex-1 min-w-0">
                {/* Address */}
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-colors duration-[180ms]",
                    isSelected ? "text-[hsl(var(--feasibility-orange))]" : "text-muted-foreground"
                  )} />
                  <p className="text-sm font-heading font-medium truncate">
                    {candidate.situs_address || 'No address on file'}
                  </p>
                </div>
                
                {/* Details Row - Acreage and Owner only */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pl-5">
                  {candidate.acreage && (
                    <span className="flex items-center gap-1 font-mono tabular-nums">
                      <Ruler className="h-3 w-3" />
                      {candidate.acreage.toFixed(2)} ac
                    </span>
                  )}
                  {candidate.owner_name && (
                    <span className="flex items-center gap-1 truncate max-w-[180px]">
                      <User className="h-3 w-3" />
                      {candidate.owner_name}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
