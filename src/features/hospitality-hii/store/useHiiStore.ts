import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HiiStore {
  // Filters
  city: string;
  radius: number; // meters
  months: number;
  
  // Current data
  hiiScore: number | null;
  bounds: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  } | null;
  
  // Actions
  setCity: (city: string) => void;
  setRadius: (radius: number) => void;
  setMonths: (months: number) => void;
  setHiiScore: (score: number | null) => void;
  setBounds: (bounds: HiiStore['bounds']) => void;
  reset: () => void;
}

const initialState = {
  city: 'Houston',
  radius: 1609, // 1 mile in meters
  months: 12,
  hiiScore: null,
  bounds: null,
};

export const useHiiStore = create<HiiStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setCity: (city) => set({ city }),
      setRadius: (radius) => set({ radius }),
      setMonths: (months) => set({ months }),
      setHiiScore: (hiiScore) => set({ hiiScore }),
      setBounds: (bounds) => set({ bounds }),
      reset: () => set(initialState),
    }),
    {
      name: 'hii-store',
      partialize: (state) => ({
        city: state.city,
        radius: state.radius,
        months: state.months,
      }),
    }
  )
);
