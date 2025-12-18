import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { ParcelSearchBar } from "@/components/ParcelSearchBar";
import { Button } from "@/components/ui/button";
import { MapLibreCanvas } from "@/components/MapLibreCanvas";
import { MapLoadingSkeleton } from "@/components/MapLoadingSkeleton";
import { DrawParcelSection } from "@/components/application/DrawParcelSection";
import { MapPin, CheckCircle2, ExternalLink, Copy, Sparkles, ChevronDown, ChevronUp, PenTool } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface PropertyStepFullWidthProps {
  formData: {
    propertyAddress: string;
    geoLat?: number;
    geoLng?: number;
    parcelId?: string;
    lotSize?: string;
    lotSizeUnit?: string;
    parcelOwner?: string;
    zoning?: string;
    county?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    neighborhood?: string;
  };
  onChange: (field: string, value: any) => void;
  onAddressSelect: (lat: number, lng: number, address: string) => void;
  onParcelSelect?: (parcel: any) => void;
  onEnrichmentComplete?: (data: any) => void;
  onDrawnParcelSave?: (parcel: { geometry: GeoJSON.Polygon; name: string; acreage: number; centroid: { lat: number; lng: number }; id?: string }) => void;
  errors: Record<string, string>;
  isAddressLoading: boolean;
  applicationId?: string;
}

