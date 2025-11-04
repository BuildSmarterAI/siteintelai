/**
 * HII Service - Client-side TypeScript module for interacting with HII backend
 */

export interface HIIScoreResult {
  hii_score: number;
  establishment_count: number;
  total_receipts: number;
  avg_receipts_per_establishment: number;
  city: string;
  city_avg_receipts: number;
  yoy_vs_city_avg: number;
  radius_meters: number;
  months_analyzed: number;
  top_establishments: Array<{
    name: string;
    address: string;
    receipts: number;
    distance_meters: number;
  }>;
}

export interface HIIGeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    name: string;
    address: string;
    city: string;
    county: string;
    total_receipts: number;
    period_end_date: string;
    category: 'high' | 'medium' | 'low';
  };
}

export interface HIIGeoJSON {
  type: 'FeatureCollection';
  features: HIIGeoJSONFeature[];
  metadata: {
    count: number;
    bbox: [number, number, number, number];
    months_analyzed: number;
  };
}

export class HIIService {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }

  /**
   * Calculate HII score for a specific location
   */
  async calculateScore(
    lat: number,
    lon: number,
    radiusMeters: number = 1609,
    monthsBack: number = 12
  ): Promise<HIIScoreResult> {
    const response = await fetch(`${this.supabaseUrl}/functions/v1/hii-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`,
      },
      body: JSON.stringify({
        lat,
        lon,
        radius_m: radiusMeters,
        months_back: monthsBack,
      }),
    });

    if (!response.ok) {
      throw new Error(`HII score request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Fetch hospitality establishments as GeoJSON within a bounding box
   */
  async getGeoJSON(
    minLng: number,
    minLat: number,
    maxLng: number,
    maxLat: number,
    monthsBack: number = 12
  ): Promise<HIIGeoJSON> {
    const response = await fetch(`${this.supabaseUrl}/functions/v1/hii-geojson`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`,
      },
      body: JSON.stringify({
        minLng,
        minLat,
        maxLng,
        maxLat,
        months_back: monthsBack,
      }),
    });

    if (!response.ok) {
      throw new Error(`HII GeoJSON request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Trigger data ingestion (admin only - requires service role key)
   */
  async triggerIngestion(): Promise<{ success: boolean; total_ingested: number }> {
    const response = await fetch(`${this.supabaseUrl}/functions/v1/hii-ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HII ingestion trigger failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Trigger alert check (admin only - requires service role key)
   */
  async triggerAlertCheck(): Promise<{ success: boolean; alerts_sent: number }> {
    const response = await fetch(`${this.supabaseUrl}/functions/v1/hii-alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HII alert check failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

/**
 * Example usage:
 * 
 * import { HIIService } from './services/hii-service';
 * 
 * const hiiService = new HIIService(
 *   'https://mcmfwlgovubpdcfiqfvk.supabase.co',
 *   'your-anon-key'
 * );
 * 
 * // Get HII score for a location (e.g., downtown Houston)
 * const score = await hiiService.calculateScore(29.7604, -95.3698);
 * console.log(`HII Score: ${score.hii_score}/100`);
 * console.log(`${score.establishment_count} establishments nearby`);
 * 
 * // Get map data for visualization
 * const geoJson = await hiiService.getGeoJSON(-95.5, 29.6, -95.2, 29.9);
 * // Use with MapLibre, Leaflet, or other mapping libraries
 */
