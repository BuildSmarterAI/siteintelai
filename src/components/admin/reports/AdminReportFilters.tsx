import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import type { AdminReportsFilters } from '@/hooks/useAdminReports';

interface AdminReportFiltersProps {
  filters: AdminReportsFilters;
  onFiltersChange: (filters: AdminReportsFilters) => void;
}

export function AdminReportFilters({ filters, onFiltersChange }: AdminReportFiltersProps) {
  const updateFilter = <K extends keyof AdminReportsFilters>(key: K, value: AdminReportsFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasFilters = Object.values(filters).some(v => v && v !== 'all');

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border rounded-lg">
      <Select
        value={filters.status || 'all'}
        onValueChange={(v) => updateFilter('status', v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="error">Error</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.scoreBand || 'all'}
        onValueChange={(v) => updateFilter('scoreBand', v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Score Band" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Scores</SelectItem>
          <SelectItem value="A">Band A (80+)</SelectItem>
          <SelectItem value="B">Band B (60-79)</SelectItem>
          <SelectItem value="C">Band C (40-59)</SelectItem>
          <SelectItem value="D">Band D (&lt;40)</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.hasPdf || 'all'}
        onValueChange={(v) => updateFilter('hasPdf', v as 'all' | 'yes' | 'no')}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="PDF Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All PDFs</SelectItem>
          <SelectItem value="yes">Has PDF</SelectItem>
          <SelectItem value="no">No PDF</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={filters.dateFrom || ''}
        onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
        className="w-[160px]"
        placeholder="From date"
      />

      <Input
        type="date"
        value={filters.dateTo || ''}
        onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
        className="w-[160px]"
        placeholder="To date"
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
