import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProgressModalProps {
  applicationId: string;
  isOpen: boolean;
  onComplete: (reportId: string) => void;
}

interface JobStatus {
  status: string;
  stage: string;
  progress: number;
  message: string;
}

export function ProgressModal({ applicationId, isOpen, onComplete }: ProgressModalProps) {
  const [jobStatus, setJobStatus] = useState<JobStatus>({
    status: 'queued',
    stage: 'Initializing',
    progress: 0,
    message: 'Your report is being prepared...'
  });

  useEffect(() => {
    if (!applicationId || !isOpen) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`application_${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: `id=eq.${applicationId}`
        },
        (payload) => {
          const app = payload.new;
          updateStatusFromApplication(app);
        }
      )
      .subscribe();

    // Also poll for status updates
    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('applications')
        .select('enrichment_status, enrichment_metadata')
        .eq('id', applicationId)
        .single();

      if (data) {
        updateStatusFromApplication(data);
      }
    }, 2000);

    return () => {
      channel.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [applicationId, isOpen]);

  const updateStatusFromApplication = (app: any) => {
    const status = app.enrichment_status;
    const metadata = app.enrichment_metadata || {};

    let stage = 'Processing';
    let progress = 10;
    let message = 'Working on your report...';

    switch (status) {
      case 'queued':
        stage = 'Queued';
        progress = 5;
        message = 'Your request is in the queue...';
        break;
      case 'enriching':
        stage = 'Gathering Data';
        progress = 30;
        message = 'Fetching parcel, utilities, and traffic data...';
        break;
      case 'ai':
        stage = 'AI Analysis';
        progress = 60;
        message = 'Generating feasibility analysis...';
        break;
      case 'rendering':
        stage = 'Finalizing Report';
        progress = 85;
        message = 'Creating PDF and final deliverables...';
        break;
      case 'complete':
        stage = 'Complete';
        progress = 100;
        message = 'Your report is ready!';
        
        // Check for report ID and trigger completion
        if (metadata.report_id) {
          setTimeout(() => onComplete(metadata.report_id), 1500);
        }
        break;
      case 'error':
        stage = 'Error';
        progress = 0;
        message = metadata.error_message || 'An error occurred. Please try again.';
        break;
    }

    setJobStatus({ status, stage, progress, message });
  };

  const getStatusIcon = () => {
    switch (jobStatus.status) {
      case 'complete':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-12 w-12 text-destructive" />;
      case 'queued':
        return <Clock className="h-12 w-12 text-muted-foreground animate-pulse" />;
      default:
        return <Loader2 className="h-12 w-12 text-primary animate-spin" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center font-headline text-2xl">
            Generating Your Report
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-6">
          {getStatusIcon()}

          <div className="w-full space-y-2">
            <div className="flex justify-between items-center">
              <Badge variant={jobStatus.status === 'error' ? 'destructive' : 'default'}>
                {jobStatus.stage}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {jobStatus.progress}%
              </span>
            </div>
            <Progress value={jobStatus.progress} className="h-3" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {jobStatus.message}
          </p>

          {jobStatus.status !== 'error' && (
            <div className="text-xs text-muted-foreground text-center">
              This typically takes 30-60 seconds
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
