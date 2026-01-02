/**
 * Survey Calibration Wizard
 * Multi-step wizard for georectifying survey images by marking control points.
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  MapPin,
  Target,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { SurveyImageCanvas } from './SurveyImageCanvas';
import { CalibrationMapCanvas } from './CalibrationMapCanvas';
import type { 
  ControlPointPair, 
  CalibrationStep, 
  ParcelMatch,
  AffineTransform,
  TransformedBounds,
} from '@/types/surveyCalibration';
import { buildAffineTransform, transformImageCorners } from '@/lib/affineTransform';
import { performFullCalibration } from '@/services/surveyCalibrationApi';
import { toast } from 'sonner';

interface SurveyCalibrationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: string;
  surveyImageUrl: string;
  onCalibrationComplete: (result: {
    transform: AffineTransform;
    bounds: TransformedBounds;
    matchedParcels: ParcelMatch[];
  }) => void;
  onParcelSelected: (parcel: ParcelMatch) => void;
}

const POINT_LABELS = ['A', 'B', 'C', 'D'];

export function SurveyCalibrationWizard({
  open,
  onOpenChange,
  surveyId,
  surveyImageUrl,
  onCalibrationComplete,
  onParcelSelected,
}: SurveyCalibrationWizardProps) {
  const [step, setStep] = useState<CalibrationStep>('instructions');
  const [points, setPoints] = useState<ControlPointPair[]>([]);
  const [activePointLabel, setActivePointLabel] = useState<string | null>(null);
  const [pendingImagePoint, setPendingImagePoint] = useState<{ x: number; y: number } | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [transform, setTransform] = useState<AffineTransform | null>(null);
  const [transformedBounds, setTransformedBounds] = useState<TransformedBounds | null>(null);
  const [matchedParcels, setMatchedParcels] = useState<ParcelMatch[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine next available label
  const nextLabel = useMemo(() => {
    const usedLabels = new Set(points.map(p => p.label));
    return POINT_LABELS.find(l => !usedLabels.has(l)) || null;
  }, [points]);

  // Start placing a new point
  const startPlacingPoint = useCallback((label: string) => {
    setActivePointLabel(label);
    setPendingImagePoint(null);
  }, []);

  // Handle image point placed
  const handleImagePointAdded = useCallback((imageX: number, imageY: number) => {
    if (!activePointLabel) return;
    setPendingImagePoint({ x: imageX, y: imageY });
  }, [activePointLabel]);

  // Handle map point placed - complete the pair
  const handleMapPointAdded = useCallback((lat: number, lng: number) => {
    if (!activePointLabel || !pendingImagePoint) return;
    
    const newPoint: ControlPointPair = {
      id: `cp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      image_x: pendingImagePoint.x,
      image_y: pendingImagePoint.y,
      map_lat: lat,
      map_lng: lng,
      label: activePointLabel,
    };
    
    setPoints(prev => [...prev, newPoint]);
    setActivePointLabel(null);
    setPendingImagePoint(null);
  }, [activePointLabel, pendingImagePoint]);

  // Remove a point
  const handlePointRemoved = useCallback((pointId: string) => {
    setPoints(prev => prev.filter(p => p.id !== pointId));
    setTransform(null); // Reset transform if points change
  }, []);

  // Handle parcel selection
  const handleSelectParcel = useCallback((parcel: ParcelMatch, autoSelected = false) => {
    onParcelSelected(parcel);
    const label = parcel.situs_address || parcel.source_parcel_id;
    if (autoSelected) {
      toast.success(`Auto-selected best match: ${label}`, {
        description: `${parcel.overlapPercentage.toFixed(0)}% overlap, ${parcel.confidence} confidence`,
        action: {
          label: 'Change',
          onClick: () => onOpenChange(true), // Re-open wizard to pick another
        },
      });
    } else {
      toast.success(`Selected parcel: ${label}`);
    }
    onOpenChange(false);
  }, [onParcelSelected, onOpenChange]);

  // Compute transform
  const handleComputeTransform = useCallback(async () => {
    if (points.length < 3 || !imageSize) {
      setError('Need at least 3 control points');
      return;
    }

    setIsComputing(true);
    setError(null);

    try {
      // Compute affine transform locally
      const result = buildAffineTransform(points);
      
      if (!result) {
        setError('Failed to compute transform. Points may be collinear.');
        setIsComputing(false);
        return;
      }

      setTransform(result);
      
      // Calculate transformed bounds
      const bounds = transformImageCorners(result.matrix, imageSize.width, imageSize.height);
      setTransformedBounds(bounds);

      // Now perform full calibration including parcel matching
      const calibResult = await performFullCalibration(
        surveyId,
        points,
        result,
        imageSize.width,
        imageSize.height
      );

      if (calibResult.success) {
        const parcels = calibResult.matchedParcels || [];
        setMatchedParcels(parcels);
        onCalibrationComplete({
          transform: result,
          bounds,
          matchedParcels: parcels,
        });
        
        // Auto-select best match if confidence is high and overlap >= 85%
        const bestMatch = parcels[0];
        if (bestMatch && 
            bestMatch.overlapPercentage >= 85 && 
            (bestMatch.confidence === 'high' || bestMatch.confidence === 'medium')) {
          console.log('[CalibrationWizard] Auto-selecting best match:', bestMatch.source_parcel_id, 
                      'overlap:', bestMatch.overlapPercentage, 'confidence:', bestMatch.confidence);
          handleSelectParcel(bestMatch, true);
        } else {
          // Show review step for manual selection
          setStep('review-transform');
        }
      } else {
        setError(calibResult.error || 'Calibration failed');
      }
    } catch (err) {
      console.error('Compute transform error:', err);
      setError('Unexpected error during calibration');
    } finally {
      setIsComputing(false);
    }
  }, [points, imageSize, surveyId, onCalibrationComplete, handleSelectParcel]);

  // Reset wizard
  const handleReset = useCallback(() => {
    setPoints([]);
    setActivePointLabel(null);
    setPendingImagePoint(null);
    setTransform(null);
    setTransformedBounds(null);
    setMatchedParcels([]);
    setError(null);
    setStep('instructions');
  }, []);

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'instructions':
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                <strong>How calibration works:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Mark 3-4 reference points on the survey image (corners work best)</li>
                <li>For each point, click the corresponding location on the map</li>
                <li>The system computes a transformation to georectify the survey</li>
                <li>Matching parcels are automatically suggested</li>
              </ol>
              <p className="text-xs">
                <strong>Tip:</strong> Use identifiable features like property corners, 
                road intersections, or lot boundaries that appear on both the survey and map.
              </p>
            </div>
            
            <Button onClick={() => setStep('mark-points')} className="w-full">
              Start Calibration
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 'mark-points':
        return (
          <div className="space-y-4">
            {/* Control point status */}
            <div className="flex items-center gap-2 flex-wrap">
              {POINT_LABELS.map((label) => {
                const point = points.find(p => p.label === label);
                const isActive = activePointLabel === label;
                const isPending = isActive && pendingImagePoint;
                
                return (
                  <Badge
                    key={label}
                    variant={point ? 'default' : isActive ? 'secondary' : 'outline'}
                    className={`cursor-pointer ${isActive ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => !point && startPlacingPoint(label)}
                  >
                    {point ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : isPending ? (
                      <MapPin className="h-3 w-3 mr-1" />
                    ) : (
                      <Target className="h-3 w-3 mr-1" />
                    )}
                    Point {label}
                    {isPending && ' (map)'}
                  </Badge>
                );
              })}
            </div>

            {/* Side-by-side canvases */}
            <div className="grid grid-cols-2 gap-3 h-[400px]">
              <div className="flex flex-col">
                <div className="text-xs font-medium mb-1 text-muted-foreground">
                  Survey Image {pendingImagePoint ? '' : '(click to mark)'}
                </div>
                <div className="flex-1 min-h-0">
                  <SurveyImageCanvas
                    imageUrl={surveyImageUrl}
                    points={points}
                    onPointAdded={handleImagePointAdded}
                    onPointRemoved={handlePointRemoved}
                    activePointLabel={pendingImagePoint ? null : activePointLabel}
                    onImageLoad={(w, h) => setImageSize({ width: w, height: h })}
                  />
                </div>
              </div>
              
              <div className="flex flex-col">
                <div className="text-xs font-medium mb-1 text-muted-foreground">
                  Map {pendingImagePoint ? '(click to match)' : ''}
                </div>
                <div className="flex-1 min-h-0">
                  <CalibrationMapCanvas
                    points={points}
                    onPointAdded={handleMapPointAdded}
                    onPointRemoved={handlePointRemoved}
                    activePointLabel={pendingImagePoint ? activePointLabel : null}
                  />
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-xs text-muted-foreground">
              {!activePointLabel && !pendingImagePoint && (
                <p>Click a point badge above to start marking, or click directly on an unmarked point.</p>
              )}
              {activePointLabel && !pendingImagePoint && (
                <p>Click on the <strong>survey image</strong> to mark point {activePointLabel}.</p>
              )}
              {pendingImagePoint && (
                <p>Now click on the <strong>map</strong> at the matching location for point {activePointLabel}.</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={isComputing}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleComputeTransform}
                disabled={points.length < 3 || isComputing}
                className="flex-1"
              >
                {isComputing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Computing...
                  </>
                ) : (
                  <>
                    Compute Transform ({points.length}/3 points)
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'review-transform':
        return (
          <div className="space-y-4">
            {/* Transform quality */}
            {transform && (
              <Alert variant={
                transform.confidence === 'high' ? 'default' :
                transform.confidence === 'medium' ? 'default' : 'destructive'
              } className={
                transform.confidence === 'high' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
                transform.confidence === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
                ''
              }>
                <CheckCircle2 className={`h-4 w-4 ${
                  transform.confidence === 'high' ? 'text-green-600' :
                  transform.confidence === 'medium' ? 'text-yellow-600' : ''
                }`} />
                <AlertDescription>
                  <strong>Calibration {transform.confidence === 'high' ? 'Excellent' : 
                    transform.confidence === 'medium' ? 'Good' : 'Poor'}</strong>
                  <br />
                  Residual error: {transform.residualErrorMeters.toFixed(2)} meters
                  {transform.confidence === 'low' && (
                    <span className="block mt-1 text-destructive">
                      Consider re-marking points for better accuracy.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Matched parcels */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Matched Parcels</div>
              {matchedParcels.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  No matching parcels found. Try adjusting the control points.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {matchedParcels.map((parcel, index) => (
                    <Card 
                      key={parcel.parcel_id} 
                      className={`cursor-pointer hover:border-primary transition-colors ${
                        index === 0 ? 'ring-2 ring-primary/50' : ''
                      }`}
                      onClick={() => handleSelectParcel(parcel)}
                    >
                      <CardHeader className="py-2 px-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">
                            {parcel.situs_address || parcel.source_parcel_id}
                          </CardTitle>
                          <Badge variant={
                            parcel.confidence === 'high' ? 'default' :
                            parcel.confidence === 'medium' ? 'secondary' : 'outline'
                          }>
                            {parcel.overlapPercentage.toFixed(0)}% match
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2 px-3 pt-0">
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {parcel.owner_name && <div>Owner: {parcel.owner_name}</div>}
                          {parcel.acreage && <div>Acreage: {parcel.acreage.toFixed(2)} ac</div>}
                          <div>County: {parcel.county}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('mark-points')}>
                Re-calibrate
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Continue Without Selection
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Survey Calibration Wizard
            <Badge variant="outline" className="ml-2">
              Step {step === 'instructions' ? '1' : step === 'mark-points' ? '2' : '3'} of 3
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {step === 'instructions' && 'Learn how to calibrate your survey for accurate parcel matching.'}
            {step === 'mark-points' && 'Mark matching control points on the survey and map.'}
            {step === 'review-transform' && 'Review calibration quality and select a matching parcel.'}
          </DialogDescription>
        </DialogHeader>

        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}
