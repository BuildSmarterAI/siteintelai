import { supabase } from '@/integrations/supabase/client';

/**
 * Type-Safe API Client Service (J-06)
 * Centralized, typed API client for all edge functions
 */

// Response types
export interface GeocodeCandidate {
  address: string;
  lat: number;
  lng: number;
  confidence: number;
  source: string;
}

export interface GeocodeResponse {
  candidates: GeocodeCandidate[];
  query: string;
  traceId?: string;
}

export interface ReverseGeocodeResponse {
  address: string;
  city?: string;
  county?: string;
  state?: string;
  zip?: string;
  traceId?: string;
}

export interface ParcelResponse {
  parcelId: string;
  owner?: string;
  acreage?: number;
  address?: string;
  geometry?: GeoJSON.Polygon;
  county?: string;
  traceId?: string;
}

export interface FloodResponse {
  floodZone: string | null;
  baseFloodElevation: number | null;
  firmPanel: string | null;
  traceId?: string;
}

export interface WetlandsResponse {
  wetlandsType: string | null;
  wetlandsArea: number | null;
  cowardinCode: string | null;
  traceId?: string;
}

export interface TrafficResponse {
  aadt: number | null;
  roadName: string | null;
  year: number | null;
  source: string | null;
  traceId?: string;
}

export interface EPAResponse {
  facilitiesCount: number;
  nearestFacilityDistance: number | null;
  nearestFacilityType: string | null;
  facilities: Array<{
    name: string;
    type: string;
    distance: number;
  }>;
  traceId?: string;
}

export interface ElevationResponse {
  elevation: number;
  source: string;
  traceId?: string;
}

export interface SoilResponse {
  soilSeries: string | null;
  drainageClass: string | null;
  hydricRating: string | null;
  slopePercent: number | null;
  traceId?: string;
}

export interface FeasibilityScoreResponse {
  score: number;
  band: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  traceId?: string;
}

export interface KillFactorResponse {
  hasKillFactors: boolean;
  killFactors: string[];
  warnings: string[];
  traceId?: string;
}

// API Error class
export class APIError extends Error {
  constructor(
    public functionName: string,
    public originalError: Error,
    public traceId?: string
  ) {
    super(`API call to ${functionName} failed: ${originalError.message}`);
    this.name = 'APIError';
  }
}

// Main API client class
class SiteIntelAPI {
  // ===== Geocoding =====

  async geocode(query: string): Promise<GeocodeResponse> {
    return this.invoke<GeocodeResponse>('geocode-with-cache', { query });
  }

  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResponse> {
    return this.invoke<ReverseGeocodeResponse>('reverse-geocode', { lat, lng });
  }

  async batchGeocode(addresses: Array<{ id: string; address: string }>): Promise<{
    results: Array<{ id: string; result: GeocodeResponse | null; error?: string }>;
    traceId?: string;
  }> {
    return this.invoke('batch-geocode', { addresses });
  }

  async validateAddress(address: string): Promise<{
    valid: boolean;
    standardized?: string;
    components?: Record<string, string>;
    traceId?: string;
  }> {
    return this.invoke('validate-address', { address });
  }

  // ===== Parcel =====

  async lookupParcel(apn: string, county?: string): Promise<ParcelResponse> {
    return this.invoke<ParcelResponse>('lookup-parcel-by-apn', { apn, county });
  }

  async searchParcels(query: string, limit = 10): Promise<{
    parcels: ParcelResponse[];
    traceId?: string;
  }> {
    return this.invoke('search-parcels', { query, limit });
  }

  async findParcelAtPoint(lat: number, lng: number): Promise<ParcelResponse> {
    return this.invoke<ParcelResponse>('fetch-parcels', { lat, lng });
  }

  async nearbyParcels(lat: number, lng: number, radiusFt = 500): Promise<{
    parcels: ParcelResponse[];
    traceId?: string;
  }> {
    return this.invoke('nearby-parcels', { lat, lng, radius_ft: radiusFt });
  }

  // ===== Overlays =====

  async queryFlood(lat: number, lng: number): Promise<FloodResponse> {
    return this.invoke<FloodResponse>('query-fema-by-point', { lat, lng });
  }

  async queryWetlands(lat: number, lng: number): Promise<WetlandsResponse> {
    return this.invoke<WetlandsResponse>('enrich-wetlands', { lat, lng });
  }

  async queryTraffic(lat: number, lng: number, radiusFt = 1000): Promise<TrafficResponse> {
    return this.invoke<TrafficResponse>('query-traffic', { lat, lng, radius_ft: radiusFt });
  }

