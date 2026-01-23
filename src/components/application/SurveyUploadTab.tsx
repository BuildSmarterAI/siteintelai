/**
 * Survey Upload Tab for Parcel Selection
 * Zero-click automatic parcel matching pipeline
 * 
 * Key constraints:
 * - Survey is NOT authoritative parcel selection
 * - User must still select parcel from CAD layer
 * - Mandatory disclaimers about survey limitations
 */

import { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, X, AlertTriangle, Loader2, Eye, Trash2, ChevronRight } from 'lucide-react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SurveyAutoMatchStatus } from './SurveyAutoMatchStatus';
import { SurveyMatchReviewPanel } from './SurveyMatchReviewPanel';
import { 
  uploadSurvey, 
  getSurveyUrl, 
  deleteSurvey,
  type SurveyUploadMetadata 
} from '@/services/surveyUploadApi';
import { 
  triggerAutoMatch, 
  selectMatchedParcel,
  getMatchStatus 
} from '@/services/surveyAutoMatchApi';
import { renderPdfFirstPage, isPdfFile } from '@/utils/pdfRenderer';
import type { SurveyMatchStatus as MatchStatus, SurveyMatchCandidate, SurveyExtraction } from '@/types/surveyAutoMatch';

interface SurveyUploadTabProps {
  onSurveyUploaded?: (survey: SurveyUploadMetadata) => void;
  onSurveyDeleted?: (surveyId: string) => void;
  onParcelSelected?: (parcel: SurveyMatchCandidate) => void;
  onUseManualSearch?: () => void;
  draftId?: string;
  uploadedSurvey?: SurveyUploadMetadata | null;
}

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.tiff,.tif';
const MAX_SIZE_MB = 50;

