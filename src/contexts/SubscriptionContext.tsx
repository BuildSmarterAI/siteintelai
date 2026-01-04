import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface CreditsInfo {
  tier: string;
  reports_limit: number;
  reports_used: number;
  reports_remaining: number;
  quickchecks_unlimited: boolean;
  has_subscription: boolean;
}

interface SubscriptionContextType {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
  credits: CreditsInfo | null;
  refreshSubscription: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = async () => {
    if (!session?.access_token) {
      setSubscribed(false);
      setProductId(null);
      setSubscriptionEnd(null);
      setCredits(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch subscription status
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        // Handle auth errors gracefully - don't crash the app
        if (error.message?.includes('401') || error.message?.includes('Invalid JWT')) {
          console.warn('Session may have expired, waiting for refresh');
          setSubscribed(false);
          setLoading(false);
          return;
        }
        console.error('Error checking subscription:', error);
        return;
      }

      setSubscribed(data.subscribed || false);
      setProductId(data.product_id || null);
      setSubscriptionEnd(data.subscription_end || null);

      // Fetch credits info
      const { data: creditsData, error: creditsError } = await supabase.functions.invoke('get-credits', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (creditsError) {
        // Handle auth errors gracefully
        if (creditsError.message?.includes('401') || creditsError.message?.includes('Invalid JWT')) {
          console.warn('Credits fetch failed due to session issue');
          return;
        }
        console.error('Error fetching credits:', creditsError);
        return;
      }

      if (creditsData) {
        setCredits(creditsData);
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session');
        return;
      }

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error opening customer portal:', error);
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
    }
  };

  // Refresh subscription when user changes
  useEffect(() => {
    if (user) {
      refreshSubscription();
    } else {
      setSubscribed(false);
      setProductId(null);
      setSubscriptionEnd(null);
      setCredits(null);
      setLoading(false);
    }
  }, [user, session]);

  // Check subscription status periodically (every 60 seconds) when user is logged in
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(refreshSubscription, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscribed,
        productId,
        subscriptionEnd,
        loading,
        credits,
        refreshSubscription,
        openCustomerPortal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
