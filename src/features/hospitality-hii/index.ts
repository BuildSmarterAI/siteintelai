// Hospitality Intelligence (HII) Module
export { useHiiStore } from './store/useHiiStore';

// Data hooks
export { useHiiScore } from './hooks/useHiiScore';
export { useHiiGeoJSON, useDebouncedHiiGeoJSON } from './hooks/useHiiGeoJSON';
export { useHiiAlerts } from './hooks/useHiiAlerts';

// Types
export type {
  HIIBounds,
  HIIScoreResult,
  HIIGeoJSON,
  HIIGeoJSONFeature,
  HIIAlert,
  HIIScoreParams,
  HIIGeoJSONParams,
  HIIEstablishment,
} from './types';
