import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapLibreCanvas } from '@/components/MapLibreCanvas';
import { ParcelSearchBar } from '@/components/ParcelSearchBar';
import { ParcelDetailsPopup } from '@/components/ParcelDetailsPopup';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ParcelExplorer() {
  const navigate = useNavigate();
  const [center, setCenter] = useState<[number, number]>([29.7604, -95.3698]); // Houston [lat, lng]
  const [zoom, setZoom] = useState(15);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);

  const handleAddressSelect = (lat: number, lng: number, address: string) => {
    setCenter([lat, lng]);
    setZoom(17);
  };

  const handleParcelSelect = (parcel: any) => {
    setSelectedParcel({
      id: parcel.properties.ACCOUNT,
      address: parcel.properties.SITUS_ADDRESS,
      owner: parcel.properties.OWNER_NAME,
      acreage: parcel.properties.ACREAGE || 0,
      landValue: parcel.properties.LAND_VALUE || 0,
      imprValue: parcel.properties.IMPR_VALUE || 0,
      geometry: parcel.geometry,
    });
  };

  const handleUseForAnalysis = (parcel: any) => {
    // Navigate to application with pre-filled data
    const params = new URLSearchParams({
      address: parcel.address || '',
      parcelId: parcel.id,
      lat: center[0].toString(),
      lng: center[1].toString(),
    });
    navigate(`/application?${params.toString()}`);
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
          {/* Back Button */}
          <div className="absolute top-20 right-4">
            <Button
              onClick={() => navigate(-1)}
              variant="secondary"
              size="sm"
              className="shadow-lg"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Search Bar */}
          <ParcelSearchBar
            onAddressSelect={handleAddressSelect}
            onParcelSelect={handleParcelSelect}
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
