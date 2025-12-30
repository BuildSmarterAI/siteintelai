/**
 * Candidate Parcel List
 * Displays ranked parcel candidates for EXPLORATION (not commitment).
 * Uses CYAN for tentative selection - Orange appears only at decision gate.
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Ruler, CheckCircle2, Hash, AlertTriangle, Building2 } from "lucide-react";
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
      <div className="text-center py-10 px-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[hsl(var(--data-cyan)/0.1)] mb-3">
          <MapPin className="h-6 w-6 text-[hsl(var(--data-cyan))]" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">Enter a Texas property address above</p>
        <p className="text-xs text-muted-foreground">
          e.g., 1616 Post Oak Blvd, Houston TX
        </p>
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
              {candidates.length} parcels found
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select the correct parcel to continue
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
          const hasGeometry = !!candidate.geom;
          const isLowConfidence = candidate.confidence === 'low';
          
          return (
            <Card
              key={candidate.parcel_id}
              className={cn(
                "p-3 cursor-pointer transition-all duration-[180ms] hover:shadow-md border-l-2",
                // CYAN for tentative selection (exploration) - NOT orange
                isSelected 
                  ? "border-l-[hsl(var(--data-cyan))] bg-[hsl(var(--exploration-cyan-subtle))] shadow-sm ring-1 ring-[hsl(var(--data-cyan)/0.3)]" 
                  : "border-l-transparent hover:border-l-[hsl(var(--data-cyan)/0.5)] hover:bg-[hsl(var(--exploration-cyan-hover))]",
                selectedId && !isSelected && "opacity-60",
                !hasGeometry && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => hasGeometry && onSelect(candidate)}
            >
              <div className="flex-1 min-w-0 space-y-2">
                {/* Row 1: Address (primary) */}
                <div className="flex items-start gap-2">
                  <MapPin className={cn(
                    "h-3.5 w-3.5 shrink-0 mt-0.5 transition-colors duration-[180ms]",
                    isSelected ? "text-[hsl(var(--data-cyan))]" : "text-muted-foreground"
                  )} />
                  <p className="text-sm font-heading font-medium leading-tight">
                    {candidate.situs_address || 'No address on file'}
                  </p>
                </div>
                
                {/* Row 2: Parcel ID (mono) + County badge */}
                <div className="flex items-center gap-2 pl-5">
                  <span className="flex items-center gap-1 text-xs font-mono tabular-nums text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    {candidate.parcel_id}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    {candidate.county}
                  </Badge>
                </div>
                
                {/* Row 3: Acreage + Owner + Zoning */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pl-5">
                  {candidate.acreage && (
                    <span className="flex items-center gap-1 font-mono tabular-nums">
                      <Ruler className="h-3 w-3" />
                      {candidate.acreage.toFixed(2)} ac
                    </span>
                  )}
                  {candidate.owner_name && (
                    <span className="flex items-center gap-1 truncate max-w-[140px]">
                      <User className="h-3 w-3" />
                      {candidate.owner_name}
                    </span>
                  )}
                  {candidate.zoning && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {candidate.zoning}
                    </span>
                  )}
                </div>

                {/* Flags row */}
                {(isLowConfidence || !hasGeometry) && (
                  <div className="flex items-center gap-2 pl-5 pt-1">
                    {isLowConfidence && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-[hsl(var(--status-warning)/0.1)] border-[hsl(var(--status-warning)/0.3)] text-[hsl(var(--status-warning))]">
                        <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                        Low confidence
                      </Badge>
                    )}
                    {!hasGeometry && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-[hsl(var(--status-error)/0.1)] border-[hsl(var(--status-error)/0.3)] text-[hsl(var(--status-error))]">
                        No boundary data
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
