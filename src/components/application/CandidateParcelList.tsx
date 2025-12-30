/**
 * Candidate Parcel List
 * Displays ranked parcel candidates for EXPLORATION (not commitment).
 * Uses CYAN for tentative selection - Orange appears only at decision gate.
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, User, Ruler, CheckCircle2, Hash, AlertTriangle, Building2, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CandidateParcel } from "@/types/parcelSelection";

interface CandidateParcelListProps {
  candidates: CandidateParcel[];
  selectedId: string | null;
  onSelect: (candidate: CandidateParcel) => void;
  onClear?: () => void;
  onRefresh?: (parcelId: string) => void;
  isRefreshing?: boolean;
}

export function CandidateParcelList({ candidates, selectedId, onSelect, onClear, onRefresh, isRefreshing }: CandidateParcelListProps) {
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
                {/* Row 1: Address (primary) + Action buttons */}
                <div className="flex items-start gap-2">
                  <MapPin className={cn(
                    "h-3.5 w-3.5 shrink-0 mt-0.5 transition-colors duration-[180ms]",
                    isSelected ? "text-[hsl(var(--data-cyan))]" : "text-muted-foreground"
                  )} />
                  <p className="text-sm font-heading font-medium leading-tight flex-1">
                    {candidate.situs_address || 'No address on file'}
                  </p>
                  {/* Action icons for selected parcel */}
                  {isSelected && (onRefresh || onClear) && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {onRefresh && (
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRefresh(candidate.parcel_id);
                                }}
                                disabled={isRefreshing}
                                className={cn(
                                  "h-6 w-6 rounded flex items-center justify-center",
                                  "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                  "transition-colors duration-150",
                                  isRefreshing && "opacity-50 cursor-not-allowed"
                                )}
                                aria-label="Refresh property data"
                              >
                                <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              Refresh data
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {onClear && (
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClear();
                                }}
                                className={cn(
                                  "h-6 w-6 rounded flex items-center justify-center",
                                  "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                                  "transition-colors duration-150"
                                )}
                                aria-label="Clear selection"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              Clear selection
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Row 2: Parcel ID with CAD prefix + County badge */}
                <div className="flex items-center gap-2 pl-5">
                  <span className="flex items-center gap-1 text-xs font-mono tabular-nums text-muted-foreground">
                    <span className="text-[10px] font-normal not-italic">
                      {(() => {
                        const prefixes: Record<string, string> = {
                          harris: 'HCAD',
                          'fort bend': 'FBCAD',
                          montgomery: 'MCAD',
                        };
                        return prefixes[candidate.county?.toLowerCase()] || '#';
                      })()}
                    </span>
                    {candidate.parcel_id}
                  </span>
                  <Badge 
                    variant="outline" 
                    className="text-[10px] px-1.5 py-0 h-4 bg-[hsl(var(--data-cyan)/0.1)] border-[hsl(var(--data-cyan)/0.3)] text-[hsl(var(--data-cyan))] font-medium"
                  >
                    {candidate.county.charAt(0).toUpperCase() + candidate.county.slice(1).toLowerCase()}
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
                    <span className="flex items-center gap-1 max-w-[200px]" title={candidate.owner_name}>
                      <User className="h-3 w-3 shrink-0" />
                      <span className="line-clamp-2 leading-tight">{candidate.owner_name}</span>
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
