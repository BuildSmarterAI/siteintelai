import { Clock, Map, Brain, FileText, CheckCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProcessingTimelineProps {
  currentStatus: string;
  statusPercent?: number;
}

const STAGES = [
  { 
    key: 'queued', 
    label: 'Queued', 
    description: 'Your report is in queue',
    eta: '~30 seconds',
    Icon: Clock 
  },
  { 
    key: 'enriching', 
    label: 'Gathering Data', 
    description: 'Fetching parcel, zoning, flood, and utility data from 12+ sources',
    eta: '~2 minutes',
    Icon: Map 
  },
  { 
    key: 'ai', 
    label: 'AI Analysis', 
    description: 'Analyzing feasibility and generating insights',
    eta: '~3 minutes',
    Icon: Brain 
  },
  { 
    key: 'rendering', 
    label: 'Building PDF', 
    description: 'Generating your lender-ready PDF report',
    eta: '~1 minute',
    Icon: FileText 
  },
  { 
    key: 'complete', 
    label: 'Complete', 
    description: 'Your report is ready',
    eta: 'Ready',
    Icon: CheckCircle 
  },
];

export function ProcessingTimeline({ currentStatus, statusPercent = 0 }: ProcessingTimelineProps) {
  const currentIndex = STAGES.findIndex(s => s.key === currentStatus);
  const isComplete = currentStatus === 'complete';

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{statusPercent}%</span>
        </div>
        <Progress value={statusPercent} className="h-2" />
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {STAGES.map((stage, index) => {
          const isActive = stage.key === currentStatus;
          const isPast = index < currentIndex;
          const isFuture = index > currentIndex;
          const Icon = stage.Icon;

          return (
            <div
              key={stage.key}
              className={cn(
                "flex items-start gap-4 p-3 rounded-lg transition-all",
                isActive && "bg-primary/5 border border-primary/20",
                isPast && "opacity-60",
                isFuture && "opacity-40"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                isActive && "bg-primary text-primary-foreground",
                isPast && "bg-green-500 text-white",
                isFuture && "bg-muted text-muted-foreground"
              )}>
                {isActive && !isComplete ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPast || isComplete ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={cn(
                    "font-medium",
                    isActive && "text-primary",
                    isPast && "text-green-600"
                  )}>
                    {stage.label}
                  </h4>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    isActive && "bg-primary/10 text-primary",
                    isPast && "bg-green-100 text-green-600",
                    isFuture && "bg-muted text-muted-foreground"
                  )}>
                    {isPast ? 'Done' : isActive ? 'In Progress' : stage.eta}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estimated time remaining */}
      {!isComplete && (
        <div className="text-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 inline-block mr-1" />
          Estimated time remaining: {getTimeRemaining(currentStatus)}
        </div>
      )}
    </div>
  );
}

function getTimeRemaining(status: string): string {
  switch (status) {
    case 'queued': return '5-7 minutes';
    case 'enriching': return '3-5 minutes';
    case 'ai': return '1-2 minutes';
    case 'rendering': return '~1 minute';
    default: return 'calculating...';
  }
}
