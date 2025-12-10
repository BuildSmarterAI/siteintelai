import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Layers, Search, Download, MapPin, Database, Grid3X3, List, 
  ChevronDown, CheckCircle2, XCircle, AlertCircle 
} from 'lucide-react';
import { useLayerDiscovery, DiscoveredLayer, ServerDiscoveryResult } from '@/hooks/useLayerDiscovery';
import { LayerPreviewMap } from './LayerPreviewMap';

interface LayerDiscoveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapServerId?: string;
  initialUrl?: string;
  onImportComplete?: () => void;
  /** Pre-save mode: return selected layers instead of importing directly */
  onLayersSelected?: (layers: DiscoveredLayer[]) => void;
}

export function LayerDiscoveryModal({
  open,
  onOpenChange,
  mapServerId,
  initialUrl = '',
  onImportComplete,
  onLayersSelected,
}: LayerDiscoveryModalProps) {
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set()); // Use unique key: serverUrl_layerId
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
  const isPreSaveMode = !mapServerId && !!onLayersSelected;
  
  const {
    isDiscovering,
    discoveryResult,
    batchResult,
    batchProgress,
    isImporting,
    discoverLayers,
    discoverMultipleLayers,
    importLayers,
    clearDiscovery,
  } = useLayerDiscovery();

  // Parse URLs from textarea input
  const parsedUrls = useMemo(() => {
    return urlInput
      .split(/[\n,]+/)
      .map(u => u.trim())
      .filter(u => u.length > 0 && u.startsWith('http'));
  }, [urlInput]);

  const isBatchMode = parsedUrls.length > 1;

  // Get all layers from batch result or single result
  const allLayers = useMemo(() => {
    if (batchResult) {
      return batchResult.servers.flatMap(s => s.layers);
    }
    if (discoveryResult) {
      return discoveryResult.layers.map(l => ({
        ...l,
        serverUrl: discoveryResult.mapServerUrl,
        serverName: discoveryResult.mapServerName,
      }));
    }
    return [];
  }, [batchResult, discoveryResult]);

  // Generate unique key for a layer
  const getLayerKey = (layer: DiscoveredLayer) => 
    `${layer.serverUrl || ''}_${layer.id}`;

  const handleDiscover = async () => {
    if (parsedUrls.length === 0) return;
    setSelectedLayers(new Set());
    setExpandedServers(new Set());
    
    if (isBatchMode) {
      const result = await discoverMultipleLayers(parsedUrls);
      if (result) {
        // Auto-expand all successful servers
        setExpandedServers(new Set(
          result.servers.filter(s => s.status === 'success').map(s => s.url)
        ));
      }
    } else {
      await discoverLayers(parsedUrls[0]);
    }
  };

  const toggleLayer = (layer: DiscoveredLayer) => {
    const key = getLayerKey(layer);
    setSelectedLayers(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAllForServer = (server: ServerDiscoveryResult) => {
    setSelectedLayers(prev => {
      const next = new Set(prev);
      server.layers.forEach(l => next.add(getLayerKey(l)));
      return next;
    });
  };

  const deselectAllForServer = (server: ServerDiscoveryResult) => {
    setSelectedLayers(prev => {
      const next = new Set(prev);
      server.layers.forEach(l => next.delete(getLayerKey(l)));
      return next;
    });
  };

  const selectAll = () => {
    setSelectedLayers(new Set(allLayers.map(getLayerKey)));
  };

  const deselectAll = () => {
    setSelectedLayers(new Set());
  };

  const toggleServer = (url: string) => {
    setExpandedServers(prev => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  const handleImport = async () => {
    const layersToImport = allLayers.filter(l => selectedLayers.has(getLayerKey(l)));

    if (isPreSaveMode) {
      onLayersSelected?.(layersToImport);
      onOpenChange(false);
      clearDiscovery();
      setSelectedLayers(new Set());
      return;
    }

    if (!mapServerId) return;
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
    setExpandedServers(new Set());
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

  const hasResults = batchResult || discoveryResult;
  const servers = batchResult?.servers || (discoveryResult ? [{
    url: discoveryResult.mapServerUrl,
    name: discoveryResult.mapServerName,
    status: 'success' as const,
    layers: discoveryResult.layers,
    spatialReference: discoveryResult.spatialReference,
  }] : []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Discover GIS Layers
          </DialogTitle>
          <DialogDescription>
            Enter MapServer URLs to automatically discover available layers. Paste multiple URLs (one per line) for batch discovery.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="mapserver-urls">MapServer URLs</Label>
            <div className="flex gap-2">
              <Textarea
                id="mapserver-urls"
                placeholder="Paste one or more MapServer URLs (one per line)&#10;https://example.com/arcgis/rest/services/Service1/MapServer&#10;https://example.com/arcgis/rest/services/Service2/MapServer"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                disabled={isDiscovering}
                className="min-h-[80px] font-mono text-sm"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {parsedUrls.length === 0 
                  ? 'Enter at least one valid URL'
                  : parsedUrls.length === 1 
                    ? '1 URL detected'
                    : `${parsedUrls.length} URLs detected (batch mode)`
                }
              </p>
              <Button
                onClick={handleDiscover}
                disabled={parsedUrls.length === 0 || isDiscovering}
                size="sm"
              >
                {isDiscovering ? (
                  <>Discovering...</>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Discover {parsedUrls.length > 1 ? `${parsedUrls.length} URLs` : ''}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress Indicator */}
          {isDiscovering && batchProgress && (
            <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between text-sm">
                <span>Discovering servers...</span>
                <span className="font-medium">{batchProgress.current} / {batchProgress.total}</span>
              </div>
              <Progress value={(batchProgress.current / batchProgress.total) * 100} />
              <p className="text-xs text-muted-foreground truncate">
                {batchProgress.currentUrl}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isDiscovering && !batchProgress && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          )}

          {/* Discovery Results */}
          {hasResults && !isDiscovering && (
            <>
              {/* Summary & Controls */}
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    {batchResult ? (
                      <>
                        <p className="font-medium">
                          {batchResult.successCount} of {batchResult.totalUrls} servers discovered
                          {batchResult.failedCount > 0 && (
                            <span className="text-destructive ml-2">
                              ({batchResult.failedCount} failed)
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {batchResult.totalLayers} total layers found
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">{discoveryResult?.mapServerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {discoveryResult?.layerCount} layers found
                          {discoveryResult?.spatialReference && (
                            <> · SRID: {discoveryResult.spatialReference.wkid}</>
                          )}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex border rounded-md">
                      <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="rounded-r-none"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="rounded-l-none"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                      Deselect All
                    </Button>
                  </div>
                </div>
              </div>

              {/* Grouped Results by Server */}
              <ScrollArea className="flex-1">
                <div className="space-y-4 p-1">
                  {servers.map(server => {
                    const isExpanded = expandedServers.has(server.url);
                    const selectedInServer = server.layers.filter(l => 
                      selectedLayers.has(getLayerKey(l))
                    ).length;
                    
                    return (
                      <Collapsible
                        key={server.url}
                        open={isExpanded || !batchResult}
                        onOpenChange={() => batchResult && toggleServer(server.url)}
                      >
                        {/* Server Header */}
                        <div className={`rounded-lg border ${server.status === 'error' ? 'border-destructive/50 bg-destructive/10' : 'bg-card'}`}>
                          <CollapsibleTrigger className="w-full" disabled={!batchResult}>
                            <div className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-3">
                                {batchResult && (
                                  <ChevronDown 
                                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                  />
                                )}
                                {server.status === 'success' ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-destructive" />
                                )}
                                <div className="text-left">
                                  <p className="font-medium">{server.name}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-md">
                                    {server.url}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {server.status === 'success' && (
                                  <>
                                    <Badge variant="secondary">
                                      {server.layers.length} layers
                                    </Badge>
                                    {selectedInServer > 0 && (
                                      <Badge className="bg-primary">
                                        {selectedInServer} selected
                                      </Badge>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (selectedInServer === server.layers.length) {
                                          deselectAllForServer(server);
                                        } else {
                                          selectAllForServer(server);
                                        }
                                      }}
                                    >
                                      {selectedInServer === server.layers.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                  </>
                                )}
                                {server.status === 'error' && (
                                  <Badge variant="destructive">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    {server.error || 'Failed'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          {/* Server Layers */}
                          <CollapsibleContent>
                            {server.status === 'success' && (
                              <div className="border-t p-3">
                                {viewMode === 'grid' ? (
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {server.layers.map(layer => (
                                      <Card
                                        key={getLayerKey(layer)}
                                        className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${
                                          selectedLayers.has(getLayerKey(layer)) ? 'ring-2 ring-primary' : ''
                                        }`}
                                        onClick={() => toggleLayer(layer)}
                                      >
                                        <CardContent className="p-0">
                                          <LayerPreviewMap
                                            features={layer.sampleFeatures || []}
                                            geometryType={layer.geometryTypeNormalized}
                                            className="h-28 w-full"
                                          />
                                          <div className="p-2 space-y-1.5">
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex-1 min-w-0">
                                                <p className="font-medium text-xs truncate">{layer.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                  {layer.suggestedLayerKey}
                                                </p>
                                              </div>
                                              <Checkbox
                                                checked={selectedLayers.has(getLayerKey(layer))}
                                                onCheckedChange={() => toggleLayer(layer)}
                                                onClick={e => e.stopPropagation()}
                                              />
                                            </div>
                                            <div className="flex items-center gap-1 flex-wrap">
                                              <Badge
                                                variant="outline"
                                                className={`text-xs ${getGeometryBadgeColor(layer.geometryTypeNormalized)}`}
                                              >
                                                {layer.geometryTypeNormalized}
                                              </Badge>
                                              <Badge variant="secondary" className="text-xs">
                                                {layer.fields.length} fields
                                              </Badge>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                ) : (
                                  <Accordion type="multiple" className="w-full">
                                    {server.layers.map(layer => (
                                      <AccordionItem key={getLayerKey(layer)} value={getLayerKey(layer)}>
                                        <div className="flex items-center px-2 py-1 hover:bg-muted/50">
                                          <Checkbox
                                            checked={selectedLayers.has(getLayerKey(layer))}
                                            onCheckedChange={() => toggleLayer(layer)}
                                            className="mr-3"
                                          />
                                          <AccordionTrigger className="flex-1 py-0 hover:no-underline">
                                            <div className="flex items-center gap-3 text-left">
                                              <MapPin className="h-4 w-4 text-muted-foreground" />
                                              <div>
                                                <p className="font-medium text-sm">{layer.name}</p>
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
                                            </div>
                                          </AccordionTrigger>
                                        </div>
                                        <AccordionContent className="px-2 pb-3">
                                          <div className="ml-8 grid md:grid-cols-2 gap-3">
                                            <LayerPreviewMap
                                              features={layer.sampleFeatures || []}
                                              geometryType={layer.geometryTypeNormalized}
                                              className="h-36 w-full"
                                            />
                                            <div className="space-y-2 text-sm">
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
                                                  {layer.fields.slice(0, 8).map(field => (
                                                    <Badge key={field.name} variant="outline" className="text-xs">
                                                      {field.name}
                                                    </Badge>
                                                  ))}
                                                  {layer.fields.length > 8 && (
                                                    <Badge variant="outline" className="text-xs">
                                                      +{layer.fields.length - 8} more
                                                    </Badge>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </AccordionContent>
                                      </AccordionItem>
                                    ))}
                                  </Accordion>
                                )}
                              </div>
                            )}
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Empty State */}
          {!hasResults && !isDiscovering && (
            <div className="flex-1 flex items-center justify-center border rounded-lg bg-muted/20">
              <div className="text-center p-8">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Enter MapServer URLs and click Discover to find available layers
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Tip: Paste multiple URLs (one per line) for batch discovery
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
              (!mapServerId && !isPreSaveMode) ||
              selectedLayers.size === 0 ||
              isImporting ||
              !hasResults
            }
          >
            {isImporting ? (
              <>Importing...</>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {isPreSaveMode ? 'Select' : 'Import'} {selectedLayers.size} Layer{selectedLayers.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
