import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mountain, ExternalLink, TrendingUp, Ruler } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  const [showEmbed, setShowEmbed] = useState(false);
  
  const slopeInfo = getSlopeClassification(slopePercent);
  
  // Generate USGS viewer URL if not provided but coordinates exist
  const usgsUrl = topographyMapUrl || 
    (latitude && longitude 
      ? `https://apps.nationalmap.gov/viewer/?basemap=b1&category=ustopo&title=US%20Topo&zoom=15&lat=${latitude}&lng=${longitude}`
      : null);

  const hasAnyData = elevation !== null || slopePercent !== null || usgsUrl;

  if (!hasAnyData) return null;

  return (
    <Card className={cn("overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm", className)}>
      <CardHeader className="bg-gradient-to-r from-midnight-blue to-midnight-blue/90 text-foreground py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Mountain className="h-5 w-5 text-data-cyan" />
            Site Topography
          </CardTitle>
          {usgsUrl && (
            <span className="text-xs text-muted-foreground font-mono">USGS National Map</span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Elevation */}
          <div className="bg-midnight-blue/50 rounded-xl p-4 border border-data-cyan/20">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Ruler className="h-4 w-4" />
              <span>Site Elevation</span>
            </div>
            <div className="font-mono text-2xl font-bold text-foreground">
              {elevation !== null && elevation !== undefined 
                ? `${elevation.toFixed(2)} ft`
                : "—"
              }
            </div>
            <div className="text-xs text-muted-foreground/70 mt-1">NAVD88 Datum</div>
          </div>

          {/* Slope */}
          <div className="bg-midnight-blue/50 rounded-xl p-4 border border-data-cyan/20">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <TrendingUp className="h-4 w-4" />
              <span>Ground Slope</span>
            </div>
            <div className="font-mono text-2xl font-bold text-foreground">
              {slopePercent !== null && slopePercent !== undefined 
                ? `${slopePercent}%`
                : "—"
              }
            </div>
            {slopeInfo && (
              <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mt-2", slopeInfo.bgColor, slopeInfo.color)}>
                {slopeInfo.label}
              </div>
            )}
          </div>

          {/* USGS Map Link */}
          <div className="bg-midnight-blue/50 rounded-xl p-4 border border-data-cyan/20 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Mountain className="h-4 w-4" />
              <span>USGS National Map</span>
            </div>
            {usgsUrl ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-data-cyan/50 text-data-cyan hover:bg-data-cyan/10"
                onClick={() => window.open(usgsUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Topo Viewer
              </Button>
            ) : (
              <div className="text-muted-foreground text-sm">No map available</div>
            )}
          </div>
        </div>

        {/* Grading Assessment */}
        {slopeInfo && (
          <div className="bg-midnight-blue/40 rounded-lg p-4 border border-data-cyan/10">
            <div className="flex items-start gap-3">
              <div className="text-data-cyan text-lg">💡</div>
              <div>
                <div className="text-sm font-medium text-foreground mb-1">Grading Assessment</div>
                <p className="text-sm text-muted-foreground">
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

        {/* Embedded Map Toggle */}
        {usgsUrl && (
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowEmbed(!showEmbed)}
            >
              {showEmbed ? "Hide" : "Show"} Interactive Map
            </Button>
            
            {showEmbed && (
              <div className="mt-3 rounded-lg overflow-hidden border border-data-cyan/20">
                <iframe
                  src={usgsUrl}
                  width="100%"
                  height="400"
                  className="border-0"
                  title="USGS National Map Viewer"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
