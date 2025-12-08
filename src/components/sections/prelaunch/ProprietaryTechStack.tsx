import { motion } from "framer-motion";
import { Layers, Network, Brain, BarChart3, Mountain, Zap, Lock } from "lucide-react";

const engines = [
  {
    icon: Layers,
    name: "Geospatial Inference Stack™",
    subtitle: "Automated CRE Feasibility Engine",
    description: "A proprietary, multi-layer inference system that unifies zoning laws, FEMA flood maps, wetlands layers, sewer networks, parcels, elevation models, and access geometry into a single regulatory intelligence map.",
    whyProprietary: "No competitor has this normalization or deduction logic.",
    seoFocus: "AI zoning analysis · geospatial zoning engine · CRE feasibility automation",
  },
  {
    icon: Network,
    name: "Structured Geospatial Orchestration Layer™",
    subtitle: "Zoning, Flood, Wetland Normalization",
    description: "Transforms chaotic city/state data into consistent feasibility datasets for commercial zoning, land-use permissions, overlays & setbacks, floodplain boundaries, and wetlands & hydric soil indicators.",
    whyProprietary: "SGOL's data structures, schemas, and spatial ontology are internally designed and protected.",
    seoFocus: "zoning analysis software · commercial zoning engine · land-use feasibility",
  },
  {
    icon: Brain,
    name: "Neural Constraint Resolution Engine™",
    subtitle: "AI Feasibility Analyst",
    description: "A multi-pass AI model that resolves zoning conflicts, environmental constraints, utility availability, traffic restrictions, and constructability risks with underwriting-grade clarity.",
    whyProprietary: "NCRE is a black-box, multi-pass regulatory reasoning model not available outside SiteIntel.",
    seoFocus: "AI feasibility platform · commercial real estate due diligence automation",
  },
  {
    icon: BarChart3,
    name: "Composite Feasibility Index (CFI™)",
    subtitle: "Lender-Calibrated Scoring",
    description: "The industry's first lender-calibrated commercial feasibility score, evaluating zoning compliance, floodplain & BFE exposure, wetlands & environmental impact, utility serviceability, driveway & access conflicts, topographic constraints, and ROM cost impacts.",
    whyProprietary: "The weightings, confidence scoring, and constraint sequencing are protected IP.",
    seoFocus: "feasibility scoring software · commercial site feasibility score",
  },
  {
    icon: Mountain,
    name: "Topographic Intelligence Model™",
    subtitle: "Slope & Pad Feasibility",
    description: "Proprietary elevation modeling that analyzes slope segments, cut-fill volumes, pad viability, grade-adjustment constraints, and constructability scoring.",
    whyProprietary: "TIM derives pad viability through a unique slope grid, convex hull, and earthwork inference pipeline.",
    seoFocus: "topography feasibility analysis · slope site evaluation · pad readiness software",
  },
  {
    icon: Zap,
    name: "Infrastructure Serviceability Model™",
    subtitle: "Water, Sewer, Utilities, Capacity",
    description: "Automated water/sewer feasibility, gravity viability, pressure zones, lift-station requirements, and capacity risks.",
    whyProprietary: "ISM blends hydraulic logic with SiteIntel's internal serviceability heuristics.",
    seoFocus: "utility feasibility analysis · sewer serviceability modeling · water capacity evaluation",
  },
];

export const ProprietaryTechStack = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Inside the Proprietary SiteIntel™ Feasibility Engine
          </h2>
        </motion.div>

        <div className="space-y-6">
          {engines.map((engine, index) => (
            <motion.div
              key={engine.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 md:p-8 bg-background border border-border rounded-xl"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                  <engine.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground font-medium">Engine {index + 1}</span>
                  </div>
                  <h3 className="font-heading text-xl md:text-2xl font-semibold text-foreground">
                    {engine.name}
                  </h3>
                  <p className="text-sm text-primary font-medium mt-1">{engine.subtitle}</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-4 leading-relaxed">{engine.description}</p>

              <div className="flex items-start gap-2 pt-4 border-t border-border/50 mb-3">
                <Lock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-primary">Why it's proprietary: </span>
                  <span className="text-sm text-muted-foreground">{engine.whyProprietary}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic">
                {engine.seoFocus}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
