import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mountain, ExternalLink, TrendingUp, Ruler, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TopographyCardProps {
  elevation?: number | null;
  topographyMapUrl?: string | null;
  slopePercent?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
}

const getSlopeClassification = (slope: number | null | undefined) => {
  if (slope === null || slope === undefined) return null;
  if (slope <= 2) return { label: "Flat", color: "text-emerald-400", bgColor: "bg-emerald-500/20", description: "Minimal grading required" };
  if (slope <= 5) return { label: "Gentle", color: "text-data-cyan", bgColor: "bg-data-cyan/20", description: "Standard grading" };
  if (slope <= 15) return { label: "Moderate", color: "text-feasibility-orange", bgColor: "bg-feasibility-orange/20", description: "Significant grading needed" };
  return { label: "Steep", color: "text-destructive", bgColor: "bg-destructive/20", description: "Major earthwork required" };
};

export function TopographyCard({
  elevation,
  topographyMapUrl,
  slopePercent,
  latitude,
  longitude,
  className
}: TopographyCardProps) {
  const slopeInfo = getSlopeClassification(slopePercent);
  
  // Generate USGS viewer URL if not provided but coordinates exist
  const usgsUrl = topographyMapUrl || 
    (latitude && longitude 
      ? `https://apps.nationalmap.gov/viewer/?basemap=b1&category=ustopo&title=US%20Topo&zoom=15&lat=${latitude}&lng=${longitude}`
      : null);

  const hasAnyData = elevation !== null || slopePercent !== null;

  if (!hasAnyData) return null;

  return (
    <Card className={cn("overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm", className)}>
      <CardHeader className="bg-gradient-to-r from-[hsl(var(--midnight-blue))] to-[hsl(var(--midnight-blue)/0.9)] text-white py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Ruler className="h-4 w-4 text-[hsl(var(--data-cyan))]" />
            Elevation Data
          </CardTitle>
          <span className="text-[10px] text-white/60 font-mono">USGS / USDA</span>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Elevation */}
          <div className="bg-[hsl(var(--cloud-white))] rounded-lg p-3 border border-[hsl(var(--data-cyan)/0.15)]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[hsl(var(--data-cyan))] text-xs font-medium">Site Elevation</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground/50" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p className="text-xs">Elevation from USGS Digital Elevation Model (10m resolution)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="font-mono text-xl font-bold text-foreground">
              {elevation !== null && elevation !== undefined 
                ? `${elevation.toFixed(1)} ft`
                : "—"
              }
            </div>
            <div className="text-[10px] text-muted-foreground/60 mt-0.5">NAVD88 Datum</div>
          </div>

          {/* Slope */}
          <div className="bg-[hsl(var(--cloud-white))] rounded-lg p-3 border border-[hsl(var(--data-cyan)/0.15)]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[hsl(var(--data-cyan))] text-xs font-medium">Ground Slope</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground/50" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p className="text-xs">Representative slope from USDA SSURGO soil survey data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="font-mono text-xl font-bold text-foreground">
              {slopePercent !== null && slopePercent !== undefined 
                ? `${slopePercent}%`
                : "—"
              }
            </div>
            {slopeInfo && (
              <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] mt-1", slopeInfo.bgColor, slopeInfo.color)}>
                {slopeInfo.label}
              </div>
            )}
          </div>
        </div>

        {/* Grading Assessment */}
        {slopeInfo && (
          <div className="bg-[hsl(var(--data-cyan)/0.05)] rounded-lg p-3 border border-[hsl(var(--data-cyan)/0.15)]">
            <div className="flex items-start gap-2">
              <Mountain className="h-4 w-4 text-[hsl(var(--data-cyan))] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-medium text-[hsl(var(--data-cyan))] mb-0.5">Grading Assessment</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {slopePercent !== null && slopePercent !== undefined && slopePercent <= 2 && 
                    "Level terrain suitable for standard foundation construction with minimal site preparation costs."
                  }
                  {slopePercent !== null && slopePercent !== undefined && slopePercent > 2 && slopePercent <= 5 && 
                    "Gentle slope requiring standard grading. Suitable for most construction types with moderate site preparation."
                  }
                  {slopePercent !== null && slopePercent !== undefined && slopePercent > 5 && slopePercent <= 15 && 
                    "Moderate slope requiring significant grading. Consider retaining walls or stepped foundation design."
                  }
                  {slopePercent !== null && slopePercent !== undefined && slopePercent > 15 && 
                    "Steep terrain requiring major earthwork. Specialized foundation engineering recommended."
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* USGS Link */}
        {usgsUrl && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-[hsl(var(--data-cyan))] hover:bg-[hsl(var(--data-cyan)/0.05)]"
              onClick={() => window.open(usgsUrl, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1.5" />
              Open USGS National Map
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
