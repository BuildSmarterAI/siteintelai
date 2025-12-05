import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ApiLogEntry {
  id: string;
  source: string;
  endpoint: string;
  duration_ms: number;
  success: boolean;
  error_message: string | null;
  timestamp: string;
  application_id: string | null;
}

interface ActiveApplication {
  id: string;
  status: string;
  formatted_address: string | null;
  status_percent: number | null;
  updated_at: string;
}

interface RealTimeMonitorState {
  recentCalls: ApiLogEntry[];
  activeApplications: ActiveApplication[];
  errorStream: ApiLogEntry[];
  isConnected: boolean;
  lastUpdate: string | null;
}

export function useRealTimeMonitor() {
  const [state, setState] = useState<RealTimeMonitorState>({
    recentCalls: [],
    activeApplications: [],
    errorStream: [],
    isConnected: false,
    lastUpdate: null,
  });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Initial fetch of recent data
    const fetchInitialData = async () => {
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      // Fetch recent API logs
      const { data: logs } = await supabase
        .from('api_logs')
        .select('id, source, endpoint, duration_ms, success, error_message, timestamp, application_id')
        .gte('timestamp', tenMinAgo)
        .order('timestamp', { ascending: false })
        .limit(50);

      // Fetch active applications (in progress)
      const { data: apps } = await supabase
        .from('applications')
        .select('id, status, formatted_address, status_percent, updated_at')
        .in('status', ['queued', 'enriching', 'ai', 'rendering'])
        .order('updated_at', { ascending: false })
        .limit(20);

      const errorLogs = (logs || []).filter(l => !l.success);

      setState(prev => ({
        ...prev,
        recentCalls: logs || [],
        activeApplications: apps || [],
        errorStream: errorLogs,
        lastUpdate: new Date().toISOString(),
      }));
    };

    fetchInitialData();

    // Set up real-time subscription for api_logs
    const channel = supabase
      .channel('realtime-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'api_logs',
        },
        (payload) => {
          const newLog = payload.new as ApiLogEntry;
          setState(prev => ({
            ...prev,
            recentCalls: [newLog, ...prev.recentCalls].slice(0, 50),
            errorStream: newLog.success 
              ? prev.errorStream 
              : [newLog, ...prev.errorStream].slice(0, 30),
            lastUpdate: new Date().toISOString(),
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: 'status=in.(queued,enriching,ai,rendering,complete,error)',
        },
        (payload) => {
          const updatedApp = payload.new as ActiveApplication;
          setState(prev => {
            // If app is complete or error, remove from active list
            if (['complete', 'error'].includes(updatedApp.status)) {
              return {
                ...prev,
                activeApplications: prev.activeApplications.filter(a => a.id !== updatedApp.id),
                lastUpdate: new Date().toISOString(),
              };
            }
            // Otherwise update or add
            const existing = prev.activeApplications.find(a => a.id === updatedApp.id);
            if (existing) {
              return {
                ...prev,
                activeApplications: prev.activeApplications.map(a => 
                  a.id === updatedApp.id ? updatedApp : a
                ),
                lastUpdate: new Date().toISOString(),
              };
            }
            return {
              ...prev,
              activeApplications: [updatedApp, ...prev.activeApplications].slice(0, 20),
              lastUpdate: new Date().toISOString(),
            };
          });
        }
      )
      .subscribe((status) => {
        setState(prev => ({
          ...prev,
          isConnected: status === 'SUBSCRIBED',
        }));
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return state;
}
