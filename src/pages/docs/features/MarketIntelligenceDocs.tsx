import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DiagramBlock } from "@/components/docs/DiagramBlock";
import { BarChart3, Hexagon, Users, TrendingUp, Building, DollarSign } from "lucide-react";

const indices = [
  { name: "Retail Spending Index", formula: "Median Income + Owner-Occupancy + (100 - Poverty Rate)", range: "0-300" },
  { name: "Growth Potential Index", formula: "Population CAGR + Income CAGR + Housing Appreciation", range: "0-100" },
  { name: "Daytime Population Estimate", formula: "Residential Total × (1 - WFH Rate) + Commute Inflow", range: "Raw count" },
  { name: "Workforce Availability Score", formula: "Labor Force × (1 - Unemployment) × Education Index", range: "0-100" },
  { name: "Affluence Concentration", formula: "HH Income > 150K / Total HH × 100", range: "0-100%" },
  { name: "Labor Pool Depth", formula: "Working Age Pop × Participation Rate", range: "Raw count" },
];

const MarketIntelligenceDocs = () => {
  return (
    <DocsLayout>
      <div className="space-y-10">
        {/* Hero */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[hsl(var(--data-cyan))]">
            <BarChart3 className="h-8 w-8" />
            <span className="text-sm font-medium uppercase tracking-wider">Platform Feature</span>
          </div>
          <h1 id="overview" className="font-heading text-4xl md:text-5xl text-white">
            Market Intelligence
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            H3 hexagon-based trade area analysis with Census data and proprietary indices. 
            Visualize demographics, spending power, and growth potential at any location.
          </p>
        </div>

        {/* Access */}
        <div className="p-4 rounded-xl border border-[hsl(var(--data-cyan))]/30 bg-[hsl(var(--data-cyan))]/10">
          <p className="text-white/80">
            <strong className="text-white">Access:</strong> Market Intelligence is available at{" "}
            <code className="px-2 py-1 rounded bg-white/10 text-[hsl(var(--data-cyan))]">/market-intelligence</code>{" "}
            as a standalone tool.
          </p>
        </div>

        {/* H3 Hexagons */}
        <section className="space-y-4">
          <h2 id="h3" className="font-heading text-2xl text-white">H3 Hexagon System</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <Hexagon className="h-6 w-6 text-[hsl(var(--feasibility-orange))] mb-3" />
              <h3 className="font-heading text-white mb-2">Why Hexagons?</h3>
              <p className="text-sm text-white/60">
                Uber's H3 system provides uniform area coverage without edge distortion. 
                Each hexagon represents consistent geographic units for accurate analysis.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <Building className="h-6 w-6 text-[hsl(var(--data-cyan))] mb-3" />
              <h3 className="font-heading text-white mb-2">Resolution Levels</h3>
              <p className="text-sm text-white/60">
                Resolution 7 (~5.16 km²) for regional views, Resolution 8 (~0.74 km²) for 
                neighborhood analysis, Resolution 9 (~0.11 km²) for site-specific insights.
              </p>
            </div>
          </div>
        </section>

        {/* Trade Area Presets */}
        <section className="space-y-4">
          <h2 id="presets" className="font-heading text-2xl text-white">Trade Area Presets</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-center">
              <div className="text-3xl font-heading text-[hsl(var(--feasibility-orange))] mb-2">1 mi</div>
              <div className="text-sm text-white/60">Walk-in radius</div>
              <div className="text-xs text-white/40 mt-1">~3.14 sq mi</div>
            </div>
            <div className="p-4 rounded-lg border border-[hsl(var(--data-cyan))]/30 bg-[hsl(var(--data-cyan))]/10 text-center">
              <div className="text-3xl font-heading text-[hsl(var(--data-cyan))] mb-2">3 mi</div>
              <div className="text-sm text-white/60">Primary trade area</div>
              <div className="text-xs text-white/40 mt-1">~28.27 sq mi</div>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-center">
              <div className="text-3xl font-heading text-[hsl(var(--feasibility-orange))] mb-2">5 mi</div>
              <div className="text-sm text-white/60">Extended trade area</div>
              <div className="text-xs text-white/40 mt-1">~78.54 sq mi</div>
            </div>
          </div>
        </section>

        {/* Proprietary Indices */}
        <section className="space-y-4">
          <h2 id="indices" className="font-heading text-2xl text-white">Proprietary Indices</h2>
          <p className="text-white/70">
            These six indices are computed from Census ACS data and are mandatory fields for all reports:
          </p>
          <div className="space-y-3">
            {indices.map((index) => (
              <div
                key={index.name}
                className="p-4 rounded-lg border border-white/10 bg-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading text-white">{index.name}</h3>
                  <span className="text-xs text-[hsl(var(--data-cyan))] px-2 py-1 rounded bg-[hsl(var(--data-cyan))]/10">
                    {index.range}
                  </span>
                </div>
                <p className="text-sm text-white/60 font-mono">{index.formula}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Data Architecture */}
        <section className="space-y-4">
          <h2 id="architecture" className="font-heading text-2xl text-white">Data Architecture</h2>
          <DiagramBlock
            title="Market Intelligence Pipeline"
            content={`┌─────────────────────────────────────────────────────────────────────┐
│                    MARKET INTELLIGENCE ENGINE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │              Census ACS 5-Year (BigQuery)                     │ │
│   │   B19013: Median Income | B25001: Housing Units               │ │
│   │   B23025: Employment   | B15003: Education                    │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │           Proprietary Index Computation                       │ │
│   │   - Retail Spending Index                                     │ │
│   │   - Growth Potential Index                                    │ │
│   │   - Daytime Population Estimate                               │ │
│   │   - Workforce Availability Score                              │ │
│   │   - Affluence Concentration                                   │ │
│   │   - Labor Pool Depth                                          │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │                H3 Hexagon Aggregation                         │ │
│   │   Resolution 7 → 8 → 9 (hierarchical rollup)                  │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │              MapLibre Visualization Layer                     │ │
│   │   Choropleth + Hover tooltips + Legend                        │ │
│   └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘`}
          />
        </section>

        {/* Demographics */}
        <section className="space-y-4">
          <h2 id="demographics" className="font-heading text-2xl text-white">Demographic Fields</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <Users className="h-6 w-6 text-[hsl(var(--feasibility-orange))] mb-3" />
              <h3 className="font-heading text-white mb-2">Population</h3>
              <ul className="text-sm text-white/60 space-y-1">
                <li>• Total population</li>
                <li>• Population density</li>
                <li>• Age distribution</li>
                <li>• 5-year projections</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <DollarSign className="h-6 w-6 text-[hsl(var(--data-cyan))] mb-3" />
              <h3 className="font-heading text-white mb-2">Income</h3>
              <ul className="text-sm text-white/60 space-y-1">
                <li>• Median household income</li>
                <li>• Per capita income</li>
                <li>• Income distribution</li>
                <li>• Poverty rate</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <TrendingUp className="h-6 w-6 text-[hsl(var(--feasibility-orange))] mb-3" />
              <h3 className="font-heading text-white mb-2">Housing</h3>
              <ul className="text-sm text-white/60 space-y-1">
                <li>• Owner vs renter</li>
                <li>• Median home value</li>
                <li>• Vacancy rates</li>
                <li>• Median rent</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Related */}
        <div className="flex flex-wrap gap-3 pt-8 border-t border-white/10">
          <Link
            to="/docs/domains/market"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Market Domain →
          </Link>
          <Link
            to="/docs/features/decision-map"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Decision Map →
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
};

export default MarketIntelligenceDocs;
