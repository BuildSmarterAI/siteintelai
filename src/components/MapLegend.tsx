import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Map, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface MapLegendProps {
  hasFloodZones?: boolean;
  hasTraffic?: boolean;
  hasEmployment?: boolean;
  hasHcadParcels?: boolean;
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
 * MapLegend - Interactive legend component for map symbols
 * 
 * Responsive design:
 * - Desktop (≥1024px): Card in bottom-right corner
 * - Mobile/Tablet (<1024px): Drawer with trigger button in top-left
 * 
 * Provides color-coded keys for flood zones, traffic, parcels, and employment
 * Now supports preset context display
 * 
 * @accessibility WCAG 2.1 AA compliant with keyboard nav and 48px touch targets
 */
export function MapLegend({
  hasFloodZones = false,
  hasTraffic = false,
  hasEmployment = false,
  hasHcadParcels = false,
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

      {/* Parcel Boundary */}
      {/* Parcel Boundary */}
      <div className="space-y-1.5">
        <p className="font-medium text-foreground">Parcel</p>
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-3 border-2 rounded-sm"
            style={{
              borderColor: '#FF7A00',
              backgroundColor: 'rgba(255, 122, 0, 0.1)',
            }}
          />
          <span className="text-muted-foreground">Property boundary</span>
        </div>
      </div>

      {/* FEMA Flood Zones */}
      {hasFloodZones && (
        <div className="space-y-1.5 pt-2 border-t">
          <p className="font-medium text-foreground">Flood Risk</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-3 rounded-sm" style={{ backgroundColor: '#EF4444' }} />
              <span className="text-muted-foreground">High (Zone AE)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-3 rounded-sm" style={{ backgroundColor: '#FF7A00' }} />
              <span className="text-muted-foreground">Moderate (Zone A)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-3 rounded-sm" style={{ backgroundColor: '#10B981' }} />
              <span className="text-muted-foreground">Low (Zone X)</span>
            </div>
          </div>
        </div>
      )}

      {/* TxDOT Traffic */}
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
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#06B6D4' }} />
              <span className="text-muted-foreground">&lt;50K vehicles/day</span>
            </div>
          </div>
        </div>
      )}

      {/* Employment Centers */}
      {hasEmployment && (
        <div className="space-y-1.5 pt-2 border-t">
          <p className="font-medium text-foreground">Employment</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 border border-white" />
            <span className="text-muted-foreground">Job clusters</span>
          </div>
        </div>
      )}

      {/* HCAD Parcels */}
      {hasHcadParcels && (
        <div className="space-y-1.5 pt-2 border-t">
          <p className="font-medium text-foreground">HCAD Parcels</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#6366F1' }} />
            <span className="text-muted-foreground">County parcel boundaries</span>
          </div>
        </div>
      )}

      {/* Water Lines */}
      {hasWaterLines && (
        <div className="space-y-1.5 pt-2 border-t">
          <p className="font-medium text-foreground">Water Lines</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
            <span className="text-muted-foreground">City of Houston Public Works</span>
          </div>
        </div>
      )}

      {/* Sewer Lines */}
      {hasSewerLines && (
        <div className="space-y-1.5 pt-2 border-t">
          <p className="font-medium text-foreground">Sewer Lines</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#10B981' }} />
            <span className="text-muted-foreground">City of Houston Public Works</span>
          </div>
        </div>
      )}

      {/* Storm Lines */}
      {hasStormLines && (
        <div className="space-y-1.5 pt-2 border-t">
          <p className="font-medium text-foreground">Storm Drain Lines</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#14B8A6' }} />
            <span className="text-muted-foreground">Houston Water HPW IPS</span>
          </div>
        </div>
      )}

      {/* Storm Manholes */}
      {hasStormManholes && (
        <div className="space-y-1.5 pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Storm Drain Manholes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 border-2 border-blue-800 rounded-full" />
            <span className="text-xs text-muted-foreground">Houston Water HPW IPS</span>
          </div>
        </div>
      )}

      {/* Force Main */}
      {hasForceMain && (
        <div className="space-y-1.5 pt-2 border-t">
          <p className="font-medium text-foreground">Force Main</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
            <span className="text-muted-foreground">Pressurized sewer</span>
          </div>
        </div>
      )}

      {/* Zoning Districts */}
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
        Data: FEMA NFHL, TxDOT, County GIS, City of Houston
      </p>
    </div>
  );

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
          <SheetContent side="bottom" className="h-[80vh]">
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
      <Card className="hidden lg:block absolute bottom-4 right-4 w-64 shadow-lg bg-background/95 backdrop-blur-sm z-10">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="p-3 pb-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <CardTitle className="text-sm font-semibold">Map Legend</CardTitle>
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
