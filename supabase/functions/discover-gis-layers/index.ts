import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArcGISField {
  name: string;
  type: string;
  alias: string;
  length?: number;
}

interface ArcGISLayer {
  id: number;
  name: string;
  type?: string;
  geometryType?: string;
  parentLayerId?: number;
  subLayerIds?: number[] | null;
}

interface DiscoveredLayer {
  id: number;
  name: string;
  geometryType: string;
  geometryTypeNormalized: string;
  fields: ArcGISField[];
  suggestedLayerKey: string;
  sourceUrl: string;
  fieldMappings: Record<string, string>;
}

function normalizeGeometryType(esriType: string): string {
  const mapping: Record<string, string> = {
    'esriGeometryPoint': 'Point',
    'esriGeometryMultipoint': 'MultiPoint',
    'esriGeometryPolyline': 'LineString',
    'esriGeometryPolygon': 'Polygon',
    'esriGeometryEnvelope': 'Polygon',
  };
  return mapping[esriType] || esriType;
}

function generateLayerKey(serverName: string, layerName: string, layerId: number): string {
  const cleanServer = serverName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  const cleanLayer = layerName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return `${cleanServer}_${cleanLayer}_${layerId}`;
}

function suggestFieldMappings(fields: ArcGISField[]): Record<string, string> {
  const mappings: Record<string, string> = {};
  const commonMappings: Record<string, string[]> = {
    'name': ['NAME', 'NAMELSAD', 'FULLNAME', 'LABEL', 'DESCRIPTION'],
    'id': ['OBJECTID', 'FID', 'ID', 'GID'],
    'area': ['SHAPE_AREA', 'AREA', 'SQFT', 'ACRES'],
    'length': ['SHAPE_LENGTH', 'LENGTH', 'LEN'],
    'county': ['COUNTY', 'CNTY', 'CO_NAME'],
    'city': ['CITY', 'MUNICIPALITY', 'PLACE'],
    'zip': ['ZIP', 'ZIPCODE', 'ZIP_CODE', 'ZCTA'],
  };

  for (const field of fields) {
    const upperName = field.name.toUpperCase();
    for (const [canonical, variants] of Object.entries(commonMappings)) {
      if (variants.includes(upperName)) {
        mappings[field.name] = canonical;
        break;
      }
    }
  }

  return mappings;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mapServerUrl } = await req.json();

    if (!mapServerUrl) {
      return new Response(
        JSON.stringify({ error: 'mapServerUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean URL - remove trailing slash and query params
    const baseUrl = mapServerUrl.replace(/\/+$/, '').split('?')[0];
    
    console.log(`[discover-gis-layers] Fetching service info from: ${baseUrl}?f=json`);

    // Fetch service metadata
    const serviceResponse = await fetch(`${baseUrl}?f=json`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!serviceResponse.ok) {
      throw new Error(`Failed to fetch service info: ${serviceResponse.status}`);
    }

    const serviceText = await serviceResponse.text();
    
    // Check if HTML was returned instead of JSON
    if (serviceText.trim().startsWith('<')) {
      throw new Error('Received HTML instead of JSON. The MapServer URL may be incorrect or the service may be down.');
    }

    const serviceInfo = JSON.parse(serviceText);

    if (!serviceInfo.layers || !Array.isArray(serviceInfo.layers)) {
      return new Response(
        JSON.stringify({ 
          error: 'No layers found in MapServer response',
          serviceInfo: serviceInfo
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serverName = serviceInfo.mapName || serviceInfo.serviceName || 
      baseUrl.split('/').filter(Boolean).pop() || 'unknown';

    console.log(`[discover-gis-layers] Found ${serviceInfo.layers.length} layers in ${serverName}`);

    // Fetch details for each layer (only feature layers with geometry)
    const discoveredLayers: DiscoveredLayer[] = [];

    for (const layer of serviceInfo.layers as ArcGISLayer[]) {
      // Skip group layers (they have subLayerIds)
      if (layer.subLayerIds && layer.subLayerIds.length > 0) {
        console.log(`[discover-gis-layers] Skipping group layer: ${layer.name}`);
        continue;
      }

      try {
        console.log(`[discover-gis-layers] Fetching layer ${layer.id}: ${layer.name}`);
        
        const layerResponse = await fetch(`${baseUrl}/${layer.id}?f=json`, {
          headers: { 'Accept': 'application/json' }
        });

        if (!layerResponse.ok) {
          console.warn(`[discover-gis-layers] Failed to fetch layer ${layer.id}: ${layerResponse.status}`);
          continue;
        }

        const layerText = await layerResponse.text();
        if (layerText.trim().startsWith('<')) {
          console.warn(`[discover-gis-layers] Received HTML for layer ${layer.id}, skipping`);
          continue;
        }

        const layerInfo = JSON.parse(layerText);

        // Skip if no geometry type (table-only layers)
        if (!layerInfo.geometryType) {
          console.log(`[discover-gis-layers] Skipping non-geometry layer: ${layer.name}`);
          continue;
        }

        const fields = (layerInfo.fields || []) as ArcGISField[];
        
        discoveredLayers.push({
          id: layer.id,
          name: layerInfo.name || layer.name,
          geometryType: layerInfo.geometryType,
          geometryTypeNormalized: normalizeGeometryType(layerInfo.geometryType),
          fields: fields.map(f => ({
            name: f.name,
            type: f.type,
            alias: f.alias || f.name,
            length: f.length
          })),
          suggestedLayerKey: generateLayerKey(serverName, layer.name, layer.id),
          sourceUrl: `${baseUrl}/${layer.id}`,
          fieldMappings: suggestFieldMappings(fields)
        });

      } catch (layerError) {
        console.warn(`[discover-gis-layers] Error fetching layer ${layer.id}:`, layerError);
      }
    }

    console.log(`[discover-gis-layers] Successfully discovered ${discoveredLayers.length} layers`);

    return new Response(
      JSON.stringify({
        success: true,
        mapServerName: serverName,
        mapServerUrl: baseUrl,
        serviceDescription: serviceInfo.serviceDescription || null,
        spatialReference: serviceInfo.spatialReference || null,
        layerCount: discoveredLayers.length,
        layers: discoveredLayers
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[discover-gis-layers] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
