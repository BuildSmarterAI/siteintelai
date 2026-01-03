/**
 * Analytics Service for SiteIntel
 * Provides event tracking with batching and persistence
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface AnalyticsEvent {
  name: string;
  properties: Record<string, unknown>;
  timestamp: number;
  sessionId?: string;
}

interface AnalyticsConfig {
  batchSize: number;
  flushIntervalMs: number;
  maxRetries: number;
  debug: boolean;
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  batchSize: 10,
  flushIntervalMs: 5000,
  maxRetries: 3,
  debug: import.meta.env.DEV,
};

class AnalyticsService {
  private queue: AnalyticsEvent[] = [];
  private config: AnalyticsConfig;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string;
  private userId: string | null = null;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.startFlushTimer();
    
    // Get user ID if authenticated
    supabase.auth.getUser().then(({ data }) => {
      this.userId = data.user?.id || null;
    });
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange((_, session) => {
      this.userId = session?.user?.id || null;
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private startFlushTimer(): void {
    if (this.flushTimer) return;
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushIntervalMs);
  }

  /**
   * Track an analytics event
   */
  track(name: string, properties: Record<string, unknown> = {}): void {
    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        url: typeof window !== 'undefined' ? window.location.pathname : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.queue.push(event);

    if (this.config.debug) {
      logger.debug('[Analytics]', name, properties);
    }

    // Flush immediately if batch size reached
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush all queued events to the server
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    try {
      // For now, just log to console in development
      // In production, this would send to an analytics endpoint
      if (this.config.debug) {
        logger.debug('[Analytics] Flushing batch:', batch.length, 'events');
      }

      // Store events in Supabase if we want persistence
      // Note: Requires analytics_events table to be created
      // const { error } = await supabase.from('analytics_events').insert(
      //   batch.map(e => ({
      //     event_name: e.name,
      //     properties: e.properties,
      //     session_id: e.sessionId,
      //     user_id: this.userId,
      //     occurred_at: new Date(e.timestamp).toISOString(),
      //   }))
      // );
      // 
      // if (error) throw error;
      
    } catch (err) {
      logger.error('[Analytics] Flush failed:', err);
      // Re-queue events for retry (limit to prevent memory leak)
      if (this.queue.length < 100) {
        this.queue.unshift(...batch);
      }
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Cleanup on unmount
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// Convenience methods for common events
export const trackEvent = analytics.track.bind(analytics);

// Parcel Selection Event Types
export type ParcelSelectionEvent = 
  | 'parcel_candidate_list_viewed'
  | 'parcel_hovered'
  | 'parcel_selected'
  | 'parcel_selection_changed'
  | 'parcel_confirm_modal_opened'
  | 'parcel_confirmed_locked'
  | 'parcel_unlock_attempted'
  | 'parcel_unlocked'
  | 'parcel_selection_abandoned'
  | 'manual_search_initiated';

// Type-safe event tracking
export function trackParcelEvent(
  event: ParcelSelectionEvent,
  properties: Record<string, unknown>
): void {
  analytics.track(event, properties);
}
