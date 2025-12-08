import { motion } from "framer-motion";
import { Check, Zap, Target, TrendingUp, DollarSign, Gauge, LayoutGrid } from "lucide-react";

const deliverables = [
  "Automated zoning & land-use report",
  "Floodplain + BFE modeling",
  "Wetlands & environmental feasibility",
  "Water/sewer serviceability profile",
  "Access & traffic feasibility (TxDOT)",
  "Topography & pad readiness",
  "Impervious cover & drainage modeling",
  "CFI™ — Composite Feasibility Index",
  "AI-generated feasibility narrative",
  "ROM cost premiums",
];

const impacts = [
  { icon: Check, text: "Approve good sites faster" },
  { icon: Target, text: "Kill bad sites earlier" },
  { icon: Gauge, text: "Improve underwriting consistency" },
  { icon: DollarSign, text: "Reduce dead-deal spend" },
  { icon: TrendingUp, text: "Accelerate acquisition velocity" },
  { icon: LayoutGrid, text: "Standardize feasibility across your entire pipeline" },
];

export const ProprietaryOutcome = () => {
  return (
    <section className="py-24 bg-background">
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
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">The Result</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              A Fully Automated, Lender-Ready Feasibility Report in 24 Hours
            </h2>
          </div>

          {/* Deliverables */}
          <div className="bg-muted/30 border border-border rounded-xl p-6 md:p-8">
            <p className="text-lg font-medium text-foreground mb-6">Your private access includes:</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

          {/* Impact */}
          <div className="space-y-6">
            <p className="text-lg font-medium text-foreground text-center">Impact:</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {impacts.map((impact, index) => (
                <motion.div
                  key={impact.text}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg"
                >
                  <impact.icon className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground/90 font-medium">{impact.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
