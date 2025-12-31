/**
 * Candidate Parcel List
 * Displays ranked parcel candidates for EXPLORATION (not commitment).
 * Uses CYAN for tentative selection - Orange appears only at decision gate.
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  MapPin, User, Ruler, CheckCircle2, AlertTriangle, Building2, X, RefreshCw,
  Scale, Waves, Zap, Leaf, Car, FileText, type LucideIcon
} from "lucide-react";
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

/** Inline SVG illustration for empty state */
const ParcelSearchIllustration = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 160 120" fill="none" className={className}>
    {/* Building silhouette */}
    <rect x="55" y="40" width="50" height="60" rx="4" className="fill-current opacity-[0.08]" />
    <rect x="60" y="30" width="40" height="70" rx="2" className="stroke-current fill-none" strokeWidth="1.5" />
    
    {/* Building windows */}
    <rect x="66" y="40" width="8" height="8" rx="1" className="fill-current opacity-20" />
    <rect x="86" y="40" width="8" height="8" rx="1" className="fill-current opacity-20" />
    <rect x="66" y="55" width="8" height="8" rx="1" className="fill-current opacity-20" />
    <rect x="86" y="55" width="8" height="8" rx="1" className="fill-current opacity-20" />
    <rect x="66" y="70" width="8" height="8" rx="1" className="fill-current opacity-20" />
    <rect x="86" y="70" width="8" height="8" rx="1" className="fill-current opacity-20" />
    
    {/* Data layer circles - floating around with animation */}
    <g className="animate-pulse">
      <circle cx="28" cy="38" r="14" className="fill-[hsl(var(--feasibility-orange)/0.1)] stroke-[hsl(var(--feasibility-orange))]" strokeWidth="1.5" />
      <text x="28" y="42" textAnchor="middle" className="fill-[hsl(var(--feasibility-orange))] text-[10px] font-medium">Z</text>
    </g>
    <g style={{ animationDelay: '0.5s' }} className="animate-pulse">
      <circle cx="132" cy="42" r="14" className="fill-current opacity-[0.05] stroke-current" strokeWidth="1.5" />
      <text x="132" y="46" textAnchor="middle" className="fill-current text-[10px] font-medium">F</text>
    </g>
    <g style={{ animationDelay: '1s' }} className="animate-pulse">
      <circle cx="24" cy="82" r="12" className="fill-current opacity-[0.05] stroke-current" strokeWidth="1.5" />
      <text x="24" y="86" textAnchor="middle" className="fill-current text-[9px] font-medium">U</text>
    </g>
    <g style={{ animationDelay: '0.75s' }} className="animate-pulse">
      <circle cx="136" cy="88" r="13" className="fill-[hsl(var(--feasibility-orange)/0.1)] stroke-[hsl(var(--feasibility-orange))]" strokeWidth="1.5" />
      <text x="136" y="92" textAnchor="middle" className="fill-[hsl(var(--feasibility-orange))] text-[9px] font-medium">T</text>
    </g>
    
    {/* Connection lines (dashed) */}
    <path d="M42 38 L55 50" className="stroke-current opacity-20" strokeWidth="1" strokeDasharray="3 3" />
    <path d="M118 42 L105 50" className="stroke-current opacity-20" strokeWidth="1" strokeDasharray="3 3" />
    <path d="M36 82 L55 85" className="stroke-current opacity-20" strokeWidth="1" strokeDasharray="3 3" />
    <path d="M123 88 L105 85" className="stroke-current opacity-20" strokeWidth="1" strokeDasharray="3 3" />
    
    {/* Map pin accent at top */}
    <circle cx="80" cy="18" r="7" className="fill-[hsl(var(--feasibility-orange))]" />
    <circle cx="80" cy="18" r="3" className="fill-white" />
    <path d="M80 25 L80 30" className="stroke-[hsl(var(--feasibility-orange))]" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** Feature item for the value grid */
const FeatureItem = ({ icon: Icon, label }: { icon: LucideIcon; label: string }) => (
  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40">
    <Icon className="h-3.5 w-3.5 text-[hsl(var(--data-cyan))] shrink-0" />
    <span className="text-foreground/80 text-[11px] leading-tight">{label}</span>
  </div>
);

/** Empty state with value proposition */
const EmptyState = () => (
  <div className="py-6 px-3 space-y-5">
    {/* Illustration */}
    <div className="flex justify-center">
      <ParcelSearchIllustration className="w-40 h-28 text-[hsl(var(--data-cyan))]" />
    </div>
    
    {/* Primary CTA */}
    <div className="text-center">
      <p className="text-sm font-medium text-foreground">
        Start Your Feasibility Analysis
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Enter a Texas property address above
      </p>
    </div>
    
    {/* How it works - horizontal steps */}
    <div className="flex justify-center items-center gap-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="w-5 h-5 rounded-full bg-[hsl(var(--data-cyan)/0.15)] flex items-center justify-center text-[10px] font-semibold text-[hsl(var(--data-cyan))]">1</span>
        <span>Search</span>
      </span>
      <span className="text-border">→</span>
      <span className="flex items-center gap-1.5">
        <span className="w-5 h-5 rounded-full bg-[hsl(var(--data-cyan)/0.15)] flex items-center justify-center text-[10px] font-semibold text-[hsl(var(--data-cyan))]">2</span>
        <span>Verify</span>
      </span>
      <span className="text-border">→</span>
      <span className="flex items-center gap-1.5">
        <span className="w-5 h-5 rounded-full bg-[hsl(var(--data-cyan)/0.15)] flex items-center justify-center text-[10px] font-semibold text-[hsl(var(--data-cyan))]">3</span>
        <span>Lock</span>
      </span>
    </div>
    
    <Separator className="my-4" />
    
    {/* What's included */}
    <div className="space-y-2.5">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">
        Your $999 report includes
      </p>
      
      <div className="grid grid-cols-2 gap-1.5">
        <FeatureItem icon={Scale} label="Zoning Analysis" />
        <FeatureItem icon={Waves} label="FEMA Flood Data" />
        <FeatureItem icon={Zap} label="Utility Infrastructure" />
        <FeatureItem icon={Leaf} label="Environmental Data" />
        <FeatureItem icon={Car} label="Traffic & Access" />
        <FeatureItem icon={FileText} label="Lender-Ready PDF" />
      </div>
    </div>
    
    {/* Trust signal */}
    <p className="text-[10px] text-center text-muted-foreground/70 leading-relaxed px-2">
      All data from verified federal and municipal sources with full citations
    </p>
  </div>
);

export function CandidateParcelList({ candidates, selectedId, onSelect, onClear, onRefresh, isRefreshing }: CandidateParcelListProps) {
  if (candidates.length === 0) {
    return <EmptyState />;
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
                  ? "border-l-[hsl(var(--data-cyan))] bg-[hsl(var(--data-cyan)/0.05)] shadow-sm ring-1 ring-[hsl(var(--data-cyan)/0.3)]" 
                  : "border-l-transparent hover:border-l-[hsl(var(--data-cyan)/0.5)] hover:bg-[hsl(var(--data-cyan)/0.03)]",
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
                    {candidate.county.toUpperCase()}
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
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1 max-w-[180px]">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate">{candidate.owner_name}</span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-[250px]">
                          {candidate.owner_name}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
