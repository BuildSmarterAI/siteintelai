// Evidence Drawer Types for SiteIntel™ Feasibility Platform

export type EvidenceDomain = 
  | 'zoning' 
  | 'flood' 
  | 'utilities' 
  | 'environmental' 
  | 'traffic' 
  | 'market' 
  | 'property';

export type FreshnessStatus = 'fresh' | 'recent' | 'stale';
export type RetrievalMethod = 'live' | 'cached' | 'estimated' | 'user_upload';

export interface SourceMetadata {
  sourceName: string;
  sourceDisplayName: string;
  sourceUrl?: string;
  timestamp: string;
  freshnessDays: number;
  freshnessStatus: FreshnessStatus;
  reliabilityScore: number; // 0-100
  retrievalMethod: RetrievalMethod;
  apiEndpoint?: string; // Enterprise only
  datasetVersion?: string;
  notes?: string[];
}

export interface EvidenceData {
  domain: EvidenceDomain;
  title: string;
  sourceMetadata: SourceMetadata;
  rawData: Record<string, unknown>;
  pdfUrl?: string;
  mapPreviewUrl?: string;
  userNotes?: string[];
}

export interface EvidenceDrawerState {
  isOpen: boolean;
  activeTab: 'evidence' | 'raw' | 'metadata' | 'notes';
  data: EvidenceData | null;
}

// Utility function to calculate freshness
export function calculateFreshness(timestamp: string): { days: number; status: FreshnessStatus } {
  const now = new Date();
  const dataDate = new Date(timestamp);
  const diffTime = Math.abs(now.getTime() - dataDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let status: FreshnessStatus = 'fresh';
  if (diffDays > 30) {
    status = 'stale';
  } else if (diffDays > 7) {
    status = 'recent';
  }

  return { days: diffDays, status };
}

// Default source configurations
export const DATA_SOURCES: Record<EvidenceDomain, Omit<SourceMetadata, 'timestamp' | 'freshnessDays' | 'freshnessStatus' | 'reliabilityScore' | 'retrievalMethod'>> = {
  zoning: {
    sourceName: 'MUNICIPAL_GIS',
    sourceDisplayName: 'Municipal GIS / HCAD',
    sourceUrl: 'https://www.hcad.org/',
  },
  flood: {
    sourceName: 'FEMA_NFHL',
    sourceDisplayName: 'FEMA National Flood Hazard Layer',
    sourceUrl: 'https://msc.fema.gov/portal/',
  },
  utilities: {
    sourceName: 'GIS_VERIFIED',
    sourceDisplayName: 'City of Houston GIS',
    sourceUrl: 'https://cohgis-mycity.opendata.arcgis.com/',
  },
  environmental: {
    sourceName: 'EPA_USFWS_USDA',
    sourceDisplayName: 'EPA ECHO / USFWS NWI / USDA SSURGO',
    sourceUrl: 'https://echo.epa.gov/',
  },
  traffic: {
    sourceName: 'TXDOT_AADT',
    sourceDisplayName: 'TxDOT Traffic Count Database',
    sourceUrl: 'https://www.txdot.gov/data-maps/roadway-inventory.html',
  },
  market: {
    sourceName: 'CENSUS_ACS',
    sourceDisplayName: 'US Census Bureau ACS',
    sourceUrl: 'https://data.census.gov/',
  },
  property: {
    sourceName: 'HCAD',
    sourceDisplayName: 'Harris County Appraisal District',
    sourceUrl: 'https://www.hcad.org/',
  },
};
