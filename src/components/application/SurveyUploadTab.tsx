/**
 * Survey Upload Tab for Parcel Selection
 * Phase 2: Includes calibration wizard for georeferencing surveys
 * 
 * Key constraints:
 * - Survey is NOT authoritative parcel selection
 * - User must still select parcel from CAD layer
 * - Mandatory disclaimers about survey limitations
 */

import { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertTriangle, Loader2, Eye, Trash2, EyeOff, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { SurveyCalibrationWizard } from './SurveyCalibrationWizard';
import { 
  uploadSurvey, 
  getSurveyUrl, 
  deleteSurvey,
  type SurveyUploadMetadata 
} from '@/services/surveyUploadApi';
import type { ParcelMatch, AffineTransform, TransformedBounds } from '@/types/surveyCalibration';
import { toast } from 'sonner';

interface SurveyUploadTabProps {
  onSurveyUploaded?: (survey: SurveyUploadMetadata) => void;
  onSurveyDeleted?: (surveyId: string) => void;
  onParcelSelected?: (parcel: ParcelMatch) => void;
  onCalibrationComplete?: (result: {
    transform: AffineTransform;
    bounds: TransformedBounds;
    matchedParcels: ParcelMatch[];
  }) => void;
  draftId?: string;
  // Overlay controls
  surveyOverlayOpacity?: number;
  onSurveyOpacityChange?: (opacity: number) => void;
  showSurveyOverlay?: boolean;
  onSurveyVisibilityToggle?: (visible: boolean) => void;
  uploadedSurvey?: SurveyUploadMetadata | null;
}

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.tiff,.tif';
const MAX_SIZE_MB = 50;

export function SurveyUploadTab({ 
  onSurveyUploaded,
  onSurveyDeleted,
  onParcelSelected,
  onCalibrationComplete,
  draftId,
  surveyOverlayOpacity = 0.5,
  onSurveyOpacityChange,
  showSurveyOverlay = true,
  onSurveyVisibilityToggle,
  uploadedSurvey: externalUploadedSurvey,
}: SurveyUploadTabProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [internalUploadedSurvey, setInternalUploadedSurvey] = useState<SurveyUploadMetadata | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyCounty, setSurveyCounty] = useState('');
  const [showCalibrationWizard, setShowCalibrationWizard] = useState(false);
  const [surveyImageUrl, setSurveyImageUrl] = useState<string | null>(null);

  // Use external state if provided, otherwise use internal
  const uploadedSurvey = externalUploadedSurvey ?? internalUploadedSurvey;
  const handleFile = useCallback(async (file: File) => {
    // Validate file size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
      return;
    }

    setIsUploading(true);
    
    const result = await uploadSurvey(file, {
      title: surveyTitle || undefined,
      county: surveyCounty || undefined,
      draftId,
    });

    setIsUploading(false);

    if (result.success && result.survey) {
      setInternalUploadedSurvey(result.survey);
      toast.success('Survey uploaded successfully');
      onSurveyUploaded?.(result.survey);
    } else {
      toast.error(result.error || 'Upload failed');
    }
  }, [surveyTitle, surveyCounty, draftId, onSurveyUploaded]);

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
      toast.error('Failed to load survey preview');
    }
  }, [uploadedSurvey]);

  const handleDeleteSurvey = useCallback(async () => {
    if (!uploadedSurvey) return;
    
    const success = await deleteSurvey(uploadedSurvey.id);
    if (success) {
      onSurveyDeleted?.(uploadedSurvey.id);
      setInternalUploadedSurvey(null);
      toast.success('Survey deleted');
    } else {
      toast.error('Failed to delete survey');
    }
  }, [uploadedSurvey, onSurveyDeleted]);

  // Open calibration wizard
  const handleOpenCalibration = useCallback(async () => {
    if (!uploadedSurvey) return;
    
    // Get signed URL for the survey image
    const url = await getSurveyUrl(uploadedSurvey.storage_path);
    if (url) {
      setSurveyImageUrl(url);
      setShowCalibrationWizard(true);
    } else {
      toast.error('Failed to load survey for calibration');
    }
  }, [uploadedSurvey]);

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
          <strong>visual reference only</strong>. You must still select an authoritative 
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
                  <p className="text-sm text-muted-foreground">Uploading survey...</p>
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
        /* Uploaded survey display */
        <Card className="border-green-500/30 bg-green-50/30 dark:bg-green-950/10">
          <CardContent className="py-4 space-y-4">
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
                    {uploadedSurvey.calibration_status}
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

            {/* Calibration Section */}
            <div className="border-t pt-3">
              {uploadedSurvey.calibration_status === 'uncalibrated' ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleOpenCalibration}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Calibrate Survey for Parcel Matching
                </Button>
              ) : uploadedSurvey.calibration_status === 'calibrated' ? (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Target className="h-4 w-4" />
                  <span>Calibrated - Ready for parcel matching</span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Calibration failed</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenCalibration}
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>

            {/* Overlay Controls */}
            <div className="border-t pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {showSurveyOverlay ? (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Label htmlFor="survey-visibility" className="text-sm font-medium">
                    Show on Map
                  </Label>
                </div>
                <Switch
                  id="survey-visibility"
                  checked={showSurveyOverlay}
                  onCheckedChange={onSurveyVisibilityToggle}
                />
              </div>
              
              {showSurveyOverlay && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Opacity</Label>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(surveyOverlayOpacity * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[surveyOverlayOpacity]}
                    onValueChange={([val]) => onSurveyOpacityChange?.(val)}
                    min={0.1}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Next step:</strong> After uploading, click "Calibrate Survey" to mark 
          control points and automatically match CAD parcels.
        </p>
        <p>
          <strong>Note:</strong> Parcel selection for feasibility analysis requires 
          matching an authoritative county appraisal district record.
        </p>
      </div>

      {/* Calibration Wizard */}
      {uploadedSurvey && surveyImageUrl && (
        <SurveyCalibrationWizard
          open={showCalibrationWizard}
          onOpenChange={setShowCalibrationWizard}
          surveyId={uploadedSurvey.id}
          surveyImageUrl={surveyImageUrl}
          onCalibrationComplete={(result) => {
            onCalibrationComplete?.(result);
            // Update internal survey status
            setInternalUploadedSurvey(prev => prev ? {
              ...prev,
              calibration_status: 'calibrated',
              geometry_confidence: result.transform.confidence,
            } : null);
          }}
          onParcelSelected={(parcel) => {
            onParcelSelected?.(parcel);
            setShowCalibrationWizard(false);
          }}
        />
      )}
    </div>
  );
}
