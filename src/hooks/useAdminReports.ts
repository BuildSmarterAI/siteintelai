import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminReportsFilters {
  status?: string;
  scoreBand?: string;
  hasPdf?: 'all' | 'yes' | 'no';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AdminReport {
  id: string;
  application_id: string;
  status: string;
  feasibility_score: number | null;
  score_band: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  formatted_address: string | null;
  parcel_id: string | null;
  user_email: string | null;
}

export interface ReportStats {
  total: number;
  completed: number;
  withPdf: number;
  withoutPdf: number;
  avgScore: number;
}

export function useAdminReports(filters: AdminReportsFilters) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-reports', filters],
    queryFn: async () => {
      let query = supabase
        .from('reports')
        .select(`
          id,
          application_id,
          status,
          feasibility_score,
          score_band,
          pdf_url,
          created_at,
          updated_at,
          applications!inner (
            formatted_address,
            parcel_id,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.scoreBand && filters.scoreBand !== 'all') {
        query = query.eq('score_band', filters.scoreBand);
      }

      if (filters.hasPdf === 'yes') {
        query = query.not('pdf_url', 'is', null);
      } else if (filters.hasPdf === 'no') {
        query = query.is('pdf_url', null);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data and apply search filter client-side
      let reports: AdminReport[] = (data || []).map((r: any) => ({
        id: r.id,
        application_id: r.application_id,
        status: r.status,
        feasibility_score: r.feasibility_score,
        score_band: r.score_band,
        pdf_url: r.pdf_url,
        created_at: r.created_at,
        updated_at: r.updated_at,
        formatted_address: r.applications?.formatted_address,
        parcel_id: r.applications?.parcel_id,
        user_email: r.applications?.email,
      }));

      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        reports = reports.filter(r => 
          r.formatted_address?.toLowerCase().includes(searchLower) ||
          r.parcel_id?.toLowerCase().includes(searchLower) ||
          r.user_email?.toLowerCase().includes(searchLower)
        );
      }

      return reports;
    },
  });

  // Calculate stats
  const stats: ReportStats = {
    total: data?.length || 0,
    completed: data?.filter(r => r.status === 'completed').length || 0,
    withPdf: data?.filter(r => r.pdf_url).length || 0,
    withoutPdf: data?.filter(r => !r.pdf_url).length || 0,
    avgScore: data?.length 
      ? Math.round(data.reduce((sum, r) => sum + (r.feasibility_score || 0), 0) / data.filter(r => r.feasibility_score).length) || 0
      : 0,
  };

  return { data: data || [], stats, isLoading, error, refetch };
}

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast.success('Report deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete report: ${error.message}`);
    },
  });
}

export function useBulkDeleteReports() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportIds: string[]) => {
      const { error } = await supabase
        .from('reports')
        .delete()
        .in('id', reportIds);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast.success(`${variables.length} reports deleted`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete reports: ${error.message}`);
    },
  });
}

export function useRegeneratePdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-pdf', {
        body: { report_id: reportId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast.success('PDF regeneration started');
    },
    onError: (error: Error) => {
      toast.error(`Failed to regenerate PDF: ${error.message}`);
    },
  });
}
