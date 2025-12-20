import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStuckApplications, StuckApplication } from '@/hooks/useStuckApplications';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Play,
  RefreshCw,
  Search,
  SkipForward,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const ENRICHMENT_STEPS = [
  { value: 'parcel', label: 'Parcel Lookup' },
  { value: 'utilities', label: 'Utilities Enrichment' },
  { value: 'traffic', label: 'Traffic Data' },
  { value: 'demographics', label: 'Demographics' },
  { value: 'wetlands', label: 'Wetlands Check' },
  { value: 'epa', label: 'EPA ECHO' },
  { value: 'fema', label: 'FEMA Flood Data' },
];

const ERROR_CODE_LABELS: Record<string, { label: string; color: string }> = {
  API_BUDGET_EXCEEDED: { label: 'Budget Exceeded', color: 'bg-red-500/20 text-red-400' },
  E003: { label: 'Parcel Not Found', color: 'bg-yellow-500/20 text-yellow-400' },
  E901: { label: 'Geocode Failed', color: 'bg-orange-500/20 text-orange-400' },
  TIMEOUT: { label: 'Timeout', color: 'bg-purple-500/20 text-purple-400' },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;
  return 'Just now';
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function StuckApplicationsTab() {
  const {
    applications,
    summary,
    isLoading,
    error,
    refetch,
    retryApplication,
    skipEnrichmentStep,
    bulkRetry,
    forceComplete,
  } = useStuckApplications();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [errorCodeFilter, setErrorCodeFilter] = useState<string>('all');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Dialogs
  const [skipDialog, setSkipDialog] = useState<{ open: boolean; app: StuckApplication | null }>({
    open: false,
    app: null,
  });
  const [skipStep, setSkipStep] = useState<string>('parcel');
  const [forceCompleteDialog, setForceCompleteDialog] = useState<{ open: boolean; app: StuckApplication | null }>({
    open: false,
    app: null,
  });

  // Filter applications
  const filteredApps = applications.filter(app => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesAddress = app.formatted_address?.toLowerCase().includes(query);
      const matchesId = app.id.toLowerCase().includes(query);
      if (!matchesAddress && !matchesId) return false;
    }
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (errorCodeFilter !== 'all' && app.error_code !== errorCodeFilter) return false;
    return true;
  });

  const handleSelectAll = () => {
    if (selectedIds.size === filteredApps.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApps.map(app => app.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleRetry = async (app: StuckApplication) => {
    setActionInProgress(app.id);
    await retryApplication(app.id);
    setActionInProgress(null);
  };

  const handleBulkRetry = async () => {
    if (selectedIds.size === 0) return;
    setActionInProgress('bulk');
    await bulkRetry(Array.from(selectedIds));
    setSelectedIds(new Set());
    setActionInProgress(null);
  };

  const handleSkipStep = async () => {
    if (!skipDialog.app) return;
    setActionInProgress(skipDialog.app.id);
    await skipEnrichmentStep(skipDialog.app.id, skipStep);
    setSkipDialog({ open: false, app: null });
    setActionInProgress(null);
  };

  const handleForceComplete = async () => {
    if (!forceCompleteDialog.app) return;
    setActionInProgress(forceCompleteDialog.app.id);
    await forceComplete(forceCompleteDialog.app.id);
    setForceCompleteDialog({ open: false, app: null });
    setActionInProgress(null);
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('ID copied to clipboard');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enriching':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Enriching</Badge>;
      case 'queued':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Queued</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'complete':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Complete</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getErrorCodeBadge = (code: string | null) => {
    if (!code) return null;
    const config = ERROR_CODE_LABELS[code] || { label: code, color: 'bg-muted text-muted-foreground' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={refetch} className="mt-4">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Total Stuck
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">{summary.total}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Stuck Time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatDuration(summary.avgStuckTimeMs)}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-400" />
              Enriching
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{summary.byStatus['enriching'] || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              Errors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{summary.byStatus['error'] || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Error Code Breakdown */}
      {Object.keys(summary.byErrorCode).length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Error Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byErrorCode).map(([code, count]) => (
                <Badge key={code} variant="outline" className="text-sm">
                  {ERROR_CODE_LABELS[code]?.label || code}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Table */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stuck Applications</CardTitle>
              <CardDescription>Applications that need attention</CardDescription>
            </div>
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by address or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="enriching">Enriching</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={errorCodeFilter} onValueChange={setErrorCodeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Error Code" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Errors</SelectItem>
                {Object.entries(ERROR_CODE_LABELS).map(([code, config]) => (
                  <SelectItem key={code} value={code}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-4 mt-4 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkRetry}
                disabled={actionInProgress === 'bulk'}
              >
                {actionInProgress === 'bulk' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Retry Selected
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {filteredApps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p>No stuck applications found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedIds.size === filteredApps.length && filteredApps.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Stuck For</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApps.map(app => (
                  <TableRow key={app.id} className={selectedIds.has(app.id) ? 'bg-muted/30' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(app.id)}
                        onCheckedChange={() => handleSelectOne(app.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs">{app.id.substring(0, 8)}...</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyId(app.id)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={app.formatted_address || ''}>
                      {app.formatted_address || 'No address'}
                    </TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Progress value={app.status_percent || 0} className="h-2 w-16" />
                        <span className="text-xs text-muted-foreground">{app.status_percent || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getErrorCodeBadge(app.error_code)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatTimeAgo(app.updated_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{app.attempts}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRetry(app)} disabled={actionInProgress === app.id}>
                            <Play className="w-4 h-4 mr-2" />
                            Retry
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSkipDialog({ open: true, app })}>
                            <SkipForward className="w-4 h-4 mr-2" />
                            Skip Step
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setForceCompleteDialog({ open: true, app })}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Force Complete
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`/report/${app.id}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Report
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Skip Step Dialog */}
      <Dialog open={skipDialog.open} onOpenChange={open => setSkipDialog({ open, app: skipDialog.app })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip Enrichment Step</DialogTitle>
            <DialogDescription>
              This will mark the selected step as skipped and continue the pipeline.
              Data from this step will not be included in the report.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={skipStep} onValueChange={setSkipStep}>
              <SelectTrigger>
                <SelectValue placeholder="Select step to skip" />
              </SelectTrigger>
              <SelectContent>
                {ENRICHMENT_STEPS.map(step => (
                  <SelectItem key={step.value} value={step.value}>{step.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSkipDialog({ open: false, app: null })}>Cancel</Button>
            <Button onClick={handleSkipStep} disabled={actionInProgress !== null}>
              {actionInProgress === skipDialog.app?.id ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <SkipForward className="w-4 h-4 mr-2" />
              )}
              Skip Step
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force Complete Dialog */}
      <Dialog open={forceCompleteDialog.open} onOpenChange={open => setForceCompleteDialog({ open, app: forceCompleteDialog.app })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="w-5 h-5" />
              Force Complete Application
            </DialogTitle>
            <DialogDescription>
              <strong>Warning:</strong> This will mark the application as complete even though enrichment
              may not have finished. The report may have missing or incomplete data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Application: <span className="font-mono">{forceCompleteDialog.app?.id.substring(0, 8)}...</span>
            <br />
            Address: {forceCompleteDialog.app?.formatted_address || 'N/A'}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setForceCompleteDialog({ open: false, app: null })}>Cancel</Button>
            <Button variant="destructive" onClick={handleForceComplete} disabled={actionInProgress !== null}>
              {actionInProgress === forceCompleteDialog.app?.id ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Force Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
