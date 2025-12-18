import { useState, useEffect, useCallback } from "react";
import { MapLibreCanvas } from "@/components/MapLibreCanvas";
import { MapLoadingSkeleton } from "@/components/MapLoadingSkeleton";
import { SmartParcelSearch } from "./SmartParcelSearch";
import { DrawNavigationBar } from "./DrawNavigationBar";
import { DrawParcelSection } from "./DrawParcelSection";
import { SelectedParcelPanel } from "./SelectedParcelPanel";
import { motion, AnimatePresence } from "framer-motion";

interface PropertyStepMapFirstProps {
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
  onDrawnParcelSave?: (parcel: { 
    geometry: GeoJSON.Polygon; 
    name: string; 
    acreage: number; 
    centroid: { lat: number; lng: number }; 
    id?: string 
  }) => void;
  onContinue: () => void;
  errors: Record<string, string>;
  isAddressLoading: boolean;
  applicationId?: string;
}

type ViewMode = 'search' | 'draw-navigate' | 'draw-active';

export function PropertyStepMapFirst({
  formData,
  onChange,
  onAddressSelect,
  onParcelSelect,
  onEnrichmentComplete,
  onDrawnParcelSave,
  onContinue,
  errors,
  isAddressLoading,
  applicationId
}: PropertyStepMapFirstProps) {
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([29.7604, -95.3698]);
  const [mapZoom, setMapZoom] = useState(11);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('search');

  // Update map center when coordinates change
  useEffect(() => {
    if (formData.geoLat && formData.geoLng) {
      setMapCenter([formData.geoLat, formData.geoLng]);
      setMapZoom(17);
    }
  }, [formData.geoLat, formData.geoLng]);

  // Handle address selection from search
  const handleAddressSelect = useCallback((lat: number, lng: number, address: string) => {
    setMapCenter([lat, lng]);
    setMapZoom(17);
    onAddressSelect(lat, lng, address);
  }, [onAddressSelect]);

  // Handle navigation to a location (for draw mode)
  const handleNavigateToLocation = useCallback((lat: number, lng: number, zoom?: number) => {
    setMapCenter([lat, lng]);
    setMapZoom(zoom || 17);
  }, []);

  // Handle parcel selection from map click
  const handleMapParcelSelect = useCallback((parcel: any) => {
    const props = parcel.properties || {};
    
    setSelectedParcel({
      id: props.ACCOUNT || props.parcelId || props.apn || 'Unknown',
      address: props.SITUS_ADDR || props.situs_address || props.address || 'Unknown Address',
      acreage: props.ACREAGE || props.acreage || 0,
      owner: props.OWNER_NAME || props.owner_name || props.parcelOwner,
      zoning: props.ZONING || props.zoning,
      county: props.COUNTY || props.county || props.jurisdiction,
      geometry: parcel.geometry,
      lat: props.lat || (parcel.geometry?.coordinates?.[0]?.[0]?.[1]),
      lng: props.lng || (parcel.geometry?.coordinates?.[0]?.[0]?.[0]),
    });

    if (onParcelSelect) {
      onParcelSelect(parcel);
    }
  }, [onParcelSelect]);

  // Handle parcel selection from search (smart search or APN)
  const handleSearchParcelSelect = useCallback((parcel: any) => {
    setSelectedParcel({
      id: parcel.parcel_id || parcel.id,
      address: parcel.situs_address || parcel.address || 'Unknown Address',
      acreage: parcel.acreage || 0,
      owner: parcel.owner_name || parcel.owner,
      zoning: parcel.zoning,
      county: parcel.county,
      geometry: parcel.geometry,
      lat: parcel.lat,
      lng: parcel.lng,
    });

    if (parcel.lat && parcel.lng) {
      setMapCenter([parcel.lat, parcel.lng]);
      setMapZoom(17);
    }

    if (onParcelSelect) {
      onParcelSelect(parcel);
    }
  }, [onParcelSelect]);

  // Handle start draw mode
  const handleStartDraw = useCallback(() => {
    setViewMode('draw-navigate');
  }, []);

  // Handle confirm draw location
  const handleConfirmDrawLocation = useCallback(() => {
    setViewMode('draw-active');
  }, []);

  // Handle cancel draw
  const handleCancelDraw = useCallback(() => {
    setViewMode('search');
  }, []);

  // Handle drawn parcel
  const handleDrawnParcel = useCallback((parcel: { 
    geometry: GeoJSON.Polygon; 
    name: string; 
    acreage: number; 
    centroid: { lat: number; lng: number }; 
    id?: string 
  }) => {
    setSelectedParcel({
      id: parcel.id || 'CUSTOM',
      address: parcel.name,
      acreage: parcel.acreage,
      isDrawn: true,
      lat: parcel.centroid.lat,
      lng: parcel.centroid.lng,
      geometry: parcel.geometry,
    });
    
    setMapCenter([parcel.centroid.lat, parcel.centroid.lng]);
    setMapZoom(16);
    setViewMode('search'); // Return to search mode after drawing
    
    if (onDrawnParcelSave) {
      onDrawnParcelSave(parcel);
    }
  }, [onDrawnParcelSave]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedParcel(null);
    onChange('propertyAddress', '');
    onChange('geoLat', undefined);
    onChange('geoLng', undefined);
    onChange('parcelId', '');
  }, [onChange]);

  // Confirm selection and continue
  const handleConfirmSelection = useCallback(() => {
    if (selectedParcel) {
      // Update form data with selected parcel info
      if (selectedParcel.address && selectedParcel.address !== 'Unknown Address') {
        onChange('propertyAddress', selectedParcel.address);
      }
      if (selectedParcel.lat && selectedParcel.lng) {
        onChange('geoLat', selectedParcel.lat);
        onChange('geoLng', selectedParcel.lng);
      }
      if (selectedParcel.id) {
        onChange('parcelId', selectedParcel.id);
      }
      if (selectedParcel.acreage) {
        onChange('lotSize', selectedParcel.acreage.toString());
        onChange('lotSizeUnit', 'acres');
      }
      if (selectedParcel.owner) {
        onChange('parcelOwner', selectedParcel.owner);
      }
      if (selectedParcel.zoning) {
        onChange('zoning', selectedParcel.zoning);
      }
      if (selectedParcel.county) {
        onChange('county', selectedParcel.county);
      }
    }
    onContinue();
  }, [selectedParcel, onChange, onContinue]);

  return (
    <div className="relative w-full h-[calc(100vh-120px)] min-h-[600px]">
      {/* Full-width Map */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {isMapLoading && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10"
            >
              <MapLoadingSkeleton message="Loading map..." />
            </motion.div>
          )}
        </AnimatePresence>
        
        <MapLibreCanvas
          center={mapCenter}
          zoom={mapZoom}
          showParcels={true}
          onParcelSelect={handleMapParcelSelect}
          onMapLoad={() => setIsMapLoading(false)}
          className="w-full h-full"
        />
      </div>

      {/* Floating Search/Navigation Panel - Top Left */}
      <div className="absolute top-4 left-4 z-20 w-full max-w-md">
        <AnimatePresence mode="wait">
          {viewMode === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SmartParcelSearch
                onAddressSelect={handleAddressSelect}
                onParcelSelect={handleSearchParcelSelect}
                onNavigateToLocation={handleNavigateToLocation}
                onStartDraw={handleStartDraw}
                mapCenter={mapCenter}
                currentAddress={formData.propertyAddress}
                isDrawMode={false}
              />
            </motion.div>
          )}

          {viewMode === 'draw-navigate' && (
            <motion.div
              key="draw-navigate"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DrawNavigationBar
                onNavigate={handleNavigateToLocation}
                onConfirmLocation={handleConfirmDrawLocation}
                onCancel={handleCancelDraw}
                currentCenter={mapCenter}
              />
            </motion.div>
          )}

          {viewMode === 'draw-active' && (
            <motion.div
              key="draw-active"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DrawParcelSection
                onParcelDrawn={handleDrawnParcel}
                initialCenter={mapCenter}
                applicationId={applicationId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Selected Parcel Panel - Bottom */}
      <AnimatePresence>
        {(selectedParcel || formData.propertyAddress) && viewMode === 'search' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-4 left-4 right-4 z-20 max-w-2xl mx-auto"
          >
            <SelectedParcelPanel
              parcel={selectedParcel || {
                address: formData.propertyAddress,
                id: formData.parcelId,
                acreage: formData.lotSize ? parseFloat(formData.lotSize) : undefined,
                owner: formData.parcelOwner,
                zoning: formData.zoning,
                county: formData.county,
                lat: formData.geoLat,
                lng: formData.geoLng,
              }}
              onClear={handleClearSelection}
              onContinue={handleConfirmSelection}
              isLoading={isAddressLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error display */}
      {errors.propertyAddress && (
        <div className="absolute top-4 right-4 z-20 bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg shadow-lg">
          {errors.propertyAddress}
        </div>
      )}
    </div>
  );
}
