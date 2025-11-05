// TypeScript interfaces for Hospitality Intelligence (HII) module

export interface HIIBounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export interface HIIEstablishment {
  taxpayer_name: string;
  taxpayer_number: string;
  location_address: string;
  total_receipts: number;
  obligor_name: string | null;
}

export interface HIIScoreResult {
  hii_score: number;
  establishment_count: number;
  total_receipts: number;
  avg_receipts_per_establishment: number;
  city: string;
  city_avg_receipts: number;
  yoy_vs_city_avg: number;
  top_establishments: HIIEstablishment[];
  radius_m: number;
  months_analyzed: number;
}

export interface HIIGeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    taxpayer_name: string;
    taxpayer_number: string;
    location_address: string;
    total_receipts: number;
    category: 'high' | 'medium' | 'low';
    obligor_name: string | null;
  };
}

export interface HIIGeoJSON {
  type: 'FeatureCollection';
  features: HIIGeoJSONFeature[];
  metadata?: {
    count: number;
    bbox: HIIBounds;
    months_analyzed: number;
  };
}

export interface HIIAlert {
  id: string;
  city: string;
  yoy: number;
  establishment_count: number;
  total_receipts: number;
  sent_at: string;
}

export interface HIIScoreParams {
  lat: number;
  lon: number;
  radius_m?: number;
  months_back?: number;
}

export interface HIIGeoJSONParams extends HIIBounds {
  months_back?: number;
}
