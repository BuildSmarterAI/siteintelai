import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Upload, Edit3, ArrowRight } from "lucide-react";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { MapLibreCanvas } from "@/components/MapLibreCanvas";
import { DrawParcelControl } from "@/components/DrawParcelControl";
import { useToast } from "@/hooks/use-toast";

export default function SiteDefinition() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<'address' | 'upload' | 'draw' | null>(null);
  const [geometry, setGeometry] = useState<any>(null);

  const handleAddressSelect = (data: any) => {
    if (data?.geometry) {
      setGeometry(data.geometry);
      setSelectedMethod('address');
      toast({
        title: "Address Found",
        description: "Parcel boundary retrieved successfully.",
      });
      // Auto-advance to confirmation
      setTimeout(() => navigate('/feasibility/confirm', { state: { geometry: data.geometry, method: 'address' } }), 500);
    }
  };

  const handleDrawComplete = (geojson: any) => {
    setGeometry(geojson);
    setSelectedMethod('draw');
    toast({
      title: "Boundary Drawn",
      description: "Your custom parcel boundary has been saved.",
    });
  };

  const handleUpload = (file: File) => {
    // Placeholder for file upload
    toast({
      title: "Upload Feature",
      description: "File upload will be processed here (.geojson, .kml, .shp)",
    });
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-headline font-bold text-foreground mb-3">
              Define Your Site
            </h1>
            <p className="text-lg text-muted-foreground">
              Choose how you want to define your property boundary
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Methods */}
            <div className="space-y-4">
              {/* Address Input Card */}
              <Card className={selectedMethod === 'address' ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-6 h-6 text-primary mt-1" />
                    <div>
                      <CardTitle>📍 Address / Parcel</CardTitle>
                      <CardDescription>
                        Type an address or APN to automatically retrieve the parcel boundary
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <AddressAutocomplete 
                    value=""
                    onChange={(value, coordinates, addressDetails) => {
                      if (coordinates) {
                        handleAddressSelect({ geometry: coordinates, addressDetails });
                      }
                    }}
                    placeholder="Enter property address..."
                  />
                </CardContent>
              </Card>

              {/* Upload Card */}
              <Card className={selectedMethod === 'upload' ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Upload className="w-6 h-6 text-primary mt-1" />
                    <div>
                      <CardTitle>📂 Upload Boundary</CardTitle>
                      <CardDescription>
                        Upload .geojson, .kml, or .zip shapefile
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <input
                    type="file"
                    accept=".geojson,.kml,.zip,.shp"
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </CardContent>
              </Card>

              {/* Draw on Map Card */}
              <Card className={selectedMethod === 'draw' ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Edit3 className="w-6 h-6 text-primary mt-1" />
                    <div>
                      <CardTitle>✏️ Draw on Map</CardTitle>
                      <CardDescription>
                        Manually outline your parcel on the map
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedMethod('draw')}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Start Drawing
                  </Button>
                </CardContent>
              </Card>

              {/* Continue Button */}
              {geometry && (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/feasibility/confirm', { state: { geometry, method: selectedMethod } })}
                >
                  Continue to Confirmation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

            {/* Map */}
            <div className="lg:sticky lg:top-24 h-[600px]">
              <MapLibreCanvas 
                center={[29.7604, -95.3698]} 
                zoom={10}
                drawingEnabled={selectedMethod === 'draw'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
