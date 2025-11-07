import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MapLayersData {
  parcel: any | null;
  floodZones: any[];
  utilities: any[];
  traffic: any[];
  employmentCenters: any[];
  drawnParcels: Array<{
    id: string;
    name: string;
    geometry: any;
    acreage_calc: number;
  }>;
  hcadParcels: any[];
  waterLines: any[];
  sewerLines: any[];
  stormLines: any[];
  forceMain: any[];
  zoningDistricts: any[];
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
  const queryClient = useQueryClient();

  const query = useQuery<MapLayersData>({
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

      // Fetch user's drawn parcels
      const { data: { user } } = await supabase.auth.getUser();
      let drawnParcels: any[] = [];
      
      if (user) {
        const { data: parcelsData } = await supabase
          .from('drawn_parcels')
          .select('id, name, geometry, acreage_calc')
          .eq('user_id', user.id)
          .eq('application_id', applicationId)
          .order('created_at', { ascending: false });
        
        drawnParcels = parcelsData || [];
      }

      // Fetch utilities data
      const { data: utilitiesData } = await supabase
        .from('applications')
        .select('utilities_summary')
        .eq('id', applicationId)
        .single();

      const utilitiesSummary = utilitiesData?.utilities_summary as any;
      
      // Transform water lines from utilities_summary
      const waterLines: any[] = [];
      if (utilitiesSummary?.water_lines && Array.isArray(utilitiesSummary.water_lines)) {
        utilitiesSummary.water_lines.forEach((line: any) => {
          if (line.geometry) {
            waterLines.push({
              geometry: line.geometry,
              facility_id: line.facility_id,
              diameter_in: line.diameter_in,
              material: line.material,
              install_year: line.install_year,
              condition: line.condition,
              status: line.status,
              distance_ft: line.distance_ft,
              attributes: line.attributes,
            });
          }
        });
      }

      // Transform sewer lines from utilities_summary
      const sewerLines: any[] = [];
      if (utilitiesSummary?.sewer_lines && Array.isArray(utilitiesSummary.sewer_lines)) {
        utilitiesSummary.sewer_lines.forEach((line: any) => {
          if (line.geometry) {
            sewerLines.push({
              geometry: line.geometry,
              facility_id: line.facility_id,
              diameter_in: line.diameter_in,
              material: line.material,
              install_year: line.install_year,
              condition: line.condition,
              status: line.status,
              distance_ft: line.distance_ft,
              attributes: line.attributes,
            });
          }
        });
      }

      // Transform storm lines from utilities_summary
      const stormLines: any[] = [];
      if (utilitiesSummary?.storm_lines && Array.isArray(utilitiesSummary.storm_lines)) {
        utilitiesSummary.storm_lines.forEach((line: any) => {
          if (line.geometry) {
            stormLines.push({
              geometry: line.geometry,
              facility_id: line.facility_id,
              diameter_in: line.diameter_in,
              material: line.material,
              install_year: line.install_year,
              condition: line.condition,
              status: line.status,
              distance_ft: line.distance_ft,
              attributes: line.attributes,
            });
          }
        });
      }

      // New infrastructure layers (empty arrays for now - future: fetch from ArcGIS)
      const hcadParcels: any[] = [];
      const forceMain: any[] = [];
      const zoningDistricts: any[] = [];

      return {
        parcel,
        floodZones,
        utilities,
        traffic,
        employmentCenters,
        drawnParcels,
        hcadParcels,
        waterLines,
        sewerLines,
        stormLines,
        forceMain,
        zoningDistricts,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000,   // 10 minutes garbage collection
    enabled: !!applicationId,
  });

  // Mutation for updating parcels
  const updateParcel = useMutation({
    mutationFn: async ({
      parcelId,
      name,
      geometry,
    }: {
      parcelId: string;
      name: string;
      geometry: any;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('update-drawn-parcel', {
        body: { parcel_id: parcelId, name, geometry },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data.parcel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map-layers', applicationId] });
      toast.success('Parcel updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update parcel:', error);
      toast.error('Failed to update parcel');
    },
  });

  // Mutation for deleting parcels
  const deleteParcel = useMutation({
    mutationFn: async (parcelId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('delete-drawn-parcel', {
        body: { parcel_id: parcelId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map-layers', applicationId] });
      toast.success('Parcel deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete parcel:', error);
      toast.error('Failed to delete parcel');
    },
  });

  return {
    ...query,
    updateParcel,
    deleteParcel,
    refetchDrawnParcels: () => queryClient.invalidateQueries({ queryKey: ['map-layers', applicationId] }),
  };
}
