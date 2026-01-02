import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ElevationPoint {
  distance_ft: number;
  elevation_ft: number;
  lat: number;
  lng: number;
}

interface ElevationProfileMetadata {
  samples: number;
  total_distance_ft: number;
  min_elevation_ft: number;
  max_elevation_ft: number;
  avg_elevation_ft: number;
  elevation_range_ft: number;
  source: string;
  resolution: string;
  queried_at: string;
}

interface ElevationProfileResponse {
  profile: ElevationPoint[];
  metadata: ElevationProfileMetadata;
  from_cache: boolean;
}

interface UseElevationProfileOptions {
  applicationId?: string;
  coordinates?: number[][] | null;
  samples?: number;
  enabled?: boolean;
}

export function useElevationProfile({
  applicationId,
  coordinates,
  samples = 16,
  enabled = true
}: UseElevationProfileOptions) {
  return useQuery({
    queryKey: ['elevation-profile', applicationId, coordinates?.length, samples],
    queryFn: async (): Promise<ElevationProfileResponse | null> => {
      if (!coordinates || coordinates.length < 3) {
        return null;
      }

      const { data, error } = await supabase.functions.invoke('fetch-elevation-profile', {
        body: {
          coordinates,
          samples,
          application_id: applicationId
        }
      });

      if (error) {
        console.error('[useElevationProfile] Error:', error);
        throw error;
      }

      return data as ElevationProfileResponse;
    },
    enabled: enabled && !!coordinates && coordinates.length >= 3,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1
  });
}

// Calculate BFE delta from elevation profile and base flood elevation
export function calculateBfeDelta(
  siteElevation: number | null | undefined,
  baseFloodElevation: number | null | undefined
): {
  delta: number;
  status: 'above' | 'below' | 'at';
  risk: 'low' | 'moderate' | 'high' | 'critical';
  insuranceImpact: string;
} | null {
  if (siteElevation === null || siteElevation === undefined || 
      baseFloodElevation === null || baseFloodElevation === undefined) {
    return null;
  }

  const delta = siteElevation - baseFloodElevation;
  const absDelta = Math.abs(delta);

  if (delta >= 2) {
    return {
      delta: absDelta,
      status: 'above',
      risk: 'low',
      insuranceImpact: 'Lower flood insurance premiums likely. May qualify for preferred rates.'
    };
  }
  if (delta > 0) {
    return {
      delta: absDelta,
      status: 'above',
      risk: 'moderate',
      insuranceImpact: 'Standard flood insurance rates. Elevation certificate recommended.'
    };
  }
  if (delta === 0) {
    return {
      delta: 0,
      status: 'at',
      risk: 'high',
      insuranceImpact: 'Higher flood insurance premiums. Fill may be required for new construction.'
    };
  }
  return {
    delta: absDelta,
    status: 'below',
    risk: 'critical',
    insuranceImpact: 'Significantly higher insurance costs. Fill or elevation required for development.'
  };
}
