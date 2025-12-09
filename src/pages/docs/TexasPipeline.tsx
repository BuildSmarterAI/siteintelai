import { DocsLayout } from "@/components/docs/DocsLayout";
import { DiagramBlock } from "@/components/docs/DiagramBlock";

const TexasPipeline = () => {
  const texasDiagram = `Houston ArcGIS
Dallas ArcGIS
Austin ArcGIS
San Antonio ArcGIS
TxDOT, TNRIS, FEMA
       ↓
[Metadata Discovery]
       ↓
[ETL Fetchers]
       ↓
[City-Specific transform_config]
       ↓
[Shared canonical_schema]
       ↓
[Texas-wide PostGIS]
       ↓
[Vector Tiles]
       ↓
[Cloudflare CDN]
       ↓
SiteIntel UI + AI Engines`;

  return (
    <DocsLayout>
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="font-heading text-4xl md:text-5xl text-white">
            Texas-wide Ingestion Pipeline
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            This page describes how SiteIntel™ scales the Houston ingestion pattern to{" "}
            <strong className="text-white">all major Texas metros and counties</strong> — 
            Houston, Dallas, Fort Worth, Austin, San Antonio, plus CADs and state services.
          </p>
        </div>

        {/* Goals */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">Goals</h2>
          <div className="grid gap-3">
            {[
              "Reuse a single ingestion pattern: Discover → Fetch → transform_config → canonical_schema → PostGIS → Tiles → CDN",
              "Support diverse ArcGIS endpoints and file formats",
              "Maintain identical canonical field semantics across all Texas datasets",
              "Make adding a new city a configuration problem, not an engineering project",
            ].map((goal, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[hsl(var(--data-cyan))]">✓</span>
                <span className="text-sm text-white/80">{goal}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Pipeline Diagram */}
        <DiagramBlock
          title="Texas-wide Pipeline Architecture"
          content={texasDiagram}
        />

        {/* City Profiles */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">City Profiles</h2>
          <p className="text-white/70">
            Each city/county has a standardized profile defining its data sources and transformation rules:
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                city: "Houston",
                sources: "15+ map servers",
                layers: "70+ layers",
                status: "Production",
                statusColor: "hii-high",
              },
              {
                city: "Dallas",
                sources: "DCAD, City GIS",
                layers: "40+ layers",
                status: "In Progress",
                statusColor: "hii-medium",
              },
              {
                city: "Austin",
                sources: "TCAD, City GIS",
                layers: "35+ layers",
                status: "Planned",
                statusColor: "hii-low",
              },
              {
                city: "San Antonio",
                sources: "BCAD, City GIS",
                layers: "30+ layers",
                status: "Planned",
                statusColor: "hii-low",
              },
            ].map((profile) => (
              <div
                key={profile.city}
                className="p-4 rounded-lg border border-white/10 bg-white/5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg text-white">{profile.city}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full bg-[hsl(var(--${profile.statusColor}))]/20 text-[hsl(var(--${profile.statusColor}))]`}>
                    {profile.status}
                  </span>
                </div>
                <div className="text-sm text-white/60 space-y-1">
                  <p><span className="text-white/80">Sources:</span> {profile.sources}</p>
                  <p><span className="text-white/80">Layers:</span> {profile.layers}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <p className="text-sm text-white/70">
              Because <code className="font-mono text-[hsl(var(--data-cyan))]">transform_config</code> is 
              declarative, scaling to a new city is done by:
            </p>
            <ol className="mt-3 space-y-2 text-sm text-white/80 list-decimal list-inside">
              <li>Listing upstream sources</li>
              <li>Writing transform_config blocks</li>
              <li>Running validation on a sample</li>
              <li>Plugging into existing pipeline</li>
            </ol>
          </div>
        </section>

        {/* Replication Strategy */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">Replication Strategy</h2>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-[hsl(var(--data-cyan))]/30 bg-[hsl(var(--data-cyan))]/5">
              <h4 className="font-heading text-sm text-[hsl(var(--data-cyan))] mb-2">
                Logical Schema per Region
              </h4>
              <p className="text-sm text-white/70">
                Each region has a logical schema in PostGIS (e.g., <code className="font-mono text-white/90">houston_*</code>, <code className="font-mono text-white/90">dallas_*</code>, <code className="font-mono text-white/90">austin_*</code>).
              </p>
            </div>

            <div className="p-4 rounded-lg border border-[hsl(var(--data-cyan))]/30 bg-[hsl(var(--data-cyan))]/5">
              <h4 className="font-heading text-sm text-[hsl(var(--data-cyan))] mb-2">
                Texas Master View
              </h4>
              <p className="text-sm text-white/70">
                A unified view aggregates all regions by canonical fields for state-wide analysis, 
                comparison, and AI model training.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-[hsl(var(--data-cyan))]/30 bg-[hsl(var(--data-cyan))]/5">
              <h4 className="font-heading text-sm text-[hsl(var(--data-cyan))] mb-2">
                Historical Versioning
              </h4>
              <p className="text-sm text-white/70">
                All dataset versions are retained for time-series analytics, lender audits, 
                and regulatory compliance.
              </p>
            </div>
          </div>
        </section>

        {/* State-level Sources */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">State-level Data Sources</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-white/90 font-medium">Source</th>
                  <th className="text-left py-2 text-white/90 font-medium">Data Types</th>
                  <th className="text-left py-2 text-white/90 font-medium">Coverage</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                <tr className="border-b border-white/5">
                  <td className="py-2">TxDOT</td>
                  <td className="py-2">Roads, AADT, intersections</td>
                  <td className="py-2">Statewide</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2">TNRIS</td>
                  <td className="py-2">Imagery, elevation, boundaries</td>
                  <td className="py-2">Statewide</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2">FEMA NFHL</td>
                  <td className="py-2">Flood zones, BFE, floodways</td>
                  <td className="py-2">National</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2">USFWS NWI</td>
                  <td className="py-2">Wetlands, water bodies</td>
                  <td className="py-2">National</td>
                </tr>
                <tr>
                  <td className="py-2">EPA ECHO</td>
                  <td className="py-2">Environmental facilities</td>
                  <td className="py-2">National</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Moat Callout */}
        <div className="p-6 rounded-xl border border-[hsl(var(--feasibility-orange))]/30 bg-[hsl(var(--feasibility-orange))]/5">
          <h3 className="font-heading text-lg text-[hsl(var(--feasibility-orange))] mb-2">
            🚀 Scaling Multiplier
          </h3>
          <p className="text-white/80">
            The transform_config DSL makes scaling a <strong>configuration problem, not an engineering project</strong>. 
            Adding Dallas, Austin, or any Texas city requires writing config files—not custom code. 
            This architectural choice enables rapid geographic expansion while maintaining data quality.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
};

export default TexasPipeline;
