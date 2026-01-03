/**
 * Parcel Analytics Hook
 * Tracks user interactions with parcel selection for funnel analysis
 */

import { useRef, useCallback, useEffect } from 'react';
import { analytics, trackParcelEvent } from '@/lib/analytics';
import type { CandidateParcel } from '@/types/parcelSelection';

interface ConfidenceDistribution {
  high: number;
  medium: number;
  low: number;
}

export function useParcelAnalytics() {
  const screenLoadTime = useRef(Date.now());
  const selectionChanges = useRef(0);
  const firstSelectTime = useRef<number | null>(null);
  const lastSelectedParcelId = useRef<string | null>(null);
  const hasTrackedView = useRef(false);

  // Reset on mount
  useEffect(() => {
    screenLoadTime.current = Date.now();
    selectionChanges.current = 0;
    firstSelectTime.current = null;
    lastSelectedParcelId.current = null;
    hasTrackedView.current = false;
  }, []);

  /**
   * Track when candidate list is first viewed
   */
  const trackCandidateListViewed = useCallback((props: {
    candidate_count: number;
    has_recommended: boolean;
    confidence_distribution: ConfidenceDistribution;
    county: string;
  }) => {
    if (hasTrackedView.current) return;
    hasTrackedView.current = true;
    
    trackParcelEvent('parcel_candidate_list_viewed', props);
  }, []);

  /**
   * Track parcel hover (throttled to 1 per 2s in analytics service)
   */
  const trackParcelHovered = useCallback((props: {
    parcel_id: string;
    confidence_tier: string;
    source: 'map' | 'list';
  }) => {
    trackParcelEvent('parcel_hovered', props);
  }, []);

  /**
   * Track parcel selection
   */
  const trackParcelSelected = useCallback((props: {
    parcel_id: string;
    confidence_tier: string;
    candidate_rank: number;
    selection_method: 'map_click' | 'list_click' | 'auto_recommend';
    map_zoom_at_select?: number;
  }) => {
    const now = Date.now();
    
    if (firstSelectTime.current === null) {
      firstSelectTime.current = now;
    }
    
    // Track selection change if not first selection
    if (lastSelectedParcelId.current && lastSelectedParcelId.current !== props.parcel_id) {
      selectionChanges.current += 1;
      
      trackParcelEvent('parcel_selection_changed', {
        from_parcel_id: lastSelectedParcelId.current,
        to_parcel_id: props.parcel_id,
        change_count_session: selectionChanges.current,
        from_confidence: 'unknown', // Would need previous confidence
        to_confidence: props.confidence_tier,
      });
    }
    
    lastSelectedParcelId.current = props.parcel_id;
    
    trackParcelEvent('parcel_selected', {
      ...props,
      time_since_screen_load_ms: now - screenLoadTime.current,
      was_camera_fit_success: true, // Assume success, could track separately
    });
  }, []);

  /**
   * Track confirmation modal open
   */
  const trackConfirmModalOpened = useCallback((props: {
    parcel_id: string;
    confidence_tier: string;
    warning_shown: boolean;
    candidate_count: number;
  }) => {
    trackParcelEvent('parcel_confirm_modal_opened', props);
  }, []);

  /**
   * Track parcel lock confirmation
   */
  const trackParcelConfirmedLocked = useCallback((props: {
    parcel_id: string;
    confidence_tier: string;
  }) => {
    trackParcelEvent('parcel_confirmed_locked', {
      ...props,
      changes_before_lock: selectionChanges.current,
      time_from_first_select_ms: firstSelectTime.current 
        ? Date.now() - firstSelectTime.current 
        : 0,
    });
  }, []);

  /**
   * Track unlock attempt
   */
  const trackUnlockAttempted = useCallback((props: {
    parcel_id: string;
    time_since_lock_ms: number;
  }) => {
    trackParcelEvent('parcel_unlock_attempted', props);
  }, []);

  /**
   * Track successful unlock
   */
  const trackParcelUnlocked = useCallback((props: {
    parcel_id: string;
    reason_selected?: string;
  }) => {
    trackParcelEvent('parcel_unlocked', props);
    
    // Reset tracking for new selection flow
    selectionChanges.current = 0;
    firstSelectTime.current = null;
    lastSelectedParcelId.current = null;
  }, []);

  /**
   * Track selection abandonment (call on unmount if not locked)
   */
  const trackSelectionAbandoned = useCallback((props: {
    selected_parcel_id: string | null;
    candidate_count: number;
    confidence_tier: string | null;
  }) => {
    trackParcelEvent('parcel_selection_abandoned', {
      ...props,
      time_on_screen_ms: Date.now() - screenLoadTime.current,
      selection_changes_count: selectionChanges.current,
    });
  }, []);

  /**
   * Track manual search initiation
   */
  const trackManualSearchInitiated = useCallback((props: {
    candidate_count: number;
    confidence_distribution: ConfidenceDistribution;
    had_selected: boolean;
    selected_confidence: string | null;
  }) => {
    trackParcelEvent('manual_search_initiated', props);
  }, []);

  /**
   * Helper to compute confidence distribution from candidates
   */
  const computeConfidenceDistribution = useCallback((candidates: CandidateParcel[]): ConfidenceDistribution => {
    return candidates.reduce(
      (acc, c) => {
        const tier = c.confidence || 'medium';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );
  }, []);

  return {
    trackCandidateListViewed,
    trackParcelHovered,
    trackParcelSelected,
    trackConfirmModalOpened,
    trackParcelConfirmedLocked,
    trackUnlockAttempted,
    trackParcelUnlocked,
    trackSelectionAbandoned,
    trackManualSearchInitiated,
    computeConfidenceDistribution,
    getSessionId: () => analytics.getSessionId(),
  };
}
