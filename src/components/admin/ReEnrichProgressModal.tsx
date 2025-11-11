import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, AlertCircle, RefreshCw, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProgressLog {
  timestamp: string;
  step: string;
  substep?: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  metadata?: Record<string, any>;
}

interface ReEnrichProgressModalProps {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function ReEnrichProgressModal({
  applicationId,
  isOpen,
  onClose,
  onComplete
}: ReEnrichProgressModalProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState('queued');
  const [progress, setProgress] = useState(0);
  const [stageLabel, setStageLabel] = useState('Initializing');
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!applicationId || !isOpen) return;

    const channel = supabase
      .channel(`app:${applicationId}`)
      .on('broadcast', { event: 'status_update' }, (payload: any) => {
        console.log('[ReEnrich] Status update:', payload);
        setStatus(payload.payload.status);
        setProgress(payload.payload.status_percent || 0);
        setStageLabel(payload.payload.stage_label || 'Processing');

        if (payload.payload.status === 'complete') {
          toast({
            title: "Re-enrichment Complete",
            description: "Application data has been refreshed successfully."
          });
          setTimeout(() => onComplete(), 1500);
        }

        if (payload.payload.status === 'error') {
          toast({
            title: "Re-enrichment Failed",
            description: payload.payload.error_code || "An error occurred",
            variant: "destructive"
          });
        }
      })
      .on('broadcast', { event: 'progress_log' }, (payload: any) => {
        console.log('[ReEnrich] Progress log:', payload);
        const logEntry = payload.payload as ProgressLog;
        setLogs(prev => [...prev, logEntry]);
      })
      .subscribe();

    // Fetch initial status
    supabase
      .from('applications')
      .select('status, status_percent, error_code')
      .eq('id', applicationId)
      .single()
      .then(({ data }) => {
        if (data) {
          setStatus(data.status || 'queued');
          setProgress(data.status_percent || 0);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applicationId, isOpen, onComplete, toast]);

  const getElapsedTime = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.step}${log.substep ? ' > ' + log.substep : ''}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reenrich-logs-${applicationId}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Re-enrichment Progress</span>
            <Badge variant={status === 'complete' ? 'default' : status === 'error' ? 'destructive' : 'secondary'}>
              {stageLabel}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Elapsed Time */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Elapsed Time</span>
            <span className="font-mono">{getElapsedTime()}</span>
          </div>

          {/* Log Viewer */}
          <div className="border rounded-lg">
            <div className="flex items-center justify-between p-3 border-b bg-muted/50">
              <h4 className="text-sm font-medium">Detailed Logs</h4>
              <Button size="sm" variant="ghost" onClick={exportLogs}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <ScrollArea className="h-64 p-3">
              <div className="space-y-2 font-mono text-xs">
                {logs.length === 0 && (
                  <div className="text-muted-foreground text-center py-8">
                    Waiting for logs...
                  </div>
                )}
                {logs.map((log, idx) => (
                  <div key={idx} className={`flex gap-2 ${
                    log.level === 'error' ? 'text-destructive' :
                    log.level === 'success' ? 'text-green-600' :
                    log.level === 'warning' ? 'text-yellow-600' :
                    'text-foreground'
                  }`}>
                    <span className="text-muted-foreground shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="shrink-0">
                      {log.level === 'error' ? '✗' :
                       log.level === 'success' ? '✓' :
                       log.level === 'warning' ? '⚠' : '•'}
                    </span>
                    <span className="font-semibold shrink-0">
                      [{log.step}{log.substep ? ` > ${log.substep}` : ''}]
                    </span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            {status === 'complete' && (
              <Button onClick={onComplete}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Close
              </Button>
            )}
            {status === 'error' && (
              <>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={() => window.location.reload()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </>
            )}
            {status !== 'complete' && status !== 'error' && (
              <Button variant="outline" onClick={onClose} disabled={progress > 0 && progress < 100}>
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
