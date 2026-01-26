import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DiagramBlock } from "@/components/docs/DiagramBlock";
import { Layers, Eye, Palette, Smartphone, Zap, Filter } from "lucide-react";

const layerPresets = [
  { name: "Decision View", layers: ["Parcels", "Zoning", "Flood", "Kill Factors"], description: "Default feasibility analysis view" },
  { name: "Lender Risk", layers: ["Flood Zones", "Wetlands", "EPA Sites"], description: "Risk-focused for underwriting" },
  { name: "Utilities", layers: ["Water", "Sewer", "Storm", "Power"], description: "Infrastructure availability" },
  { name: "Market", layers: ["Demographics", "Traffic", "POIs"], description: "Market context and demand drivers" },
  { name: "Environmental", layers: ["Wetlands", "Soil", "Elevation"], description: "Environmental constraints" },
];

const DecisionMap = () => {
  return (
    <DocsLayout>
      <div className="space-y-10">
        {/* Hero */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[hsl(var(--feasibility-orange))]">
            <Layers className="h-8 w-8" />
            <span className="text-sm font-medium uppercase tracking-wider">Platform Feature</span>
          </div>
          <h1 id="overview" className="font-heading text-4xl md:text-5xl text-white">
            Decision Map
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Multi-layer GIS visualization with layer presets, interactive legends, 
            and vector tile architecture. Sub-200ms tile delivery worldwide.
          </p>
        </div>

        {/* Layer Presets */}
        <section className="space-y-4">
          <h2 id="presets" className="font-heading text-2xl text-white">Layer Presets</h2>
          <div className="space-y-3">
            {layerPresets.map((preset) => (
              <div
                key={preset.name}
                className="p-4 rounded-lg border border-white/10 bg-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading text-white">{preset.name}</h3>
                  <div className="flex gap-1">
                    {preset.layers.map((layer) => (
                      <span
                        key={layer}
                        className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/70"
                      >
                        {layer}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-white/60">{preset.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Key Features */}
        <section className="space-y-4">
          <h2 id="features" className="font-heading text-2xl text-white">Key Capabilities</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <Eye className="h-6 w-6 text-[hsl(var(--data-cyan))] mb-3" />
              <h3 className="font-heading text-white mb-2">Interactive Legends</h3>
              <p className="text-sm text-white/60">
                Dynamic legends that update based on visible layers. 
                Click legend items to toggle layer visibility.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <Palette className="h-6 w-6 text-[hsl(var(--feasibility-orange))] mb-3" />
              <h3 className="font-heading text-white mb-2">Semantic Styling</h3>
              <p className="text-sm text-white/60">
                Color-coded layers using SiteIntel brand palette. 
                Risk indicators use red/amber/green system.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <Zap className="h-6 w-6 text-[hsl(var(--data-cyan))] mb-3" />
              <h3 className="font-heading text-white mb-2">Vector Tiles</h3>
              <p className="text-sm text-white/60">
                MapLibre GL + Tileserver GL architecture. 
                Sub-200ms tile delivery via Cloudflare CDN.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <Smartphone className="h-6 w-6 text-[hsl(var(--feasibility-orange))] mb-3" />
              <h3 className="font-heading text-white mb-2">Mobile Responsive</h3>
              <p className="text-sm text-white/60">
                Touch-optimized controls and responsive layout. 
                Full functionality on tablet and mobile devices.
              </p>
            </div>
          </div>
        </section>

        {/* Architecture */}
        <section className="space-y-4">
          <h2 id="architecture" className="font-heading text-2xl text-white">Tile Architecture</h2>
          <DiagramBlock
            title="Vector Tile Delivery"
            content={`┌─────────────────────────────────────────────────────────────────────┐
│                    VECTOR TILE ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │                 MapLibre GL (Frontend)                        │ │
│   │   - Style specification                                       │ │
│   │   - Layer compositing                                         │ │
│   │   - Interaction handlers                                      │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │              Cloudflare CDN (Edge Cache)                      │ │
│   │   - 300+ edge locations worldwide                             │ │
│   │   - <50ms TTFB globally                                       │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │               Tileserver GL (Origin)                          │ │
│   │   - MBTiles → PBF conversion                                  │ │
│   │   - On-demand tile generation                                 │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │                 PostGIS (Tile Source)                         │ │
│   │   - ST_AsMVT() for vector tiles                               │ │
│   │   - Geometry simplification                                   │ │
│   │   - Zoom-level optimization                                   │ │
│   └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘`}
          />
        </section>

        {/* Layer Controls */}
        <section className="space-y-4">
          <h2 id="controls" className="font-heading text-2xl text-white">Layer Controls</h2>
          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <Filter className="h-6 w-6 text-[hsl(var(--data-cyan))] mb-4" />
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-white">Layer Visibility</span>
                <span className="text-white/60">Toggle individual layers on/off</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-white">Opacity Control</span>
                <span className="text-white/60">Adjust layer transparency (0-100%)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-white">Layer Order</span>
                <span className="text-white/60">Drag to reorder layer stack</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-white">Preset Switch</span>
                <span className="text-white/60">One-click preset activation</span>
              </div>
            </div>
          </div>
        </section>

        {/* Related */}
        <div className="flex flex-wrap gap-3 pt-8 border-t border-white/10">
          <Link
            to="/docs/tile-architecture"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Tile Architecture Details →
          </Link>
          <Link
            to="/docs/features/parcel-explorer"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Parcel Explorer →
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
};

export default DecisionMap;
