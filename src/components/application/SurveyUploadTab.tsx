/**
 * Survey Upload Tab for Parcel Selection
 * Phase 1: Read-only overlay mode - upload shows as visual reference only
 * 
 * Key constraints:
 * - Survey is NOT authoritative parcel selection
 * - User must still select parcel from CAD layer
 * - Mandatory disclaimers about survey limitations
 */

import { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertTriangle, Loader2, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  uploadSurvey, 
  getSurveyUrl, 
  deleteSurvey,
  type SurveyUploadMetadata 
} from '@/services/surveyUploadApi';
import { toast } from 'sonner';

interface SurveyUploadTabProps {
  onSurveyUploaded?: (survey: SurveyUploadMetadata) => void;
  onSurveyDeleted?: (surveyId: string) => void;
  draftId?: string;
}

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.tiff,.tif';
const MAX_SIZE_MB = 50;

export function SurveyUploadTab({ 
  onSurveyUploaded,
  onSurveyDeleted,
  draftId 
}: SurveyUploadTabProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedSurvey, setUploadedSurvey] = useState<SurveyUploadMetadata | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyCounty, setSurveyCounty] = useState('');

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
      setUploadedSurvey(result.survey);
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
      setUploadedSurvey(null);
      toast.success('Survey deleted');
    } else {
      toast.error('Failed to delete survey');
    }
  }, [uploadedSurvey, onSurveyDeleted]);

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
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Next step:</strong> After uploading, the survey will display as a 
          semi-transparent overlay on the map. Use it to visually confirm you're 
          selecting the correct parcel.
        </p>
        <p>
          <strong>Note:</strong> Parcel selection for feasibility analysis requires 
          matching an authoritative county appraisal district record.
        </p>
      </div>
    </div>
  );
}
