import { DocsLayout } from "@/components/docs/DocsLayout";
import { DiagramBlock } from "@/components/docs/DiagramBlock";
import { CodeBlock } from "@/components/docs/CodeBlock";

const TileArchitecture = () => {
  const tileDiagram = `PostGIS (canonical tables)
      ↓
Vector Tile Builder (tippecanoe / Martin / custom)
      ↓
Tileserver GL / Martin
      ↓
Cloudflare CDN (edge cache)
      ↓
SiteIntel Frontend + AI Engines`;

  return (
    <DocsLayout>
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="font-heading text-4xl md:text-5xl text-white">
            Tileserver GL + Cloudflare Architecture
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            This page documents how SiteIntel™ serves <strong className="text-white">Texas-wide vector tiles</strong> using 
            Tileserver GL (or Martin) behind Cloudflare, creating ultra-fast, globally cached map experiences.
          </p>
        </div>

        {/* Objectives */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">Objectives</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              "Deliver sub-200ms tile responses",
              "Decouple frontend from PostGIS load",
              "Leverage Cloudflare edge caching for global performance",
              "Support versioned tile URLs for reproducibility",
              "Provide a stable base for lender-grade feasibility mapping",
            ].map((objective, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[hsl(var(--data-cyan))]">✓</span>
                <span className="text-sm text-white/80">{objective}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture Diagram */}
        <DiagramBlock
          title="Tile Serving Architecture"
          content={tileDiagram}
        />

        {/* Tile Generation */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">Tile Generation</h2>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <h4 className="font-heading text-sm text-white mb-2">Input</h4>
              <p className="text-sm text-white/70">
                PostGIS canonical tables (zoning, parcels, utilities, flood, etc.)
              </p>
            </div>

            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <h4 className="font-heading text-sm text-white mb-2">Output</h4>
              <p className="text-sm text-white/70 mb-3">
                MVT/PBF tiles grouped by dataset and version:
              </p>
              <CodeBlock
                language="text"
                code={`/tiles/tx/zoning/{version}/{z}/{x}/{y}.pbf
/tiles/tx/parcels/{version}/{z}/{x}/{y}.pbf
/tiles/tx/utilities/{version}/{z}/{x}/{y}.pbf
/tiles/tx/flood/{version}/{z}/{x}/{y}.pbf`}
              />
            </div>

            <div className="p-4 rounded-lg border border-[hsl(var(--feasibility-orange))]/30 bg-[hsl(var(--feasibility-orange))]/5">
              <h4 className="font-heading text-sm text-[hsl(var(--feasibility-orange))] mb-2">
                Regeneration Schedule
              </h4>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• <strong className="text-white">Nightly:</strong> Dynamic layers (parcels, zoning)</li>
                <li>• <strong className="text-white">On-change:</strong> Critical datasets (flood zones)</li>
                <li>• <strong className="text-white">Weekly:</strong> Slow-moving layers (demographics)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Cloudflare Caching */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">Cloudflare Edge Caching</h2>
          
          <div className="space-y-4">
            <CodeBlock
              title="Cache Headers"
              language="text"
              code={`Cache-Control: public, max-age=31536000, immutable
stale-while-revalidate: enabled for safe background refresh`}
            />

            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <h4 className="font-heading text-sm text-white mb-3">Cache Invalidation</h4>
              <p className="text-sm text-white/70">
                Per-dataset purge when a new version is published. Old versions remain 
                accessible for reproducibility and debugging.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border border-[hsl(var(--data-cyan))]/30 bg-[hsl(var(--data-cyan))]/5 text-center">
                <span className="block text-3xl font-heading text-[hsl(var(--data-cyan))]">90-99%</span>
                <span className="text-sm text-white/60">Edge Cache Hit Rate</span>
              </div>
              <div className="p-4 rounded-lg border border-[hsl(var(--data-cyan))]/30 bg-[hsl(var(--data-cyan))]/5 text-center">
                <span className="block text-3xl font-heading text-[hsl(var(--data-cyan))]">&lt;200ms</span>
                <span className="text-sm text-white/60">P95 Response Time</span>
              </div>
              <div className="p-4 rounded-lg border border-[hsl(var(--data-cyan))]/30 bg-[hsl(var(--data-cyan))]/5 text-center">
                <span className="block text-3xl font-heading text-[hsl(var(--data-cyan))]">320+</span>
                <span className="text-sm text-white/60">Edge Locations</span>
              </div>
            </div>
          </div>
        </section>

        {/* URL Patterns */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">URL Patterns</h2>
          
          <CodeBlock
            language="text"
            code={`# Production Tiles
https://tiles.siteintel.io/tx/{layer}/{version}/{z}/{x}/{y}.pbf

# Examples
https://tiles.siteintel.io/tx/parcels/2025_01_15/{z}/{x}/{y}.pbf
https://tiles.siteintel.io/tx/zoning/2025_01_12/{z}/{x}/{y}.pbf
https://tiles.siteintel.io/tx/flood/nfhl_2024_q4/{z}/{x}/{y}.pbf

# Style JSON
https://tiles.siteintel.io/styles/siteintel-dark.json
https://tiles.siteintel.io/styles/siteintel-satellite.json`}
          />

          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <h4 className="font-heading text-sm text-white mb-2">Versioning Strategy</h4>
            <p className="text-sm text-white/70">
              Version strings follow <code className="font-mono text-[hsl(var(--data-cyan))]">YYYY_MM_DD</code> format 
              for city data or <code className="font-mono text-[hsl(var(--data-cyan))]">source_YYYY_quarter</code> for 
              federal datasets (e.g., <code className="font-mono text-white/90">nfhl_2024_q4</code>).
            </p>
          </div>
        </section>

        {/* Moat Explanation */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">Why This Matters for the Moat</h2>
          
          <div className="p-6 rounded-xl border border-[hsl(var(--feasibility-orange))]/30 bg-[hsl(var(--feasibility-orange))]/5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏰</span>
              <div>
                <h4 className="font-heading text-lg text-white">Data Moat Advantage</h4>
                <p className="text-white/80 mt-1">
                  You're not just storing data; you're serving a <strong>statewide vector-tile infrastructure</strong>. 
                  Competitors relying on direct ArcGIS calls can never match your performance or reliability.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="font-heading text-lg text-white">Performance Edge</h4>
                <p className="text-white/80 mt-1">
                  Sub-200ms tile responses vs. 2-5 second ArcGIS queries. Lenders get instantaneous, 
                  interactive feasibility maps backed by fully normalized data.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h4 className="font-heading text-lg text-white">Independence</h4>
                <p className="text-white/80 mt-1">
                  No dependency on city GIS uptime, rate limits, or schema changes. 
                  SiteIntel controls the entire data pipeline from source to delivery.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
};

export default TileArchitecture;
