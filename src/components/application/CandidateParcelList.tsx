/**
 * Candidate Parcel List
 * Displays ranked parcel candidates as selectable decision cards.
 * Selection is the decision - no confidence badges shown.
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
                "p-3 cursor-pointer transition-all hover:border-primary/50",
                isSelected && "border-primary bg-primary/5 ring-1 ring-primary"
              )}
              onClick={() => onSelect(candidate)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Address */}
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <p className="text-sm font-medium truncate">
                      {candidate.situs_address || 'No address on file'}
                    </p>
                  </div>
                  
                  {/* Details Row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{candidate.parcel_id}</span>
                    {candidate.acreage && (
                      <span className="flex items-center gap-1">
                        <Ruler className="h-3 w-3" />
                        {candidate.acreage.toFixed(2)} ac
                      </span>
                    )}
                    {candidate.owner_name && (
                      <span className="flex items-center gap-1 truncate max-w-[120px]">
                        <User className="h-3 w-3" />
                        {candidate.owner_name}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Source Badge - simplified */}
                <div className="shrink-0">
                  <SourceBadge source={candidate.source} />
                </div>
              </div>
              
              {isSelected && (
                <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1 text-xs text-primary font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Selected
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: 'canonical' | 'external' | 'mixed' }) {
  const config = {
    canonical: { label: 'Verified', className: 'bg-[hsl(var(--status-success)/0.1)] text-[hsl(var(--status-success))] border-[hsl(var(--status-success)/0.2)]' },
    external: { label: 'External', className: 'bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.2)]' },
    mixed: { label: 'Mixed', className: 'bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.2)]' },
  };
  const c = config[source];
  return <Badge variant="outline" className={cn("text-[10px] px-1.5", c.className)}>{c.label}</Badge>;
}
