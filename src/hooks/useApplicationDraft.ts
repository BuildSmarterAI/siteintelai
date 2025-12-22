import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from "@/lib/logger";
import { supabase } from '@/integrations/supabase/client';
import { ApplicationFormData } from './useApplicationForm';
import { useToast } from './use-toast';

interface DraftState {
  draftId: string | null;
  lastSaved: string | null;
  isSaving: boolean;
  isLoading: boolean;
  completionPercent: number;
}

export function useApplicationDraft(
  formData: ApplicationFormData,
  currentStep: number,
  updateMultipleFields: (updates: Partial<ApplicationFormData>) => void
) {
  const { toast } = useToast();
  const [draftState, setDraftState] = useState<DraftState>({
    draftId: null,
    lastSaved: null,
    isSaving: false,
    isLoading: true,
    completionPercent: 0,
  });
  
  const saveTimeoutRef = useRef<number | null>(null);
  const lastSavedDataRef = useRef<string>('');

  // Load existing draft on mount
  useEffect(() => {
    async function loadDraft() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setDraftState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // Check for draft_id in URL or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const urlDraftId = urlParams.get('draft_id');
        const storedDraftId = localStorage.getItem('current_draft_id');
        const draftId = urlDraftId || storedDraftId;

        if (draftId) {
          // Load specific draft
          const { data: draft, error } = await supabase
            .from('applications')
            .select('*')
            .eq('id', draftId)
            .eq('user_id', session.user.id)
            .eq('enrichment_status', 'draft')
            .maybeSingle();

          if (draft && !error) {
            logger.debug('Draft', 'Loaded existing draft:', draftId);
            restoreFormFromDraft(draft);
            setDraftState(prev => ({
              ...prev,
              draftId: draft.id,
              lastSaved: draft.draft_saved_at,
              isLoading: false,
            }));
            return;
          }
        }

        // Find most recent draft for this user
        const { data: recentDraft, error } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('enrichment_status', 'draft')
          .order('draft_saved_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentDraft && !error) {
          logger.debug('Draft', 'Found recent draft:', recentDraft.id);
          restoreFormFromDraft(recentDraft);
          localStorage.setItem('current_draft_id', recentDraft.id);
          setDraftState(prev => ({
            ...prev,
            draftId: recentDraft.id,
            lastSaved: recentDraft.draft_saved_at,
            isLoading: false,
          }));
        } else {
          setDraftState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        logger.error('[Draft] Error loading draft:', error);
        setDraftState(prev => ({ ...prev, isLoading: false }));
      }
    }

    loadDraft();
  }, []);

  // Restore form fields from draft data
  const restoreFormFromDraft = (draft: any) => {
    const updates: Partial<ApplicationFormData> = {};
    
    if (draft.full_name) updates.fullName = draft.full_name;
    if (draft.company) updates.company = draft.company;
    if (draft.email) updates.email = draft.email;
    if (draft.phone) updates.phone = draft.phone;
    if (draft.intent_type) updates.intentType = draft.intent_type as 'build' | 'buy';
    if (draft.formatted_address || draft.property_address) {
      updates.propertyAddress = draft.formatted_address || draft.property_address;
    }
    if (draft.geo_lat) updates.geoLat = draft.geo_lat;
    if (draft.geo_lng) updates.geoLng = draft.geo_lng;
    if (draft.county) updates.county = draft.county;
    if (draft.city) updates.city = draft.city;
    if (draft.state) updates.state = draft.state;
    if (draft.postal_code) updates.zipCode = draft.postal_code;
    if (draft.neighborhood) updates.neighborhood = draft.neighborhood;
    if (draft.sublocality) updates.sublocality = draft.sublocality;
    if (draft.place_id) updates.placeId = draft.place_id;
    if (draft.project_type) updates.projectType = draft.project_type;
    if (draft.building_size_value) updates.buildingSize = String(draft.building_size_value);
    if (draft.building_size_unit) updates.buildingSizeUnit = draft.building_size_unit;
    if (draft.stories_height) updates.stories = draft.stories_height;
    if (draft.prototype_requirements) updates.prototypeRequirements = draft.prototype_requirements;
    if (draft.quality_level) updates.qualityLevel = draft.quality_level;
    if (draft.desired_budget) updates.budget = String(draft.desired_budget);
    if (draft.parcel_id) updates.parcelId = draft.parcel_id;
    if (draft.acreage_cad) updates.lotSize = String(draft.acreage_cad);
    if (draft.zoning_code) updates.zoning = draft.zoning_code;

    if (Object.keys(updates).length > 0) {
      logger.debug('Draft', 'Restoring form fields:', Object.keys(updates));
      updateMultipleFields(updates);
    }
  };

  // Save draft to Supabase
  const saveDraft = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Check if data has changed since last save
      const currentDataHash = JSON.stringify({
        ...formData,
        currentStep,
      });
      
      if (currentDataHash === lastSavedDataRef.current) {
        return; // No changes, skip save
      }

      setDraftState(prev => ({ ...prev, isSaving: true }));

      const { data, error } = await supabase.functions.invoke('save-draft', {
        body: {
          formData,
          currentStep,
          draftId: draftState.draftId,
        },
      });

      if (error) throw error;

      lastSavedDataRef.current = currentDataHash;
      
      if (data.draft_id) {
        localStorage.setItem('current_draft_id', data.draft_id);
      }

      setDraftState(prev => ({
        ...prev,
        draftId: data.draft_id,
        lastSaved: data.lastSaved,
        isSaving: false,
        completionPercent: data.completionPercent,
      }));

      logger.debug('Draft', 'Saved successfully:', data.draft_id);
    } catch (error) {
      logger.error('[Draft] Save error:', error);
      setDraftState(prev => ({ ...prev, isSaving: false }));
    }
  }, [formData, currentStep, draftState.draftId]);

  // Auto-save with debounce (30 seconds)
  useEffect(() => {
    // Don't auto-save if still loading or no meaningful data
    if (draftState.isLoading) return;
    if (!formData.propertyAddress && !formData.fullName) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = window.setTimeout(() => {
      saveDraft();
    }, 30000); // 30 seconds

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, currentStep, draftState.isLoading, saveDraft]);

  // Save on step change
  useEffect(() => {
    if (draftState.isLoading) return;
    if (!formData.propertyAddress && !formData.fullName) return;
    
    saveDraft();
  }, [currentStep]);

  // Clear draft after successful submission
  const clearDraft = useCallback(() => {
    localStorage.removeItem('current_draft_id');
    setDraftState({
      draftId: null,
      lastSaved: null,
      isSaving: false,
      isLoading: false,
      completionPercent: 0,
    });
  }, []);

  return {
    ...draftState,
    saveDraft,
    clearDraft,
  };
}
