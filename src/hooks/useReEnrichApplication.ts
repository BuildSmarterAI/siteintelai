import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useReEnrichApplication() {
  const [loading, setLoading] = useState(false);

  const reEnrich = async (applicationId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('re-enrich-application', {
        body: { application_id: applicationId }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Re-enrichment failed');

      toast.success('Enrichment triggered successfully', {
        description: 'The application will be re-processed. Refresh in a few moments.'
      });

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Re-enrichment failed', { description: message });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { reEnrich, loading };
}
