import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Layers, Search, Download, MapPin, Database } from 'lucide-react';
import { useLayerDiscovery, DiscoveredLayer } from '@/hooks/useLayerDiscovery';

interface LayerDiscoveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapServerId?: string;
  initialUrl?: string;
  onImportComplete?: () => void;
}

export function LayerDiscoveryModal({
  open,
  onOpenChange,
  mapServerId,
  initialUrl = '',
  onImportComplete,
}: LayerDiscoveryModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [selectedLayers, setSelectedLayers] = useState<Set<number>>(new Set());
  const {
    isDiscovering,
    discoveryResult,
    isImporting,
    discoverLayers,
    importLayers,
    clearDiscovery,
  } = useLayerDiscovery();

  const handleDiscover = async () => {
    if (!url.trim()) return;
    setSelectedLayers(new Set());
    await discoverLayers(url.trim());
  };

  const toggleLayer = (layerId: number) => {
    setSelectedLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (!discoveryResult) return;
    setSelectedLayers(new Set(discoveryResult.layers.map(l => l.id)));
  };

  const deselectAll = () => {
    setSelectedLayers(new Set());
  };

  const handleImport = async () => {
    if (!mapServerId || !discoveryResult) return;

    const layersToImport = discoveryResult.layers.filter(l =>
      selectedLayers.has(l.id)
    );

    const success = await importLayers(mapServerId, layersToImport);
    if (success) {
      onImportComplete?.();
      onOpenChange(false);
      clearDiscovery();
      setSelectedLayers(new Set());
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    clearDiscovery();
    setSelectedLayers(new Set());
  };

  const getGeometryBadgeColor = (type: string) => {
    switch (type) {
      case 'Polygon':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'LineString':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Point':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Discover GIS Layers
          </DialogTitle>
          <DialogDescription>
            Enter a MapServer URL to automatically discover available layers and import them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="mapserver-url">MapServer URL</Label>
            <div className="flex gap-2">
              <Input
                id="mapserver-url"
                placeholder="https://example.com/arcgis/rest/services/ServiceName/MapServer"
                value={url}
                onChange={e => setUrl(e.target.value)}
                disabled={isDiscovering}
              />
              <Button
                onClick={handleDiscover}
                disabled={!url.trim() || isDiscovering}
              >
                {isDiscovering ? (
                  <>Discovering...</>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Discover
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {isDiscovering && (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {/* Discovery Results */}
          {discoveryResult && !isDiscovering && (
            <>
              {/* Service Info */}
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{discoveryResult.mapServerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {discoveryResult.layerCount} layers found
                      {discoveryResult.spatialReference && (
                        <> · SRID: {discoveryResult.spatialReference.wkid}</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                      Deselect All
                    </Button>
                  </div>
                </div>
              </div>

              {/* Layers List */}
              <ScrollArea className="flex-1 border rounded-lg">
                <Accordion type="multiple" className="w-full">
                  {discoveryResult.layers.map(layer => (
                    <AccordionItem key={layer.id} value={`layer-${layer.id}`}>
                      <div className="flex items-center px-4 py-2 hover:bg-muted/50">
                        <Checkbox
                          id={`layer-${layer.id}`}
                          checked={selectedLayers.has(layer.id)}
                          onCheckedChange={() => toggleLayer(layer.id)}
                          className="mr-3"
                        />
                        <AccordionTrigger className="flex-1 py-0 hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{layer.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {layer.suggestedLayerKey}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={getGeometryBadgeColor(layer.geometryTypeNormalized)}
                            >
                              {layer.geometryTypeNormalized}
                            </Badge>
                            <Badge variant="secondary">
                              {layer.fields.length} fields
                            </Badge>
                          </div>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent className="px-4 pb-4">
                        <div className="ml-10 space-y-3">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Source URL
                            </p>
                            <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
                              {layer.sourceUrl}
                            </code>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Fields ({layer.fields.length})
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {layer.fields.slice(0, 15).map(field => (
                                <Badge
                                  key={field.name}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {field.name}
                                </Badge>
                              ))}
                              {layer.fields.length > 15 && (
                                <Badge variant="outline" className="text-xs">
                                  +{layer.fields.length - 15} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          {Object.keys(layer.fieldMappings).length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Suggested Mappings
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(layer.fieldMappings).map(
                                  ([from, to]) => (
                                    <Badge
                                      key={from}
                                      className="text-xs bg-primary/20 text-primary"
                                    >
                                      {from} → {to}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            </>
          )}

          {/* Empty State */}
          {!discoveryResult && !isDiscovering && (
            <div className="flex-1 flex items-center justify-center border rounded-lg bg-muted/20">
              <div className="text-center p-8">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Enter a MapServer URL and click Discover to find available layers
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              !mapServerId ||
              selectedLayers.size === 0 ||
              isImporting ||
              !discoveryResult
            }
          >
            {isImporting ? (
              <>Importing...</>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Import {selectedLayers.size} Layer{selectedLayers.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
