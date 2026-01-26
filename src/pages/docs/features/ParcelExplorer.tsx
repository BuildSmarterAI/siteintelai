import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DiagramBlock } from "@/components/docs/DiagramBlock";
import { Map, Search, MousePointer, GitCompare, Database } from "lucide-react";

const counties = [
  { name: "Harris (HCAD)", coverage: "2.4M+ parcels", status: "Active" },
  { name: "Fort Bend (FBCAD)", coverage: "280K+ parcels", status: "Active" },
  { name: "Montgomery (MCAD)", coverage: "230K+ parcels", status: "Active" },
  { name: "Travis (TCAD)", coverage: "450K+ parcels", status: "Active" },
  { name: "Bexar (BCAD)", coverage: "680K+ parcels", status: "Active" },
  { name: "Dallas (DCAD)", coverage: "850K+ parcels", status: "Active" },
  { name: "Tarrant (TAD)", coverage: "720K+ parcels", status: "Active" },
  { name: "Williamson (WCAD)", coverage: "220K+ parcels", status: "Active" },
];

const ParcelExplorer = () => {
  return (
    <DocsLayout>
      <div className="space-y-10">
        {/* Hero */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[hsl(var(--feasibility-orange))]">
            <Map className="h-8 w-8" />
            <span className="text-sm font-medium uppercase tracking-wider">Platform Feature</span>
          </div>
          <h1 id="overview" className="font-heading text-4xl md:text-5xl text-white">
            Parcel Explorer
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Interactive parcel search and selection across 8 Texas counties. 
            Find parcels by address, CAD number, or click-to-select on the map.
          </p>
        </div>

        {/* Access */}
        <div className="p-4 rounded-xl border border-[hsl(var(--feasibility-orange))]/30 bg-[hsl(var(--feasibility-orange))]/10">
          <p className="text-white/80">
            <strong className="text-white">Access:</strong> Parcel Explorer is available at{" "}
            <code className="px-2 py-1 rounded bg-white/10 text-[hsl(var(--feasibility-orange))]">/parcel-explorer</code>{" "}
            for all authenticated users.
          </p>
        </div>

        {/* Search Methods */}
        <section className="space-y-4">
          <h2 id="search" className="font-heading text-2xl text-white">Search Methods</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <Search className="h-6 w-6 text-[hsl(var(--feasibility-orange))] mb-3" />
              <h3 className="font-heading text-white mb-2">Address Search</h3>
              <p className="text-sm text-white/60 mb-3">
                Google Places-powered geocoding with automatic county detection. 
                Returns parcel geometry and CAD attributes.
              </p>
              <code className="text-xs text-[hsl(var(--data-cyan))]">
                "1000 Main St, Houston, TX"
              </code>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <Database className="h-6 w-6 text-[hsl(var(--data-cyan))] mb-3" />
              <h3 className="font-heading text-white mb-2">CAD/APN Search</h3>
              <p className="text-sm text-white/60 mb-3">
                Direct lookup by County Appraisal District account number. 
                Cross-references parcel_index table.
              </p>
              <code className="text-xs text-[hsl(var(--data-cyan))]">
                "HCAD-0123456789012"
              </code>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <MousePointer className="h-6 w-6 text-[hsl(var(--feasibility-orange))] mb-3" />
              <h3 className="font-heading text-white mb-2">Click-to-Select</h3>
              <p className="text-sm text-white/60">
                Click any parcel on the map to select it. 
                Uses ST_Contains PostGIS query for precise boundary detection.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <GitCompare className="h-6 w-6 text-[hsl(var(--data-cyan))] mb-3" />
              <h3 className="font-heading text-white mb-2">Comparison Mode</h3>
              <p className="text-sm text-white/60">
                Select up to 4 parcels for side-by-side comparison. 
                Compare acreage, zoning, flood zones, and values.
              </p>
            </div>
          </div>
        </section>

        {/* County Coverage */}
        <section className="space-y-4">
          <h2 id="coverage" className="font-heading text-2xl text-white">County Coverage</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/70 font-medium">County (CAD)</th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Parcel Count</th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-white/60">
                {counties.map((county) => (
                  <tr key={county.name} className="border-b border-white/5">
                    <td className="py-3 px-4 text-white">{county.name}</td>
                    <td className="py-3 px-4">{county.coverage}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs">
                        {county.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Data Architecture */}
        <section className="space-y-4">
          <h2 id="architecture" className="font-heading text-2xl text-white">Data Architecture</h2>
          <DiagramBlock
            title="Parcel Search Pipeline"
            content={`┌─────────────────────────────────────────────────────────────────────┐
│                      PARCEL SEARCH API                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │                    search-parcels                             │ │
│   │            Edge Function (Request Router)                     │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│        ┌─────────────────────┼─────────────────────┐               │
│        ▼                     ▼                     ▼               │
│   ┌─────────┐         ┌───────────┐        ┌─────────────┐        │
│   │ Address │         │  CAD/APN  │        │   Point     │        │
│   │ Search  │         │  Lookup   │        │  (lat/lng)  │        │
│   └─────────┘         └───────────┘        └─────────────┘        │
│        │                     │                     │               │
│        ▼                     ▼                     ▼               │
│   ┌─────────┐         ┌───────────┐        ┌─────────────┐        │
│   │ Google  │         │  parcel   │        │ ST_Contains │        │
│   │ Places  │         │  _index   │        │   PostGIS   │        │
│   └─────────┘         └───────────┘        └─────────────┘        │
│        │                     │                     │               │
│        └─────────────────────┼─────────────────────┘               │
│                              ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │                    fetch-parcels                              │ │
│   │           (County-Specific Field Mapping)                     │ │
│   │   HCAD | FBCAD | MCAD | TCAD | BCAD | DCAD | TAD | WCAD      │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │              Normalized GeoJSON Response                      │ │
│   │   { geometry, properties: { parcel_id, owner, acreage, ... }}│ │
│   └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘`}
          />
        </section>

        {/* Response Schema */}
        <section className="space-y-4">
          <h2 id="response" className="font-heading text-2xl text-white">Response Fields</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Field</th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-white/60">
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4 font-mono text-[hsl(var(--data-cyan))]">parcel_id</td>
                  <td className="py-3 px-4">string</td>
                  <td className="py-3 px-4">Unique parcel identifier (CAD format)</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4 font-mono text-[hsl(var(--data-cyan))]">geometry</td>
                  <td className="py-3 px-4">GeoJSON</td>
                  <td className="py-3 px-4">Parcel boundary polygon (WGS84)</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4 font-mono text-[hsl(var(--data-cyan))]">owner_name</td>
                  <td className="py-3 px-4">string</td>
                  <td className="py-3 px-4">Property owner from CAD records</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4 font-mono text-[hsl(var(--data-cyan))]">acreage</td>
                  <td className="py-3 px-4">number</td>
                  <td className="py-3 px-4">Parcel area in acres</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4 font-mono text-[hsl(var(--data-cyan))]">total_value</td>
                  <td className="py-3 px-4">number</td>
                  <td className="py-3 px-4">Total appraised value (CAD)</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4 font-mono text-[hsl(var(--data-cyan))]">confidence</td>
                  <td className="py-3 px-4">number</td>
                  <td className="py-3 px-4">Match confidence score (0-1)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Related */}
        <div className="flex flex-wrap gap-3 pt-8 border-t border-white/10">
          <Link
            to="/docs/features/decision-map"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Decision Map →
          </Link>
          <Link
            to="/docs/canonical-schema"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Canonical Schema →
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
};

export default ParcelExplorer;
