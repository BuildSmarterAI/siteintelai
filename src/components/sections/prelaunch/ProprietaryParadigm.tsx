import { motion } from "framer-motion";
import { Sparkles, Check } from "lucide-react";

const features = [
  "Commercial zoning analysis",
  "Floodplain + Base Flood Elevation (BFE) modeling",
  "Wetlands & environmental constraints",
  "Water/sewer serviceability & utility feasibility",
  "Traffic & TxDOT access requirements",
  "Topography & pad constructability",
  "Commercial ROM cost estimation",
];

export const ProprietaryParadigm = () => {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">The New Paradigm</span>
            </div>
          </div>

          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            Feasibility-as-a-Service™
          </h2>

          <p className="text-xl text-primary font-medium">
            A New Category in Commercial Real Estate Technology
          </p>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            SiteIntel replaces weeks of fragmented due diligence with a single AI-driven 
            feasibility engine that standardizes:
          </p>

          {/* Features List */}
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
            {features.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3"
              >
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-foreground/90">{feature}</span>
              </motion.div>
            ))}
          </div>

          <div className="pt-8 space-y-3">
            <p className="text-lg text-muted-foreground">
              This is not a mapping tool.
            </p>
            <p className="text-2xl md:text-3xl font-bold text-primary">
              This is a proprietary feasibility computation system.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
