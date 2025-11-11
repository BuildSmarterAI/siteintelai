import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapLibreCanvas } from "@/components/MapLibreCanvas";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as turf from "@turf/turf";

export default function ConfirmBoundary() {
  const navigate = useNavigate();
  const location = useLocation();
  const { geometry, method } = location.state || {};

  if (!geometry) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Boundary Defined</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please define a site boundary first.
            </p>
            <Button onClick={() => navigate('/feasibility/start')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Site Definition
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate parcel stats
  const area = turf.area(geometry);
  const acreage = (area / 4046.86).toFixed(2); // Convert sq meters to acres
  const bbox = turf.bbox(geometry);
  const frontage = turf.length(turf.lineString([
    [bbox[0], bbox[1]],
    [bbox[2], bbox[1]]
  ]), { units: 'feet' });

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-headline font-bold text-foreground mb-3">
              Confirm Your Boundary
            </h1>
            <p className="text-lg text-muted-foreground">
              Review the parcel details before proceeding
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr,400px] gap-6">
            {/* Map Preview */}
            <div className="h-[600px] rounded-lg overflow-hidden border">
              <MapLibreCanvas 
                center={[29.7604, -95.3698]} 
                zoom={12}
                parcel={geometry}
              />
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Parcel Summary</CardTitle>
                    <Badge variant="outline">{method || 'manual'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Area</div>
                    <div className="text-2xl font-bold">{acreage} acres</div>
                    <div className="text-xs text-muted-foreground">
                      ({area.toLocaleString()} sq ft)
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Approx. Frontage</div>
                    <div className="text-xl font-semibold">{frontage.toFixed(0)} ft</div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-status-success mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium">Boundary Ready</div>
                        <div className="text-muted-foreground">
                          Proceed to select your analysis type
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/feasibility/type', { state: { geometry, method } })}
                >
                  Confirm & Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/feasibility/start')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Site Definition
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
