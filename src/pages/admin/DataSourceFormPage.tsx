import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DataSourcesSidebar } from '@/components/admin/DataSourcesSidebar';
import { DataSourceForm } from '@/components/admin/data-sources/DataSourceForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Layers } from 'lucide-react';
import {
  useDataSource,
  useCreateDataSource,
  useUpdateDataSource,
  DataSourceFormData,
} from '@/hooks/useDataSources';
import { LayerDiscoveryModal } from '@/components/admin/data-sources/LayerDiscoveryModal';

export default function DataSourceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [discoveryOpen, setDiscoveryOpen] = useState(false);

  const { data: source, isLoading, refetch } = useDataSource(id!);
  const createSource = useCreateDataSource();
  const updateSource = useUpdateDataSource();

  const handleSubmit = (data: DataSourceFormData) => {
    if (isEditing) {
      updateSource.mutate(
        { id: id!, ...data },
        { onSuccess: () => navigate(`/admin/data-sources/${id}`) }
      );
    } else {
      createSource.mutate(data, {
        onSuccess: (newSource) => navigate(`/admin/data-sources/${newSource.id}`),
      });
    }
  };

  if (isEditing && isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <DataSourcesSidebar />
          <main className="flex-1 p-6 space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DataSourcesSidebar />

        <main className="flex-1 overflow-auto">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
            <div className="flex h-14 items-center gap-4 px-6">
              <SidebarTrigger />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/data-sources')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex-1">
                <h1 className="text-lg font-semibold">
                  {isEditing ? 'Edit Data Source' : 'Add New Data Source'}
                </h1>
              </div>
              {isEditing && source && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDiscoveryOpen(true)}
                  className="gap-2"
                >
                  <Layers className="h-4 w-4" />
                  Discover Layers
                </Button>
              )}
            </div>
          </header>

          {/* Layer Discovery Modal */}
          {isEditing && source && (
            <LayerDiscoveryModal
              open={discoveryOpen}
              onOpenChange={setDiscoveryOpen}
              mapServerId={id}
              initialUrl={source.base_url}
              onImportComplete={() => refetch()}
            />
          )}

          {/* Form */}
          <div className="p-6 max-w-4xl">
            <DataSourceForm
              defaultValues={
                isEditing && source
                  ? {
                      server_key: source.server_key,
                      provider: source.provider,
                      base_url: source.base_url,
                      service_type: source.service_type,
                      jurisdiction: source.jurisdiction,
                      is_active: source.is_active ?? true,
                      dataset_family: source.dataset_family,
                      agency: source.agency,
                      update_frequency: source.update_frequency,
                      accuracy_tier: source.accuracy_tier,
                      reliability_score: source.reliability_score,
                      notes: source.notes,
                    }
                  : undefined
              }
              onSubmit={handleSubmit}
              isSubmitting={createSource.isPending || updateSource.isPending}
              submitLabel={isEditing ? 'Update Source' : 'Create Source'}
            />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
