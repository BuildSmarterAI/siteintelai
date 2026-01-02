import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * useApplicationOrchestration Hook (J-04)
 * Track real-time application processing progress
 */

export type OrchestrationStatus =
  | 'pending'
  | 'geocoding'
  | 'parcel_lookup'
  | 'enriching'
  | 'overlay_fetch'
  | 'scoring'
  | 'report_generation'
  | 'complete'
  | 'error';

interface OrchestrationEvent {
  timestamp: string;
  status: OrchestrationStatus;
  message: string;
  progress: number;
}

interface OrchestrationState {
  status: OrchestrationStatus | null;
  progress: number;
  message: string;
  events: OrchestrationEvent[];
  errorCode: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export function useApplicationOrchestration(applicationId: string | null) {
  const [state, setState] = useState<OrchestrationState>({
    status: null,
    progress: 0,
    message: '',
    events: [],
    errorCode: null,
    startedAt: null,
    completedAt: null,
  });

  const [isStarting, setIsStarting] = useState(false);

  // Fetch initial state
  useEffect(() => {
    if (!applicationId) {
      setState({
        status: null,
        progress: 0,
        message: '',
        events: [],
        errorCode: null,
        startedAt: null,
        completedAt: null,
      });
      return;
    }

    const fetchInitialState = async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('enrichment_status, status_percent, error_code, created_at, updated_at')
        .eq('id', applicationId)
        .single();

      if (!error && data) {
        setState(prev => ({
          ...prev,
          status: (data.enrichment_status as OrchestrationStatus) || null,
          progress: data.status_percent || 0,
          errorCode: data.error_code || null,
          startedAt: data.created_at,
          completedAt: data.enrichment_status === 'complete' ? data.updated_at : null,
        }));
      }
    };

    fetchInitialState();
  }, [applicationId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!applicationId) return;

    const channel = supabase
      .channel(`orchestration:${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: `id=eq.${applicationId}`,
        },
        (payload) => {
          const newData = payload.new as Record<string, unknown>;
          const status = newData.enrichment_status as OrchestrationStatus;
          const progress = (newData.status_percent as number) || 0;
          const errorCode = newData.error_code as string | null;

          // Create event for this update
          const event: OrchestrationEvent = {
            timestamp: new Date().toISOString(),
            status,
            message: getStatusMessage(status),
            progress,
          };

          setState(prev => ({
            ...prev,
            status,
            progress,
            message: event.message,
            errorCode,
            events: [...prev.events.slice(-9), event], // Keep last 10 events
            completedAt: status === 'complete' || status === 'error' 
              ? new Date().toISOString() 
              : prev.completedAt,
          }));

          // Show toast on completion or error
          if (status === 'complete') {
            toast.success('Analysis complete!');
          } else if (status === 'error') {
            toast.error(`Analysis failed: ${errorCode || 'Unknown error'}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applicationId]);

  // Start orchestration
  const startOrchestration = useCallback(async () => {
    if (!applicationId) {
      console.error('[useApplicationOrchestration] No applicationId provided');
      return { success: false, error: 'No application ID' };
    }

    setIsStarting(true);
    setState(prev => ({
      ...prev,
      status: 'pending',
      progress: 0,
      message: 'Starting analysis...',
      events: [],
      errorCode: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
    }));

    try {
      const { data, error } = await supabase.functions.invoke('orchestrate-application', {
        body: { applicationId },
      });

      if (error) {
        setState(prev => ({
          ...prev,
          status: 'error',
          message: error.message,
          errorCode: 'ORCHESTRATION_START_FAILED',
        }));
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        status: 'error',
        message: errorMessage,
        errorCode: 'ORCHESTRATION_EXCEPTION',
      }));
      return { success: false, error: errorMessage };
    } finally {
      setIsStarting(false);
    }
  }, [applicationId]);

  // Retry failed orchestration
  const retry = useCallback(async () => {
    if (state.status !== 'error') {
      console.warn('[useApplicationOrchestration] Cannot retry: not in error state');
      return { success: false, error: 'Not in error state' };
    }
    return startOrchestration();
  }, [state.status, startOrchestration]);

  return {
    ...state,
    isStarting,
    isProcessing: state.status != null && !['complete', 'error'].includes(state.status),
    isComplete: state.status === 'complete',
    isError: state.status === 'error',
    startOrchestration,
    retry,
  };
}

function getStatusMessage(status: OrchestrationStatus): string {
  switch (status) {
    case 'pending':
      return 'Preparing analysis...';
    case 'geocoding':
      return 'Geocoding address...';
    case 'parcel_lookup':
      return 'Looking up parcel data...';
    case 'enriching':
      return 'Enriching with external data...';
    case 'overlay_fetch':
      return 'Fetching overlay data...';
    case 'scoring':
      return 'Computing feasibility score...';
    case 'report_generation':
      return 'Generating report...';
    case 'complete':
      return 'Analysis complete!';
    case 'error':
      return 'Analysis failed';
    default:
      return 'Processing...';
  }
}
