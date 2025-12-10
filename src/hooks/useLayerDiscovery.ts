import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DiscoveredField {
  name: string;
  type: string;
  alias: string;
  length?: number;
}

export interface SampleFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: Record<string, any>;
}

export interface DiscoveredLayer {
  id: number;
  name: string;
  geometryType: string;
  geometryTypeNormalized: string;
  fields: DiscoveredField[];
  suggestedLayerKey: string;
  sourceUrl: string;
  fieldMappings: Record<string, string>;
  sampleFeatures?: SampleFeature[];
  extent?: { xmin: number; ymin: number; xmax: number; ymax: number };
  /** Added for batch discovery - tracks which server this layer belongs to */
  serverUrl?: string;
  serverName?: string;
}

export interface DiscoveryResult {
  success: boolean;
  mapServerName: string;
  mapServerUrl: string;
  serviceDescription: string | null;
  spatialReference: { wkid: number } | null;
  layerCount: number;
  layers: DiscoveredLayer[];
}

export interface ServerDiscoveryResult {
  url: string;
  name: string;
  status: 'success' | 'error';
  error?: string;
  layers: DiscoveredLayer[];
  spatialReference?: { wkid: number } | null;
}

export interface BatchDiscoveryResult {
  totalUrls: number;
  successCount: number;
  failedCount: number;
  totalLayers: number;
  servers: ServerDiscoveryResult[];
}

export interface BatchDiscoveryProgress {
  current: number;
  total: number;
  currentUrl: string;
}

export function useLayerDiscovery() {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchDiscoveryResult | null>(null);
  const [batchProgress, setBatchProgress] = useState<BatchDiscoveryProgress | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const discoverLayers = async (mapServerUrl: string): Promise<DiscoveryResult | null> => {
    setIsDiscovering(true);
    setDiscoveryResult(null);
    setBatchResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('discover-gis-layers', {
        body: { mapServerUrl }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setDiscoveryResult(data);
      toast({
        title: 'Layers Discovered',
        description: `Found ${data.layerCount} layers in ${data.mapServerName}`,
      });

      return data;
    } catch (error: any) {
      console.error('Layer discovery failed:', error);
      toast({
        title: 'Discovery Failed',
        description: error.message || 'Failed to discover layers',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsDiscovering(false);
    }
  };

  const discoverMultipleLayers = useCallback(async (urls: string[]): Promise<BatchDiscoveryResult | null> => {
    if (urls.length === 0) return null;
    
    setIsDiscovering(true);
    setDiscoveryResult(null);
    setBatchResult(null);
    setBatchProgress({ current: 0, total: urls.length, currentUrl: urls[0] });

    const servers: ServerDiscoveryResult[] = [];
    let successCount = 0;
    let failedCount = 0;
    let totalLayers = 0;

    // Process URLs in parallel with concurrency limit of 3
    const concurrencyLimit = 3;
    const chunks: string[][] = [];
    for (let i = 0; i < urls.length; i += concurrencyLimit) {
      chunks.push(urls.slice(i, i + concurrencyLimit));
    }

    let processed = 0;
    for (const chunk of chunks) {
      const results = await Promise.allSettled(
        chunk.map(async (url) => {
          const { data, error } = await supabase.functions.invoke('discover-gis-layers', {
            body: { mapServerUrl: url }
          });
          
          if (error) throw error;
          if (data.error) throw new Error(data.error);
          
          return { url, data };
        })
      );

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const url = chunk[i];
        processed++;
        setBatchProgress({ current: processed, total: urls.length, currentUrl: url });

        if (result.status === 'fulfilled') {
          const { data } = result.value;
          // Attach server info to each layer
          const layersWithServer = data.layers.map((layer: DiscoveredLayer) => ({
            ...layer,
            serverUrl: url,
            serverName: data.mapServerName,
          }));
          
          servers.push({
            url,
            name: data.mapServerName,
            status: 'success',
            layers: layersWithServer,
            spatialReference: data.spatialReference,
          });
          successCount++;
          totalLayers += data.layers.length;
        } else {
          servers.push({
            url,
            name: extractServerName(url),
            status: 'error',
            error: result.reason?.message || 'Unknown error',
            layers: [],
          });
          failedCount++;
        }
      }
    }

    const batchResultData: BatchDiscoveryResult = {
      totalUrls: urls.length,
      successCount,
      failedCount,
      totalLayers,
      servers,
    };

    setBatchResult(batchResultData);
    setBatchProgress(null);
    setIsDiscovering(false);

    toast({
      title: 'Batch Discovery Complete',
      description: `Found ${totalLayers} layers across ${successCount} servers${failedCount > 0 ? ` (${failedCount} failed)` : ''}`,
    });

    return batchResultData;
  }, [toast]);

  const importLayers = async (
    mapServerId: string,
    selectedLayers: DiscoveredLayer[]
  ): Promise<boolean> => {
    if (selectedLayers.length === 0) {
      toast({
        title: 'No Layers Selected',
        description: 'Please select at least one layer to import',
        variant: 'destructive',
      });
      return false;
    }

    setIsImporting(true);

    try {
      // Insert layers into gis_layers table
      const layersToInsert = selectedLayers.map(layer => ({
        layer_key: layer.suggestedLayerKey,
        display_name: layer.name,
        provider: layer.serverName || discoveryResult?.mapServerName || 'Unknown',
        source_url: layer.sourceUrl,
        category: 'boundaries', // Default, can be changed later
        geometry_type: layer.geometryTypeNormalized,
        native_srid: discoveryResult?.spatialReference?.wkid || 4326,
        status: 'active',
        update_policy: JSON.stringify({ frequency: 'weekly', method: 'etag' }),
        field_mappings: JSON.stringify(layer.fieldMappings),
        map_server_id: mapServerId,
      }));

      const { error } = await supabase
        .from('gis_layers')
        .insert(layersToInsert);

      if (error) throw error;

      toast({
        title: 'Layers Imported',
        description: `Successfully imported ${selectedLayers.length} layers`,
      });

      return true;
    } catch (error: any) {
      console.error('Layer import failed:', error);
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import layers',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  const clearDiscovery = () => {
    setDiscoveryResult(null);
    setBatchResult(null);
    setBatchProgress(null);
  };

  return {
    isDiscovering,
    discoveryResult,
    batchResult,
    batchProgress,
    isImporting,
    discoverLayers,
    discoverMultipleLayers,
    importLayers,
    clearDiscovery,
  };
}

/** Extract a readable name from a MapServer URL */
function extractServerName(url: string): string {
  try {
    const match = url.match(/\/services\/(.+?)\/MapServer/i);
    if (match) {
      return match[1].split('/').pop() || 'Unknown';
    }
    return new URL(url).hostname;
  } catch {
    return 'Unknown';
  }
}
