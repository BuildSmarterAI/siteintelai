import { DocsLayout } from "@/components/docs/DocsLayout";
import { CodeBlock } from "@/components/docs/CodeBlock";

const CanonicalSchema = () => {
  return (
    <DocsLayout>
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="font-heading text-4xl md:text-5xl text-white">
            canonical_schema
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            The <strong className="text-white">canonical_schema</strong> is SiteIntel's master data 
            standardization model. It unifies heterogeneous GIS datasets (city, county, state, federal) 
            into a single consistent format for AI processing and lender-grade reporting.
          </p>
        </div>

        {/* Design Principles */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">Design Principles</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { title: "Stability", desc: "Field names never change; backward compatible" },
              { title: "Extensibility", desc: "New cities/states compatible without schema changes" },
              { title: "AI Compatibility", desc: "Predictable fields for inference engines" },
              { title: "GIS Interoperability", desc: "Supports Polygons, Lines, Points" },
              { title: "Versioning", desc: "source_version + canonical_version tracking" },
            ].map((principle) => (
              <div key={principle.title} className="p-4 rounded-lg border border-white/10 bg-white/5">
                <h4 className="font-heading text-sm text-[hsl(var(--data-cyan))]">{principle.title}</h4>
                <p className="text-sm text-white/70 mt-1">{principle.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 11 Domains */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">11 Schema Domains</h2>
          
          <div className="space-y-3">
            {[
              { domain: "_meta", desc: "Source tracking, timestamps, dataset versions", color: "slate-gray" },
              { domain: "geometry", desc: "PostGIS geometry, CRS, bounding box", color: "data-cyan" },
              { domain: "parcel", desc: "Parcel ID, APN, ownership, legal description", color: "feasibility-orange" },
              { domain: "zoning", desc: "Zone code, permitted uses, setbacks, FAR, height", color: "feasibility-orange" },
              { domain: "flood", desc: "FEMA zone, BFE, floodway, SFHA", color: "data-cyan" },
              { domain: "wetlands", desc: "Cowardin classification, NWI code, area %", color: "data-cyan" },
              { domain: "utilities", desc: "Water/sewer distance, capacity, CCN", color: "feasibility-orange" },
              { domain: "topography", desc: "Elevation, slope, aspect, cut/fill", color: "data-cyan" },
              { domain: "transportation", desc: "AADT, road class, driveway spacing", color: "feasibility-orange" },
              { domain: "environmental", desc: "EPA facilities, contamination, buffers", color: "data-cyan" },
              { domain: "jurisdiction", desc: "County, city, ETJ, MUD, special districts", color: "feasibility-orange" },
            ].map((item) => (
              <div key={item.domain} className="flex items-start gap-4 p-4 rounded-lg border border-white/10 bg-white/5">
                <code className={`font-mono text-[hsl(var(--${item.color}))] whitespace-nowrap`}>
                  {item.domain}
                </code>
                <span className="text-sm text-white/70">{item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Parcel Domain Example */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">Example: Parcel Domain</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-white/90 font-medium">Field</th>
                  <th className="text-left py-2 text-white/90 font-medium">Type</th>
                  <th className="text-left py-2 text-white/90 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">parcel_id</td>
                  <td className="py-2">string</td>
                  <td className="py-2">Unique parcel identifier</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">apn</td>
                  <td className="py-2">string</td>
                  <td className="py-2">Assessor's Parcel Number</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">owner_name</td>
                  <td className="py-2">string</td>
                  <td className="py-2">Property owner name</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">situs_address</td>
                  <td className="py-2">string</td>
                  <td className="py-2">Physical address</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">area_sqft</td>
                  <td className="py-2">number</td>
                  <td className="py-2">Parcel area in square feet</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">area_acres</td>
                  <td className="py-2">number</td>
                  <td className="py-2">Parcel area in acres</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">legal_description</td>
                  <td className="py-2">string</td>
                  <td className="py-2">Legal description text</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">market_value</td>
                  <td className="py-2">number</td>
                  <td className="py-2">Appraised market value</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* _meta Domain */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">The _meta Domain</h2>
          <p className="text-white/70">
            Every canonical record includes a <code className="font-mono text-[hsl(var(--data-cyan))]">_meta</code> object 
            for provenance tracking:
          </p>
          
          <CodeBlock
            language="json"
            code={`"_meta": {
  "source_dataset": "HCAD_Parcels",
  "source_layer_id": "hcad_2025_01_15",
  "canonical_version": "1.0.0",
  "fetched_at": "2025-01-15T03:00:00Z",
  "transform_config_version": "1.2.0",
  "record_hash": "sha256:abc123..."
}`}
          />
        </section>

        {/* Versioning Strategy */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">Versioning Strategy</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border border-[hsl(var(--data-cyan))]/30 bg-[hsl(var(--data-cyan))]/5">
              <h4 className="font-heading text-sm text-[hsl(var(--data-cyan))] mb-2">canonical_version</h4>
              <p className="text-sm text-white/70">
                Increments when schema fields change. All downstream systems must handle version compatibility.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-[hsl(var(--feasibility-orange))]/30 bg-[hsl(var(--feasibility-orange))]/5">
              <h4 className="font-heading text-sm text-[hsl(var(--feasibility-orange))] mb-2">source_version</h4>
              <p className="text-sm text-white/70">
                Tracks the upstream dataset version (e.g., HCAD_2025_01_15). Enables reproducible data lineage.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <p className="text-sm text-white/70">
              All datasets store both versions. The transform_config_version indicates which 
              transformation rules were applied. This three-way versioning enables complete 
              data lineage for lender audits.
            </p>
          </div>
        </section>

        {/* Transformation Example */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">Transformation Example</h2>
          <p className="text-white/70 mb-4">
            Raw Houston data transformed to canonical format:
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-heading text-sm text-white/60 mb-2">Raw (HCAD)</h4>
              <CodeBlock
                language="json"
                code={`{
  "ACCOUNT": "1234567890",
  "GEO_ID": "001-234-567",
  "OWNER": "SMITH JOHN",
  "SITUS_ADDR": "123 MAIN ST",
  "LAND_SQFT": 43560
}`}
              />
            </div>
            <div>
              <h4 className="font-heading text-sm text-white/60 mb-2">Canonical</h4>
              <CodeBlock
                language="json"
                code={`{
  "parcel_id": "1234567890",
  "apn": "001-234-567",
  "owner_name": "SMITH JOHN",
  "situs_address": "123 MAIN ST",
  "area_sqft": 43560,
  "area_acres": 1.0
}`}
              />
            </div>
          </div>
        </section>

        {/* Moat Callout */}
        <div className="p-6 rounded-xl border border-[hsl(var(--feasibility-orange))]/30 bg-[hsl(var(--feasibility-orange))]/5">
          <h3 className="font-heading text-lg text-[hsl(var(--feasibility-orange))] mb-2">
            🏰 Schema as Moat
          </h3>
          <p className="text-white/80">
            The canonical_schema is the foundation of SiteIntel's data moat. Once normalized, 
            datasets become interoperable, comparable, AI-ready, and version-controlled—regardless 
            of source fragmentation. Every AI engine and lender report depends on this standardization.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
};

export default CanonicalSchema;
