import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ComparisonParcel {
  parcel_id: string;
  owner_name: string | null;
  situs_address: string | null;
  acreage: number | null;
  land_use_desc: string | null;
  jurisdiction: string | null;
  market_value?: number | null;
  geometry?: unknown;
  source?: 'canonical' | 'external';
}

interface ParcelComparisonState {
  comparedParcels: ComparisonParcel[];
  isPanelOpen: boolean;
  maxParcels: number;
  
  // Actions
  addToComparison: (parcel: ComparisonParcel) => boolean;
  removeFromComparison: (parcelId: string) => void;
  clearComparison: () => void;
  isInComparison: (parcelId: string) => boolean;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
}

export const useParcelComparisonStore = create<ParcelComparisonState>()(
  persist(
    (set, get) => ({
      comparedParcels: [],
      isPanelOpen: false,
      maxParcels: 4,

      addToComparison: (parcel) => {
        const { comparedParcels, maxParcels } = get();
        
        // Check if already in comparison
        if (comparedParcels.some(p => p.parcel_id === parcel.parcel_id)) {
          return false;
        }
        
        // Check max limit
        if (comparedParcels.length >= maxParcels) {
          return false;
        }
        
        set({ comparedParcels: [...comparedParcels, parcel] });
        return true;
      },

      removeFromComparison: (parcelId) => {
        set(state => ({
          comparedParcels: state.comparedParcels.filter(p => p.parcel_id !== parcelId),
        }));
      },

      clearComparison: () => {
        set({ comparedParcels: [], isPanelOpen: false });
      },

      isInComparison: (parcelId) => {
        return get().comparedParcels.some(p => p.parcel_id === parcelId);
      },

      togglePanel: () => {
        set(state => ({ isPanelOpen: !state.isPanelOpen }));
      },

      openPanel: () => {
        set({ isPanelOpen: true });
      },

      closePanel: () => {
        set({ isPanelOpen: false });
      },
    }),
    {
      name: 'parcel-comparison-storage',
      partialize: (state) => ({
        comparedParcels: state.comparedParcels,
      }),
    }
  )
);
