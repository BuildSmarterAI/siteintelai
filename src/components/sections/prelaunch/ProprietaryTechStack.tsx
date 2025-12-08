import { motion, type Variants } from "framer-motion";
import { Layers, Network, Brain, BarChart3, Mountain, Zap } from "lucide-react";

const engines = [
  {
    icon: Layers,
    name: "Geospatial Inference Stack™",
    description: "A unified regulatory intelligence system that merges zoning codes, flood data, wetlands, utilities, parcels, driveways, and elevation models into a single interpreted feasibility layer. It automatically identifies conflicts, risks, and buildability constraints without requiring consultant review.",
  },
  {
    icon: Network,
    name: "Structured Geospatial Orchestration Layer™ (SGOL™)",
    description: "A normalization engine that converts messy, inconsistent municipal datasets into a standardized regulatory model. SGOL™ ensures zoning, floodplain, environmental, and land-use information flows into a clean, consistent feasibility dataset across all jurisdictions.",
  },
  {
    icon: Brain,
    name: "Neural Constraint Resolution Engine™ (NCRE™)",
    description: "A multi-pass AI reasoning system that evaluates zoning rules, environmental constraints, utilities, access geometry, and topography as a unified regulatory problem. It resolves conflicts, interprets edge cases, and produces a definitive feasibility determination.",
  },
  {
    icon: BarChart3,
    name: "Composite Feasibility Index™ (CFI™)",
    description: "A lender-calibrated scoring model that quantifies site viability using zoning compliance, environmental exposure, utility readiness, access restrictions, topographic constraints, and ROM cost impacts. It delivers one consistent feasibility score across markets and asset types.",
  },
  {
    icon: Mountain,
    name: "Topographic Intelligence Model™ (TIM™)",
    description: "A terrain and constructability engine that analyzes slope, grading requirements, cut-fill volumes, pad suitability, drainage pathways, and driveway grade feasibility. TIM™ determines whether a site can physically support a commercial building.",
  },
  {
    icon: Zap,
    name: "Infrastructure Serviceability Model™ (ISM™)",
    description: "A utility readiness engine that evaluates gravity sewer feasibility, water pressure zones, basin capacity, lift-station needs, and electric service availability. ISM™ determines whether a site can be economically and realistically served by existing infrastructure.",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export const ProprietaryTechStack = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Inside the Proprietary SiteIntel™ Feasibility Engine
          </h2>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="space-y-6"
        >
          {engines.map((engine, index) => (
            <motion.div
              key={engine.name}
              variants={cardVariants}
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              className="p-6 md:p-8 bg-background border border-border rounded-xl transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-start gap-4 mb-4">
                <motion.div 
                  className="p-3 bg-primary/10 rounded-lg flex-shrink-0"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <engine.icon className="w-6 h-6 text-primary" />
                </motion.div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground font-medium">Engine {index + 1}</span>
                  </div>
                  <h3 className="font-heading text-xl md:text-2xl font-semibold text-foreground">
                    {engine.name}
                  </h3>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">{engine.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
