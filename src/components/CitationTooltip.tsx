import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CitationTooltipProps {
  datasetName: string;
  endpointUrl: string;
}

export const CitationTooltip = ({ datasetName, endpointUrl }: CitationTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-muted transition-colors"
            aria-label={`View data source for ${datasetName}`}
          >
            <Info className="w-3 h-3 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-semibold mb-1">{datasetName}</p>
          <a
            href={endpointUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline break-all"
          >
            {endpointUrl}
          </a>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
