import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DataSourcesSidebar } from '@/components/admin/DataSourcesSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Pencil,
  ExternalLink,
  Plus,
  Copy,
} from 'lucide-react';
import {
  useDataSource,
  useDataSourceLayers,
  useDataSourceVersions,
  useDataSourceErrors,
  useCreateVersionSnapshot,
  getHealthStatus,
} from '@/hooks/useDataSources';
import { ReliabilityBadge } from '@/components/admin/data-sources/ReliabilityBadge';
import { AccuracyTierBadge } from '@/components/admin/data-sources/AccuracyTierBadge';
import { DatasetFamilyBadge } from '@/components/admin/data-sources/DatasetFamilyBadge';
import { HealthStatusBadge } from '@/components/admin/data-sources/HealthStatusBadge';
import { JsonViewer } from '@/components/admin/data-sources/JsonViewer';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

export default function DataSourceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: source, isLoading } = useDataSource(id!);
  const { data: layers } = useDataSourceLayers(id!);
  const { data: versions } = useDataSourceVersions(id);
  const { data: errors } = useDataSourceErrors(id);
  const createSnapshot = useCreateVersionSnapshot();

  if (isLoading) {
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

  if (!source) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <DataSourcesSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Source not found</h2>
              <Button onClick={() => navigate('/admin/data-sources')} className="mt-4">
                Back to Sources
              </Button>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const health = getHealthStatus(source);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(source.base_url);
    toast.success('URL copied to clipboard');
  };

  const handleCreateSnapshot = () => {
    createSnapshot.mutate({
      mapServerId: source.id,
      version: `v${format(new Date(), 'yyyy.MM.dd.HHmm')}`,
    });
  };

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
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(source.base_url, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open Endpoint
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/admin/data-sources/${source.id}/edit`)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </header>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Title & Badges */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold">{source.provider}</h1>
                <p className="text-muted-foreground font-mono text-sm mt-1">
                  {source.server_key}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <HealthStatusBadge status={health.status} color={health.color} />
                <ReliabilityBadge score={source.reliability_score} />
                <AccuracyTierBadge tier={source.accuracy_tier} />
                <DatasetFamilyBadge family={source.dataset_family} />
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="layers">Layers ({layers?.length || 0})</TabsTrigger>
                <TabsTrigger value="schema">Schema</TabsTrigger>
                <TabsTrigger value="versions">Versions ({versions?.length || 0})</TabsTrigger>
                <TabsTrigger value="errors">Errors ({errors?.length || 0})</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Connection Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Base URL</span>
                        <Button variant="ghost" size="sm" onClick={handleCopyUrl}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <code className="block text-xs bg-muted p-2 rounded break-all">
                        {source.base_url}
                      </code>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <span className="text-xs text-muted-foreground">Source Type</span>
                          <Badge variant="outline" className="mt-1 block w-fit">
                            {source.service_type}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Jurisdiction</span>
                          <p className="text-sm font-medium">{source.jurisdiction}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Classification</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground">Agency</span>
                          <p className="text-sm font-medium">{source.agency || '—'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Update Frequency</span>
                          <p className="text-sm font-medium capitalize">
                            {source.update_frequency || '—'}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Status</span>
                          <Badge variant={source.is_active ? 'default' : 'secondary'} className="mt-1">
                            {source.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Last Sync</span>
                          <p className="text-sm font-medium">
                            {source.last_sync_at
                              ? formatDistanceToNow(new Date(source.last_sync_at), { addSuffix: true })
                              : 'Never'}
                          </p>
                        </div>
                      </div>
                      {source.notes && (
                        <div className="pt-2 border-t">
                          <span className="text-xs text-muted-foreground">Notes</span>
                          <p className="text-sm mt-1">{source.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Layers Tab */}
              <TabsContent value="layers">
                <Card>
                  <CardContent className="pt-6">
                    {layers && layers.length > 0 ? (
                      <div className="space-y-3">
                        {layers.map((layer: any) => (
                          <div
                            key={layer.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{layer.layer_id}</Badge>
                                <span className="font-medium">{layer.layer_name}</span>
                              </div>
                              {layer.canonical_table && (
                                <span className="text-xs text-muted-foreground font-mono">
                                  → {layer.canonical_table}
                                </span>
                              )}
                            </div>
                            <Badge variant={layer.is_active ? 'default' : 'secondary'}>
                              {layer.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No layers configured for this source
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Schema Tab */}
              <TabsContent value="schema">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Field Schema</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateSnapshot}
                      disabled={createSnapshot.isPending}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Snapshot
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <JsonViewer data={layers?.[0]?.field_mappings || {}} maxHeight="500px" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Versions Tab */}
              <TabsContent value="versions">
                <Card>
                  <CardContent className="pt-6">
                    {versions && versions.length > 0 ? (
                      <div className="space-y-3">
                        {versions.map((version) => (
                          <div
                            key={version.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                          >
                            <div>
                              <span className="font-mono font-medium">
                                {version.dataset_version}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {version.ingested_at ? format(new Date(version.ingested_at), 'PPp') : 'Unknown'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {version.record_count && (
                                <Badge variant="outline">{version.record_count} records</Badge>
                              )}
                              {version.schema_hash && (
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {version.schema_hash.slice(0, 8)}
                                </code>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No version history available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Errors Tab */}
              <TabsContent value="errors">
                <Card>
                  <CardContent className="pt-6">
                    {errors && errors.length > 0 ? (
                      <div className="space-y-3">
                        {errors.map((error) => (
                          <div
                            key={error.id}
                            className="p-3 rounded-lg border border-destructive/30 bg-destructive/5"
                          >
                            <div className="flex items-center justify-between">
                              <Badge variant="destructive">{error.error_type}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {error.occurred_at ? formatDistanceToNow(new Date(error.occurred_at), { addSuffix: true }) : 'Unknown'}
                              </span>
                            </div>
                            <p className="text-sm mt-2">{error.error_message}</p>
                            {error.status_code && (
                              <code className="text-xs text-muted-foreground">
                                HTTP {error.status_code}
                              </code>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No errors recorded
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
