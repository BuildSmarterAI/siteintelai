import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataSourcesSidebar } from '@/components/admin/DataSourcesSidebar';
import { AdminReportFilters } from '@/components/admin/reports/AdminReportFilters';
import { AdminReportsTable } from '@/components/admin/reports/AdminReportsTable';
import { useAdminReports, useBulkDeleteReports, useRegeneratePdf, type AdminReportsFilters } from '@/hooks/useAdminReports';
import { useAdminRole } from '@/hooks/useAdminRole';
import { FileText, RefreshCw, Trash2, Search, BarChart3, FileCheck, FileX, TrendingUp } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminReports() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const [filters, setFilters] = useState<AdminReportsFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data: reports, stats, isLoading, refetch } = useAdminReports({
    ...filters,
    search: searchInput,
  });

  const bulkDelete = useBulkDeleteReports();
  const regeneratePdf = useRegeneratePdf();

  // Redirect non-admins
  if (!adminLoading && !isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const handleBulkDelete = () => {
    bulkDelete.mutate(selectedIds, {
      onSuccess: () => {
        setSelectedIds([]);
        setBulkDeleteOpen(false);
      },
    });
  };

  const handleBulkRegeneratePdf = async () => {
    for (const id of selectedIds) {
      await regeneratePdf.mutateAsync(id);
    }
    setSelectedIds([]);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DataSourcesSidebar />

      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reports Management</h1>
            <p className="text-muted-foreground">View and manage all generated reports</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard title="Total Reports" value={stats.total} icon={FileText} color="bg-primary/20 text-primary" />
            <StatCard title="Completed" value={stats.completed} icon={BarChart3} color="bg-emerald-500/20 text-emerald-500" />
            <StatCard title="With PDF" value={stats.withPdf} icon={FileCheck} color="bg-cyan-500/20 text-cyan-500" />
            <StatCard title="No PDF" value={stats.withoutPdf} icon={FileX} color="bg-amber-500/20 text-amber-500" />
            <StatCard title="Avg Score" value={stats.avgScore} icon={TrendingUp} color="bg-violet-500/20 text-violet-500" />
          </div>
        )}

        {/* Filters */}
        <AdminReportFilters filters={filters} onFiltersChange={setFilters} />

        {/* Search + Bulk Actions */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search address, parcel ID, or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedIds.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkRegeneratePdf}
                disabled={regeneratePdf.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate PDFs
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : (
          <AdminReportsTable
            reports={reports}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        )}

        {/* Bulk Delete Dialog */}
        <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedIds.length} Reports</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete these reports? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-destructive text-destructive-foreground"
                disabled={bulkDelete.isPending}
              >
                {bulkDelete.isPending ? 'Deleting...' : 'Delete All'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  </SidebarProvider>
  );
}
