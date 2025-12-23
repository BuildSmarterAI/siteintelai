/**
 * Search History Hook - P5
 * Manages recent searches and favorites with database persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

export type SearchQueryType = 'address' | 'apn' | 'coordinates' | 'intersection' | 'draw';

export interface SavedLocation {
  id: string;
  label: string;
  query: string;
  queryType: SearchQueryType;
  lat?: number;
  lng?: number;
  parcelId?: string;
  county?: string;
  isFavorite: boolean;
  useCount: number;
  lastUsedAt: Date;
  createdAt: Date;
}

interface UseSearchHistoryOptions {
  maxRecent?: number;
  maxFavorites?: number;
}

interface UseSearchHistoryReturn {
  recentSearches: SavedLocation[];
  favorites: SavedLocation[];
  isLoading: boolean;
  addSearch: (search: Omit<SavedLocation, 'id' | 'isFavorite' | 'useCount' | 'lastUsedAt' | 'createdAt'>) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  removeSearch: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'siteintel_search_history';

// Convert database row to SavedLocation
function rowToSavedLocation(row: Record<string, unknown>): SavedLocation {
  return {
    id: row.id as string,
    label: row.label as string,
    query: row.query as string,
    queryType: row.query_type as SearchQueryType,
    lat: row.lat as number | undefined,
    lng: row.lng as number | undefined,
    parcelId: row.parcel_id as string | undefined,
    county: row.county as string | undefined,
    isFavorite: row.is_favorite as boolean,
    useCount: row.use_count as number,
    lastUsedAt: new Date(row.last_used_at as string),
    createdAt: new Date(row.created_at as string),
  };
}

export function useSearchHistory(options: UseSearchHistoryOptions = {}): UseSearchHistoryReturn {
  const { maxRecent = 10, maxFavorites = 20 } = options;
  const { user, isAuthenticated } = useAuth();
  
  const [recentSearches, setRecentSearches] = useState<SavedLocation[]>([]);
  const [favorites, setFavorites] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage for unauthenticated users
  const loadFromLocalStorage = useCallback((): SavedLocation[] => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((item: Record<string, unknown>) => ({
          ...item,
          lastUsedAt: new Date(item.lastUsedAt as string),
          createdAt: new Date(item.createdAt as string),
        }));
      }
    } catch (e) {
      console.error('Failed to load search history from localStorage:', e);
    }
    return [];
  }, []);

  // Save to localStorage for unauthenticated users
  const saveToLocalStorage = useCallback((searches: SavedLocation[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(searches.slice(0, maxRecent)));
    } catch (e) {
      console.error('Failed to save search history to localStorage:', e);
    }
  }, [maxRecent]);

  // Load history from database or localStorage
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    
    try {
      if (isAuthenticated && user) {
        // Load from database
        const { data, error } = await supabase
          .from('user_saved_locations')
          .select('*')
          .eq('user_id', user.id)
          .order('last_used_at', { ascending: false })
          .limit(maxRecent + maxFavorites);

        if (error) throw error;

        const locations = (data || []).map(rowToSavedLocation);
        setFavorites(locations.filter(l => l.isFavorite).slice(0, maxFavorites));
        setRecentSearches(locations.filter(l => !l.isFavorite).slice(0, maxRecent));
      } else {
        // Load from localStorage
        const localSearches = loadFromLocalStorage();
        setFavorites(localSearches.filter(l => l.isFavorite).slice(0, maxFavorites));
        setRecentSearches(localSearches.filter(l => !l.isFavorite).slice(0, maxRecent));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, maxRecent, maxFavorites, loadFromLocalStorage]);

  // Initial load
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Add a new search
  const addSearch = useCallback(async (
    search: Omit<SavedLocation, 'id' | 'isFavorite' | 'useCount' | 'lastUsedAt' | 'createdAt'>
  ) => {
    const now = new Date();
    
    if (isAuthenticated && user) {
      try {
        // Check if this query already exists
        const { data: existing } = await supabase
          .from('user_saved_locations')
          .select('id, use_count')
          .eq('user_id', user.id)
          .eq('query', search.query)
          .maybeSingle();

        if (existing) {
          // Update existing entry
          await supabase
            .from('user_saved_locations')
            .update({
              use_count: (existing.use_count as number) + 1,
              last_used_at: now.toISOString(),
              label: search.label,
              lat: search.lat,
              lng: search.lng,
              parcel_id: search.parcelId,
              county: search.county,
            })
            .eq('id', existing.id);
        } else {
          // Insert new entry
          await supabase
            .from('user_saved_locations')
            .insert({
              user_id: user.id,
              label: search.label,
              query: search.query,
              query_type: search.queryType,
              lat: search.lat,
              lng: search.lng,
              parcel_id: search.parcelId,
              county: search.county,
              is_favorite: false,
              use_count: 1,
              last_used_at: now.toISOString(),
            });
        }

        await loadHistory();
      } catch (error) {
        console.error('Failed to save search:', error);
      }
    } else {
      // Save to localStorage
      const localSearches = loadFromLocalStorage();
      const existingIndex = localSearches.findIndex(s => s.query === search.query);
      
      const newSearch: SavedLocation = {
        id: crypto.randomUUID(),
        ...search,
        isFavorite: false,
        useCount: 1,
        lastUsedAt: now,
        createdAt: now,
      };

      let updatedSearches: SavedLocation[];
      
      if (existingIndex >= 0) {
        // Update existing
        updatedSearches = [...localSearches];
        updatedSearches[existingIndex] = {
          ...updatedSearches[existingIndex],
          ...search,
          useCount: updatedSearches[existingIndex].useCount + 1,
          lastUsedAt: now,
        };
      } else {
        // Add new
        updatedSearches = [newSearch, ...localSearches];
      }

      // Sort by last used
      updatedSearches.sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime());
      
      saveToLocalStorage(updatedSearches);
      setFavorites(updatedSearches.filter(l => l.isFavorite).slice(0, maxFavorites));
      setRecentSearches(updatedSearches.filter(l => !l.isFavorite).slice(0, maxRecent));
    }
  }, [isAuthenticated, user, loadHistory, loadFromLocalStorage, saveToLocalStorage, maxRecent, maxFavorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (id: string) => {
    if (isAuthenticated && user) {
      try {
        const allSearches = [...favorites, ...recentSearches];
        const search = allSearches.find(s => s.id === id);
        
        if (search) {
          await supabase
            .from('user_saved_locations')
            .update({ is_favorite: !search.isFavorite })
            .eq('id', id)
            .eq('user_id', user.id);

          await loadHistory();
          toast.success(search.isFavorite ? 'Removed from favorites' : 'Added to favorites');
        }
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
        toast.error('Failed to update favorite');
      }
    } else {
      // Update localStorage
      const localSearches = loadFromLocalStorage();
      const index = localSearches.findIndex(s => s.id === id);
      
      if (index >= 0) {
        localSearches[index].isFavorite = !localSearches[index].isFavorite;
        saveToLocalStorage(localSearches);
        setFavorites(localSearches.filter(l => l.isFavorite).slice(0, maxFavorites));
        setRecentSearches(localSearches.filter(l => !l.isFavorite).slice(0, maxRecent));
        toast.success(localSearches[index].isFavorite ? 'Added to favorites' : 'Removed from favorites');
      }
    }
  }, [isAuthenticated, user, favorites, recentSearches, loadHistory, loadFromLocalStorage, saveToLocalStorage, maxRecent, maxFavorites]);

  // Remove a search
  const removeSearch = useCallback(async (id: string) => {
    if (isAuthenticated && user) {
      try {
        await supabase
          .from('user_saved_locations')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        await loadHistory();
      } catch (error) {
        console.error('Failed to remove search:', error);
        toast.error('Failed to remove search');
      }
    } else {
      const localSearches = loadFromLocalStorage().filter(s => s.id !== id);
      saveToLocalStorage(localSearches);
      setFavorites(localSearches.filter(l => l.isFavorite).slice(0, maxFavorites));
      setRecentSearches(localSearches.filter(l => !l.isFavorite).slice(0, maxRecent));
    }
  }, [isAuthenticated, user, loadHistory, loadFromLocalStorage, saveToLocalStorage, maxRecent, maxFavorites]);

  // Clear all history
  const clearHistory = useCallback(async () => {
    if (isAuthenticated && user) {
      try {
        await supabase
          .from('user_saved_locations')
          .delete()
          .eq('user_id', user.id)
          .eq('is_favorite', false);

        await loadHistory();
        toast.success('Search history cleared');
      } catch (error) {
        console.error('Failed to clear history:', error);
        toast.error('Failed to clear history');
      }
    } else {
      const localSearches = loadFromLocalStorage().filter(s => s.isFavorite);
      saveToLocalStorage(localSearches);
      setRecentSearches([]);
      toast.success('Search history cleared');
    }
  }, [isAuthenticated, user, loadHistory, loadFromLocalStorage, saveToLocalStorage]);

  return {
    recentSearches,
    favorites,
    isLoading,
    addSearch,
    toggleFavorite,
    removeSearch,
    clearHistory,
    refreshHistory: loadHistory,
  };
}
