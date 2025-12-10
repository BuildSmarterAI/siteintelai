import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DataSourcesSidebar } from '@/components/admin/DataSourcesSidebar';
import { DataSourceForm } from '@/components/admin/data-sources/DataSourceForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Layers } from 'lucide-react';
import {
  useDataSource,
  useCreateDataSource,
  useUpdateDataSource,
  DataSourceFormData,
} from '@/hooks/useDataSources';
import { LayerDiscoveryModal } from '@/components/admin/data-sources/LayerDiscoveryModal';
import { DiscoveredLayer } from '@/hooks/useLayerDiscovery';
import { useLayerDiscovery } from '@/hooks/useLayerDiscovery';
import { useToast } from '@/hooks/use-toast';

export default function DataSourceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [discoveryUrl, setDiscoveryUrl] = useState('');
  const [pendingLayers, setPendingLayers] = useState<DiscoveredLayer[]>([]);
  const { toast } = useToast();

  const { data: source, isLoading, refetch } = useDataSource(id!);
  const createSource = useCreateDataSource();
  const updateSource = useUpdateDataSource();
  const { importLayers } = useLayerDiscovery();

  const handleSubmit = async (data: DataSourceFormData) => {
    if (isEditing) {
      updateSource.mutate(
        { id: id!, ...data },
        { onSuccess: () => navigate(`/admin/data-sources/${id}`) }
      );
    } else {
      // Create source first, then import pending layers
      createSource.mutate(data, {
        onSuccess: async (newSource) => {
          if (pendingLayers.length > 0) {
            const success = await importLayers(newSource.id, pendingLayers);
            if (success) {
              toast({
                title: 'Source Created',
                description: `Created source with ${pendingLayers.length} layers imported`,
              });
            }
          }
          navigate(`/admin/data-sources/${newSource.id}`);
        },
      });
    }
  };

  const handleDiscoverLayers = (url: string) => {
    setDiscoveryUrl(url);
    setDiscoveryOpen(true);
  };

  const handleLayersSelected = (layers: DiscoveredLayer[]) => {
    setPendingLayers(layers);
    toast({
      title: 'Layers Selected',
      description: `${layers.length} layers ready to import when you create the source`,
    });
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
                  onClick={() => {
                    setDiscoveryUrl(source.base_url);
                    setDiscoveryOpen(true);
                  }}
                  className="gap-2"
                >
                  <Layers className="h-4 w-4" />
                  Discover Layers
                </Button>
              )}
              {!isEditing && pendingLayers.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Layers className="h-3 w-3" />
                  {pendingLayers.length} layers ready
                </Badge>
              )}
            </div>
          </header>

          {/* Layer Discovery Modal */}
          <LayerDiscoveryModal
            open={discoveryOpen}
            onOpenChange={setDiscoveryOpen}
            mapServerId={isEditing ? id : undefined}
            initialUrl={discoveryUrl}
            onImportComplete={isEditing ? () => refetch() : undefined}
            onLayersSelected={!isEditing ? handleLayersSelected : undefined}
          />

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
              onDiscoverLayers={!isEditing ? handleDiscoverLayers : undefined}
              discoveredLayersCount={!isEditing ? pendingLayers.length : undefined}
            />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
