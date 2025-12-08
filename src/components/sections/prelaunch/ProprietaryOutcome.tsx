import { motion } from "framer-motion";
import { Check, Clock } from "lucide-react";

const deliverables = [
  "Parcel Summary",
  "Zoning Compliance Matrix",
  "Floodplain/BFE Analysis",
  "Wetlands Risk Signature",
  "Utilities Serviceability Profile",
  "Topography/Pad Viability",
  "Traffic/Access Friction",
  "Environmental Flags",
  "Composite Feasibility Index (CFI™)",
  "Underwriting-Ready Narrative",
  "ROM Cost Premiums",
];

const replaces = [
  "Consultants",
  "GIS portals",
  "Manual analysis",
  "Weeks of delays",
];

export const ProprietaryOutcome = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-muted/50 to-background">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-12"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">The Outcome</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              24-hour, lender-ready feasibility
            </h2>
            <p className="text-xl text-muted-foreground">
              Standardized, deterministic, defensible.
            </p>
          </div>

          {/* Deliverables */}
          <div className="bg-background border border-border rounded-xl p-8">
            <p className="text-lg font-medium text-foreground mb-6">Your team receives:</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {deliverables.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-3"
                >
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground/90">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Replaces */}
          <div className="text-center space-y-6">
            <p className="text-lg text-muted-foreground">This output replaces:</p>
            <div className="flex flex-wrap justify-center gap-4">
              {replaces.map((item) => (
                <span
                  key={item}
                  className="px-4 py-2 bg-destructive/10 text-destructive/80 rounded-lg line-through"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
