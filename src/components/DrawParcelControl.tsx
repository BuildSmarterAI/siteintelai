import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, X, Save } from 'lucide-react';
import { toast } from 'sonner';

interface DrawParcelControlProps {
  drawingActive: boolean;
  onToggleDrawing: () => void;
  onSaveParcel: (name: string) => Promise<void>;
  onCancelDrawing: () => void;
  calculatedAcreage?: number;
  isSaving?: boolean;
  editMode?: boolean;
  editingParcelName?: string;
}

export function DrawParcelControl({
  drawingActive,
  onToggleDrawing,
  onSaveParcel,
  onCancelDrawing,
  calculatedAcreage,
  isSaving = false,
  editMode = false,
  editingParcelName = '',
}: DrawParcelControlProps) {
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [parcelName, setParcelName] = useState(editingParcelName);

  const handleStartDrawing = () => {
    onToggleDrawing();
    if (editMode) {
      toast.info('Drag vertices to edit the parcel. Click Finish when done.');
    } else {
      toast.info('Click on the map to start drawing. Double-click to finish.');
    }
  };

  const handleFinishDrawing = () => {
    setShowNameDialog(true);
  };

  const handleSave = async () => {
    if (!parcelName.trim()) {
      toast.error('Please enter a name for this parcel');
      return;
    }

    try {
      await onSaveParcel(parcelName);
      setShowNameDialog(false);
      setParcelName('');
      toast.success('Parcel saved successfully!');
    } catch (error) {
      console.error('Failed to save parcel:', error);
      toast.error('Failed to save parcel');
    }
  };

  const handleCancel = () => {
    onCancelDrawing();
    setShowNameDialog(false);
    setParcelName('');
  };

  return (
    <>
      {/* Drawing Control Button */}
      <Card className="absolute top-4 right-4 z-10 shadow-lg">
        <div className="p-2">
      {!drawingActive ? (
            <Button
              onClick={handleStartDrawing}
              size="sm"
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              {editMode ? 'Edit Parcel' : 'Draw Parcel'}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleFinishDrawing}
                size="sm"
                variant="default"
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Finish
              </Button>
              <Button
                onClick={handleCancel}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Drawing Instructions Overlay */}
      {drawingActive && (
        <div className="absolute top-20 right-4 z-10">
          <Card className="p-4 bg-accent/90 backdrop-blur-sm border-primary/20 max-w-xs">
            <p className="text-sm font-medium text-primary">
              Drawing Mode Active
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click to add points. Double-click or press Enter to finish.
            </p>
          </Card>
        </div>
      )}

      {/* Save Parcel Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? 'Update Parcel' : 'Save Drawn Parcel'}</DialogTitle>
            <DialogDescription>
              {editMode ? 'Update the name for this parcel.' : 'Give your parcel a name to save it for future reference.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="parcel-name">Parcel Name</Label>
              <Input
                id="parcel-name"
                placeholder="e.g., South Lot, Building Site A"
                value={parcelName}
                onChange={(e) => setParcelName(e.target.value)}
                disabled={isSaving}
              />
            </div>
            
            {calculatedAcreage !== undefined && (
              <div className="rounded-lg bg-primary/10 p-3">
                <p className="text-sm font-medium">Calculated Area</p>
                <p className="text-2xl font-bold text-primary">
                  {calculatedAcreage.toFixed(2)} acres
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !parcelName.trim()}
            >
              {isSaving ? 'Saving...' : editMode ? 'Update Parcel' : 'Save Parcel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
