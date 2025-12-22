import { useEffect, useState, useRef } from "react";
import { logger } from "@/lib/logger";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [jobStatus, setJobStatus] = useState<JobStatus>({
    status: 'queued',
    stage: 'Initializing',
    progress: 0,
    message: 'Your report is being prepared...'
  });
  const [startTime] = useState(Date.now());
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!applicationId || !isOpen) return;

    // Subscribe to realtime broadcast channel
    const channel = supabase
      .channel(`app:${applicationId}`)
      .on('broadcast', { event: 'status_update' }, (payload: any) => {
        logger.debug('ProgressModal', 'Realtime update:', payload);
        setJobStatus({
          status: payload.payload.status,
          stage: getStageLabel(payload.payload.status),
          progress: payload.payload.status_percent || 0,
          message: payload.payload.error_code 
            ? `Error: ${payload.payload.error_code}` 
            : getStageMessage(payload.payload.status)
        });

        // Trigger completion callback
        if (payload.payload.status === 'complete') {
          const metadata = payload.payload.enrichment_metadata as any;
          if (metadata?.report_id) {
            setTimeout(() => onComplete(metadata.report_id), 1500);
          }
        }
      })
      .subscribe();

    // Initial status fetch (in case we missed events)
    supabase
      .from('applications')
      .select('status, status_percent, error_code, enrichment_metadata')
      .eq('id', applicationId)
      .single()
      .then(({ data }) => {
        if (data) {
          setJobStatus({
            status: data.status || 'queued',
            stage: getStageLabel(data.status || 'queued'),
            progress: data.status_percent || 0,
            message: data.error_code 
              ? `Error: ${data.error_code}` 
              : getStageMessage(data.status || 'queued')
          });

          // Check if already complete
          if (data.status === 'complete') {
            const metadata = data.enrichment_metadata as any;
            if (metadata?.report_id) {
              setTimeout(() => onComplete(metadata.report_id), 500);
            }
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applicationId, isOpen, onComplete]);

  // Calculate estimated time remaining based on progress
  useEffect(() => {
    if (jobStatus.progress > 0 && jobStatus.progress < 100) {
      const elapsedMs = Date.now() - startTime;
      const totalEstimatedMs = (elapsedMs / jobStatus.progress) * 100;
      const remainingMs = totalEstimatedMs - elapsedMs;
      setEstimatedTimeRemaining(Math.max(0, Math.ceil(remainingMs / 1000)));
    } else {
      setEstimatedTimeRemaining(null);
    }
  }, [jobStatus.progress, startTime]);

  const getStageLabel = (status: string) => {
    switch (status) {
      case 'queued':
        return 'Queued';
      case 'enriching':
        return 'Gathering Data';
      case 'ai':
        return 'AI Analysis';
      case 'rendering':
        return 'Generating Report';
      case 'complete':
        return 'Complete';
      case 'error':
        return 'Error';
      default:
        return 'Processing';
    }
  };

  const getStageMessage = (status: string) => {
    switch (status) {
      case 'queued':
        return 'Your request is queued for processing...';
      case 'enriching':
        return 'Pulling data from FEMA, TxDOT, utilities, and wetlands services...';
      case 'ai':
        return 'Running AI analysis on your property data...';
      case 'rendering':
        return 'Generating your PDF report...';
      case 'complete':
        return 'Your report is ready!';
      case 'error':
        return 'Something went wrong. Please check error details.';
      default:
        return 'Processing your request...';
    }
  };

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      
      // Re-trigger enrichment via edge function
      const { error } = await supabase.functions.invoke('re-enrich-application', {
        body: { application_id: applicationId }
      });
      
      if (error) throw error;
      
      setJobStatus({
        status: 'queued',
        stage: 'Retrying',
        progress: 0,
        message: 'Restarting report generation...'
      });
      
      toast({
        title: "Retrying Report Generation",
        description: "We're processing your request again.",
      });
    } catch (err) {
      console.error('[Retry failed]', err);
      toast({
        title: "Retry Failed",
        description: "Unable to restart report generation. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleBackToDashboard = () => {
    window.location.href = '/dashboard';
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
      <DialogContent 
        className="sm:max-w-md" 
        onInteractOutside={(e) => e.preventDefault()}
        aria-labelledby="progress-title"
        aria-describedby="progress-description"
      >
        <DialogHeader>
          <DialogTitle id="progress-title" className="text-center font-headline text-2xl">
            {jobStatus.status === 'error' ? 'Report Generation Failed' : 'Generating Your Report'}
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
            <Progress 
              value={jobStatus.progress} 
              className="h-3" 
              aria-label="Report generation progress"
            />
          </div>

          <p id="progress-description" className="text-center text-sm text-muted-foreground">
            {jobStatus.message}
          </p>

          {/* Estimated time remaining */}
          {jobStatus.status !== 'error' && estimatedTimeRemaining !== null && jobStatus.progress > 0 && (
            <div className="text-xs text-muted-foreground text-center">
              Estimated time remaining: {Math.ceil(estimatedTimeRemaining / 60)} minute{Math.ceil(estimatedTimeRemaining / 60) !== 1 ? 's' : ''}
            </div>
          )}

          {jobStatus.status !== 'error' && !estimatedTimeRemaining && (
            <div className="text-xs text-muted-foreground text-center">
              This typically takes 30-60 seconds
            </div>
          )}

          {/* Error recovery UI */}
          {jobStatus.status === 'error' && (
            <div className="w-full space-y-3 pt-4 border-t">
              <Button 
                onClick={handleRetry} 
                className="w-full touch-target"
                variant="default"
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Generation
                  </>
                )}
              </Button>
              <Button 
                onClick={handleBackToDashboard} 
                className="w-full touch-target"
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
