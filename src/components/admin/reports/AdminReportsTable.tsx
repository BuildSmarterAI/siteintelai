import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, FileText, Eye, RefreshCw, Trash2, CheckCircle, XCircle } from 'lucide-react';
import type { AdminReport } from '@/hooks/useAdminReports';
import { useDeleteReport, useRegeneratePdf } from '@/hooks/useAdminReports';

interface AdminReportsTableProps {
  reports: AdminReport[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

function ScoreBadge({ score, band }: { score: number | null; band: string | null }) {
  if (score === null) return <span className="text-muted-foreground">—</span>;

  const colors: Record<string, string> = {
    A: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    B: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    C: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    D: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <Badge variant="outline" className={colors[band || 'D'] || colors.D}>
      {score} ({band || 'D'})
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: 'bg-emerald-500/20 text-emerald-400',
    pending: 'bg-amber-500/20 text-amber-400',
    error: 'bg-red-500/20 text-red-400',
  };

  return (
    <Badge variant="secondary" className={colors[status] || 'bg-muted text-muted-foreground'}>
      {status}
    </Badge>
  );
}

export function AdminReportsTable({ reports, selectedIds, onSelectionChange }: AdminReportsTableProps) {
  const navigate = useNavigate();
  const deleteReport = useDeleteReport();
  const regeneratePdf = useRegeneratePdf();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  const allSelected = reports.length > 0 && selectedIds.length === reports.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < reports.length;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(reports.map(r => r.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleDelete = (id: string) => {
    setReportToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (reportToDelete) {
      deleteReport.mutate(reportToDelete);
    }
    setDeleteDialogOpen(false);
    setReportToDelete(null);
  };

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p>No reports found</p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                  className={someSelected ? 'opacity-50' : ''}
                />
              </TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="w-[120px]">Score</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[80px]">PDF</TableHead>
              <TableHead className="w-[200px]">User</TableHead>
              <TableHead className="w-[140px]">Created</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow
                key={report.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => navigate(`/report/${report.id}`)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.includes(report.id)}
                    onCheckedChange={() => toggleOne(report.id)}
                    aria-label={`Select report ${report.id}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium truncate max-w-[300px]">
                      {report.formatted_address || 'No address'}
                    </span>
                    {report.parcel_id && (
                      <span className="text-xs text-muted-foreground">
                        {report.parcel_id}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <ScoreBadge score={report.feasibility_score} band={report.score_band} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={report.status} />
                </TableCell>
                <TableCell>
                  {report.pdf_url ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground/50" />
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground truncate max-w-[180px] block">
                    {report.user_email || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(report.created_at), 'MMM d, yyyy')}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/report/${report.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Report
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/dashboard?app=${report.application_id}`)}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Application
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => regeneratePdf.mutate(report.id)}
                        disabled={regeneratePdf.isPending}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate PDF
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(report.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
