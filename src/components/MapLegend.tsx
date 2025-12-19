import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Map, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface MapLegendProps {
  hasFloodZones?: boolean;
  hasTraffic?: boolean;
  hasEmployment?: boolean;
  hasParcels?: boolean; // Unified parcel indicator
  hasWaterLines?: boolean;
  hasSewerLines?: boolean;
  hasStormLines?: boolean;
  hasStormManholes?: boolean;
  hasForceMain?: boolean;
  hasZoningDistricts?: boolean;
  // Preset context
  presetId?: string;
  presetLabel?: string;
  onResetToDefault?: () => void;
}

/**
 * MapLegend - Simplified interactive legend component for map symbols
 * 
 * Only shows legend items for VISIBLE layers to reduce clutter.
 * Merged "Parcel" and "HCAD Parcels" into single "Parcels" section.
 * 
 * @accessibility WCAG 2.1 AA compliant with keyboard nav and 48px touch targets
 */
export function MapLegend({
  hasFloodZones = false,
  hasTraffic = false,
  hasEmployment = false,
  hasParcels = false,
  hasWaterLines = false,
  hasSewerLines = false,
  hasStormLines = false,
  hasStormManholes = false,
  hasForceMain = false,
  hasZoningDistricts = false,
  presetId,
  presetLabel,
  onResetToDefault,
}: MapLegendProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Check if any layers are visible to show the legend
  const hasAnyLayers = hasParcels || hasFloodZones || hasTraffic || hasEmployment || 
    hasWaterLines || hasSewerLines || hasStormLines || hasStormManholes || 
    hasForceMain || hasZoningDistricts;

  const legendContent = (
    <div className="space-y-3 text-xs">
      {/* Preset indicator */}
      {presetLabel && (
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
            <span className="font-medium text-foreground">{presetLabel}</span>
          </div>
          {presetId !== 'decision_mode' && onResetToDefault && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetToDefault}
              className="h-6 px-2 text-[10px]"
            >
              Reset
            </Button>
          )}
        </div>
      )}

      {/* Parcels - Unified section (always shown when parcels visible) */}
      {hasParcels && (
        <div className="space-y-1.5">
          <p className="font-medium text-foreground">Parcels</p>
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-3 border-2 rounded-sm"
              style={{
                borderColor: '#FF7A00',
                backgroundColor: 'rgba(255, 122, 0, 0.25)',
              }}
            />
            <span className="text-muted-foreground">Property boundaries</span>
          </div>
        </div>
      )}

      {/* FEMA Flood Zones - Only show if flood layer is on */}
      {hasFloodZones && (
        <div className="space-y-1.5 pt-2 border-t">
          <p className="font-medium text-foreground">Flood Risk</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-3 rounded-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }} />
              <span className="text-muted-foreground">High (Zone AE/VE)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-3 rounded-sm" style={{ backgroundColor: 'rgba(249, 115, 22, 0.2)' }} />
              <span className="text-muted-foreground">Moderate (Zone AO/AH)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-3 rounded-sm" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }} />
              <span className="text-muted-foreground">Low (Zone X)</span>
            </div>
          </div>
        </div>
      )}

      {/* TxDOT Traffic - Only show if traffic layer is on */}
      {hasTraffic && (
        <div className="space-y-1.5 pt-2 border-t">
          <p className="font-medium text-foreground">Traffic Volume (AADT)</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#EF4444' }} />
              <span className="text-muted-foreground">&gt;100K vehicles/day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
              <span className="text-muted-foreground">50K-100K vehicles/day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#10B981' }} />
              <span className="text-muted-foreground">&lt;50K vehicles/day</span>
            </div>
          </div>
        </div>
      )}

      {/* Employment Centers - Only show if employment layer is on */}
      {hasEmployment && (
        <div className="space-y-1.5 pt-2 border-t">
          <p className="font-medium text-foreground">Employment</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 border border-white" />
            <span className="text-muted-foreground">Job clusters</span>
          </div>
        </div>
      )}

      {/* Water Lines - Only show if visible */}
      {hasWaterLines && (
        <div className="space-y-1.5 pt-2 border-t">
          <p className="font-medium text-foreground">Water</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#1F6AE1' }} />
            <span className="text-muted-foreground">Water mains</span>
          </div>
        </div>
      )}

      {/* Sewer Lines - Only show if visible */}
      {hasSewerLines && (
        <div className="space-y-1.5 pt-2 border-t">
          <p className="font-medium text-foreground">Sewer</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#7A4A2E' }} />
            <span className="text-muted-foreground">Sewer lines</span>
          </div>
        </div>
      )}

      {/* Storm Lines - Only show if visible */}
      {hasStormLines && (
        <div className="space-y-1.5 pt-2 border-t">
          <p className="font-medium text-foreground">Stormwater</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#1C7C7C' }} />
            <span className="text-muted-foreground">Storm drains</span>
          </div>
        </div>
      )}

      {/* Storm Manholes - Only show if visible */}
      {hasStormManholes && (
        <div className="space-y-1.5 pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-teal-400 border-2 border-teal-700 rounded-full" />
            <span className="text-muted-foreground">Storm manholes</span>
          </div>
        </div>
      )}

      {/* Force Main - Only show if visible */}
      {hasForceMain && (
        <div className="space-y-1.5 pt-2 border-t">
          <p className="font-medium text-foreground">Force Main</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
            <span className="text-muted-foreground">Pressurized sewer</span>
          </div>
        </div>
      )}

      {/* Zoning Districts - Only show if visible */}
      {hasZoningDistricts && (
        <div className="space-y-1.5 pt-2 border-t">
          <p className="font-medium text-foreground">Zoning</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 rounded-sm" style={{ backgroundColor: 'rgba(236, 72, 153, 0.3)', border: '1px solid #EC4899' }} />
            <span className="text-muted-foreground">Zoning districts</span>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground pt-2 border-t">
        Data: FEMA, TxDOT, County GIS, Houston Public Works
      </p>
    </div>
  );

  // Don't render anything if no layers are visible
  if (!hasAnyLayers && !presetLabel) {
    return null;
  }

  return (
    <>
      {/* Mobile: Drawer with trigger button */}
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              size="lg"
              className="fixed top-4 left-4 z-20 h-12 w-12 p-0 shadow-lg"
              aria-label="Show map legend"
            >
              <Map className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh]">
            <SheetHeader>
              <SheetTitle>Map Legend</SheetTitle>
            </SheetHeader>
            <div className="mt-6 overflow-auto">
              {legendContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Card in bottom-right */}
      <Card className="hidden lg:block absolute bottom-4 right-4 w-56 shadow-lg bg-background/95 backdrop-blur-sm z-10">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="p-3 pb-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <CardTitle className="text-sm font-semibold">Legend</CardTitle>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </CollapsibleTrigger>
          </CardHeader>
          
          <CollapsibleContent>
            <CardContent className="p-3 pt-0">
              {legendContent}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </>
  );
}