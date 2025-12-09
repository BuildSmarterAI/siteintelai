import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DataSourcesSidebar } from '@/components/admin/DataSourcesSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataSourceVersions } from '@/hooks/useDataSources';
import { JsonViewer } from '@/components/admin/data-sources/JsonViewer';
import { format, formatDistanceToNow } from 'date-fns';
import { History, FileJson, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DataSourceVersions() {
  const { data: versions, isLoading } = useDataSourceVersions();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DataSourcesSidebar />

        <main className="flex-1 overflow-auto">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
            <div className="flex h-14 items-center gap-4 px-6">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-lg font-semibold">Version History</h1>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-4">
                <div className="text-2xl font-bold">{versions?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Total Snapshots</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-2xl font-bold">
                  {new Set(versions?.map((v: any) => v.map_server_id)).size || 0}
                </div>
                <div className="text-sm text-muted-foreground">Sources Tracked</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-2xl font-bold">
                  {versions?.filter((v: any) => v.diff_from_previous).length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Schema Changes</div>
              </div>
            </div>

            {/* Version List */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : versions && versions.length > 0 ? (
              <div className="space-y-4">
                {versions.map((version: any) => (
                  <Card key={version.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/admin/data-sources/${version.map_server_id}`}
                              className="font-medium hover:underline"
                            >
                              {version.map_servers?.name || 'Unknown Source'}
                            </Link>
                            <code className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {version.map_servers?.server_key}
                            </code>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="font-mono">{version.dataset_version}</span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(version.ingested_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {version.record_count && (
                            <Badge variant="outline" className="gap-1">
                              <Database className="h-3 w-3" />
                              {version.record_count.toLocaleString()}
                            </Badge>
                          )}
                          {version.schema_hash && (
                            <Badge variant="secondary" className="gap-1 font-mono">
                              <FileJson className="h-3 w-3" />
                              {version.schema_hash.slice(0, 8)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {version.diff_from_previous && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Schema Diff</p>
                          <JsonViewer
                            data={version.diff_from_previous}
                            maxHeight="200px"
                            collapsible
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No version snapshots recorded yet. Create your first snapshot from a data source
                detail page.
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
