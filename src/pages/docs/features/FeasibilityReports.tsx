import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DiagramBlock } from "@/components/docs/DiagramBlock";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { FileText, Clock, Database, Brain, Download, Shield } from "lucide-react";

const FeasibilityReports = () => {
  return (
    <DocsLayout>
      <div className="space-y-10">
        {/* Hero */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[hsl(var(--feasibility-orange))]">
            <FileText className="h-8 w-8" />
            <span className="text-sm font-medium uppercase tracking-wider">Platform Feature</span>
          </div>
          <h1 id="overview" className="font-heading text-4xl md:text-5xl text-white">
            Feasibility Reports
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Lender-ready Site Feasibility Intelligence™ reports delivered in 3-10 minutes. 
            Comprehensive 7-domain analysis powered by 20+ authoritative data sources.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-center">
            <div className="text-2xl font-heading text-[hsl(var(--feasibility-orange))]">$1,495</div>
            <div className="text-sm text-white/60">Per Report</div>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-center">
            <div className="text-2xl font-heading text-[hsl(var(--data-cyan))]">3-10 min</div>
            <div className="text-sm text-white/60">Delivery Time</div>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-center">
            <div className="text-2xl font-heading text-[hsl(var(--feasibility-orange))]">20+</div>
            <div className="text-sm text-white/60">Data Sources</div>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-center">
            <div className="text-2xl font-heading text-[hsl(var(--data-cyan))]">7</div>
            <div className="text-sm text-white/60">Domains</div>
          </div>
        </div>

        {/* Report Structure */}
        <section className="space-y-4">
          <h2 id="structure" className="font-heading text-2xl text-white">Report Structure</h2>
          <p className="text-white/70">
            Each report contains comprehensive analysis across seven core feasibility domains:
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { domain: "Zoning", weight: "30%", href: "/docs/domains/zoning", description: "Code verification, setbacks, FAR, overlays" },
              { domain: "Flood Risk", weight: "20%", href: "/docs/domains/flood", description: "FEMA zones, BFE, NFIP claims history" },
              { domain: "Utilities", weight: "20%", href: "/docs/domains/utilities", description: "Water, sewer, storm infrastructure access" },
              { domain: "Environmental", weight: "10%", href: "/docs/domains/environmental", description: "Wetlands, EPA facilities, soil data" },
              { domain: "Traffic", weight: "10%", href: "/docs/domains/traffic", description: "AADT counts, drive times, road network" },
              { domain: "Market", weight: "10%", href: "/docs/domains/market", description: "Demographics, proprietary indices" },
              { domain: "Topography", weight: "—", href: "/docs/domains/topography", description: "Elevation profiles, slope analysis" },
            ].map((item) => (
              <Link
                key={item.domain}
                to={item.href}
                className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading text-white">{item.domain}</span>
                  <span className="text-sm text-[hsl(var(--feasibility-orange))]">{item.weight}</span>
                </div>
                <p className="text-sm text-white/60">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Data Pipeline */}
        <section className="space-y-4">
          <h2 id="pipeline" className="font-heading text-2xl text-white">Data Pipeline</h2>
          <DiagramBlock
            title="Report Generation Pipeline"
            content={`┌─────────────────────────────────────────────────────────────────────┐
│                      REPORT ORCHESTRATION                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐     │
│   │ Address  │───▶│  Geocoding   │───▶│  Parcel Resolution   │     │
│   │  Input   │    │ (Google API) │    │  (CAD + PostGIS)     │     │
│   └──────────┘    └──────────────┘    └──────────────────────┘     │
│                                                 │                   │
│                         ┌───────────────────────┼───────────────┐   │
│                         ▼                       ▼               ▼   │
│                   ┌──────────┐           ┌──────────┐    ┌────────┐│
│                   │   FEMA   │           │   EPA    │    │ TxDOT  ││
│                   │ OpenFEMA │           │  ECHO    │    │  AADT  ││
│                   └──────────┘           └──────────┘    └────────┘│
│                         │                       │               │   │
│                         └───────────┬───────────┴───────────────┘   │
│                                     ▼                               │
│                         ┌──────────────────────┐                    │
│                         │   AI Narrative Gen   │                    │
│                         │    (GPT-4o-mini)     │                    │
│                         └──────────────────────┘                    │
│                                     │                               │
│                                     ▼                               │
│                         ┌──────────────────────┐                    │
│                         │  PDF Report Export   │                    │
│                         │   (Lender-Ready)     │                    │
│                         └──────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────┘`}
          />
        </section>

        {/* Data Sources */}
        <section className="space-y-4">
          <h2 id="data-sources" className="font-heading text-2xl text-white">Authoritative Data Sources</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Source</th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Domain</th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Update Frequency</th>
                </tr>
              </thead>
              <tbody className="text-white/60">
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">FEMA OpenFEMA</td>
                  <td className="py-3 px-4">Flood Risk</td>
                  <td className="py-3 px-4">Monthly</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">EPA ECHO</td>
                  <td className="py-3 px-4">Environmental</td>
                  <td className="py-3 px-4">Weekly</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">TxDOT Open Data</td>
                  <td className="py-3 px-4">Traffic</td>
                  <td className="py-3 px-4">Annual</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">USFWS NWI</td>
                  <td className="py-3 px-4">Wetlands</td>
                  <td className="py-3 px-4">Biannual</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">Census ACS 5-Year</td>
                  <td className="py-3 px-4">Demographics</td>
                  <td className="py-3 px-4">Annual</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">County CAD (HCAD, FBCAD, etc.)</td>
                  <td className="py-3 px-4">Parcel/Property</td>
                  <td className="py-3 px-4">Bi-weekly</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Output Format */}
        <section className="space-y-4">
          <h2 id="output" className="font-heading text-2xl text-white">Report Output</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <Download className="h-6 w-6 text-[hsl(var(--feasibility-orange))] mb-3" />
              <h3 className="font-heading text-white mb-2">PDF Export</h3>
              <p className="text-sm text-white/60">
                Lender-ready PDF with executive summary, domain breakdowns, and source citations.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <Database className="h-6 w-6 text-[hsl(var(--data-cyan))] mb-3" />
              <h3 className="font-heading text-white mb-2">Data Provenance</h3>
              <p className="text-sm text-white/60">
                Every data point includes source, timestamp, and confidence scoring.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <Shield className="h-6 w-6 text-[hsl(var(--feasibility-orange))] mb-3" />
              <h3 className="font-heading text-white mb-2">Signed URLs</h3>
              <p className="text-sm text-white/60">
                72-hour signed URL lifecycle for secure report sharing with stakeholders.
              </p>
            </div>
          </div>
        </section>

        {/* API Example */}
        <section className="space-y-4">
          <h2 id="api" className="font-heading text-2xl text-white">API Integration</h2>
          <CodeBlock
            title="Report Generation Request"
            language="json"
            code={`{
  "address": "1000 Main St, Houston, TX 77002",
  "project_type": ["multifamily", "mixed-use"],
  "quality_level": "premium",
  "include_pdf": true,
  "webhook_url": "https://your-app.com/webhooks/report-complete"
}`}
          />
        </section>

        {/* Related */}
        <div className="flex flex-wrap gap-3 pt-8 border-t border-white/10">
          <Link
            to="/docs/features/scoring-engine"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            AI Scoring Engine →
          </Link>
          <Link
            to="/docs/domains/zoning"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Zoning Domain →
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
};

export default FeasibilityReports;
