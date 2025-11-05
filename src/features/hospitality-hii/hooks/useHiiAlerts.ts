import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { HIIAlert } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseHiiAlertsOptions {
  maxAlerts?: number;
  onAlert?: (alert: HIIAlert) => void;
}

export const useHiiAlerts = ({ 
  maxAlerts = 5,
  onAlert 
}: UseHiiAlertsOptions = {}) => {
  const [alerts, setAlerts] = useState<HIIAlert[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  useEffect(() => {
    console.log('[useHiiAlerts] Setting up realtime subscription');
    
    const channel: RealtimeChannel = supabase
      .channel('hii_alerts_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hii_alerts'
        },
        (payload) => {
          console.log('[useHiiAlerts] New alert received:', payload);
          
          const newAlert: HIIAlert = {
            id: payload.new.id,
            city: payload.new.city,
            yoy: payload.new.yoy,
            establishment_count: payload.new.establishment_count,
            total_receipts: payload.new.total_receipts,
            sent_at: payload.new.sent_at,
          };

          // Add to alerts state
          setAlerts(prev => [newAlert, ...prev].slice(0, maxAlerts));

          // Show toast notification
          toast.success(`📈 ${newAlert.city}`, {
            description: `YoY growth: +${newAlert.yoy.toFixed(1)}% (${newAlert.establishment_count} venues)`,
            duration: 5000,
          });

          // Call optional callback
          if (onAlert) {
            onAlert(newAlert);
          }
        }
      )
      .subscribe((status) => {
        console.log('[useHiiAlerts] Subscription status:', status);
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('[useHiiAlerts] Cleaning up subscription');
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [maxAlerts, onAlert]);

  return {
    alerts,
    isSubscribed,
    clearAlerts,
    removeAlert,
  };
};