export function SurveyUploadTab({ 
  onSurveyUploaded,
  onSurveyDeleted,
  onParcelSelected,
  onUseManualSearch,
  draftId,
  uploadedSurvey: externalUploadedSurvey,
}: SurveyUploadTabProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [internalUploadedSurvey, setInternalUploadedSurvey] = useState<SurveyUploadMetadata | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyCounty, setSurveyCounty] = useState('');
  
  // Auto-match state
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('pending');
  const [matchConfidence, setMatchConfidence] = useState<number>(0);
  const [matchCandidates, setMatchCandidates] = useState<SurveyMatchCandidate[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<SurveyMatchCandidate | null>(null);
  const [extraction, setExtraction] = useState<SurveyExtraction | null>(null);
  const [isSelectingParcel, setIsSelectingParcel] = useState(false);

  // Use external state if provided, otherwise use internal
  const uploadedSurvey = externalUploadedSurvey ?? internalUploadedSurvey;

  // Poll for match status updates
  useEffect(() => {
    if (!uploadedSurvey || matchStatus === 'matched' || matchStatus === 'no_match' || matchStatus === 'error') {
      return;
    }

    const pollInterval = setInterval(async () => {
      const result = await getMatchStatus(uploadedSurvey.id);
      if (result.success && result.status) {
        setMatchStatus(result.status);
        setMatchConfidence(result.confidence || 0);
        if (result.candidates) setMatchCandidates(result.candidates);
        
        // Stop polling when complete
        if (result.status === 'matched' || result.status === 'no_match' || result.status === 'error' || result.status === 'needs_review') {
          clearInterval(pollInterval);
        }
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [uploadedSurvey, matchStatus]);

  const handleFile = useCallback(async (file: File) => {
    // Validate file size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      logger.warn('[SurveyUploadTab] File too large');
      return;
    }

    setIsUploading(true);
    setMatchStatus('pending');
    
    const result = await uploadSurvey(file, {
      title: surveyTitle || undefined,
      county: surveyCounty || undefined,
      draftId,
    });

    if (result.success && result.survey) {
      setInternalUploadedSurvey(result.survey);
      logger.debug('[SurveyUploadTab]', 'Survey uploaded');
      onSurveyUploaded?.(result.survey);

      // Trigger auto-match with optional client-side OCR image
      setMatchStatus('analyzing');
      
      // If PDF, render first page for OCR
      let ocrImageBase64: string | undefined;
      if (isPdfFile(file)) {
        try {
          logger.debug('[SurveyUploadTab]', 'Rendering PDF first page for OCR...');
          ocrImageBase64 = await renderPdfFirstPage(file);
          logger.debug('[SurveyUploadTab]', 'PDF rendered, image length:', ocrImageBase64?.length);
        } catch (renderError) {
          logger.warn('[SurveyUploadTab] PDF render failed, proceeding without OCR image:', renderError);
        }
      }
      
      const matchResult = await triggerAutoMatch(result.survey.id, ocrImageBase64);
      
      setIsUploading(false);
      
      if (matchResult.success) {
        setMatchConfidence(matchResult.confidence);
        setMatchCandidates(matchResult.candidates);
        setExtraction(matchResult.extraction);
        
        if (matchResult.status === 'AUTO_SELECTED' && matchResult.candidates[0]) {
          setMatchStatus('matched');
          setSelectedParcel(matchResult.candidates[0]);
          logger.debug('[SurveyUploadTab]', 'Auto-matched');
          onParcelSelected?.(matchResult.candidates[0]);
        } else if (matchResult.status === 'NEEDS_REVIEW') {
          setMatchStatus('needs_review');
          logger.debug('[SurveyUploadTab]', 'Needs review');
        } else {
          setMatchStatus('no_match');
          logger.debug('[SurveyUploadTab]', 'No match');
        }
      } else {
        setMatchStatus('error');
        logger.error('[SurveyUploadTab] Match error:', matchResult.error);
      }
    } else {
      setIsUploading(false);
      logger.error('[SurveyUploadTab] Upload failed:', result.error);
    }
  }, [surveyTitle, surveyCounty, draftId, onSurveyUploaded, onParcelSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleViewSurvey = useCallback(async () => {
    if (!uploadedSurvey) return;
    
    const url = await getSurveyUrl(uploadedSurvey.storage_path);
    if (url) {
      window.open(url, '_blank');
    } else {
      logger.error('[SurveyUploadTab] Failed to load survey preview');
    }
  }, [uploadedSurvey]);

  const handleDeleteSurvey = useCallback(async () => {
    if (!uploadedSurvey) return;
    
    const success = await deleteSurvey(uploadedSurvey.id);
    if (success) {
      onSurveyDeleted?.(uploadedSurvey.id);
      setInternalUploadedSurvey(null);
      setMatchStatus('pending');
      setMatchCandidates([]);
      setSelectedParcel(null);
      logger.debug('[SurveyUploadTab]', 'Survey deleted');
    } else {
      logger.error('[SurveyUploadTab] Failed to delete survey');
    }
  }, [uploadedSurvey, onSurveyDeleted]);

  const handleSelectCandidate = useCallback(async (candidate: SurveyMatchCandidate) => {
    if (!uploadedSurvey) return;
    
    setIsSelectingParcel(true);
    const result = await selectMatchedParcel(uploadedSurvey.id, candidate.parcel_id);
    setIsSelectingParcel(false);
    
    if (result.success) {
      setMatchStatus('matched');
      setSelectedParcel(candidate);
      logger.debug('[SurveyUploadTab]', 'Parcel selected');
      onParcelSelected?.(candidate);
    } else {
      logger.error('[SurveyUploadTab] Failed to select parcel:', result.error);
    }
  }, [uploadedSurvey, onParcelSelected]);

  const handleUseManualSearch = useCallback(() => {
    onUseManualSearch?.();
  }, [onUseManualSearch]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Mandatory Warning */}
      <Alert variant="default" className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">
          Survey Upload Disclaimer
        </AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
          Survey uploads are <strong>user-supplied</strong> and may not reflect the county 
          appraisal district parcel boundary. The uploaded survey is for{' '}
          <strong>visual reference only</strong>. You must still confirm an authoritative 
          parcel from the map to proceed with feasibility analysis.
        </AlertDescription>
      </Alert>

      {!uploadedSurvey ? (
        <>
          {/* Optional metadata fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="survey-title" className="text-xs">
                Survey Title (optional)
              </Label>
              <Input
                id="survey-title"
                placeholder="e.g., Recorded Plat #12345"
                value={surveyTitle}
                onChange={(e) => setSurveyTitle(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="survey-county" className="text-xs">
                County (optional)
              </Label>
              <Input
                id="survey-county"
                placeholder="e.g., Harris"
                value={surveyCounty}
                onChange={(e) => setSurveyCounty(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Dropzone */}
          <Card
            className={`border-2 border-dashed transition-colors cursor-pointer ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <CardContent className="flex flex-col items-center justify-center py-8">
              {isUploading ? (
                <>
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                  <p className="text-sm text-muted-foreground">Uploading and analyzing...</p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium mb-1">
                    Drop your survey/plat file here
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    PDF, JPEG, PNG, or TIFF (max {MAX_SIZE_MB}MB)
                  </p>
                  <label>
                    <input
                      type="file"
                      accept={ACCEPTED_TYPES}
                      onChange={handleFileInput}
                      className="sr-only"
                    />
                    <Button variant="outline" size="sm" asChild>
                      <span>Browse Files</span>
                    </Button>
                  </label>
                </>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* Uploaded survey display with auto-match status */
        <div className="space-y-4">
          {/* File Info Card */}
          <Card className="border-green-500/30 bg-green-50/30 dark:bg-green-950/10">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <FileText className="h-6 w-6 text-green-700 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate">
                      {uploadedSurvey.title || uploadedSurvey.filename}
                    </p>
                    <Badge variant="outline" className="text-xs shrink-0">
                      Uploaded
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(uploadedSurvey.file_size)}
                    {uploadedSurvey.county && ` • ${uploadedSurvey.county} County`}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handleViewSurvey}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={handleDeleteSurvey}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto-Match Status */}
          <SurveyAutoMatchStatus
            status={matchStatus}
            confidence={matchConfidence}
            selectedParcel={selectedParcel}
            extraction={extraction}
          />

          {/* Review Panel (shown when needs_review) */}
          {matchStatus === 'needs_review' && (
            <SurveyMatchReviewPanel
              candidates={matchCandidates}
              onSelectParcel={handleSelectCandidate}
              onUseManualSearch={handleUseManualSearch}
              isSelecting={isSelectingParcel}
              hasCounty={!!(extraction?.county_extracted || surveyCounty)}
            />
          )}

          {/* No Match - Manual Search Link */}
          {matchStatus === 'no_match' && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleUseManualSearch}
            >
              <ChevronRight className="h-4 w-4 mr-2" />
              Continue with Manual Parcel Search
            </Button>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>How it works:</strong> Upload your survey and we'll automatically 
          extract parcel identifiers to find matching CAD records.
        </p>
        <p>
          <strong>Note:</strong> Parcel selection for feasibility analysis requires 
          matching an authoritative county appraisal district record.
        </p>
      </div>
    </div>
  );
}
