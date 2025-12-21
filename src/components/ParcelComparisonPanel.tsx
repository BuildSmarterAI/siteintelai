import { motion } from 'framer-motion';
import { X, Download, MapPin, User, Ruler, Building, DollarSign, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useParcelComparisonStore, ComparisonParcel } from '@/stores/useParcelComparisonStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface ParcelComparisonPanelProps {
  open: boolean;
  onClose: () => void;
}

// Helper to format values for comparison
function formatValue(value: unknown, type: 'number' | 'currency' | 'string' = 'string'): string {
  if (value === null || value === undefined) return '—';
  
  if (type === 'currency' && typeof value === 'number') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }
  
  if (type === 'number' && typeof value === 'number') {
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  
  return String(value);
}

// Find best/worst values for highlighting
function findExtremes(parcels: ComparisonParcel[], field: keyof ComparisonParcel, higherIsBetter = true) {
  const values = parcels.map((p, i) => ({ value: p[field] as number | null, index: i })).filter(v => v.value !== null);
  if (values.length === 0) return { best: -1, worst: -1 };
  
  const sorted = [...values].sort((a, b) => (a.value ?? 0) - (b.value ?? 0));
  return higherIsBetter 
    ? { best: sorted[sorted.length - 1].index, worst: sorted[0].index }
    : { worst: sorted[sorted.length - 1].index, best: sorted[0].index };
}

export function ParcelComparisonPanel({ open, onClose }: ParcelComparisonPanelProps) {
  const { comparedParcels, removeFromComparison, clearComparison } = useParcelComparisonStore();

  const acreageExtremes = findExtremes(comparedParcels, 'acreage', true);
  const valueExtremes = findExtremes(comparedParcels, 'market_value', true);

  // Export to CSV
  const handleExport = () => {
    const headers = ['Parcel ID', 'Address', 'Owner', 'Acreage', 'Land Use', 'Jurisdiction', 'Market Value'];
    const rows = comparedParcels.map(p => [
      p.parcel_id,
      p.situs_address || '',
      p.owner_name || '',
      p.acreage?.toString() || '',
      p.land_use_desc || '',
      p.jurisdiction || '',
      p.market_value?.toString() || '',
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parcel-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="h-[70vh] sm:h-[60vh]">
        <SheetHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <SheetTitle className="flex items-center gap-2">
              <span>Parcel Comparison</span>
              <Badge variant="secondary">{comparedParcels.length} parcels</Badge>
            </SheetTitle>
            <SheetDescription>
              Compare property attributes side by side
            </SheetDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={comparedParcels.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={clearComparison} className="text-muted-foreground">
              Clear All
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-full pt-4">
          {comparedParcels.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <MapPin className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-sm">No parcels selected for comparison</p>
              <p className="text-xs mt-1">Right-click on parcels to add them</p>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(comparedParcels.length, 4)}, 1fr)` }}>
              {comparedParcels.map((parcel, index) => (
                <motion.div
                  key={parcel.parcel_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="relative h-full">
                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-60 hover:opacity-100"
                      onClick={() => removeFromComparison(parcel.parcel_id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="truncate">
                          {parcel.situs_address || `Parcel ${parcel.parcel_id.slice(0, 10)}...`}
                        </span>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3 text-sm">
                      {/* Parcel ID */}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Parcel ID</p>
                          <p className="font-mono text-xs">{parcel.parcel_id}</p>
                        </div>
                      </div>

                      {/* Owner */}
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Owner</p>
                          <p className={parcel.owner_name ? '' : 'text-muted-foreground'}>
                            {formatValue(parcel.owner_name)}
                          </p>
                        </div>
                      </div>

                      {/* Acreage */}
                      <div className="flex items-start gap-2">
                        <Ruler className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Acreage</p>
                          <p className={`${acreageExtremes.best === index ? 'text-emerald-600 font-medium' : ''} ${acreageExtremes.worst === index && comparedParcels.length > 1 ? 'text-amber-600' : ''}`}>
                            {formatValue(parcel.acreage, 'number')} {parcel.acreage ? 'acres' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Land Use */}
                      <div className="flex items-start gap-2">
                        <Building className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Land Use</p>
                          <p className={parcel.land_use_desc ? '' : 'text-muted-foreground'}>
                            {formatValue(parcel.land_use_desc)}
                          </p>
                        </div>
                      </div>

                      {/* Jurisdiction */}
                      <div className="flex items-start gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Jurisdiction</p>
                          <p className={parcel.jurisdiction ? '' : 'text-muted-foreground'}>
                            {formatValue(parcel.jurisdiction)}
                          </p>
                        </div>
                      </div>

                      {/* Market Value */}
                      {parcel.market_value && (
                        <div className="flex items-start gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Market Value</p>
                            <p className={`${valueExtremes.best === index ? 'text-emerald-600 font-medium' : ''}`}>
                              {formatValue(parcel.market_value, 'currency')}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Source badge */}
                      {parcel.source && (
                        <Badge variant={parcel.source === 'canonical' ? 'default' : 'secondary'} className="mt-2">
                          {parcel.source === 'canonical' ? 'SiteIntel' : 'External'}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
