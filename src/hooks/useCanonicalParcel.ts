import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CanonicalParcel {
  id: number;
  source_parcel_id: string;
  apn: string | null;
  situs_address: string | null;
  owner_name: string | null;
  acreage: number | null;
  land_use_code: string | null;
  land_use_desc: string | null;
  jurisdiction: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  county_fips: string | null;
  source_agency: string | null;
  dataset_version: string;
  accuracy_tier: number | null;
  confidence: number | null;
  created_at: string;
  updated_at: string;
  // External fallback fields (not in DB but returned by edge function)
  _external_raw?: Record<string, unknown>;
}

// Response from query-canonical-parcel edge function
export interface ParcelQueryResponse {
  parcel: CanonicalParcel | null;
  source: 'canonical_parcels' | 'external_fallback';
  coverage_status: 'seeded' | 'not_seeded';
  query_type?: string;
  message?: string;
  data_provenance: {
    source: string;
    dataset_version: string | null;
    accuracy_tier: number | null;
    source_agency: string | null;
  };
}

interface UseCanonicalParcelOptions {
  parcelId?: string;
  lat?: number;
  lng?: number;
  enabled?: boolean;
}

export interface UseCanonicalParcelResult {
  parcel: CanonicalParcel | null;
  source: 'canonical_parcels' | 'external_fallback' | null;
  coverageStatus: 'seeded' | 'not_seeded' | null;
  dataProvenance: ParcelQueryResponse['data_provenance'] | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Hook to query canonical_parcels table for parcel details
 * Now includes fallback to external APIs with coverage tracking
 */
export function useCanonicalParcel({ parcelId, lat, lng, enabled = true }: UseCanonicalParcelOptions): UseCanonicalParcelResult {
  const query = useQuery({
    queryKey: ['canonical-parcel', parcelId, lat, lng],
    queryFn: async (): Promise<ParcelQueryResponse> => {
      // Always use the edge function for hybrid fallback support
      const { data, error } = await supabase.functions.invoke('query-canonical-parcel', {
        body: { 
          source_parcel_id: parcelId,
          lat, 
          lng 
        }
      });

      if (error) {
        console.error('Error fetching parcel:', error);
        throw error;
      }

      return data as ParcelQueryResponse;
    },
    enabled: enabled && (!!parcelId || (lat !== undefined && lng !== undefined)),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    parcel: query.data?.parcel ?? null,
    source: query.data?.source ?? null,
    coverageStatus: query.data?.coverage_status ?? null,
    dataProvenance: query.data?.data_provenance ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * Hook to query multiple parcels by bounding box
 * For use with vector tile clicks that need full details
 */
export function useCanonicalParcelsInBbox(bbox: [number, number, number, number] | null, enabled = true) {
  return useQuery({
    queryKey: ['canonical-parcels-bbox', bbox],
    queryFn: async (): Promise<CanonicalParcel[]> => {
      if (!bbox) return [];

      const { data, error } = await supabase.functions.invoke('query-canonical-parcel', {
        body: { bbox }
      });

      if (error) {
        console.error('Error fetching canonical parcels by bbox:', error);
        throw error;
      }

      return (data?.parcels || []) as CanonicalParcel[];
    },
    enabled: enabled && !!bbox,
    staleTime: 5 * 60 * 1000,
  });
}
