import { useState } from "react";
import { Label } from "@/components/ui/label";
import { ParcelSearchBar } from "@/components/ParcelSearchBar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MapLibreCanvas } from "@/components/MapLibreCanvas";
import { MapPin, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PropertyStepProps {
  formData: {
    propertyAddress: string;
    geoLat?: number;
    geoLng?: number;
    parcelId?: string;
    lotSize?: string;
    lotSizeUnit?: string;
    parcelOwner?: string;
    zoning?: string;
  };
  onChange: (field: string, value: any) => void;
  onAddressSelect: (lat: number, lng: number, address: string) => void;
  onParcelSelect?: (parcel: any) => void;
  onEnrichmentComplete?: (data: any) => void;
  errors: Record<string, string>;
  isAddressLoading: boolean;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
}

export function PropertyStep({ 
  formData, 
  onChange, 
  onAddressSelect,
  onParcelSelect,
  onEnrichmentComplete,
  errors,
  isAddressLoading,
  placeholder = "Address, parcel ID, or intersection...",
  label = "Property Address",
  required = true,
  error
}: PropertyStepProps) {
  const { toast } = useToast();
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedParcelFromMap, setSelectedParcelFromMap] = useState<any>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  
  const handleMapOpenChange = (open: boolean) => {
    setIsMapOpen(open);
    if (open) {
      setIsMapLoading(false);
    }
  };
  
  // Determine map center (use selected location or default to Houston)
  const mapCenter: [number, number] = formData.geoLat && formData.geoLng 
    ? [formData.geoLat, formData.geoLng]
    : [29.7604, -95.3698]; // Houston default
  
  const handleMapParcelSelect = (parcel: any) => {
    const props = parcel.properties;
    
    // Call parent handler
    if (onParcelSelect) {
      onParcelSelect(parcel);
    }
    
    // Store for confirmation display
    setSelectedParcelFromMap({
      id: props.ACCOUNT || props.parcelId || 'Unknown',
      address: props.SITUS_ADDR || props.address || 'Unknown Address',
      acreage: props.ACREAGE || props.acreage || 0,
    });
    
    // Show success toast
    toast({
      title: "Parcel Selected",
      description: `${props.SITUS_ADDR || 'Parcel'} selected (${(props.ACREAGE || 0).toFixed(2)} acres)`,
    });
    
    // Collapse map after selection
    setIsMapOpen(false);
  };
  
  return (
    <fieldset className="space-y-6">
      <legend className="sr-only">Property Information</legend>

      <div className="space-y-2">
        <Label htmlFor="property-search" className="font-body font-semibold text-charcoal">
          {label} {required && <span className="text-maxx-red">*</span>}
        </Label>
        <p className="text-sm text-muted-foreground mb-2">
          Search by street address, parcel ID (10+ digits), intersection (e.g., "Main St & Elm Ave"), or click coordinates on map
        </p>
        
        {/* ParcelSearchBar component with all search capabilities */}
        <ParcelSearchBar
          onAddressSelect={onAddressSelect}
          onParcelSelect={onParcelSelect}
          containerClassName="relative"
        />
        
        {/* Display selected address if available */}
        {formData.propertyAddress && (
          <div className="mt-2 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                {/* Primary Address */}
                <div>
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                    Selected Address:
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {formData.propertyAddress}
                  </p>
                </div>

                {/* Parcel Details Grid - Show if ANY enriched data exists */}
                {(formData.parcelId || formData.lotSize || formData.parcelOwner || formData.zoning) && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm border-t border-green-200 dark:border-green-700 pt-2">
                    {/* Parcel ID */}
                    {formData.parcelId && (
                      <>
                        <span className="text-green-800 dark:text-green-200 font-medium">Parcel ID:</span>
                        <span className="text-green-700 dark:text-green-300">{formData.parcelId}</span>
                      </>
                    )}
                    
                    {/* Lot Size */}
                    {formData.lotSize && (
                      <>
                        <span className="text-green-800 dark:text-green-200 font-medium">Lot Size:</span>
                        <span className="text-green-700 dark:text-green-300">
                          {formData.lotSize} {formData.lotSizeUnit || 'acres'}
                        </span>
                      </>
                    )}
                    
                    {/* Owner */}
                    {formData.parcelOwner && (
                      <>
                        <span className="text-green-800 dark:text-green-200 font-medium">Owner:</span>
                        <span className="text-green-700 dark:text-green-300 truncate" title={formData.parcelOwner}>
                          {formData.parcelOwner}
                        </span>
                      </>
                    )}
                    
                    {/* Zoning */}
                    {formData.zoning && (
                      <>
                        <span className="text-green-800 dark:text-green-200 font-medium">Zoning:</span>
                        <span className="text-green-700 dark:text-green-300">{formData.zoning}</span>
                      </>
                    )}
                  </div>
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
          </div>
        )}
        
        {error && (
          <p className="text-sm text-maxx-red mt-1">{error}</p>
        )}
        {errors.propertyAddress && !error && (
          <p className="text-sm text-maxx-red mt-1">{errors.propertyAddress}</p>
        )}
      </div>

      {/* Map Selection Section */}
      <Collapsible open={isMapOpen} onOpenChange={handleMapOpenChange}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between"
            aria-label={isMapOpen ? "Close map selector" : "Open map selector"}
            aria-expanded={isMapOpen}
          >
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Select from Map
            </span>
            {isMapOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4">
          <div className="border rounded-lg overflow-hidden">
            {/* Instructions */}
            <div className="bg-muted p-3 text-sm">
              <p className="font-semibold mb-1">Click any parcel on the map to select it</p>
              <p className="text-muted-foreground">
                Zoom in to see individual parcel boundaries. Parcels will load automatically as you pan the map.
              </p>
            </div>
            
            {/* Map Container */}
            <div className="h-[500px] relative">
              {isMapLoading && (
                <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading parcels...</p>
                  </div>
                </div>
              )}
              <MapLibreCanvas
                center={mapCenter}
                zoom={15}
                showParcels={true}
                onParcelSelect={handleMapParcelSelect}
                className="w-full h-full"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Selection Confirmation */}
      {selectedParcelFromMap && (
        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
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
  );
}
