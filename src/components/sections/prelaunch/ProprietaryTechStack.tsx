import { motion } from "framer-motion";
import { Layers, Network, Brain, BarChart3, Mountain, Droplets, Lock } from "lucide-react";

const engines = [
  {
    icon: Layers,
    name: "Geospatial Inference Stack™",
    description: "The foundation of SiteIntel's IP. A multi-layer inference system that standardizes zoning statutes, FEMA NFHL geometry, wetlands hydric indicators, sewer networks, traffic access rules, and elevation geometry into a coherent regulatory map.",
    whyProprietary: "No competitor has this normalization or deduction logic.",
  },
  {
    icon: Network,
    name: "Structured Geospatial Orchestration Layer™ (SGOL)",
    description: "A regulatory AI fabric that unifies thousands of disparate datasets into deterministic feasibility constraints.",
    whyProprietary: "SGOL's data structures, schemas, and spatial ontology are internally designed and protected.",
  },
  {
    icon: Brain,
    name: "Neural Constraint Resolution Engine™ (NCRE)",
    description: "A frontier multi-pass reasoning engine that resolves zoning conflicts, environmental constraints, access restrictions, and utility availability through neural logic sequencing.",
    whyProprietary: "NCRE is a black-box, multi-pass regulatory reasoning model not available outside SiteIntel.",
  },
  {
    icon: BarChart3,
    name: "Composite Feasibility Index (CFI™)",
    description: "A lender-calibrated feasibility score derived from thousands of weighted constraint evaluations.",
    inputs: ["Zoning", "Flood", "Wetlands", "Utilities", "Access", "Topography", "Drainage", "ROM cost premiums"],
    whyProprietary: "The weightings, confidence scoring, and constraint sequencing are protected IP.",
  },
  {
    icon: Mountain,
    name: "Topographic Intelligence Model™ (TIM)",
    description: "A precision terrain model computing pad viability, slope segmentation, cut-fill prediction, and terrain constructability.",
    whyProprietary: "TIM derives pad viability through a unique slope grid, convex hull, and earthwork inference pipeline.",
  },
  {
    icon: Droplets,
    name: "Infrastructure Serviceability Model™ (ISM)",
    description: "Determines water/sewer availability, gravity feasibility, pressure-zone compliance, and off-site improvement exposure.",
    whyProprietary: "ISM blends hydraulic logic with SiteIntel's internal serviceability heuristics.",
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
            Inside the proprietary SiteIntel computation engine
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
                </div>
              </div>

              <p className="text-muted-foreground mb-4 leading-relaxed">{engine.description}</p>

              {'inputs' in engine && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {engine.inputs.map((input) => (
                    <span
                      key={input}
                      className="px-2 py-1 bg-muted/50 text-xs font-medium text-foreground/70 rounded"
                    >
                      {input}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-2 pt-4 border-t border-border/50">
                <Lock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-primary">Why it's proprietary: </span>
                  <span className="text-sm text-muted-foreground">{engine.whyProprietary}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
