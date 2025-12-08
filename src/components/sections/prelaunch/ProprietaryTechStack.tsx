import { motion } from "framer-motion";
import { Layers, Network, Brain, BarChart3, Mountain, Droplets } from "lucide-react";

const technologies = [
  {
    icon: Layers,
    name: "Geospatial Inference Stack™",
    description: "Your multi-layer engine that interprets zoning statutes, FEMA flood geometry, wetlands hydric soils, sewer load paths, TxDOT access rules, and topography into a unified format.",
    highlight: "This is your core moat.",
  },
  {
    icon: Network,
    name: "Structured Geospatial Orchestration Layer™",
    description: "The only system capable of standardizing regulatory layers into coherent constraint objects. Converts chaotic, inconsistent GIS into precise, machine-readable feasibility data.",
    highlight: null,
  },
  {
    icon: Brain,
    name: "Neural Constraint Resolution Engine™",
    features: [
      "Multi-pass reasoning",
      "Regulatory rule resolution",
      "Conflict detection",
      "Kill-factor identification",
      "Feasibility narrative generation",
    ],
    footer: "This is not a chatbot. It is a full constraint-solving neural system engineered for CRE feasibility.",
  },
  {
    icon: BarChart3,
    name: "Composite Feasibility Index (CFI™)",
    evaluates: [
      "Zoning compliance",
      "Floodplain + BFE positioning",
      "Wetlands risk probability",
      "Utility serviceability & sewer capacity",
      "Access friction & TxDOT rules",
      "Drainage & impervious cover",
      "Topographic constructability",
      "Environmental overlays",
      "ROM cost premiums",
    ],
    result: "A single defensible feasibility score trusted by credit committees and investment teams.",
  },
  {
    icon: Mountain,
    name: "Topographic Intelligence Model (TIM™)",
    features: [
      "Pad detection",
      "Slope segmentation",
      "Cut-fill estimates",
      "Buildable envelope refinement",
      "Terrain viability scoring",
    ],
    footer: "Traditional GIS cannot do this. TIM™ transforms elevation into constructability intelligence.",
  },
  {
    icon: Droplets,
    name: "Infrastructure Serviceability Model (ISM™)",
    determines: [
      "Sewer availability",
      "Gravity vs force-main viability",
      "Pressure zone compliance",
      "Required lift-stations",
      "Water line upsizing",
      "Capacity moratoria",
      "Off-site improvement exposure",
    ],
    footer: "This replaces weeks of utility email chains.",
  },
];

export const ProprietaryTechStack = () => {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            Inside the proprietary computation engine
          </h2>
        </motion.div>

        <div className="space-y-8">
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 bg-muted/30 border border-border rounded-xl"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <tech.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{index + 1}.</span>
                  <h3 className="font-heading text-xl md:text-2xl font-semibold text-foreground">
                    {tech.name}
                  </h3>
                </div>
              </div>

              {'description' in tech && (
                <p className="text-muted-foreground mb-4">{tech.description}</p>
              )}

              {'highlight' in tech && tech.highlight && (
                <p className="text-primary font-medium">{tech.highlight}</p>
              )}

              {'features' in tech && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">A frontier AI system that performs:</p>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {tech.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-foreground/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {'evaluates' in tech && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">A lender-calibrated index that evaluates:</p>
                  <ul className="grid sm:grid-cols-3 gap-2">
                    {tech.evaluates.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-foreground/80 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {'determines' in tech && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">A proprietary utility and capacity model that determines:</p>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {tech.determines.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-foreground/80 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {'result' in tech && (
                <p className="text-lg font-medium text-foreground border-t border-border pt-4 mt-4">
                  The result: {tech.result}
                </p>
              )}

              {'footer' in tech && (
                <p className="text-muted-foreground italic mt-4">{tech.footer}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
