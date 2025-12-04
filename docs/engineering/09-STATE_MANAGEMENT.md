# I. State Management

> Zustand, TanStack Query, and React Context patterns

## State Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    STATE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 SERVER STATE                         │    │
│  │            (TanStack Query)                          │    │
│  │                                                      │    │
│  │  • API data fetching and caching                     │    │
│  │  • Background refetching                             │    │
│  │  • Optimistic updates                                │    │
│  │  • Infinite queries                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 CLIENT STATE                         │    │
│  │               (Zustand)                              │    │
│  │                                                      │    │
│  │  • UI state (modals, sidebars)                       │    │
│  │  • Form state (multi-step)                           │    │
│  │  • Feature-specific state (HII)                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                CONTEXT STATE                         │    │
│  │              (React Context)                         │    │
│  │                                                      │    │
│  │  • Auth state (via Supabase)                         │    │
│  │  • Subscription/credits context                      │    │
│  │  • Theme context                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 LOCAL STATE                          │    │
│  │              (useState/useReducer)                   │    │
│  │                                                      │    │
│  │  • Component-specific state                          │    │
│  │  • Form inputs                                       │    │
│  │  • Toggle states                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## TanStack Query (Server State)

### Setup

```typescript
// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 30 * 60 * 1000,        // 30 minutes (was cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* App content */}
    </QueryClientProvider>
  );
}
```

### Query Patterns

```typescript
// Basic query
import { useQuery } from '@tanstack/react-query';

function useApplications(userId: string) {
  return useQuery({
    queryKey: ['applications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

// Usage
const { data: applications, isLoading, error } = useApplications(userId);
```

### Mutation Patterns

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useCreateApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateApplicationInput) => {
      const { data, error } = await supabase
        .from('applications')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application created');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Usage
const createApplication = useCreateApplication();
createApplication.mutate({ ...formData });
```

### Optimistic Updates

```typescript
function useUpdateApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: UpdateInput) => {
      const { data, error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['applications'] });
      
      // Snapshot previous value
      const previousApps = queryClient.getQueryData(['applications']);
      
      // Optimistically update
      queryClient.setQueryData(['applications'], (old: Application[]) =>
        old.map(app => app.id === id ? { ...app, ...updates } : app)
      );
      
      return { previousApps };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['applications'], context?.previousApps);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
```

### Query Key Convention

```typescript
// Query keys follow hierarchical pattern
const queryKeys = {
  // All applications
  applications: ['applications'] as const,
  
  // Applications for specific user
  userApplications: (userId: string) => 
    ['applications', userId] as const,
  
  // Single application
  application: (id: string) => 
    ['applications', 'detail', id] as const,
  
  // Reports
  reports: ['reports'] as const,
  userReports: (userId: string) => 
    ['reports', userId] as const,
  report: (id: string) => 
    ['reports', 'detail', id] as const,
};

// Invalidation patterns
queryClient.invalidateQueries({ queryKey: ['applications'] }); // All
queryClient.invalidateQueries({ queryKey: ['applications', userId] }); // User's
```

---

## Zustand (Client State)

### Store Creation

```typescript
// src/features/hospitality-hii/store/useHiiStore.ts
import { create } from 'zustand';

interface Coordinates {
  lat: number;
  lng: number;
}

interface HIIFilters {
  monthsBack: number;
  radiusM: number;
}

interface HIIStore {
  // State
  selectedLocation: Coordinates | null;
  filters: HIIFilters;
  isLayerVisible: boolean;
  
  // Actions
  setSelectedLocation: (coords: Coordinates | null) => void;
  setFilters: (filters: Partial<HIIFilters>) => void;
  toggleLayerVisibility: () => void;
  reset: () => void;
}

const initialState = {
  selectedLocation: null,
  filters: { monthsBack: 12, radiusM: 1609 },
  isLayerVisible: true,
};

