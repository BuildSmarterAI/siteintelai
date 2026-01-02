import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DataConfidenceBadgeProps {
  dataFlags?: string[];
  confidenceScore?: number;
  showDetails?: boolean;
}

// Human-readable messages for data flags
const DATA_FLAG_MESSAGES: Record<string, { message: string; severity: 'warning' | 'error' | 'info' }> = {
  'utilities_api_error': { message: 'Utility data was unavailable at time of analysis', severity: 'warning' },
  'utilities_exception': { message: 'Utility data could not be retrieved', severity: 'warning' },
  'fema_timeout': { message: 'FEMA flood data could not be retrieved', severity: 'warning' },
  'parcel_not_found': { message: 'Parcel boundaries estimated from address', severity: 'info' },
  'wetlands_query_failed': { message: 'Wetlands data unavailable', severity: 'warning' },
  'geocode_failed': { message: 'Address geocoding failed', severity: 'error' },
  'api_budget_exceeded': { message: 'API budget exceeded during analysis', severity: 'error' },
  'traffic_api_error': { message: 'Traffic data could not be retrieved', severity: 'warning' },
  'census_api_error': { message: 'Demographics data unavailable', severity: 'warning' },
  'elevation_unavailable': { message: 'Elevation data not available', severity: 'info' },
  'auto_recovered': { message: 'Report was automatically recovered after a processing issue', severity: 'info' },
};

export function DataConfidenceBadge({ 
  dataFlags = [], 
  confidenceScore,
  showDetails = false 
}: DataConfidenceBadgeProps) {
  const hasErrors = dataFlags.some(flag => 
    DATA_FLAG_MESSAGES[flag]?.severity === 'error'
  );
  const hasWarnings = dataFlags.some(flag => 
    DATA_FLAG_MESSAGES[flag]?.severity === 'warning'
  );
  const hasInfo = dataFlags.some(flag => 
    DATA_FLAG_MESSAGES[flag]?.severity === 'info' ||
    flag.startsWith('auto_recovered')
  );

  // No issues
  if (dataFlags.length === 0 && (!confidenceScore || confidenceScore >= 80)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
              <CheckCircle className="h-3 w-3" />
              High Confidence
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>All data sources were successfully retrieved</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Determine badge style based on severity
  let badgeClass = "bg-yellow-50 text-yellow-700 border-yellow-200";
  let Icon = AlertTriangle;
  let label = "Partial Data";

  if (hasErrors) {
    badgeClass = "bg-red-50 text-red-700 border-red-200";
    Icon = AlertCircle;
    label = "Data Issues";
  } else if (confidenceScore && confidenceScore < 50) {
    badgeClass = "bg-orange-50 text-orange-700 border-orange-200";
    Icon = AlertTriangle;
    label = "Low Confidence";
  } else if (!hasWarnings && hasInfo) {
    badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
    Icon = Info;
    label = "Note";
  }

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className={`${badgeClass} gap-1`}>
              <Icon className="h-3 w-3" />
              {label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <ul className="text-sm space-y-1">
              {dataFlags.map(flag => {
                const flagKey = flag.startsWith('auto_recovered') ? 'auto_recovered' : flag;
                return (
                  <li key={flag} className="flex items-start gap-1">
                    <span>•</span>
                    <span>{DATA_FLAG_MESSAGES[flagKey]?.message || flag}</span>
                  </li>
                );
              })}
              {confidenceScore && confidenceScore < 80 && (
                <li className="flex items-start gap-1">
                  <span>•</span>
                  <span>Data confidence: {confidenceScore}%</span>
                </li>
              )}
            </ul>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed view with Alert component
  return (
    <Alert variant={hasErrors ? "destructive" : "default"} className="mb-4">
      <Icon className="h-4 w-4" />
      <AlertTitle>Data Availability Notice</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-1 text-sm">
          {dataFlags.map(flag => {
            const flagKey = flag.startsWith('auto_recovered') ? 'auto_recovered' : flag;
            const info = DATA_FLAG_MESSAGES[flagKey];
            return (
              <li key={flag} className="flex items-start gap-2">
                {info?.severity === 'error' && <AlertCircle className="h-3 w-3 text-red-500 mt-0.5" />}
                {info?.severity === 'warning' && <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5" />}
                {info?.severity === 'info' && <Info className="h-3 w-3 text-blue-500 mt-0.5" />}
                <span>{info?.message || flag}</span>
              </li>
            );
          })}
        </ul>
        {confidenceScore && (
          <p className="mt-2 text-sm font-medium">
            Overall data confidence: {confidenceScore}%
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
