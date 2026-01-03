/**
 * Survey Auto-Match Status Panel
 * Shows the current status of automatic parcel matching
 */

import { Loader2, CheckCircle2, AlertCircle, Search, FileText, MapPin, User, Ruler, FileType } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { SurveyMatchStatus, SurveyMatchCandidate, MatchReasonCode, SurveyExtraction, SurveyType } from '@/types/surveyAutoMatch';

interface SurveyAutoMatchStatusProps {
  status: SurveyMatchStatus;
  confidence?: number;
  selectedParcel?: SurveyMatchCandidate | null;
  extraction?: SurveyExtraction | null;
}

const STATUS_CONFIG: Record<SurveyMatchStatus, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  color: string;
}> = {
  pending: {
    icon: FileText,
    label: "Pending",
    description: "Waiting to process...",
    color: "text-muted-foreground",
  },
  analyzing: {
    icon: Loader2,
    label: "Analyzing",
    description: "Extracting survey data...",
    color: "text-blue-500",
  },
  matching: {
    icon: Search,
    label: "Matching",
    description: "Finding matching parcels...",
    color: "text-blue-500",
  },
  matched: {
    icon: CheckCircle2,
    label: "Match Found",
    description: "Parcel automatically selected",
    color: "text-green-500",
  },
  needs_review: {
    icon: AlertCircle,
    label: "Needs Review",
    description: "Please select the correct parcel below",
    color: "text-amber-500",
  },
  no_match: {
    icon: AlertCircle,
    label: "No Match Found",
    description: "Continue with manual parcel search",
    color: "text-muted-foreground",
  },
  error: {
    icon: AlertCircle,
    label: "Error",
    description: "Something went wrong. Try again or use manual search.",
    color: "text-destructive",
  },
};

const REASON_CODE_LABELS: Record<MatchReasonCode, string> = {
  APN_MATCH: "APN Match",
  ADDRESS_MATCH: "Address Match",
  OWNER_MATCH: "Owner Match",
  LEGAL_DESC_MATCH: "Legal Description",
  AREA_MATCH: "Area Match",
  COUNTY_MATCH: "County Match",
  // Legacy codes
  APN: "APN Match",
  ADDRESS: "Address Match",
  SHAPE: "Shape Match",
  COUNTY: "County Match",
  AREA_SIMILAR: "Similar Area",
};

const SURVEY_TYPE_LABELS: Record<SurveyType, { label: string; color: string }> = {
  LAND_TITLE_SURVEY: { label: "Land Title Survey", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  RECORDED_PLAT: { label: "Recorded Plat", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  BOUNDARY_ONLY: { label: "Boundary Survey", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  UNKNOWN: { label: "Unknown Type", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300" },
};

function SelectedParcelSummary({ parcel, confidence }: { parcel: SurveyMatchCandidate; confidence?: number }) {
  return (
    <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <MapPin className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {parcel.situs_address || "Address not available"}
            </p>
            <p className="text-xs text-muted-foreground">
              {parcel.county} County • {parcel.source_parcel_id}
            </p>
          </div>
        </div>
        {confidence !== undefined && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Progress 
              value={Math.round(confidence * 100)} 
              className="h-2 w-12 bg-green-200 dark:bg-green-900"
            />
            <span className="text-xs font-medium text-green-600">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        )}
      </div>
      
      {/* Owner & Acreage */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {parcel.owner_name && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{parcel.owner_name}</span>
          </div>
        )}
        {parcel.acreage && (
          <div className="flex items-center gap-1">
            <Ruler className="h-3 w-3" />
            <span>{parcel.acreage.toFixed(2)} ac</span>
          </div>
        )}
      </div>

      {/* Match Reasons */}
      <div className="flex flex-wrap gap-1">
        {parcel.reason_codes.map((code) => (
          <Badge key={code} variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/50">
            {REASON_CODE_LABELS[code as MatchReasonCode] || code}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function SurveyAutoMatchStatus({
  status,
  confidence,
  selectedParcel,
  extraction,
}: SurveyAutoMatchStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const isLoading = status === "analyzing" || status === "matching";

  return (
    <Card className={`border-l-4 ${
      status === "matched" ? "border-l-green-500" : 
      status === "needs_review" ? "border-l-amber-500" : 
      status === "error" ? "border-l-destructive" :
      "border-l-muted"
    }`}>
      <CardContent className="py-3 space-y-3">
        {/* Status Header */}
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.color} ${isLoading ? "animate-spin" : ""}`} />
          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
          
          {/* Survey Type Badge */}
          {extraction?.survey_type && extraction.survey_type !== "UNKNOWN" && (
            <Badge variant="outline" className={`text-xs ml-1 ${SURVEY_TYPE_LABELS[extraction.survey_type].color}`}>
              <FileType className="h-3 w-3 mr-1" />
              {SURVEY_TYPE_LABELS[extraction.survey_type].label}
            </Badge>
          )}
          
          {confidence !== undefined && confidence > 0 && status !== "matched" && (
            <Badge variant="outline" className="ml-auto text-xs">
              {Math.round(confidence * 100)}% confidence
            </Badge>
          )}
        </div>

        {/* Status Description */}
        <p className="text-xs text-muted-foreground">{config.description}</p>

        {/* Extraction Info (for debugging/transparency) */}
        {extraction && status !== "matched" && (
          <div className="text-xs space-y-1 bg-muted/50 rounded p-2">
            <p className="font-medium text-muted-foreground">Extracted from survey:</p>
            {extraction.apn_extracted && (
              <p>• APN: <span className="font-mono">{extraction.apn_extracted}</span></p>
            )}
            {extraction.address_extracted && (
              <p>• Address: {extraction.address_extracted}</p>
            )}
            {extraction.owner_extracted && (
              <p>• Owner: {extraction.owner_extracted}</p>
            )}
            {extraction.acreage_extracted && (
              <p>• Acreage: {extraction.acreage_extracted.toFixed(2)} ac</p>
            )}
            {extraction.legal_description && (extraction.legal_description.lot || extraction.legal_description.subdivision) && (
              <p>• Legal: {[
                extraction.legal_description.lot && `Lot ${extraction.legal_description.lot}`,
                extraction.legal_description.block && `Block ${extraction.legal_description.block}`,
                extraction.legal_description.subdivision,
              ].filter(Boolean).join(', ')}</p>
            )}
            {extraction.county_extracted && (
              <p>• County: {extraction.county_extracted}</p>
            )}
            {extraction.ocr_used && (
              <p className="text-muted-foreground italic">• OCR was used for text extraction</p>
            )}
          </div>
        )}

        {/* Selected Parcel Summary */}
        {status === "matched" && selectedParcel && (
          <SelectedParcelSummary parcel={selectedParcel} confidence={confidence} />
        )}
      </CardContent>
    </Card>
  );
}
