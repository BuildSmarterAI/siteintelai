import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionContextType {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
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
  const [subscribed, setSubscribed] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setSubscribed(false);
        setProductId(null);
        setSubscriptionEnd(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      setSubscribed(data.subscribed || false);
      setProductId(data.product_id || null);
      setSubscriptionEnd(data.subscription_end || null);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();

    // Check subscription status periodically (every 60 seconds)
    const interval = setInterval(refreshSubscription, 60000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        refreshSubscription();
      } else if (event === 'SIGNED_OUT') {
        setSubscribed(false);
        setProductId(null);
        setSubscriptionEnd(null);
      }
    });

    return () => {
      interval && clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscribed,
        productId,
        subscriptionEnd,
        loading,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
