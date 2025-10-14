import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MapLayersData {
  parcel: any | null;
  floodZones: any[];
  utilities: any[];
  traffic: any[];
  employmentCenters: any[];
}

/**
 * Custom hook to fetch and transform map layer data from Supabase
 * 
 * Transforms stored geospatial data into MapLibre-compatible formats
 * with React Query caching for optimal performance.
 * 
 * @param applicationId - The application ID to fetch data for
 * @returns Query result with layer data
 */
export function useMapLayers(applicationId: string) {
  return useQuery<MapLayersData>({
    queryKey: ['map-layers', applicationId],
    queryFn: async () => {
      // Fetch application data with relevant fields including coordinates
      const { data: app, error } = await supabase
        .from('applications')
        .select('parcel_id, formatted_address, employment_clusters, geo_lat, geo_lng, acreage_cad, lot_size_value, lot_size_unit')
        .eq('id', applicationId)
        .single();

      if (error) throw error;

      // Create parcel boundary representation
      // Phase 1: Generate approximate boundary from property coordinates
      // Future: Replace with actual parcel geometry from county GIS data
      let parcel = null;
      
      if (app.geo_lat && app.geo_lng) {
        // Estimate parcel size - use lot_size if available, otherwise default
        const acreage = app.acreage_cad || app.lot_size_value || 1;
        const radiusMeters = Math.sqrt(acreage * 4046.86) / 2; // Convert acres to approx radius
        
        console.log('🗺️ Parcel generation starting:', {
          applicationId,
          center: { lat: app.geo_lat, lng: app.geo_lng },
          acreage_cad: app.acreage_cad,
          lot_size_value: app.lot_size_value,
          calculated_acreage: acreage,
          radiusMeters: radiusMeters.toFixed(2),
        });
        
        // Generate circular approximation (simplified for Phase 1)
        const centerLng = app.geo_lng;
        const centerLat = app.geo_lat;
        const points = 32;
        const coordinates: number[][][] = [[]];
        
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * 2 * Math.PI;
          const dx = radiusMeters * Math.cos(angle);
          const dy = radiusMeters * Math.sin(angle);
          
          // Approximate degrees offset (1 degree ≈ 111km at equator)
          const lat = centerLat + (dy / 111000);
          const lng = centerLng + (dx / (111000 * Math.cos(centerLat * Math.PI / 180)));
          
          coordinates[0].push([lng, lat]);
        }
        
        parcel = {
          geometry: {
            type: 'Polygon',
            coordinates,
          },
          properties: {
            parcel_id: app.parcel_id,
            address: app.formatted_address,
            acreage: acreage,
          },
        };
        
        console.log('✅ Parcel geometry created:', {
          type: parcel.geometry.type,
          pointCount: coordinates[0].length,
          firstPoint: coordinates[0][0],
          lastPoint: coordinates[0][coordinates[0].length - 1],
          acreage: parcel.properties.acreage,
        });
      }

      // Fetch geospatial intelligence data
      const { data: geoData } = await supabase
        .from('feasibility_geospatial')
        .select('fema_flood_risk, traffic_exposure, county_boundary')
        .eq('application_id', applicationId)
        .maybeSingle();

      // Transform FEMA flood zones from geospatial data
      const floodData = geoData?.fema_flood_risk as any;
      const floodZones = floodData?.in_flood_zone && floodData?.geometry_ref
        ? [{
            geometry: floodData.geometry_ref,
            properties: {
              zone: floodData.zone_code || 'Unknown',
              source: floodData.source || 'FEMA',
              bfe: floodData.bfe,
            },
          }]
        : [];

      const utilities: any[] = []; // TODO: Fetch from utility data

      // Transform TxDOT traffic segments
      const trafficData = geoData?.traffic_exposure as any;
      const traffic = trafficData?.nearest_segment_id && trafficData?.geometry_ref
        ? [{
            geometry: trafficData.geometry_ref,
            properties: {
              roadway: trafficData.roadway_name || 'Unknown',
              aadt: trafficData.aadt || 0,
              year: trafficData.year,
              distance_ft: trafficData.distance_to_segment_ft,
              source: trafficData.source || 'TxDOT',
            },
          }]
        : [];

      // Transform employment centers from JSON to array format
      const employmentCenters = Array.isArray(app.employment_clusters)
        ? app.employment_clusters
            .filter((c: any) => c.lat && c.lng)
            .map((cluster: any) => ({
              name: cluster.name || 'Employment Center',
              jobs: cluster.jobs || 0,
              distance_miles: cluster.distance || 0,
              coordinates: [cluster.lat, cluster.lng] as [number, number],
            }))
        : [];

      return {
        parcel,
        floodZones,
        utilities,
        traffic,
        employmentCenters,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000,   // 10 minutes garbage collection
    enabled: !!applicationId,
  });
}
