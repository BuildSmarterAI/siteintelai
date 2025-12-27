import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const dataSources = [
  { name: "FEMA", tooltip: "Official FEMA flood zone and NFIP data" },
  { name: "ArcGIS", tooltip: "Authoritative GIS parcel and mapping data" },
  { name: "TxDOT", tooltip: "Texas DOT traffic count databases" },
  { name: "EPA", tooltip: "EPA environmental facility records" },
];

export const TrustBadges = () => {
  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {dataSources.map(({ name, tooltip }) => (
          <Tooltip key={name}>
            <TooltipTrigger asChild>
              <Badge 
                variant="secondary" 
                className="text-xs cursor-help hover:bg-secondary/80"
              >
                {name} Verified
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};
