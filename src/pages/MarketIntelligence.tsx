import { useState, useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/navigation/DashboardSidebar';
import { PresetSelector } from '@/components/market-intelligence/PresetSelector';
import { TradeAreaMap } from '@/components/market-intelligence/TradeAreaMap';
import { MetricsSummaryPanel } from '@/components/market-intelligence/MetricsSummaryPanel';
import { DemographicBreakdownChart } from '@/components/market-intelligence/DemographicBreakdownChart';
import { GrowthProjectionCard } from '@/components/market-intelligence/GrowthProjectionCard';
import { MetricSelector, MetricType } from '@/components/market-intelligence/MetricSelector';
import { AddressSearchInput } from '@/components/market-intelligence/AddressSearchInput';
import { useMarketPresets } from '@/hooks/useMarketPresets';
import { generateMockMetrics } from '@/hooks/useTradeAreaMetrics';
import { Globe2, Sparkles } from 'lucide-react';

// Default center: Downtown Houston
const DEFAULT_CENTER = { lat: 29.7604, lng: -95.3698 };

export default function MarketIntelligence() {
  const { presets, isLoading: presetsLoading, selectedPreset, setSelectedPresetId } = useMarketPresets();
  
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [selectedAddress, setSelectedAddress] = useState('Downtown Houston, TX');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('population');

  // Get radius from selected preset
  const radiusMiles = selectedPreset?.radius_miles || 1;

  // Generate mock metrics based on radius
  const metrics = useMemo(() => generateMockMetrics(radiusMiles), [radiusMiles, center]);

  const handleAddressSelect = (lat: number, lng: number, address: string) => {
    setCenter({ lat, lng });
    setSelectedAddress(address);
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        <DashboardSidebar />
        
        <main className="flex-1 overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[hsl(var(--data-cyan))] to-[hsl(var(--data-cyan)/0.8)] rounded-lg">
                  <Globe2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Market Intelligence</h1>
                  <p className="text-sm text-slate-500">
                    Analyze trade areas with H3 hexagon visualization
                  </p>
                </div>
                <span className="ml-2 px-2 py-0.5 bg-[hsl(var(--feasibility-orange))] text-white text-xs font-medium rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  NEW
                </span>
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
              <div className="h-full bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <TradeAreaMap
                  centerLat={center.lat}
                  centerLng={center.lng}
                  radiusMiles={radiusMiles}
                  metric={selectedMetric}
                  onCenterChange={(lat, lng) => setCenter({ lat, lng })}
                />
              </div>
            </div>

            {/* Metrics Panel */}
            <div className="w-full lg:w-[420px] p-4 overflow-y-auto">
              <div className="space-y-6">
                {/* Location Badge */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    Selected Location
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {selectedAddress}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
                  </div>
                </div>

                <MetricsSummaryPanel 
                  metrics={metrics} 
                  radiusMiles={radiusMiles}
                />
                
                <DemographicBreakdownChart metrics={metrics} />
                
                <GrowthProjectionCard metrics={metrics} />

                {/* Data Attribution */}
                <div className="text-xs text-slate-400 text-center py-4">
                  Data sources: U.S. Census ACS 2022, ESRI Demographics
                  <br />
                  Last updated: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
