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
}

interface UseCanonicalParcelOptions {
  parcelId?: string;
  lat?: number;
  lng?: number;
  enabled?: boolean;
}

/**
 * Hook to query canonical_parcels table for parcel details
 * Uses internal SiteIntel data - no external API calls
 */
export function useCanonicalParcel({ parcelId, lat, lng, enabled = true }: UseCanonicalParcelOptions) {
  return useQuery({
    queryKey: ['canonical-parcel', parcelId, lat, lng],
    queryFn: async (): Promise<CanonicalParcel | null> => {
      // Query by parcel ID if provided
      if (parcelId) {
        const { data, error } = await supabase
          .from('canonical_parcels')
          .select('*')
          .eq('source_parcel_id', parcelId)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching canonical parcel by ID:', error);
          throw error;
        }

        return data as CanonicalParcel | null;
      }

      // Query by point if lat/lng provided
      if (lat !== undefined && lng !== undefined) {
        const { data, error } = await supabase.functions.invoke('query-canonical-parcel', {
          body: { lat, lng }
        });

        if (error) {
          console.error('Error fetching canonical parcel by point:', error);
          throw error;
        }

        return data?.parcel as CanonicalParcel | null;
      }

      return null;
    },
    enabled: enabled && (!!parcelId || (lat !== undefined && lng !== undefined)),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
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
