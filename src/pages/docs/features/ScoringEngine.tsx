import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DiagramBlock } from "@/components/docs/DiagramBlock";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Brain, AlertTriangle, CheckCircle, XCircle, Scale, Target } from "lucide-react";

const domainWeights = [
  { domain: "Zoning", weight: 30, color: "hsl(var(--feasibility-orange))", description: "Code verification, setbacks, FAR, overlay districts" },
  { domain: "Flood Risk", weight: 20, color: "hsl(var(--data-cyan))", description: "FEMA zones, BFE, historical claims, flood frequency" },
  { domain: "Utilities", weight: 20, color: "hsl(var(--feasibility-orange))", description: "Water, sewer, storm access, provider confidence" },
  { domain: "Environmental", weight: 10, color: "hsl(var(--data-cyan))", description: "Wetlands, EPA facilities, soil constraints" },
  { domain: "Traffic", weight: 10, color: "hsl(var(--feasibility-orange))", description: "AADT counts, road classification, access points" },
  { domain: "Market", weight: 10, color: "hsl(var(--data-cyan))", description: "Demographics, growth potential, spending indices" },
];

const killFactors = [
  { factor: "FEMA Zone AE/VE", description: "High-risk flood zone without elevation certificate" },
  { factor: "Active Wetlands", description: "NWI wetlands covering >25% of parcel" },
  { factor: "No Utility Access", description: "No water/sewer within 500ft" },
  { factor: "Incompatible Zoning", description: "Zoning prohibits intended use type" },
  { factor: "EPA Superfund", description: "Site listed on NPL or active brownfield" },
  { factor: "Deed Restrictions", description: "Restrictive covenants prohibiting development" },
];

const ScoringEngine = () => {
  return (
    <DocsLayout>
      <div className="space-y-10">
        {/* Hero */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[hsl(var(--data-cyan))]">
            <Brain className="h-8 w-8" />
            <span className="text-sm font-medium uppercase tracking-wider">Platform Feature</span>
          </div>
          <h1 id="overview" className="font-heading text-4xl md:text-5xl text-white">
            AI Scoring Engine
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Deterministic 0-100 feasibility scoring with weighted domain analysis 
            and kill-factor detection. Lender-grade confidence for development decisions.
          </p>
        </div>

        {/* Score Range */}
        <section className="space-y-4">
          <h2 id="ranges" className="font-heading text-2xl text-white">Score Interpretation</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/10">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="font-heading text-white">70-100: Go</span>
              </div>
              <p className="text-sm text-white/60">
                Strong feasibility. Proceed with confidence. Minor issues may exist but are manageable.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <span className="font-heading text-white">40-69: Caution</span>
              </div>
              <p className="text-sm text-white/60">
                Moderate concerns. Additional due diligence recommended before proceeding.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-400" />
                <span className="font-heading text-white">0-39: No-Go</span>
              </div>
              <p className="text-sm text-white/60">
                Significant constraints. Kill factors likely present. High risk for development.
              </p>
            </div>
          </div>
        </section>

        {/* Domain Weights */}
        <section className="space-y-4">
          <h2 id="weights" className="font-heading text-2xl text-white">Domain Weights</h2>
          <div className="space-y-3">
            {domainWeights.map((item) => (
              <div
                key={item.domain}
                className="p-4 rounded-lg border border-white/10 bg-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-2 rounded-full"
                      style={{ 
                        background: `linear-gradient(to right, ${item.color} ${item.weight}%, transparent ${item.weight}%)`,
                        border: `1px solid ${item.color}40`
                      }}
                    />
                    <span className="font-heading text-white">{item.domain}</span>
                  </div>
                  <span className="text-lg font-heading" style={{ color: item.color }}>
                    {item.weight}%
                  </span>
                </div>
                <p className="text-sm text-white/60">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Score Formula */}
        <section className="space-y-4">
          <h2 id="formula" className="font-heading text-2xl text-white">Score Calculation</h2>
          <DiagramBlock
            title="Feasibility Score Formula"
            content={`┌─────────────────────────────────────────────────────────────────────┐
│                    FEASIBILITY SCORE CALCULATION                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Base Score = Σ (Domain Score × Domain Weight)                     │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  Zoning Score (0-100) × 0.30  = ____                        │  │
│   │  Flood Score (0-100) × 0.20   = ____                        │  │
│   │  Utility Score (0-100) × 0.20 = ____                        │  │
│   │  Environ Score (0-100) × 0.10 = ____                        │  │
│   │  Traffic Score (0-100) × 0.10 = ____                        │  │
│   │  Market Score (0-100) × 0.10  = ____                        │  │
│   │  ─────────────────────────────────────                      │  │
│   │  Base Score                   = ____                        │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   Kill Factor Penalty:                                              │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  IF kill_factors.length > 0:                                │  │
│   │     Final Score = min(Base Score, 35)                       │  │
│   │     // Caps score at "No-Go" threshold                      │  │
│   │  ELSE:                                                      │  │
│   │     Final Score = Base Score                                │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   Confidence Score = (Data Coverage % × Data Freshness Index)       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘`}
          />
        </section>

        {/* Kill Factors */}
        <section className="space-y-4">
          <h2 id="kill-factors" className="font-heading text-2xl text-white">Kill Factors</h2>
          <p className="text-white/70">
            Kill factors are critical constraints that automatically cap the feasibility score at 35 (No-Go threshold):
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {killFactors.map((item) => (
              <div
                key={item.factor}
                className="p-4 rounded-lg border border-red-500/20 bg-red-500/5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <span className="font-heading text-white">{item.factor}</span>
                </div>
                <p className="text-sm text-white/60">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Confidence Scoring */}
        <section className="space-y-4">
          <h2 id="confidence" className="font-heading text-2xl text-white">Confidence Scoring</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <Target className="h-6 w-6 text-[hsl(var(--feasibility-orange))] mb-3" />
              <h3 className="font-heading text-white mb-2">Data Coverage</h3>
              <p className="text-sm text-white/60">
                Percentage of expected data fields that have values. 
                Higher coverage = higher confidence.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <Scale className="h-6 w-6 text-[hsl(var(--data-cyan))] mb-3" />
              <h3 className="font-heading text-white mb-2">Data Freshness</h3>
              <p className="text-sm text-white/60">
                Weighted by data source update frequency. 
                Recent data sources contribute more to confidence.
              </p>
            </div>
          </div>
        </section>

        {/* API Example */}
        <section className="space-y-4">
          <h2 id="api" className="font-heading text-2xl text-white">API Response</h2>
          <CodeBlock
            title="Score Response Schema"
            language="json"
            code={`{
  "feasibility_score": 72,
  "confidence_score": 0.89,
  "domain_scores": {
    "zoning": { "score": 85, "weight": 0.30, "contribution": 25.5 },
    "flood": { "score": 60, "weight": 0.20, "contribution": 12.0 },
    "utilities": { "score": 90, "weight": 0.20, "contribution": 18.0 },
    "environmental": { "score": 75, "weight": 0.10, "contribution": 7.5 },
    "traffic": { "score": 80, "weight": 0.10, "contribution": 8.0 },
    "market": { "score": 70, "weight": 0.10, "contribution": 7.0 }
  },
  "kill_factors": [],
  "data_coverage": {
    "total_fields": 156,
    "populated_fields": 139,
    "coverage_percent": 89.1
  }
}`}
          />
        </section>

        {/* Related */}
        <div className="flex flex-wrap gap-3 pt-8 border-t border-white/10">
          <Link
            to="/docs/features/feasibility-reports"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Feasibility Reports →
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

export default ScoringEngine;
