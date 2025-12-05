import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapLibreCanvas } from '@/components/MapLibreCanvas';
import { ParcelSearchBar } from '@/components/ParcelSearchBar';
import { ParcelDetailsPopup } from '@/components/ParcelDetailsPopup';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin } from 'lucide-react';

// County center coordinates for quick jump
const COUNTY_CENTERS: Record<string, { lat: number; lng: number; label: string }> = {
  harris: { lat: 29.7604, lng: -95.3698, label: 'Harris County' },
  fortbend: { lat: 29.5458, lng: -95.7697, label: 'Fort Bend County' },
  montgomery: { lat: 30.3116, lng: -95.4560, label: 'Montgomery County' },
  travis: { lat: 30.2672, lng: -97.7431, label: 'Travis County' },
  dallas: { lat: 32.7767, lng: -96.7970, label: 'Dallas County' },
  tarrant: { lat: 32.7357, lng: -97.1081, label: 'Tarrant County' },
  bexar: { lat: 29.4241, lng: -98.4936, label: 'Bexar County' },
  williamson: { lat: 30.6789, lng: -97.6782, label: 'Williamson County' },
};

// County boundary boxes for detection
const COUNTY_BOUNDS: Record<string, { minLng: number; maxLng: number; minLat: number; maxLat: number }> = {
  harris: { minLng: -95.91, maxLng: -94.91, minLat: 29.49, maxLat: 30.17 },
  montgomery: { minLng: -95.86, maxLng: -95.07, minLat: 30.07, maxLat: 30.67 },
  travis: { minLng: -98.17, maxLng: -97.37, minLat: 30.07, maxLat: 30.63 },
  bexar: { minLng: -98.81, maxLng: -98.09, minLat: 29.17, maxLat: 29.73 },
  dallas: { minLng: -97.05, maxLng: -96.52, minLat: 32.55, maxLat: 33.02 },
  tarrant: { minLng: -97.55, maxLng: -96.98, minLat: 32.55, maxLat: 33.00 },
  williamson: { minLng: -98.05, maxLng: -97.28, minLat: 30.48, maxLat: 30.91 },
  fortbend: { minLng: -96.01, maxLng: -95.45, minLat: 29.35, maxLat: 29.82 },
};

function detectCounty(lat: number, lng: number): string | null {
  for (const [county, bounds] of Object.entries(COUNTY_BOUNDS)) {
    if (lng >= bounds.minLng && lng <= bounds.maxLng && 
        lat >= bounds.minLat && lat <= bounds.maxLat) {
      return county;
    }
  }
  return null;
}

export default function ParcelExplorer() {
  const navigate = useNavigate();
  const [center, setCenter] = useState<[number, number]>([29.7604, -95.3698]); // Houston default
  const [zoom, setZoom] = useState(15);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [currentCounty, setCurrentCounty] = useState<string>('harris');

  // Update current county when center changes
  useEffect(() => {
    const detected = detectCounty(center[0], center[1]);
    if (detected) {
      setCurrentCounty(detected);
    }
  }, [center]);

  const handleAddressSelect = (lat: number, lng: number, address: string) => {
    setCenter([lat, lng]);
    setZoom(17);
  };

  const handleParcelSelect = (parcel: any) => {
    const props = parcel.properties || {};
    
    setSelectedParcel({
      id: props.parcel_id || props.ACCOUNT || props.acct_num || 'Unknown',
      address: props.situs_address || props.SITUS_ADDRESS || 'Unknown Address',
      owner: props.owner_name || props.OWNER_NAME || 'Unknown',
      acreage: props.acreage || props.ACREAGE || props.Acreage || 0,
      landValue: props.market_value || props.land_value || props.LAND_VALUE || 0,
      imprValue: props.improvement_value || props.impr_value || props.IMPR_VALUE || 0,
      county: props.county || currentCounty,
      source: props.source || COUNTY_CENTERS[currentCounty]?.label || 'County CAD',
      geometry: parcel.geometry,
    });
  };

  const handleUseForAnalysis = (parcel: any) => {
    const params = new URLSearchParams({
      address: parcel.address || '',
      parcelId: parcel.id,
      lat: center[0].toString(),
      lng: center[1].toString(),
      county: parcel.county || currentCounty,
    });
    navigate(`/application?${params.toString()}`);
  };

  const handleCountyJump = (countyKey: string) => {
    const countyCenter = COUNTY_CENTERS[countyKey];
    if (countyCenter) {
      setCenter([countyCenter.lat, countyCenter.lng]);
      setZoom(12);
      setCurrentCounty(countyKey);
      setSelectedParcel(null);
    }
  };

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0">
      {/* Map Layer - Background */}
      <div className="absolute inset-0 z-0">
        <MapLibreCanvas
          center={center}
          zoom={zoom}
          showParcels={true}
          onParcelSelect={handleParcelSelect}
          className="h-full w-full"
        />
      </div>

      {/* UI Controls Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          {/* Top Header with Back Button and County Indicator */}
          <div className="absolute top-20 left-4 right-4 flex items-center justify-between gap-4">
            {/* County Badge & Jump */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="shadow-lg bg-background/95 backdrop-blur-sm px-3 py-1.5">
                <MapPin className="h-3 w-3 mr-1.5" />
                {COUNTY_CENTERS[currentCounty]?.label || 'Unknown County'}
              </Badge>
              
              <Select value={currentCounty} onValueChange={handleCountyJump}>
                <SelectTrigger className="w-[160px] h-8 bg-background/95 backdrop-blur-sm shadow-lg text-xs">
                  <SelectValue placeholder="Jump to county..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COUNTY_CENTERS).map(([key, value]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Back Button */}
            <Button
              onClick={() => navigate(-1)}
              variant="secondary"
              size="sm"
              className="shadow-lg bg-background/95 backdrop-blur-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Search Bar */}
          <ParcelSearchBar
            onAddressSelect={handleAddressSelect}
            onParcelSelect={handleParcelSelect}
            containerClassName="top-32 md:top-32 z-30"
            initialCounty={currentCounty}
          />
        </div>
      </div>

      {/* Parcel Details Popup */}
      {selectedParcel && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="pointer-events-auto">
            <ParcelDetailsPopup
              parcel={selectedParcel}
              onClose={() => setSelectedParcel(null)}
              onUseForAnalysis={handleUseForAnalysis}
            />
          </div>
        </div>
      )}
    </div>
  );
}
