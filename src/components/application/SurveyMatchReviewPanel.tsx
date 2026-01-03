/**
 * Survey Match Review Panel
 * Decision-logic ordered panel for parcel selection
 * Displays recommended parcel prominently, other matches collapsed
 */

import { useState } from 'react';
import { CheckCircle2, MapPin, User, Ruler, ChevronRight, ChevronDown, Search, AlertCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { SurveyMatchCandidate, MatchReasonCode, SurveyExtraction } from '@/types/surveyAutoMatch';

interface SurveyMatchReviewPanelProps {
  candidates: SurveyMatchCandidate[];
  onSelectParcel: (candidate: SurveyMatchCandidate) => void;
  onUseManualSearch: () => void;
  isSelecting?: boolean;
  hasCounty?: boolean;
  extraction?: SurveyExtraction | null;
}

const REASON_CODE_CONFIG: Record<MatchReasonCode, { label: string; variant: "default" | "secondary" | "outline"; priority: number }> = {
  APN_MATCH: { label: "APN Match", variant: "default", priority: 1 },
  ADDRESS_MATCH: { label: "Address Match", variant: "default", priority: 2 },
  LEGAL_DESC_MATCH: { label: "Legal Description", variant: "secondary", priority: 3 },
  OWNER_MATCH: { label: "Owner Match", variant: "secondary", priority: 4 },
  AREA_MATCH: { label: "Area Match", variant: "outline", priority: 5 },
  COUNTY_MATCH: { label: "County", variant: "outline", priority: 6 },
  // New Survey-First codes
  GEOMETRY_OVERLAP: { label: "Geometry Overlap", variant: "default", priority: 1 },
  ACREAGE_FINGERPRINT: { label: "Acreage Match", variant: "secondary", priority: 3 },
  ROW_RATIO_MATCH: { label: "ROW Ratio", variant: "outline", priority: 5 },
  ROAD_FRONTAGE_MATCH: { label: "Road Frontage", variant: "outline", priority: 5 },
  MULTI_PARCEL_ASSEMBLY: { label: "Multi-Parcel", variant: "secondary", priority: 4 },
  LIVE_QUERY: { label: "Live Query", variant: "outline", priority: 7 },
  // Legacy codes
  APN: { label: "APN Match", variant: "default", priority: 1 },
  ADDRESS: { label: "Address", variant: "secondary", priority: 2 },
  SHAPE: { label: "Shape", variant: "outline", priority: 3 },
  COUNTY: { label: "County", variant: "outline", priority: 6 },
  AREA_SIMILAR: { label: "Similar Area", variant: "outline", priority: 5 },
};

function ConfidenceTierBadge({ tier, score }: { tier?: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'; score: number }) {
  const displayTier = tier || (score >= 0.85 ? 'HIGH' : score >= 0.65 ? 'MEDIUM' : 'LOW');
  const tierConfig = {
    HIGH: { label: 'HIGH', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300' },
    MEDIUM: { label: 'MEDIUM', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300' },
    LOW: { label: 'LOW', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300' },
    NONE: { label: 'N/A', className: 'bg-muted text-muted-foreground border-border' },
  };
  const config = tierConfig[displayTier];
  
  return (
    <Badge variant="outline" className={`text-xs font-semibold ${config.className}`}>
      {config.label}
    </Badge>
  );
}

function ConfidenceBar({ confidence, tier }: { confidence: number; tier?: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' }) {
  const percentage = Math.round(confidence * 100);
  const effectiveTier = tier === 'NONE' ? undefined : tier;
  const colorClass = effectiveTier === 'HIGH' || confidence >= 0.85 ? "bg-green-500" 
    : effectiveTier === 'MEDIUM' || confidence >= 0.65 ? "bg-amber-500" 
    : "bg-red-500";
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`absolute inset-y-0 left-0 ${colorClass} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground">{percentage}%</span>
    </div>
  );
}

function AddressDisplay({ address }: { address: string | null }) {
  if (address) {
    return <span className="font-medium">{address}</span>;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
            Address unavailable – boundary only
            <AlertCircle className="h-3 w-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[220px]">
          <p className="text-xs">
            Some counties do not provide situs addresses. This increases verification risk.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function WhyThisParcel({ candidate, extraction }: { candidate: SurveyMatchCandidate; extraction?: SurveyExtraction | null }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Use V2 delta if available, otherwise calculate
  const acreageDelta = candidate.gross_acre_delta 
    ?? (extraction?.acreage_extracted && candidate.acreage
      ? Math.abs(extraction.acreage_extracted - candidate.acreage)
      : null);
  
  const overlapPct = candidate.overlap_pct;
  const score = candidate.match_score || candidate.confidence;
  const tier = candidate.confidence_tier;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="text-xs text-muted-foreground underline hover:text-foreground flex items-center gap-1">
        <HelpCircle className="h-3 w-3" />
        Why we chose this parcel
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="text-xs space-y-1 bg-muted/50 p-2.5 rounded-md border border-border/50">
          {overlapPct !== undefined && (
            <p>• Geometry overlap: <span className="font-mono font-semibold">{(overlapPct * 100).toFixed(1)}%</span></p>
          )}
          {acreageDelta !== null && (
            <p>• Acreage delta: <span className="font-mono">±{acreageDelta.toFixed(3)} ac</span> from survey</p>
          )}
          <p>• County: Matched ({candidate.county})</p>
          <p>• Match signals: {candidate.reason_codes.length} criteria met</p>
          <p>• Composite score: <span className="font-semibold">{Math.round(score * 100)}%</span> 
            {tier && <span className="ml-1">({tier})</span>}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function RecommendedParcelCard({ 
  candidate, 
  onSelect, 
  isSelecting,
  extraction,
}: { 
  candidate: SurveyMatchCandidate; 
  onSelect: () => void;
  isSelecting: boolean;
  extraction?: SurveyExtraction | null;
}) {
  const sortedReasonCodes = [...candidate.reason_codes].sort((a, b) => {
    const priorityA = REASON_CODE_CONFIG[a as MatchReasonCode]?.priority || 99;
    const priorityB = REASON_CODE_CONFIG[b as MatchReasonCode]?.priority || 99;
    return priorityA - priorityB;
  });
  
  const hasAddressWarning = !candidate.situs_address;

  return (
    <Card className={`border-2 border-[hsl(var(--feasibility-orange)/0.4)] bg-[hsl(var(--commitment-orange-subtle))] shadow-md ${hasAddressWarning ? 'ring-1 ring-amber-300 dark:ring-amber-700' : ''}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Address */}
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-[hsl(var(--feasibility-orange))] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm truncate">
                  <AddressDisplay address={candidate.situs_address} />
                </p>
                <p className="text-xs text-muted-foreground">
                  {candidate.county} County • #{candidate.source_parcel_id}
                </p>
              </div>
            </div>
            
            {/* Owner & Acreage */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {candidate.owner_name && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span className="truncate max-w-[150px]">{candidate.owner_name}</span>
                </div>
              )}
              {candidate.acreage && (
                <div className="flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  <span className="font-mono">{candidate.acreage.toFixed(2)} ac</span>
                </div>
              )}
            </div>

            {/* Reason Chips */}
            <div className="flex flex-wrap gap-1">
              {sortedReasonCodes.map((code) => {
                const config = REASON_CODE_CONFIG[code as MatchReasonCode] || { label: code, variant: "outline" as const };
                return (
                  <Badge key={code} variant={config.variant} className="text-xs">
                    {config.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Confidence Tier + Bar */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <ConfidenceTierBadge tier={candidate.confidence_tier} score={candidate.match_score || candidate.confidence} />
            <ConfidenceBar confidence={candidate.match_score || candidate.confidence} tier={candidate.confidence_tier} />
          </div>
        </div>
        
        {/* Why This Parcel */}
        <WhyThisParcel candidate={candidate} extraction={extraction} />
        
        {/* Select Button - Prominent */}
        <Button 
          onClick={onSelect}
          disabled={isSelecting}
          className="w-full bg-[hsl(var(--feasibility-orange))] hover:bg-[hsl(var(--feasibility-orange)/0.9)] text-white font-semibold gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Select This Parcel
        </Button>
      </CardContent>
    </Card>
  );
}

function CompactCandidateCard({ 
  candidate, 
  onSelect, 
  isSelecting,
}: { 
  candidate: SurveyMatchCandidate; 
  onSelect: () => void;
  isSelecting: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:border-primary/30 bg-background transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">
          <AddressDisplay address={candidate.situs_address} />
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>#{candidate.source_parcel_id}</span>
          {candidate.acreage && <span>• {candidate.acreage.toFixed(2)} ac</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ConfidenceTierBadge tier={candidate.confidence_tier} score={candidate.match_score || candidate.confidence} />
        <ConfidenceBar confidence={candidate.match_score || candidate.confidence} tier={candidate.confidence_tier} />
        <Button 
          size="sm" 
          variant="outline"
          onClick={onSelect}
          disabled={isSelecting}
        >
          Select
        </Button>
      </div>
    </div>
  );
}

export function SurveyMatchReviewPanel({
  candidates,
  onSelectParcel,
  onUseManualSearch,
  isSelecting = false,
  hasCounty = true,
  extraction,
}: SurveyMatchReviewPanelProps) {
  const [othersOpen, setOthersOpen] = useState(false);
  
  if (candidates.length === 0) {
    return (
      <Card className="border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10">
        <CardContent className="py-6 text-center space-y-4">
          <div className="flex justify-center">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium mb-1">
              {hasCounty 
                ? "No matching parcels found in the extracted area"
                : "Unable to determine survey location"
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {hasCounty 
                ? "The survey data didn't match any parcels in our database. Please search manually."
                : "Please specify the county and use manual search to find the parcel."
              }
            </p>
          </div>
          <Button variant="outline" onClick={onUseManualSearch}>
            <ChevronRight className="h-4 w-4 mr-2" />
            Use Manual Parcel Search
          </Button>
        </CardContent>
      </Card>
    );
  }

  const [recommendedParcel, ...otherCandidates] = candidates;

  return (
    <div className="space-y-4">
      {/* Recommended Parcel Section */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          Based on your survey, we recommend this parcel:
        </p>
        <RecommendedParcelCard
          candidate={recommendedParcel}
          onSelect={() => onSelectParcel(recommendedParcel)}
          isSelecting={isSelecting}
          extraction={extraction}
        />
      </div>

      {/* Other Candidates - Collapsed by Default */}
      {otherCandidates.length > 0 && (
        <Collapsible open={othersOpen} onOpenChange={setOthersOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
            <span className="text-sm text-muted-foreground">
              Other Possible Matches ({otherCandidates.length})
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${othersOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2 pr-2">
                {otherCandidates.map((candidate) => (
                  <CompactCandidateCard
                    key={candidate.parcel_id}
                    candidate={candidate}
                    onSelect={() => onSelectParcel(candidate)}
                    isSelecting={isSelecting}
                  />
                ))}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Manual Search Option */}
      <div className="border-t pt-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onUseManualSearch}
          className="w-full text-muted-foreground"
        >
          <ChevronRight className="h-4 w-4 mr-2" />
          Use manual parcel search instead
        </Button>
      </div>
    </div>
  );
}
