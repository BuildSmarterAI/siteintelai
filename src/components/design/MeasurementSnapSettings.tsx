/**
 * Measurement Snap Settings Popover
 * Configure which geometries to snap to and snap distance
 */

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2 } from "lucide-react";
import { useDesignStore } from "@/stores/useDesignStore";

export function MeasurementSnapSettings() {
  const { measurementSnapSettings, setMeasurementSnapSettings } = useDesignStore();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-4">
          <div className="font-medium text-sm">Snap Settings</div>
          
          {/* Snap targets */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="snap-parcel"
                checked={measurementSnapSettings.snapToParcel}
                onCheckedChange={(checked) =>
                  setMeasurementSnapSettings({ snapToParcel: !!checked })
                }
              />
              <Label htmlFor="snap-parcel" className="text-sm">
                Parcel Boundary
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="snap-buildable"
                checked={measurementSnapSettings.snapToBuildable}
                onCheckedChange={(checked) =>
                  setMeasurementSnapSettings({ snapToBuildable: !!checked })
                }
              />
              <Label htmlFor="snap-buildable" className="text-sm">
                Buildable Area
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="snap-buildings"
                checked={measurementSnapSettings.snapToBuildings}
                onCheckedChange={(checked) =>
                  setMeasurementSnapSettings({ snapToBuildings: !!checked })
                }
              />
              <Label htmlFor="snap-buildings" className="text-sm">
                Building Footprints
              </Label>
            </div>
          </div>

          {/* Snap distance */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Snap Distance</span>
              <span className="font-mono">{measurementSnapSettings.snapThresholdFeet} ft</span>
            </div>
            <Slider
              value={[measurementSnapSettings.snapThresholdFeet]}
              onValueChange={([value]) =>
                setMeasurementSnapSettings({ snapThresholdFeet: value })
              }
              min={5}
              max={30}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