export const useHiiStore = create<HIIStore>((set) => ({
  ...initialState,
  
  setSelectedLocation: (coords) => 
    set({ selectedLocation: coords }),
  
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters }
    })),
  
  toggleLayerVisibility: () =>
    set((state) => ({ isLayerVisible: !state.isLayerVisible })),
  
  reset: () => set(initialState),
}));
```

### Using Zustand Store

```typescript
// In component
import { useHiiStore } from '@/features/hospitality-hii/store/useHiiStore';

function MapComponent() {
  // Select specific state
  const selectedLocation = useHiiStore((state) => state.selectedLocation);
  const setSelectedLocation = useHiiStore((state) => state.setSelectedLocation);
  
  // Or destructure multiple
  const { filters, setFilters } = useHiiStore();
  
  return (
    <div onClick={(e) => setSelectedLocation({ lat: e.lat, lng: e.lng })}>
      {/* Map content */}
    </div>
  );
}
```

### Zustand with Persistence

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  theme: 'light' | 'dark';
  mapStyle: string;
  setTheme: (theme: 'light' | 'dark') => void;
  setMapStyle: (style: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      mapStyle: 'streets',
      setTheme: (theme) => set({ theme }),
      setMapStyle: (mapStyle) => set({ mapStyle }),
    }),
    {
      name: 'siteintel-settings', // localStorage key
    }
  )
);
```

---

## React Context (Global Context)

### Subscription Context

```typescript
// src/contexts/SubscriptionContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionState {
  tier: 'free' | 'pro' | 'enterprise';
  credits: number;
  reportsRemaining: number;
  isLoading: boolean;
}

interface SubscriptionContextType extends SubscriptionState {
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SubscriptionState>({
    tier: 'free',
    credits: 0,
    reportsRemaining: 0,
    isLoading: true,
  });

  const refresh = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-credits');
      if (error) throw error;
      
      setState({
        tier: data.tier || 'free',
        credits: data.credits || 0,
        reportsRemaining: data.reports_remaining || 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setState(s => ({ ...s, isLoading: false }));
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <SubscriptionContext.Provider value={{ ...state, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}
```

### Auth Context (via Supabase)

```typescript
// Auth state from Supabase
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut };
}
```

---

## Local State Patterns

### Form State with useState

```typescript
function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await submitForm(formData);
      toast.success('Form submitted');
    } catch (error) {
      toast.error('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={formData.name}
        onChange={handleChange('name')}
        error={errors.name}
      />
      {/* ... */}
    </form>
  );
}
```

### Complex State with useReducer

```typescript
type ApplicationState = {
  step: number;
  data: ApplicationData;
  errors: ValidationErrors;
  isDirty: boolean;
};

type ApplicationAction =
  | { type: 'SET_FIELD'; field: string; value: unknown }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_ERRORS'; errors: ValidationErrors }
  | { type: 'RESET' };

function applicationReducer(
  state: ApplicationState,
  action: ApplicationAction
): ApplicationState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        data: { ...state.data, [action.field]: action.value },
        isDirty: true,
      };
    case 'NEXT_STEP':
      return { ...state, step: state.step + 1 };
    case 'PREV_STEP':
      return { ...state, step: Math.max(0, state.step - 1) };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

function useApplicationForm() {
  const [state, dispatch] = useReducer(applicationReducer, initialState);
  
  const setField = (field: string, value: unknown) =>
    dispatch({ type: 'SET_FIELD', field, value });
  
  const nextStep = () => dispatch({ type: 'NEXT_STEP' });
  const prevStep = () => dispatch({ type: 'PREV_STEP' });
  
  return { ...state, setField, nextStep, prevStep };
}
```

---

## State Selection Guidelines

| Use Case | Recommended Solution |
|----------|---------------------|
| API data | TanStack Query |
| Global UI state | Zustand |
| Auth state | Supabase auth hooks |
| Form state | useState / react-hook-form |
| Complex local state | useReducer |
| Theme/settings | Zustand with persist |
| Feature module state | Zustand (scoped store) |
