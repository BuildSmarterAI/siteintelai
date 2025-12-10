import { useState } from 'react';
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

export function useLayerDiscovery() {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const discoverLayers = async (mapServerUrl: string): Promise<DiscoveryResult | null> => {
    setIsDiscovering(true);
    setDiscoveryResult(null);

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
        provider: discoveryResult?.mapServerName || 'Unknown',
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
  };

  return {
    isDiscovering,
    discoveryResult,
    isImporting,
    discoverLayers,
    importLayers,
    clearDiscovery,
  };
}
