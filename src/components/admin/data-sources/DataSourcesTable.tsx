import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReliabilityBadge } from './ReliabilityBadge';
import { AccuracyTierBadge } from './AccuracyTierBadge';
import { DatasetFamilyBadge } from './DatasetFamilyBadge';
import { HealthStatusBadge } from './HealthStatusBadge';
import { DataSource, getHealthStatus, useDeleteDataSource } from '@/hooks/useDataSources';
import { formatDistanceToNow } from 'date-fns';

interface DataSourcesTableProps {
  sources: DataSource[];
  isLoading: boolean;
}

export function DataSourcesTable({ sources, isLoading }: DataSourcesTableProps) {
  const navigate = useNavigate();
  const deleteSource = useDeleteDataSource();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No data sources found. Add your first source to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[250px]">Name</TableHead>
            <TableHead>Agency</TableHead>
            <TableHead>Family</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Reliability</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Health</TableHead>
            <TableHead>Last Sync</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((source) => {
            const health = getHealthStatus(source);
            return (
              <TableRow
                key={source.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/admin/data-sources/${source.id}`)}
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{source.provider}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {source.server_key}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{source.agency || '—'}</span>
                </TableCell>
                <TableCell>
                  <DatasetFamilyBadge family={source.dataset_family} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {source.service_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ReliabilityBadge score={source.reliability_score} />
                </TableCell>
                <TableCell>
                  <AccuracyTierBadge tier={source.accuracy_tier} />
                </TableCell>
                <TableCell>
                  <HealthStatusBadge status={health.status} color={health.color} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {source.last_sync_at
                    ? formatDistanceToNow(new Date(source.last_sync_at), { addSuffix: true })
                    : 'Never'}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/admin/data-sources/${source.id}`)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/admin/data-sources/${source.id}/edit`)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this data source?')) {
                            deleteSource.mutate(source.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
