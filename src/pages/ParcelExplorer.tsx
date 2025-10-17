import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapLibreCanvas } from '@/components/MapLibreCanvas';
import { ParcelSearchBar } from '@/components/ParcelSearchBar';
import { ParcelDetailsPopup } from '@/components/ParcelDetailsPopup';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ParcelExplorer() {
  const navigate = useNavigate();
  const [center, setCenter] = useState<[number, number]>([-95.3698, 29.7604]); // Houston
  const [zoom, setZoom] = useState(15);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);

  const handleAddressSelect = (lat: number, lng: number, address: string) => {
    setCenter([lng, lat]);
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
      lat: center[1].toString(),
      lng: center[0].toString(),
    });
    navigate(`/application?${params.toString()}`);
  };

  return (
    <div className="relative h-screen w-full">
      {/* Back Button */}
      <div className="absolute top-4 right-4 z-20">
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

      {/* Map */}
      <MapLibreCanvas
        center={center}
        zoom={zoom}
        showParcels={true}
        onParcelSelect={handleParcelSelect}
        className="h-full w-full"
      />

      {/* Parcel Details Popup */}
      {selectedParcel && (
        <ParcelDetailsPopup
          parcel={selectedParcel}
          onClose={() => setSelectedParcel(null)}
          onUseForAnalysis={handleUseForAnalysis}
        />
      )}
    </div>
  );
}
