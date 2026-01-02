import { useQueries, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * useOverlays Hook (J-03)
 * Fetch multiple overlay datasets for a location in parallel
 */

export type OverlayType = 'flood' | 'wetlands' | 'traffic' | 'epa' | 'elevation' | 'soil' | 'schools';

interface FloodData {
  floodZone: string | null;
  baseFloodElevation: number | null;
  firmPanel: string | null;
}

interface WetlandsData {
  wetlandsType: string | null;
  wetlandsArea: number | null;
  cowardinCode: string | null;
}

interface TrafficData {
  aadt: number | null;
  roadName: string | null;
  year: number | null;
  source: string | null;
}

interface EPAData {
  facilitiesCount: number | null;
  nearestFacilityDistance: number | null;
  nearestFacilityType: string | null;
}

interface ElevationData {
  elevation: number | null;
  source: string | null;
}

interface SoilData {
  soilSeries: string | null;
  drainageClass: string | null;
  hydricRating: string | null;
}

interface SchoolsData {
  nearestSchool: string | null;
  schoolDistrict: string | null;
  distanceFt: number | null;
}

export type OverlayData = {
  flood: FloodData;
  wetlands: WetlandsData;
  traffic: TrafficData;
  epa: EPAData;
  elevation: ElevationData;
  soil: SoilData;
  schools: SchoolsData;
};

interface UseOverlaysOptions {
  lat: number | null;
  lng: number | null;
  overlays?: OverlayType[];
  enabled?: boolean;
}

interface OverlayConfig {
  key: OverlayType;
  functionName: string;
  staleTime: number;
}

const OVERLAY_CONFIGS: OverlayConfig[] = [
  { key: 'flood', functionName: 'query-fema-by-point', staleTime: 30 * 60 * 1000 },
  { key: 'wetlands', functionName: 'enrich-wetlands', staleTime: 30 * 60 * 1000 },
  { key: 'traffic', functionName: 'query-traffic', staleTime: 15 * 60 * 1000 },
  { key: 'epa', functionName: 'query-epa-echo', staleTime: 30 * 60 * 1000 },
  { key: 'elevation', functionName: 'query-elevation', staleTime: 60 * 60 * 1000 },
  { key: 'soil', functionName: 'query-soil', staleTime: 60 * 60 * 1000 },
  { key: 'schools', functionName: 'query-schools', staleTime: 30 * 60 * 1000 },
];

async function fetchOverlay(functionName: string, lat: number, lng: number): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: { lat, lng },
  });

  if (error) {
    throw new Error(`Failed to fetch ${functionName}: ${error.message}`);
  }

  return data;
}

export function useOverlays({
  lat,
  lng,
  overlays,
  enabled = true,
}: UseOverlaysOptions) {
  const validCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
  const activeConfigs = overlays
    ? OVERLAY_CONFIGS.filter(c => overlays.includes(c.key))
    : OVERLAY_CONFIGS;

  const queries = useQueries({
    queries: activeConfigs.map(config => ({
      queryKey: ['overlay', config.key, lat, lng],
      queryFn: () => fetchOverlay(config.functionName, lat!, lng!),
      enabled: enabled && validCoords,
      staleTime: config.staleTime,
      retry: 2,
      retryDelay: 1000,
    })),
  });

  // Map results back to overlay types
  const results: Partial<Record<OverlayType, UseQueryResult<unknown, Error>>> = {};
  activeConfigs.forEach((config, index) => {
    results[config.key] = queries[index];
  });

  // Aggregate loading and error states
  const isLoading = queries.some(q => q.isLoading);
  const isFetching = queries.some(q => q.isFetching);
  const hasError = queries.some(q => q.isError);
  const errors = queries
    .filter(q => q.isError)
    .map((q, i) => ({ overlay: activeConfigs[i].key, error: q.error }));

  // Extract typed data
  const data: Partial<OverlayData> = {};
  
  if (results.flood?.data) {
    const d = results.flood.data as Record<string, unknown>;
    data.flood = {
      floodZone: (d.floodZone ?? d.flood_zone ?? null) as string | null,
      baseFloodElevation: (d.baseFloodElevation ?? d.bfe ?? null) as number | null,
      firmPanel: (d.firmPanel ?? d.panel_id ?? null) as string | null,
    };
  }

  if (results.wetlands?.data) {
    const d = results.wetlands.data as Record<string, unknown>;
    data.wetlands = {
      wetlandsType: (d.wetlandsType ?? d.wetland_type ?? null) as string | null,
      wetlandsArea: (d.wetlandsArea ?? d.area_pct ?? null) as number | null,
      cowardinCode: (d.cowardinCode ?? d.cowardin_code ?? null) as string | null,
    };
  }

  if (results.traffic?.data) {
    const d = results.traffic.data as Record<string, unknown>;
    data.traffic = {
      aadt: (d.aadt ?? d.traffic_aadt ?? null) as number | null,
      roadName: (d.roadName ?? d.road_name ?? null) as string | null,
      year: (d.year ?? d.traffic_year ?? null) as number | null,
      source: (d.source ?? null) as string | null,
    };
  }

  if (results.epa?.data) {
    const d = results.epa.data as Record<string, unknown>;
    data.epa = {
      facilitiesCount: (d.facilitiesCount ?? d.epa_facilities_count ?? null) as number | null,
      nearestFacilityDistance: (d.nearestFacilityDistance ?? d.nearest_facility_dist ?? null) as number | null,
      nearestFacilityType: (d.nearestFacilityType ?? d.nearest_facility_type ?? null) as string | null,
    };
  }

  if (results.elevation?.data) {
    const d = results.elevation.data as Record<string, unknown>;
    data.elevation = {
      elevation: (d.elevation ?? null) as number | null,
      source: (d.source ?? null) as string | null,
    };
  }

  if (results.soil?.data) {
    const d = results.soil.data as Record<string, unknown>;
    data.soil = {
      soilSeries: (d.soilSeries ?? d.soil_series ?? null) as string | null,
      drainageClass: (d.drainageClass ?? d.drainage_class ?? null) as string | null,
      hydricRating: (d.hydricRating ?? d.hydric_rating ?? null) as string | null,
    };
  }

  if (results.schools?.data) {
    const d = results.schools.data as Record<string, unknown>;
    data.schools = {
      nearestSchool: (d.nearestSchool ?? d.school_name ?? null) as string | null,
      schoolDistrict: (d.schoolDistrict ?? d.district ?? null) as string | null,
      distanceFt: (d.distanceFt ?? d.distance_ft ?? null) as number | null,
    };
  }

  return {
    data,
    queries: results,
    isLoading,
    isFetching,
    hasError,
    errors,
    refetch: () => queries.forEach(q => q.refetch()),
  };
}