  async queryEPA(lat: number, lng: number, radiusMiles = 1): Promise<EPAResponse> {
    return this.invoke<EPAResponse>('query-epa-echo', { lat, lng, radius_miles: radiusMiles });
  }

  async queryElevation(lat: number, lng: number): Promise<ElevationResponse> {
    return this.invoke<ElevationResponse>('query-elevation', { lat, lng });
  }

  async querySoil(lat: number, lng: number): Promise<SoilResponse> {
    return this.invoke<SoilResponse>('query-soil', { lat, lng });
  }

  async querySchools(lat: number, lng: number): Promise<{
    schools: Array<{ name: string; district: string; distance: number }>;
    traceId?: string;
  }> {
    return this.invoke('query-schools', { lat, lng });
  }

  async queryZoning(lat: number, lng: number): Promise<{
    zoningCode: string | null;
    description: string | null;
    allowedUses: string[];
    traceId?: string;
  }> {
    return this.invoke('query-zoning', { lat, lng });
  }

  // ===== Feasibility =====

  async computeScore(applicationId: string): Promise<FeasibilityScoreResponse> {
    return this.invoke<FeasibilityScoreResponse>('compute-feasibility-score', { applicationId });
  }

  async detectKillFactors(applicationId: string): Promise<KillFactorResponse> {
    return this.invoke<KillFactorResponse>('detect-kill-factors', { applicationId });
  }

  async enrichAllOverlays(lat: number, lng: number): Promise<{
    flood: FloodResponse | null;
    wetlands: WetlandsResponse | null;
    traffic: TrafficResponse | null;
    epa: EPAResponse | null;
    soil: SoilResponse | null;
    traceId?: string;
  }> {
    return this.invoke('enrich-all-overlays', { lat, lng });
  }

  // ===== Applications =====

  async orchestrateApplication(applicationId: string): Promise<{
    success: boolean;
    status: string;
    traceId?: string;
  }> {
    return this.invoke('orchestrate-application', { applicationId });
  }

  async reEnrichApplication(applicationId: string): Promise<{
    success: boolean;
    traceId?: string;
  }> {
    return this.invoke('re-enrich-application', { applicationId });
  }

  // ===== Reports =====

  async generatePDF(reportId: string): Promise<{
    pdfUrl: string;
    traceId?: string;
  }> {
    return this.invoke('generate-pdf', { reportId });
  }

  async generateAIReport(applicationId: string): Promise<{
    success: boolean;
    reportId: string;
    traceId?: string;
  }> {
    return this.invoke('generate-ai-report', { applicationId });
  }

  // ===== Batch Operations =====

  async batchReports(applicationIds: string[], priority: 'normal' | 'high' = 'normal'): Promise<{
    batchId: string;
    queuedCount: number;
    estimatedCompletionMinutes: number;
    statusUrl: string;
    traceId?: string;
  }> {
    return this.invoke('batch-reports', { applicationIds, priority });
  }

  async batchStatus(batchId: string): Promise<{
    status: 'pending' | 'processing' | 'complete' | 'failed';
    progress: number;
    completedCount: number;
    failedCount: number;
    traceId?: string;
  }> {
    return this.invoke('batch-status', { batchId });
  }

  // ===== Admin =====

  async getCacheStats(): Promise<{
    totalEntries: number;
    hitRate: { last1h: number; last24h: number };
    byProvider: Array<{ provider: string; entries: number; hitRate: number }>;
    traceId?: string;
  }> {
    return this.invoke('cache-stats', {});
  }

  async getDataQualityReport(days = 30): Promise<{
    applications: { total: number; complete: number; failed: number };
    dataCompleteness: Record<string, { percentage: number }>;
    recommendations: string[];
    traceId?: string;
  }> {
    // Use GET with query params
    const { data, error } = await supabase.functions.invoke('data-quality-report', {
      method: 'GET',
      body: null,
      headers: {},
    });
    
    if (error) throw new APIError('data-quality-report', error);
    return data;
  }

  // ===== Private Helper =====

  private async invoke<T>(functionName: string, body: unknown): Promise<T> {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) {
        throw new APIError(functionName, error, (data as Record<string, unknown>)?.traceId as string);
      }

      return data as T;
    } catch (err) {
      if (err instanceof APIError) throw err;
      throw new APIError(
        functionName,
        err instanceof Error ? err : new Error(String(err))
      );
    }
  }
}

// Export singleton instance
export const api = new SiteIntelAPI();

// Export class for testing/mocking
export { SiteIntelAPI };
