import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MapLegendProps {
  hasFloodZones?: boolean;
  hasTraffic?: boolean;
  hasEmployment?: boolean;
}

/**
 * MapLegend - Interactive legend component for map symbols
 * 
 * Provides color-coded keys for:
 * - FEMA flood zones (risk-based colors)
 * - TxDOT traffic segments (AADT gradient)
 * - Parcel boundaries
 * - Employment centers
 * 
 * @accessibility Keyboard navigable accordion with focus management
 */
export function MapLegend({
  hasFloodZones = false,
  hasTraffic = false,
  hasEmployment = false,
}: MapLegendProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card className="absolute bottom-4 right-4 w-64 shadow-lg bg-background/95 backdrop-blur-sm z-10">
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
          <CardContent className="p-3 pt-0 space-y-3 text-xs">
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

            <p className="text-[10px] text-muted-foreground pt-2 border-t">
              Data: FEMA NFHL, TxDOT, County GIS
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
