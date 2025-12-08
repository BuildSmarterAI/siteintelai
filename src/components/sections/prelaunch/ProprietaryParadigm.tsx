import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

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

          <p className="text-lg text-muted-foreground">
            The new standard for CRE viability assessment.
          </p>

          <p className="text-xl md:text-2xl text-foreground/90 max-w-3xl mx-auto leading-relaxed">
            SiteIntel doesn't aggregate data — it computes feasibility through a proprietary intelligence engine purpose-built for underwriting, acquisitions, and site selection at scale.
          </p>

          <div className="pt-8 space-y-3">
            <p className="text-lg text-muted-foreground">
              Not a map. Not a consultant.
            </p>
            <p className="text-2xl md:text-3xl font-bold text-primary">
              A new computational category.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
