import { Badge } from "@/components/ui/badge";
import { CitationTooltip } from "./CitationTooltip";

interface DataSourceBadgeProps {
  datasetName: string;
  timestamp: string;
  endpointUrl?: string;
  showEndpoint?: boolean;
}

export const DataSourceBadge = ({ 
  datasetName, 
  timestamp, 
  endpointUrl,
  showEndpoint = true 
}: DataSourceBadgeProps) => {
  const formattedDate = new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="inline-flex items-center gap-1.5">
      <Badge variant="outline" className="text-xs font-normal">
        {datasetName} • As of {formattedDate}
      </Badge>
      {endpointUrl && showEndpoint && (
        <CitationTooltip datasetName={datasetName} endpointUrl={endpointUrl} />
      )}
    </div>
  );
};
