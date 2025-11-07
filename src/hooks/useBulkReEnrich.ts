import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useBulkReEnrich() {
  const [loading, setLoading] = useState(false);

  const bulkReEnrich = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bulk-re-enrich', {
        body: {}
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Bulk re-enrichment failed');

      const { count, successCount } = data;
      
      if (count === 0) {
        toast.info('No failed applications found', {
          description: 'All applications with E003 errors have been processed.'
        });
      } else {
        toast.success(`Re-enrichment triggered for ${successCount}/${count} applications`, {
          description: 'Applications are being re-processed. Check back in a few minutes.'
        });
      }

      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Bulk re-enrichment failed', { description: message });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { bulkReEnrich, loading };
}
