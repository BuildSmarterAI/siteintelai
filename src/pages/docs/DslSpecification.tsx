import { DocsLayout } from "@/components/docs/DocsLayout";
import { CodeBlock } from "@/components/docs/CodeBlock";

const DslSpecification = () => {
  return (
    <DocsLayout>
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="font-heading text-4xl md:text-5xl text-white">
            transform_config DSL Specification
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            This page defines the <strong className="text-white">syntax, grammar, and rules</strong> for 
            SiteIntel's <code className="font-mono text-[hsl(var(--data-cyan))]">transform_config</code> DSL. 
            This DSL describes how raw upstream datasets are transformed into the canonical_schema.
          </p>
        </div>

        {/* Top-Level Grammar */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">Top-Level Grammar</h2>
          <p className="text-white/70">
            Each <code className="font-mono text-[hsl(var(--data-cyan))]">transform_config</code> document 
            is a JSON object with four primary sections:
          </p>
          <CodeBlock
            language="json"
            code={`{
  "transform_config": {
    "metadata": { ... },
    "map": { ... },
    "geom": { ... },
    "ops": { ... }
  }
}`}
          />
          <p className="text-sm text-white/60">
            All four sections are optional, but <strong className="text-white">metadata + map</strong> are 
            required for production transforms.
          </p>
        </section>

        {/* 1. metadata Block */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">1. metadata Block</h2>
          <p className="text-white/70">Describes the source dataset and the canonical target.</p>
          
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
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">source_dataset</td>
                  <td className="py-2">string, required</td>
                  <td className="py-2">Internal name of the upstream dataset</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">source_url</td>
                  <td className="py-2">string, optional</td>
                  <td className="py-2">Reference URL (e.g., ArcGIS endpoint)</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">canonical_target</td>
                  <td className="py-2">string, required</td>
                  <td className="py-2">Which canonical sub-schema to map into</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">version</td>
                  <td className="py-2">string, required</td>
                  <td className="py-2">Transform config version</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">notes</td>
                  <td className="py-2">string, optional</td>
                  <td className="py-2">Human-readable notes</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock
            title="Example"
            language="json"
            code={`"metadata": {
  "source_dataset": "COH_Zoning",
  "source_url": "https://gis.houstontx.gov/arcgis/rest/services/...",
  "canonical_target": "zoning",
  "version": "1.0.0",
  "notes": "Houston zoning polygons from Planning Dept."
}`}
          />
        </section>

        {/* 2. map Block */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">2. map Block (Field Mapping)</h2>
          <p className="text-white/70">Defines how raw fields map to canonical fields.</p>
          
          <CodeBlock
            language="json"
            code={`"map": {
  "RAW_FIELD_NAME": "canonical_field_name",
  "ANOTHER_RAW": "another_canonical"
}`}
          />

          <div className="p-4 rounded-lg border border-[hsl(var(--feasibility-orange))]/30 bg-[hsl(var(--feasibility-orange))]/5">
            <h4 className="font-heading text-sm text-[hsl(var(--feasibility-orange))] mb-2">Rules</h4>
            <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
              <li>Keys = raw field names exactly as upstream exposes them</li>
              <li>Values = canonical field names defined in canonical_schema</li>
              <li>Unknown raw fields are ignored unless referenced in ops</li>
              <li>A canonical field can be populated from a computed field in ops</li>
            </ul>
          </div>
        </section>

        {/* 3. geom Block */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">3. geom Block (Geometry Rules)</h2>
          <p className="text-white/70">Defines geometry normalization and projection behavior.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-white/90 font-medium">Field</th>
                  <th className="text-left py-2 text-white/90 font-medium">Default</th>
                  <th className="text-left py-2 text-white/90 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">repair</td>
                  <td className="py-2">true</td>
                  <td className="py-2">Run topology repair (fix self-intersections)</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">project</td>
                  <td className="py-2">"EPSG:3857"</td>
                  <td className="py-2">Target CRS</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">simplify_tolerance</td>
                  <td className="py-2">-</td>
                  <td className="py-2">Simplify geometry for performance</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">calculate_area</td>
                  <td className="py-2">false</td>
                  <td className="py-2">Auto-calc area_sqft / area_acres</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock
            title="Example"
            language="json"
            code={`"geom": {
  "repair": true,
  "project": "EPSG:3857",
  "simplify_tolerance": 0.3,
  "calculate_area": true
}`}
          />
        </section>

        {/* 4. ops Block */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">4. ops Block (Transform Operations)</h2>
          <p className="text-white/70">Defines attribute-level operations and error handling.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-white/90 font-medium">Key</th>
                  <th className="text-left py-2 text-white/90 font-medium">Type</th>
                  <th className="text-left py-2 text-white/90 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">coerce_numbers</td>
                  <td className="py-2">array&lt;string&gt;</td>
                  <td className="py-2">Fields to cast to numeric</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">coerce_booleans</td>
                  <td className="py-2">array&lt;string&gt;</td>
                  <td className="py-2">Fields to cast to boolean</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">uppercase</td>
                  <td className="py-2">array&lt;string&gt;</td>
                  <td className="py-2">Fields to force upper-case</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">default_values</td>
                  <td className="py-2">object</td>
                  <td className="py-2">canonical_field → default value</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">drop_null_rows</td>
                  <td className="py-2">bool</td>
                  <td className="py-2">Drop records missing key fields</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-[hsl(var(--data-cyan))]">computed_fields</td>
                  <td className="py-2">object</td>
                  <td className="py-2">canonical_field → expression</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock
            title="Example"
            language="json"
            code={`"ops": {
  "coerce_numbers": ["min_lot_size_sqft", "max_height_ft"],
  "uppercase": ["zoning_code"],
  "default_values": {
    "overlay_district": "NONE"
  },
  "drop_null_rows": true
}`}
          />
        </section>

        {/* Expression Grammar */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">Expression Grammar for computed_fields</h2>
          <p className="text-white/70">Expressions support a small expression language:</p>
          
          <ul className="text-white/70 space-y-1 list-disc list-inside">
            <li><strong className="text-white">Literals:</strong> numbers, strings</li>
            <li><strong className="text-white">Operators:</strong> +, -, *, /</li>
            <li><strong className="text-white">Conditionals:</strong> if ... then ... else ...</li>
            <li><strong className="text-white">Field references:</strong> $RAW_FIELD, $canonical_field</li>
          </ul>

          <CodeBlock
            title="Example"
            language="json"
            code={`"computed_fields": {
  "height_to_far_ratio": "$max_height_ft / ($far == 0 ? 1 : $far)"
}`}
          />
        </section>

        {/* Error Handling */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">Error Handling Semantics</h2>
          
          <div className="p-4 rounded-lg border border-white/10 bg-white/5 space-y-2">
            <ul className="text-sm text-white/70 space-y-2">
              <li>• If a mapped raw field is missing: use default_values if available, else null</li>
              <li>• If geometry repair fails: row flagged, optionally dropped by pipeline</li>
              <li>• If numeric coercion fails: set to null and log a warning</li>
              <li>• If CRS projection fails: row is quarantined for manual review</li>
            </ul>
            <p className="text-sm text-white/60 pt-2 border-t border-white/10">
              The DSL is <strong className="text-white">declarative</strong>; the engine enforces 
              semantics consistently across all datasets.
            </p>
          </div>
        </section>

        {/* Complete Example */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">Complete Example: Houston Parcels Transform</h2>
          
          <CodeBlock
            language="json"
            code={`{
  "transform_config": {
    "metadata": {
      "source_dataset": "HCAD_Parcels",
      "canonical_target": "parcel",
      "version": "1.0.0"
    },
    "map": {
      "ACCOUNT": "parcel_id",
      "GEO_ID": "apn",
      "CITY": "city",
      "COUNTY": "county",
      "STATE": "state"
    },
    "geom": {
      "repair": true,
      "project": "EPSG:3857",
      "calculate_area": true
    },
    "ops": {
      "uppercase": ["city", "county", "state"],
      "drop_null_rows": true
    }
  }
}`}
          />
        </section>

        {/* Best Practices */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl text-white">Best Practices</h2>
          
          <div className="grid gap-3">
            {[
              "Keep each transform_config focused on a single dataset",
              "Always fill metadata.source_dataset and canonical_target",
              "Prefer explicit coerce_numbers instead of silent type inference",
              "Always run repair for polygon datasets from municipal sources",
              "Use simplify_tolerance conservatively to avoid geometry distortion",
              "Version configs and never mutate old versions used in production",
            ].map((practice, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[hsl(var(--feasibility-orange))]">✓</span>
                <span className="text-sm text-white/80">{practice}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DocsLayout>
  );
};

export default DslSpecification;
