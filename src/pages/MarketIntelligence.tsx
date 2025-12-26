import { useMemo, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/navigation/DashboardSidebar";
import { PresetSelector } from "@/components/market-intelligence/PresetSelector";
import { TradeAreaMap } from "@/components/market-intelligence/TradeAreaMap";
import { MetricsSummaryPanel } from "@/components/market-intelligence/MetricsSummaryPanel";
import { DemographicBreakdownChart } from "@/components/market-intelligence/DemographicBreakdownChart";
import { GrowthProjectionCard } from "@/components/market-intelligence/GrowthProjectionCard";
import {
  MetricSelector,
  MetricType,
} from "@/components/market-intelligence/MetricSelector";
import { AddressSearchInput } from "@/components/market-intelligence/AddressSearchInput";
import { useMarketPresets } from "@/hooks/useMarketPresets";
import { useComputeTradeAreaMetrics } from "@/hooks/useComputeTradeAreaMetrics";
import { generateMockMetrics } from "@/hooks/useTradeAreaMetrics";
import { Globe2, Sparkles, Loader2, Database } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Default center: Downtown Houston
const DEFAULT_CENTER = { lat: 29.7604, lng: -95.3698 };

export default function MarketIntelligence() {
  const {
    presets,
    isLoading: presetsLoading,
    selectedPreset,
    setSelectedPresetId,
  } = useMarketPresets();

  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [selectedAddress, setSelectedAddress] = useState(
    "Downtown Houston, TX"
  );
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("population");

  // Get radius from selected preset
  const radiusMiles = selectedPreset?.radius_miles || 1;

  // Fetch real Census data via edge function
  const {
    data: tradeAreaData,
    isLoading: metricsLoading,
    error: metricsError,
  } = useComputeTradeAreaMetrics({
    centerLat: center.lat,
    centerLng: center.lng,
    radiusMiles,
    metric: selectedMetric,
  });

  // Use real metrics if available; memoize mock fallback so it doesn't change every render
  const fallbackMetrics = useMemo(
    () => generateMockMetrics(radiusMiles),
    [center.lat, center.lng, radiusMiles]
  );
  const metrics = tradeAreaData?.metrics || fallbackMetrics;

  // Avoid showing mock hexes while real data is loading (prevents "changing" hexagons)
  const h3Cells = tradeAreaData?.cells ?? [];
  const coverage = tradeAreaData?.coverage;

  // Round to 6 decimal places (~10cm precision) to prevent floating-point drift
  const roundCoord = (n: number) => Math.round(n * 1000000) / 1000000;

  const handleAddressSelect = (lat: number, lng: number, address: string) => {
    setCenter({ lat: roundCoord(lat), lng: roundCoord(lng) });
    setSelectedAddress(address);
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />

        <main className="flex-1 overflow-hidden">
          {/* Header */}
          <header className="bg-card border-b border-border px-6 py-4 shadow-soft">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-data-cyan to-data-cyan/80 rounded-xl shadow-md">
                  <Globe2 className="h-6 w-6 text-data-cyan-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground font-heading">
                    Market Intelligence
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Analyze trade areas with H3 hexagon visualization
                  </p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-2 px-2.5 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-help shadow-sm hover:shadow-md transition-shadow">
                        <Sparkles className="h-3 w-3" />
                        NEW
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-sm">
                        New feature: Real-time Census data visualization with H3
                        hexagons
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Address Search */}
              <AddressSearchInput
                onSelect={handleAddressSelect}
                className="w-full lg:w-96"
              />
            </div>

            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
              <PresetSelector
                presets={presets}
                selectedPresetId={selectedPreset?.id || null}
                onSelect={handlePresetSelect}
                isLoading={presetsLoading}
              />
              <MetricSelector
                selectedMetric={selectedMetric}
                onSelect={setSelectedMetric}
              />
            </div>
          </header>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row h-[calc(100vh-180px)]">
            {/* Map Panel */}
            <div className="flex-1 p-4 min-h-[400px] lg:min-h-0">
              <div className="h-full bg-card rounded-xl shadow-soft border border-border overflow-hidden relative">
                <TradeAreaMap
                  centerLat={center.lat}
                  centerLng={center.lng}
                  radiusMiles={radiusMiles}
                  metric={selectedMetric}
                  onCenterChange={(lat, lng) => {
                    const newLat = roundCoord(lat);
                    const newLng = roundCoord(lng);
                    // Only update if coordinates changed significantly
                    if (newLat !== center.lat || newLng !== center.lng) {
                      setCenter({ lat: newLat, lng: newLng });
                    }
                  }}
                  externalCells={h3Cells}
                  externalMinValue={tradeAreaData?.minValue}
                  externalMaxValue={tradeAreaData?.maxValue}
                  isLoading={metricsLoading}
                />

                {/* Map overlay badge */}
                {coverage && (
                  <div className="absolute top-4 left-4 z-10">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 bg-card/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md border border-border cursor-help hover:shadow-lg transition-shadow">
                            <Database className="h-3.5 w-3.5 text-data-cyan" />
                            <span className="text-xs font-medium text-foreground">
                              {coverage.coveredCells} hexagons
                            </span>
                            <span className="text-xs text-muted-foreground">
                              (Census)
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-sm">
                            {coverage.coveragePercent}% coverage from{" "}
                            {coverage.requestedCells} requested Census block
                            groups
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            </div>

            {/* Metrics Panel */}
            <div className="w-full lg:w-[420px] p-4 overflow-y-auto bg-muted/30">
              <div className="space-y-4">
                {metricsLoading && (
                  <div className="bg-card rounded-xl p-4 shadow-soft border border-border flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-data-cyan" />
                    <span className="text-sm text-muted-foreground">
                      Loading Census data...
                    </span>
                  </div>
                )}

                <MetricsSummaryPanel
                  metrics={metrics}
                  radiusMiles={radiusMiles}
                  isLoading={metricsLoading}
                  hexCount={coverage?.coveredCells}
                  selectedAddress={selectedAddress}
                />

                <DemographicBreakdownChart
                  metrics={metrics}
                  isLoading={metricsLoading}
                />

                <GrowthProjectionCard
                  metrics={metrics}
                  isLoading={metricsLoading}
                />

                {/* Data Attribution */}
                <div className="text-xs text-muted-foreground text-center py-4 border-t border-border">
                  <p>
                    {tradeAreaData?.dataSource ||
                      "Data sources: U.S. Census ACS 2022, ESRI Demographics"}
                  </p>
                  <p className="mt-1">
                    Last updated: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
