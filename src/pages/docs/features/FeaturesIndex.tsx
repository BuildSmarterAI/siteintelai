import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { 
  FileText, 
  Compass, 
  Map, 
  BarChart3, 
  Layers, 
  Brain,
  ArrowRight,
  Sparkles
} from "lucide-react";

const features = [
  {
    title: "Feasibility Reports",
    href: "/docs/features/feasibility-reports",
    icon: FileText,
    description: "Lender-ready $1,495 reports with 7 domain analysis, 20+ data sources, and AI-generated narratives.",
    color: "hsl(var(--feasibility-orange))"
  },
  {
    title: "Design Mode",
    href: "/docs/features/design-mode",
    icon: Compass,
    description: "8-step conceptual design wizard with 3D Cesium visualization and real-time compliance validation.",
    color: "hsl(var(--data-cyan))"
  },
  {
    title: "Parcel Explorer",
    href: "/docs/features/parcel-explorer",
    icon: Map,
    description: "Interactive parcel search across 8 Texas counties with click-to-select and comparison mode.",
    color: "hsl(var(--feasibility-orange))"
  },
  {
    title: "Market Intelligence",
    href: "/docs/features/market-intelligence",
    icon: BarChart3,
    description: "H3 hexagon trade area analysis with Census data and proprietary indices.",
    color: "hsl(var(--data-cyan))"
  },
  {
    title: "Decision Map",
    href: "/docs/features/decision-map",
    icon: Layers,
    description: "Multi-layer GIS visualization with layer presets, legends, and vector tile architecture.",
    color: "hsl(var(--feasibility-orange))"
  },
  {
    title: "AI Scoring Engine",
    href: "/docs/features/scoring-engine",
    icon: Brain,
    description: "Deterministic 0-100 feasibility scoring with weighted domains and kill-factor detection.",
    color: "hsl(var(--data-cyan))"
  },
];

const FeaturesIndex = () => {
  return (
    <DocsLayout>
      <div className="space-y-10">
        {/* Hero */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[hsl(var(--feasibility-orange))]">
            <Sparkles className="h-8 w-8" />
            <span className="text-sm font-medium uppercase tracking-wider">Platform Features</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-white">
            Feature Documentation
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Comprehensive documentation for all SiteIntel™ platform capabilities. 
            From feasibility reports to 3D design visualization—learn how each feature 
            accelerates your development decisions.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.href}
                to={feature.href}
                className="group p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:border-white/20"
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: feature.color }} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-heading text-lg text-white group-hover:text-[hsl(var(--feasibility-orange))] transition-colors flex items-center gap-2">
                      {feature.title}
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-white/10">
          <div className="text-center p-4">
            <div className="text-3xl font-heading text-[hsl(var(--feasibility-orange))]">20+</div>
            <div className="text-sm text-white/60">Data Sources</div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl font-heading text-[hsl(var(--data-cyan))]">8</div>
            <div className="text-sm text-white/60">Texas Counties</div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl font-heading text-[hsl(var(--feasibility-orange))]">7</div>
            <div className="text-sm text-white/60">Report Domains</div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl font-heading text-[hsl(var(--data-cyan))]">3-10</div>
            <div className="text-sm text-white/60">Minutes to Report</div>
          </div>
        </div>

        {/* Related Links */}
        <div className="space-y-4 pt-8 border-t border-white/10">
          <h2 className="font-heading text-xl text-white">Related Documentation</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/docs/domains/zoning"
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              Report Domains →
            </Link>
            <Link
              to="/docs/canonical-schema"
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              Data Schema →
            </Link>
            <Link
              to="/docs/tile-architecture"
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              Tile Architecture →
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
};

export default FeaturesIndex;
