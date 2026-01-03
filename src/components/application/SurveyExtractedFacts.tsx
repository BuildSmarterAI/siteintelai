/**
 * Survey Extracted Facts
 * Displays LOCKED survey-extracted data at top of decision panel
 * These are immutable facts from the source document
 */

import { Lock, Ruler, MapPin, FileType, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { SurveyExtraction, SurveyType } from '@/types/surveyAutoMatch';

interface SurveyExtractedFactsProps {
  extraction: SurveyExtraction;
  confidence?: number;
}

const SURVEY_TYPE_LABELS: Record<SurveyType, { label: string; color: string }> = {
  LAND_TITLE_SURVEY: { label: "Land Title Survey", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  RECORDED_PLAT: { label: "Recorded Plat", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  BOUNDARY_ONLY: { label: "Boundary Survey", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  UNKNOWN: { label: "Unknown Type", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300" },
};

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const level = confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low';
  const colorClass = level === 'high' ? 'text-green-600' : level === 'medium' ? 'text-amber-600' : 'text-red-600';
  const label = level === 'high' ? 'High' : level === 'medium' ? 'Medium' : 'Low';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  level === 'high' ? 'bg-green-500' : 
                  level === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${colorClass}`}>{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>OCR extraction confidence: {Math.round(confidence * 100)}%</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function SurveyExtractedFacts({ extraction, confidence }: SurveyExtractedFactsProps) {
  const hasLegalDescription = extraction.legal_description && 
    (extraction.legal_description.lot || extraction.legal_description.subdivision);
  
  return (
    <Card className="border-[hsl(var(--exploration-cyan)/0.3)] bg-[hsl(var(--exploration-cyan-subtle))]">
      <CardContent className="p-4 space-y-3">
        {/* Header with Lock indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[hsl(var(--exploration-cyan)/0.15)] flex items-center justify-center">
              <Lock className="h-3 w-3 text-[hsl(var(--data-cyan))]" />
            </div>
            <span className="text-sm font-semibold text-foreground">Survey-Extracted Facts</span>
          </div>
          <Badge variant="outline" className="text-xs bg-[hsl(var(--exploration-cyan)/0.1)] border-[hsl(var(--exploration-cyan)/0.3)]">
            Locked
          </Badge>
        </div>
        
        {/* Survey Type Badge */}
        {extraction.survey_type && extraction.survey_type !== 'UNKNOWN' && (
          <div className="flex items-center gap-2">
            <FileType className="h-3.5 w-3.5 text-muted-foreground" />
            <Badge className={`text-xs ${SURVEY_TYPE_LABELS[extraction.survey_type].color}`}>
              {SURVEY_TYPE_LABELS[extraction.survey_type].label}
            </Badge>
          </div>
        )}
        
        {/* Extracted Data Grid */}
        <div className="space-y-2">
          {/* Acreage - Primary fact */}
          {extraction.acreage_extracted && (
            <div className="flex items-center justify-between py-1.5 border-b border-[hsl(var(--exploration-cyan)/0.15)]">
              <div className="flex items-center gap-2">
                <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Acreage</span>
              </div>
              <span className="text-sm font-semibold font-mono">
                {extraction.acreage_extracted.toFixed(3)} ac
              </span>
            </div>
          )}
          
          {/* County */}
          {extraction.county_extracted && (
            <div className="flex items-center justify-between py-1.5 border-b border-[hsl(var(--exploration-cyan)/0.15)]">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">County</span>
              </div>
              <span className="text-sm font-semibold">
                {extraction.county_extracted}
              </span>
            </div>
          )}
          
          {/* APN if extracted */}
          {extraction.apn_extracted && (
            <div className="flex items-center justify-between py-1.5 border-b border-[hsl(var(--exploration-cyan)/0.15)]">
              <span className="text-sm text-muted-foreground">APN/Account</span>
              <span className="text-sm font-mono">{extraction.apn_extracted}</span>
            </div>
          )}
          
          {/* Legal Description if available */}
          {hasLegalDescription && (
            <div className="flex items-start justify-between py-1.5 border-b border-[hsl(var(--exploration-cyan)/0.15)]">
              <span className="text-sm text-muted-foreground">Legal</span>
              <span className="text-sm text-right max-w-[180px]">
                {[
                  extraction.legal_description?.lot && `Lot ${extraction.legal_description.lot}`,
                  extraction.legal_description?.block && `Block ${extraction.legal_description.block}`,
                  extraction.legal_description?.subdivision,
                ].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>
        
        {/* Confidence Note */}
        {confidence !== undefined && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">Extraction confidence</span>
            <ConfidenceIndicator confidence={confidence} />
          </div>
        )}
        
        {/* OCR Warning if applicable */}
        {extraction.ocr_used && (
          <div className="flex items-start gap-2 pt-2 border-t border-[hsl(var(--exploration-cyan)/0.15)]">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              OCR was used to extract text from scanned images
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
