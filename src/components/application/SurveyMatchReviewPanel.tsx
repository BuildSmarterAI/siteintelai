/**
 * Survey Match Review Panel
 * Displayed when auto-match confidence is below threshold
 * Allows user to select from top candidates or use manual search
 */

import { CheckCircle2, MapPin, User, Ruler, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SurveyMatchCandidate, MatchReasonCode } from '@/types/surveyAutoMatch';

interface SurveyMatchReviewPanelProps {
  candidates: SurveyMatchCandidate[];
  onSelectParcel: (candidate: SurveyMatchCandidate) => void;
  onUseManualSearch: () => void;
  isSelecting?: boolean;
  hasCounty?: boolean;
}

const REASON_CODE_CONFIG: Record<MatchReasonCode, { label: string; variant: "default" | "secondary" | "outline"; priority: number }> = {
  APN_MATCH: { label: "APN Match", variant: "default", priority: 1 },
  ADDRESS_MATCH: { label: "Address Match", variant: "default", priority: 2 },
  LEGAL_DESC_MATCH: { label: "Legal Description", variant: "secondary", priority: 3 },
  OWNER_MATCH: { label: "Owner Match", variant: "secondary", priority: 4 },
  AREA_MATCH: { label: "Area Match", variant: "outline", priority: 5 },
  COUNTY_MATCH: { label: "County", variant: "outline", priority: 6 },
  // Legacy codes
  APN: { label: "APN Match", variant: "default", priority: 1 },
  ADDRESS: { label: "Address", variant: "secondary", priority: 2 },
  SHAPE: { label: "Shape", variant: "outline", priority: 3 },
  COUNTY: { label: "County", variant: "outline", priority: 6 },
  AREA_SIMILAR: { label: "Similar Area", variant: "outline", priority: 5 },
};

function ConfidenceBar({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  const colorClass = confidence >= 0.8 ? "bg-green-500" : confidence >= 0.6 ? "bg-amber-500" : "bg-red-500";
  
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

function CandidateCard({ 
  candidate, 
  onSelect, 
  isSelecting,
  rank,
}: { 
  candidate: SurveyMatchCandidate; 
  onSelect: () => void;
  isSelecting: boolean;
  rank: number;
}) {
  // Sort reason codes by priority
  const sortedReasonCodes = [...candidate.reason_codes].sort((a, b) => {
    const priorityA = REASON_CODE_CONFIG[a as MatchReasonCode]?.priority || 99;
    const priorityB = REASON_CODE_CONFIG[b as MatchReasonCode]?.priority || 99;
    return priorityA - priorityB;
  });

  return (
    <Card className={`hover:border-primary/50 transition-colors ${rank === 1 ? 'border-primary/30 bg-primary/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Address */}
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {candidate.situs_address || "Address not available"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {candidate.county} County • {candidate.source_parcel_id}
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
                  <span>{candidate.acreage.toFixed(2)} ac</span>
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

          {/* Confidence & Select */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <ConfidenceBar confidence={candidate.confidence} />
            <Button 
              size="sm" 
              onClick={onSelect}
              disabled={isSelecting}
              className="gap-1"
              variant={rank === 1 ? "default" : "outline"}
            >
              <CheckCircle2 className="h-3 w-3" />
              Select
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SurveyMatchReviewPanel({
  candidates,
  onSelectParcel,
  onUseManualSearch,
  isSelecting = false,
  hasCounty = true,
}: SurveyMatchReviewPanelProps) {
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Select Matching Parcel</span>
          <Badge variant="secondary" className="font-normal">
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          We found potential matches for your survey. Please review and select the correct parcel.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2 pr-2">
            {candidates.map((candidate, index) => (
              <CandidateCard
                key={candidate.parcel_id}
                candidate={candidate}
                onSelect={() => onSelectParcel(candidate)}
                isSelecting={isSelecting}
                rank={index + 1}
              />
            ))}
          </div>
        </ScrollArea>

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
      </CardContent>
    </Card>
  );
}
