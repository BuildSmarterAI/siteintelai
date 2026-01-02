import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mountain, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { ElevationProfileChart } from "./ElevationProfileChart";
import { useElevationProfile } from "@/hooks/useElevationProfile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ElevationProfileCardProps {
  applicationId: string;
  coordinates?: number[][] | null;
  baseFloodElevation?: number | null;
  className?: string;
}

export function ElevationProfileCard({
  applicationId,
  coordinates,
  baseFloodElevation,
  className
}: ElevationProfileCardProps) {
  const { data, isLoading, error } = useElevationProfile({
    applicationId,
    coordinates,
    samples: 16,
    enabled: !!coordinates && coordinates.length >= 3
  });

  const profile = data?.profile || [];
  const metadata = data?.metadata;

  // Don't render if no coordinates
  if (!coordinates || coordinates.length < 3) {
    return null;
  }

  return (
    <Card className={cn("glass-card overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mountain className="h-5 w-5 text-[hsl(var(--data-cyan))]" />
            Elevation Profile
          </CardTitle>
          <div className="flex items-center gap-2">
            {metadata?.source && (
              <Badge variant="outline" className="text-xs font-mono">
                {metadata.source === 'google_elevation_api' ? 'Google' : 'USGS'}
              </Badge>
            )}
            {data?.from_cache && (
              <Badge variant="secondary" className="text-xs">Cached</Badge>
            )}
          </div>
        </div>
        
        {/* Elevation Stats Strip */}
        {metadata && (
          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">Min:</span>
              <span className="font-mono font-medium">{metadata.min_elevation_ft} ft</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Max:</span>
              <span className="font-mono font-medium">{metadata.max_elevation_ft} ft</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Minus className="h-4 w-4 text-amber-500" />
              <span className="text-muted-foreground">Avg:</span>
              <span className="font-mono font-medium">{metadata.avg_elevation_ft} ft</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Range:</span>
              <span className="font-mono font-medium">{metadata.elevation_range_ft} ft</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {error ? (
          <div className="p-4 bg-destructive/10 rounded-lg text-center">
            <p className="text-sm text-destructive">Failed to load elevation profile</p>
          </div>
        ) : (
          <ElevationProfileChart
            data={profile}
            baseFloodElevation={baseFloodElevation}
            minElevation={metadata?.min_elevation_ft}
            maxElevation={metadata?.max_elevation_ft}
            isLoading={isLoading}
          />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            {metadata ? (
              <>
                {metadata.samples} samples • {metadata.total_distance_ft.toLocaleString()} ft transect • {metadata.resolution} resolution
              </>
            ) : (
              'Cross-section elevation along parcel diagonal'
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => window.open('https://apps.nationalmap.gov/epqs/', '_blank')}
          >
            USGS Verify
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
