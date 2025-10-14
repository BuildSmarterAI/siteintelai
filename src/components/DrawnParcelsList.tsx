import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit, Trash2, ZoomIn, MapPin, Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface DrawnParcel {
  id: string;
  name: string;
  acreage_calc: number;
  created_at?: string;
  geometry: any;
}

interface DrawnParcelsListProps {
  parcels: DrawnParcel[];
  onEdit: (parcel: DrawnParcel) => void;
  onDelete: (parcelId: string) => void;
  onZoomTo: (parcel: DrawnParcel) => void;
  onDrawNew: () => void;
  isLoading?: boolean;
}

export function DrawnParcelsList({
  parcels,
  onEdit,
  onDelete,
  onZoomTo,
  onDrawNew,
  isLoading = false,
}: DrawnParcelsListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [parcelToDelete, setParcelToDelete] = useState<string | null>(null);

  const handleDeleteClick = (parcelId: string) => {
    setParcelToDelete(parcelId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (parcelToDelete) {
      onDelete(parcelToDelete);
      setDeleteDialogOpen(false);
      setParcelToDelete(null);
    }
  };

  const exportAsGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: parcels.map(parcel => ({
        type: 'Feature',
        properties: {
          name: parcel.name,
          acreage: parcel.acreage_calc,
          created_at: parcel.created_at,
        },
        geometry: parcel.geometry,
      })),
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `SiteIntel_Parcels_${Date.now()}.geojson`;
    link.href = URL.createObjectURL(blob);
    link.click();
    toast.success('Parcels exported as GeoJSON');
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            My Parcels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Loading parcels...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              My Parcels
              {parcels.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {parcels.length}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {parcels.length > 0 && (
                <Button onClick={exportAsGeoJSON} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              )}
              <Button onClick={onDrawNew} size="sm">
                Draw New
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {parcels.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground">No parcels drawn yet</p>
              <Button onClick={onDrawNew} variant="outline" size="sm">
                Draw your first parcel
              </Button>
            </div>
          ) : (
            parcels.map((parcel) => (
              <Card key={parcel.id} className="border-border/50">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <h4 className="font-medium text-foreground">
                        {parcel.name}
                      </h4>
                      <p className="text-lg font-bold text-primary">
                        {parcel.acreage_calc?.toFixed(2) || '0.00'} acres
                      </p>
                      {parcel.created_at && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(parcel.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onEdit(parcel)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => onZoomTo(parcel)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <ZoomIn className="h-3 w-3 mr-1" />
                      Zoom
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(parcel.id)}
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Parcel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this parcel? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
