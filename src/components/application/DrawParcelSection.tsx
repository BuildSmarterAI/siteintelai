import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapLibreCanvas } from '@/components/MapLibreCanvas';
import { MapLoadingSkeleton } from '@/components/MapLoadingSkeleton';
import { Pencil, Save, X, MapPin, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import * as turf from '@turf/turf';

interface DrawParcelSectionProps {
  onParcelDrawn: (parcel: {
    geometry: GeoJSON.Polygon;
    name: string;
    acreage: number;
    centroid: { lat: number; lng: number };
    id?: string;
  }) => void;
  initialCenter?: [number, number];
  applicationId?: string;
  existingGeometry?: GeoJSON.Polygon | null;
  existingName?: string;
  disabled?: boolean;
}

export function DrawParcelSection({
  onParcelDrawn,
  initialCenter = [29.7604, -95.3698], // Houston default
  applicationId,
  existingGeometry,
  existingName,
  disabled = false,
}: DrawParcelSectionProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawnGeometry, setDrawnGeometry] = useState<GeoJSON.Polygon | null>(existingGeometry || null);
  const [calculatedAcreage, setCalculatedAcreage] = useState<number | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [parcelName, setParcelName] = useState(existingName || '');
  const [isSaving, setIsSaving] = useState(false);

  // Calculate acreage from polygon
  const calculateAcreage = useCallback((geometry: GeoJSON.Polygon): number => {
    try {
      const polygon = turf.polygon(geometry.coordinates);
      const areaM2 = turf.area(polygon);
      const areaAcres = areaM2 / 4046.86; // Convert sq meters to acres
      return Math.round(areaAcres * 100) / 100;
    } catch (e) {
      console.error('[DrawParcelSection] Failed to calculate area:', e);
      return 0;
    }
  }, []);

  // Calculate centroid from polygon
  const calculateCentroid = useCallback((geometry: GeoJSON.Polygon): { lat: number; lng: number } => {
    try {
      const polygon = turf.polygon(geometry.coordinates);
      const centroid = turf.centroid(polygon);
      return {
        lng: centroid.geometry.coordinates[0],
        lat: centroid.geometry.coordinates[1],
      };
    } catch (e) {
      console.error('[DrawParcelSection] Failed to calculate centroid:', e);
      // Fallback to first vertex
      const firstCoord = geometry.coordinates?.[0]?.[0];
      if (firstCoord) {
        return { lng: firstCoord[0], lat: firstCoord[1] };
      }
      return { lat: initialCenter[0], lng: initialCenter[1] };
    }
  }, [initialCenter]);

  // Handle drawing completion from map
  const handleDrawingComplete = useCallback((geometry: GeoJSON.Polygon) => {
    setDrawnGeometry(geometry);
    const acreage = calculateAcreage(geometry);
    setCalculatedAcreage(acreage);
    setDrawingMode(false);
    setShowSaveDialog(true);
  }, [calculateAcreage]);

  // Save drawn parcel
  const handleSaveParcel = async () => {
    if (!drawnGeometry || !parcelName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a name for your parcel.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const centroid = calculateCentroid(drawnGeometry);
      const acreage = calculatedAcreage || calculateAcreage(drawnGeometry);

      // Save to backend if authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      let savedId: string | undefined;
      
      if (session?.user) {
        const { data, error } = await supabase.functions.invoke('save-drawn-parcel', {
          body: {
            geometry: drawnGeometry,
            name: parcelName,
            application_id: applicationId,
          },
        });

        if (error) {
          console.error('[DrawParcelSection] Save error:', error);
          toast({
            title: 'Save Failed',
            description: 'Could not save parcel to server. Using local data.',
            variant: 'destructive',
          });
        } else {
          savedId = data?.id;
        }
      }

      // Notify parent with parcel data
      onParcelDrawn({
        geometry: drawnGeometry,
        name: parcelName,
        acreage,
        centroid,
        id: savedId,
      });

      setShowSaveDialog(false);
      setIsExpanded(false);
      
      toast({
        title: 'Parcel Saved',
        description: `${parcelName} (${acreage.toFixed(2)} acres) has been saved.`,
      });
    } catch (error) {
      console.error('[DrawParcelSection] Unexpected error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel drawing
  const handleCancelDrawing = () => {
    setDrawingMode(false);
    setDrawnGeometry(null);
    setCalculatedAcreage(null);
    setShowSaveDialog(false);
  };

  // Start fresh drawing
  const handleStartDrawing = () => {
    setDrawingMode(true);
    setDrawnGeometry(null);
    setCalculatedAcreage(null);
  };

  if (disabled) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Collapsed State - Link to expand */}
      {!isExpanded && !drawnGeometry && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Can't find your parcel? Draw it manually</span>
        </button>
      )}

      {/* Drawn Parcel Summary (after saving) */}
      {drawnGeometry && !isExpanded && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Custom Parcel Drawn</p>
                <p className="text-sm text-muted-foreground">
                  {parcelName || 'Custom Parcel'} • {calculatedAcreage?.toFixed(2) || '—'} acres
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
              >
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expanded Drawing Interface */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Pencil className="h-5 w-5" />
                      Draw Custom Parcel
                    </CardTitle>
                    <CardDescription>
                      Click on the map to draw your property boundary
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsExpanded(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drawing Controls */}
                <div className="flex gap-2">
                  {!drawingMode ? (
                    <Button
                      type="button"
                      onClick={handleStartDrawing}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      {drawnGeometry ? 'Redraw Boundary' : 'Start Drawing'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelDrawing}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>

                {/* Drawing Instructions */}
                {drawingMode && (
                  <div className="rounded-lg bg-primary/10 p-3 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="font-semibold text-primary">Drawing Mode Active</span>
                    </div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• <span className="font-mono text-xs">Click</span> to add vertices</li>
                      <li>• <span className="font-mono text-xs">Double-click</span> to complete polygon</li>
                      <li>• <span className="font-mono text-xs">Escape</span> to cancel</li>
                    </ul>
                  </div>
                )}

                {/* Map Container */}
                <div className="h-[400px] rounded-lg overflow-hidden border relative">
                  {isMapLoading && (
                    <MapLoadingSkeleton message="Loading map..." />
                  )}
                  <MapLibreCanvas
                    center={initialCenter}
                    zoom={15}
                    showParcels={true}
                    onParcelSelect={(parcel) => {
                      // When user clicks a parcel, use its geometry
                      if (parcel?.geometry) {
                        handleDrawingComplete(parcel.geometry as GeoJSON.Polygon);
                      }
                    }}
                    className="w-full h-full"
                  />
                  {drawingMode && (
                    <div className="absolute inset-0 pointer-events-none border-4 border-primary/50 rounded-lg" />
                  )}
                </div>

                {/* Acreage Display */}
                {calculatedAcreage !== null && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Calculated Area
                      </p>
                      <p className="text-xl font-bold text-green-700 dark:text-green-300">
                        {calculatedAcreage.toFixed(2)} acres
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Drawn Parcel</DialogTitle>
            <DialogDescription>
              Give your custom parcel a name for reference.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="drawn-parcel-name">Parcel Name</Label>
              <Input
                id="drawn-parcel-name"
                placeholder="e.g., South Development Site"
                value={parcelName}
                onChange={(e) => setParcelName(e.target.value)}
                disabled={isSaving}
              />
            </div>
            
            {calculatedAcreage !== null && (
              <div className="rounded-lg bg-primary/10 p-4">
                <p className="text-sm font-medium text-muted-foreground">Calculated Area</p>
                <p className="text-2xl font-bold text-primary">
                  {calculatedAcreage.toFixed(2)} acres
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDrawing}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveParcel}
              disabled={isSaving || !parcelName.trim()}
              className="gap-2"
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Parcel
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
