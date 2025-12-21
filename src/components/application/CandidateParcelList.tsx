/**
 * Candidate Parcel List
 * Displays ranked parcel candidates with source badges and confidence.
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, User, Ruler, CheckCircle } from "lucide-react";
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
        <p className="text-sm">Search for a property to see candidates</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">
          {candidates.length} Parcel{candidates.length > 1 ? 's' : ''} Found
        </h3>
        {candidates.length > 1 && (
          <Badge variant="outline" className="text-xs">Select one to verify</Badge>
        )}
      </div>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {candidates.map((candidate) => (
          <Card
            key={candidate.parcel_id}
            className={cn(
              "p-3 cursor-pointer transition-all hover:border-primary/50",
              selectedId === candidate.parcel_id && "border-primary bg-primary/5 ring-1 ring-primary"
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
              
              {/* Badges */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <SourceBadge source={candidate.source} />
                <ConfidenceBadge confidence={candidate.confidence} />
              </div>
            </div>
            
            {selectedId === candidate.parcel_id && (
              <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1 text-xs text-primary">
                <CheckCircle className="h-3 w-3" />
                Selected - verify below
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: 'canonical' | 'external' | 'mixed' }) {
  const config = {
    canonical: { label: 'Canonical', variant: 'default' as const, className: 'bg-green-500/10 text-green-600 border-green-500/20' },
    external: { label: 'External', variant: 'outline' as const, className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    mixed: { label: 'Mixed', variant: 'outline' as const, className: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  };
  const c = config[source];
  return <Badge variant={c.variant} className={cn("text-[10px] px-1.5", c.className)}>{c.label}</Badge>;
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { label: 'High', className: 'bg-green-500/10 text-green-600' },
    medium: { label: 'Med', className: 'bg-yellow-500/10 text-yellow-600' },
    low: { label: 'Low', className: 'bg-red-500/10 text-red-600' },
  };
  const c = config[confidence];
  return <Badge variant="outline" className={cn("text-[10px] px-1.5", c.className)}>{c.label}</Badge>;
}
