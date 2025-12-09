import { DocsLayout } from "@/components/docs/DocsLayout";
import { DiagramBlock } from "@/components/docs/DiagramBlock";

const HoustonWorkflow = () => {
  const workflowDiagram = `          +--------------------------------------+
          |   City of Houston ArcGIS Services    |
          |  (MapServer / FeatureServer / WFS)   |
          +--------------------+-----------------+
                               |
                               v
                     [1] Metadata Scanner
                      - discover layers
                      - read fields, types
                      - detect CRS, extents
                               |
                               v
                       [2] ETL Fetcher
                      - paginated requests
                      - maxRecordCount aware
                      - retries & backoff
                               |
                               v
                  [3] transform_config Engine
            RAW fields + geometry + config.json
                        --> canonical_schema
                               |
                               v
                         [4] PostGIS
               - canonical tables (zoning, parcels,
                 utilities, flood, etc.)
               - versioned schemas
                               |
                               v
                   [5] Vector Tile Builder
               - per-layer tiles (PBF / MVT)
               - dataset+version-based paths
                               |
                               v
                     [6] Tileserver GL / Martin
                               |
                               v
                    [7] Cloudflare Edge CDN
                               |
                               v
                        SiteIntel Frontend
                       + AI Feasibility Engine`;

  return (
    <DocsLayout>
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="font-heading text-4xl md:text-5xl text-white">
            City of Houston Ingestion Workflow
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            This page illustrates the <strong className="text-white">end-to-end ingestion pipeline</strong> for 
            City of Houston GIS services into SiteIntel™.
          </p>
        </div>

        {/* Main Diagram */}
        <DiagramBlock
          title="Houston Ingestion Pipeline"
          content={workflowDiagram}
        />

        {/* Step-by-Step Breakdown */}
        <section className="space-y-6">
          <h2 className="font-heading text-2xl text-white">Pipeline Steps</h2>

          <div className="space-y-4">
            {[
              {
                step: 1,
                title: "Metadata Scanner",
                description: "Discovers all available layers from City of Houston ArcGIS services. Reads field names, data types, and detects coordinate reference systems (CRS) and spatial extents.",
                color: "data-cyan",
              },
              {
                step: 2,
                title: "ETL Fetcher",
                description: "Executes paginated requests to extract all records. Handles maxRecordCount limits, implements retry logic with exponential backoff, and manages rate limiting.",
                color: "data-cyan",
              },
              {
                step: 3,
                title: "transform_config Engine",
                description: "Applies the transform_config DSL to convert raw fields and geometry into the canonical_schema. Handles field mapping, type coercion, geometry repair, and projection.",
                color: "feasibility-orange",
              },
              {
                step: 4,
                title: "PostGIS Storage",
                description: "Stores transformed data in PostgreSQL with PostGIS extension. Creates versioned canonical tables for zoning, parcels, utilities, flood, and other domains.",
                color: "data-cyan",
              },
              {
                step: 5,
                title: "Vector Tile Builder",
                description: "Generates MVT/PBF vector tiles using Tippecanoe. Creates per-layer tiles with dataset+version-based URL paths for immutable caching.",
                color: "feasibility-orange",
              },
              {
                step: 6,
                title: "Tileserver GL / Martin",
                description: "Serves vector tiles via Tileserver GL or Martin. Provides high-performance tile delivery with proper CORS and cache headers.",
                color: "data-cyan",
              },
              {
                step: 7,
                title: "Cloudflare Edge CDN",
                description: "Distributes tiles globally via Cloudflare's edge network. Achieves 90-99% cache hit rates with sub-200ms response times worldwide.",
                color: "feasibility-orange",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-4 p-4 rounded-lg border border-white/10 bg-white/5"
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-[hsl(var(--${item.color}))]/20 flex items-center justify-center`}>
                  <span className={`font-heading text-lg text-[hsl(var(--${item.color}))]`}>
                    {item.step}
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading text-lg text-white">{item.title}</h3>
                  <p className="text-sm text-white/70">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Data Sources */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">Houston Data Sources</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-white/90 font-medium">Service</th>
                  <th className="text-left py-2 text-white/90 font-medium">Layers</th>
                  <th className="text-left py-2 text-white/90 font-medium">Update Frequency</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                <tr className="border-b border-white/5">
                  <td className="py-2">Houston Water GIS</td>
                  <td className="py-2">Water mains, sewer lines, hydrants</td>
                  <td className="py-2">Weekly</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2">HCAD Parcels</td>
                  <td className="py-2">Property boundaries, ownership</td>
                  <td className="py-2">Bi-weekly</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2">Houston Planning</td>
                  <td className="py-2">Zoning, overlays, ETJ</td>
                  <td className="py-2">Monthly</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2">Harris County Flood Control</td>
                  <td className="py-2">FEMA zones, drainage</td>
                  <td className="py-2">Quarterly</td>
                </tr>
                <tr>
                  <td className="py-2">Houston Public Works</td>
                  <td className="py-2">Stormwater, force mains</td>
                  <td className="py-2">Monthly</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Moat Callout */}
        <div className="p-6 rounded-xl border border-[hsl(var(--feasibility-orange))]/30 bg-[hsl(var(--feasibility-orange))]/5">
          <h3 className="font-heading text-lg text-[hsl(var(--feasibility-orange))] mb-2">
            🏰 Data Moat Advantage
          </h3>
          <p className="text-white/80">
            By replicating and normalizing City of Houston's fragmented GIS services into a unified, 
            versioned data layer, SiteIntel creates a permanent competitive advantage. Competitors 
            relying on direct ArcGIS calls cannot match our performance, reliability, or data quality.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
};

export default HoustonWorkflow;
