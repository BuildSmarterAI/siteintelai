import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DataSourcesSidebar } from '@/components/admin/DataSourcesSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDataSourceErrors, useDataSources } from '@/hooks/useDataSources';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DataSourceErrors() {
  const [selectedSource, setSelectedSource] = useState<string | undefined>();
  const { data: errors, isLoading, refetch } = useDataSourceErrors(selectedSource);
  const { data: sources } = useDataSources();

  const errorTypes = [...new Set(errors?.map((e) => e.error_type) || [])];

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
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h1 className="text-lg font-semibold">Error Logs</h1>
              </div>
              <div className="flex-1" />
              <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </header>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="text-2xl font-bold text-destructive">{errors?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Total Errors</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-2xl font-bold">
                  {new Set(errors?.map((e) => e.map_server_id)).size || 0}
                </div>
                <div className="text-sm text-muted-foreground">Affected Sources</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-2xl font-bold">{errorTypes.length}</div>
                <div className="text-sm text-muted-foreground">Error Types</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-2xl font-bold">
                  {errors?.filter(
                    (e) =>
                      e.occurred_at && new Date(e.occurred_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Last 24 Hours</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <Select
                value={selectedSource || 'all'}
                onValueChange={(value) =>
                  setSelectedSource(value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sources?.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error List */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : errors && errors.length > 0 ? (
              <div className="space-y-3">
                {errors.map((error) => (
                  <Card
                    key={error.id}
                    className="border-destructive/30 bg-destructive/5"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">{error.error_type}</Badge>
                            {error.status_code && (
                              <Badge variant="outline">HTTP {error.status_code}</Badge>
                            )}
                          </div>
                          <p className="text-sm">{error.error_message || 'No message'}</p>
                          {error.endpoint_url && (
                            <code className="text-xs text-muted-foreground block truncate max-w-lg">
                              {error.endpoint_url}
                            </code>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <span className="text-xs text-muted-foreground block">
                            {error.occurred_at ? formatDistanceToNow(new Date(error.occurred_at), { addSuffix: true }) : 'Unknown'}
                          </span>
                          <Link
                            to={`/admin/data-sources/${error.map_server_id}`}
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                          >
                            {error.map_servers?.provider || 'View Source'}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No errors recorded</p>
                <p className="text-sm">All data sources are operating normally</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