export function PropertyStepFullWidth({
  formData,
  onChange,
  onAddressSelect,
  onParcelSelect,
  onEnrichmentComplete,
  onDrawnParcelSave,
  errors,
  isAddressLoading,
  applicationId
}: PropertyStepFullWidthProps) {
  const { toast } = useToast();
  const [selectedParcelFromMap, setSelectedParcelFromMap] = useState<any>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [showEnrichAnimation, setShowEnrichAnimation] = useState(false);
  const [isEnrichedCollapsed, setIsEnrichedCollapsed] = useState(false);
  const [showDrawParcel, setShowDrawParcel] = useState(false);

  // Animate enrichment data appearing
  useEffect(() => {
    if (formData.parcelId || formData.lotSize || formData.parcelOwner) {
      setShowEnrichAnimation(true);
      const timer = setTimeout(() => {
        setShowEnrichAnimation(false);
        // Auto-collapse enriched fields after animation
        setIsEnrichedCollapsed(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData.parcelId, formData.lotSize, formData.parcelOwner]);

  // Map center
  const mapCenter: [number, number] = formData.geoLat && formData.geoLng
    ? [formData.geoLat, formData.geoLng]
    : [29.7604, -95.3698]; // Houston default

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied`, description: text });
  };

  const openGoogleMaps = () => {
    if (formData.geoLat && formData.geoLng) {
      window.open(
        `https://www.google.com/maps?q=${formData.geoLat},${formData.geoLng}`,
        '_blank'
      );
    }
  };

  const handleMapParcelSelect = (parcel: any) => {
    const props = parcel.properties;
    if (onParcelSelect) {
      onParcelSelect(parcel);
    }
    setSelectedParcelFromMap({
      id: props.ACCOUNT || props.parcelId || 'Unknown',
      address: props.SITUS_ADDR || props.address || 'Unknown Address',
      acreage: props.ACREAGE || props.acreage || 0,
    });
    toast({
      title: "Parcel Selected",
      description: `${props.SITUS_ADDR || 'Parcel'} selected (${(props.ACREAGE || 0).toFixed(2)} acres)`,
    });
  };

  const handleDrawnParcel = (parcel: { geometry: GeoJSON.Polygon; name: string; acreage: number; centroid: { lat: number; lng: number }; id?: string }) => {
    if (onDrawnParcelSave) {
      onDrawnParcelSave(parcel);
    }
    setShowDrawParcel(false);
    toast({
      title: "Custom Parcel Saved",
      description: `${parcel.name} (${parcel.acreage.toFixed(2)} acres) will be used for your feasibility analysis.`,
    });
  };

  // Count enriched fields for summary
  const enrichedFieldCount = [
    formData.parcelId,
    formData.lotSize,
    formData.parcelOwner,
    formData.zoning,
    formData.county,
    formData.city
  ].filter(Boolean).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
      {/* Left: Form Content */}
      <div className="lg:col-span-3 space-y-6">
        <fieldset className="space-y-4">
          <legend className="sr-only">Property Information</legend>

          {/* Search Bar */}
          <div className="space-y-2">
            <Label htmlFor="property-search" className="font-body font-semibold text-foreground">
              Property Address <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              Search by street address, parcel ID, or click a parcel on the map
            </p>
            <ParcelSearchBar
              onAddressSelect={onAddressSelect}
              onParcelSelect={onParcelSelect}
              containerClassName="relative"
            />
          </div>

          {/* Selected Address Display */}
          <AnimatePresence>
            {formData.propertyAddress && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    {/* Primary Address */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                          {formData.propertyAddress}
                        </p>
                        {formData.geoLat && formData.geoLng && (
                          <p className="text-xs text-green-700 dark:text-green-300 font-mono">
                            {formData.geoLat.toFixed(6)}, {formData.geoLng.toFixed(6)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                          onClick={() => copyToClipboard(formData.propertyAddress, 'Address')}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                          onClick={openGoogleMaps}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Enriched Fields - Collapsible */}
                    {enrichedFieldCount > 0 && (
                      <Collapsible open={!isEnrichedCollapsed} onOpenChange={(open) => setIsEnrichedCollapsed(!open)}>
                        <CollapsibleTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900 gap-1"
                          >
                            {showEnrichAnimation && <Sparkles className="h-3 w-3 animate-pulse text-primary" />}
                            <CheckCircle2 className="h-3 w-3" />
                            {enrichedFieldCount} fields auto-filled
                            {isEnrichedCollapsed ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronUp className="h-3 w-3" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm border-t border-green-200 dark:border-green-700 pt-2 mt-2"
                          >
                            {formData.parcelId && (
                              <div className="contents">
                                <span className="text-green-800 dark:text-green-200 font-medium">Parcel ID:</span>
                                <span className="text-green-700 dark:text-green-300 font-mono text-xs">{formData.parcelId}</span>
                              </div>
                            )}
                            {formData.lotSize && (
                              <div className="contents">
                                <span className="text-green-800 dark:text-green-200 font-medium">Lot Size:</span>
                                <span className="text-green-700 dark:text-green-300">{formData.lotSize} {formData.lotSizeUnit || 'acres'}</span>
                              </div>
                            )}
                            {formData.parcelOwner && (
                              <div className="contents">
                                <span className="text-green-800 dark:text-green-200 font-medium">Owner:</span>
                                <span className="text-green-700 dark:text-green-300 truncate">{formData.parcelOwner}</span>
                              </div>
                            )}
                            {formData.zoning && (
                              <div className="contents">
                                <span className="text-green-800 dark:text-green-200 font-medium">Zoning:</span>
                                <span className="text-green-700 dark:text-green-300">{formData.zoning}</span>
                              </div>
                            )}
                            {formData.county && (
                              <div className="contents">
                                <span className="text-green-800 dark:text-green-200 font-medium">County:</span>
                                <span className="text-green-700 dark:text-green-300">{formData.county}</span>
                              </div>
                            )}
                            {formData.city && (
                              <div className="contents">
                                <span className="text-green-800 dark:text-green-200 font-medium">City:</span>
                                <span className="text-green-700 dark:text-green-300">{formData.city}</span>
                              </div>
                            )}
                          </motion.div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>

                  {/* Clear Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange('propertyAddress', '')}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 flex-shrink-0"
                  >
                    Clear
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error display */}
          {errors.propertyAddress && (
            <p className="text-sm text-destructive">{errors.propertyAddress}</p>
          )}

          {/* Draw Parcel CTA */}
          {!showDrawParcel && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-dashed border-border">
              <PenTool className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Can't find your site?
              </span>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-sm"
                onClick={() => setShowDrawParcel(true)}
              >
                Draw custom boundaries →
              </Button>
            </div>
          )}

          {/* Draw Parcel Section */}
          <AnimatePresence>
            {showDrawParcel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <DrawParcelSection
                  onParcelDrawn={handleDrawnParcel}
                  initialCenter={mapCenter}
                  applicationId={applicationId}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map Selection Confirmation */}
          {selectedParcelFromMap && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-900 dark:text-green-100">
                  Parcel Selected from Map
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  <strong>Parcel #{selectedParcelFromMap.id}</strong>
                  {selectedParcelFromMap.address !== 'Unknown Address' && (
                    <> • {selectedParcelFromMap.address}</>
                  )}
                  {selectedParcelFromMap.acreage > 0 && (
                    <> • {selectedParcelFromMap.acreage.toFixed(2)} acres</>
                  )}
                </p>
              </div>
            </div>
          )}
        </fieldset>
      </div>

      {/* Right: Always-Visible Map */}
      <div className="lg:col-span-2 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
        <div className="h-[400px] lg:h-full rounded-lg overflow-hidden border border-border shadow-sm">
          <div className="h-full relative">
            <AnimatePresence>
              {isMapLoading && (
                <MapLoadingSkeleton message="Loading map..." />
              )}
            </AnimatePresence>
            <MapLibreCanvas
              center={mapCenter}
              zoom={formData.geoLat ? 16 : 12}
              showParcels={true}
              onParcelSelect={handleMapParcelSelect}
              className="w-full h-full"
            />
            
            {/* Map Instructions Overlay */}
            {!formData.propertyAddress && (
              <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg border border-border shadow-lg">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-foreground">
                    Click any parcel on the map to select it, or search above
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
