import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DataSourcesSidebar } from '@/components/admin/DataSourcesSidebar';
import { DataSourcesTable } from '@/components/admin/data-sources/DataSourcesTable';
import { DataSourceFilters } from '@/components/admin/data-sources/DataSourceFilters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { useDataSources, useDataSourceFilterOptions } from '@/hooks/useDataSources';

interface Filters {
  jurisdiction?: string;
  dataset_family?: string;
  is_active?: boolean;
  accuracy_tier?: string;
}

export default function DataSources() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({});
  const [searchQuery, setSearchQuery] = useState('');

  const { data: sources = [], isLoading, refetch } = useDataSources(filters);
  const { data: filterOptions } = useDataSourceFilterOptions();

  // Filter by search query
  const filteredSources = sources.filter((source) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      source.provider.toLowerCase().includes(query) ||
      source.server_key.toLowerCase().includes(query) ||
      source.agency?.toLowerCase().includes(query) ||
      source.jurisdiction?.toLowerCase().includes(query)
    );
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DataSourcesSidebar />

        <main className="flex-1 overflow-auto">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-6">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-lg font-semibold">Data Source Registry</h1>
              </div>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={() => navigate('/admin/data-sources/new')} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Source
              </Button>
            </div>
          </header>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="text-2xl font-bold">{sources.length}</div>
                <div className="text-sm text-muted-foreground">Total Sources</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-2xl font-bold text-green-600">
                  {sources.filter((s) => s.is_active).length}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-2xl font-bold text-primary">
                  {sources.filter((s) => s.accuracy_tier === 'T1').length}
                </div>
                <div className="text-sm text-muted-foreground">Tier 1 (Regulatory)</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-2xl font-bold">
                  {Math.round(
                    sources.reduce((acc, s) => acc + (s.reliability_score || 0), 0) /
                      (sources.length || 1)
                  )}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Reliability</div>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <DataSourceFilters
                filters={filters}
                onFiltersChange={setFilters}
                options={filterOptions || { jurisdictions: [], families: [], tiers: [] }}
              />
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Table */}
            <DataSourcesTable sources={filteredSources} isLoading={isLoading} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
