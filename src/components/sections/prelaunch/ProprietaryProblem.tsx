import { motion } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

const legacyMethods = [
  "Fragmented GIS layers",
  "Outdated zoning PDFs",
  "Spreadsheet ROMs",
  "Multiple consultants",
  "Weeks of emails and follow-ups",
  "Human interpretation prone to errors",
];

const consequences = [
  "Slows acquisitions",
  "Misses flood, wetlands, utility, and access risks",
  "Makes underwriting inconsistent",
  "Kills deals late in the cycle",
  "Wastes time on non-viable sites",
];

export const ProprietaryProblem = () => {
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
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <span className="text-sm font-medium text-destructive uppercase tracking-wider">The Problem</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Feasibility was never designed for speed, standardization, or scale.
            </h2>
          </div>

          {/* Legacy methods */}
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">
              That's why developers, lenders, brokers, and franchise teams still rely on:
            </p>
            <ul className="grid sm:grid-cols-2 gap-3">
              {legacyMethods.map((method, index) => (
                <motion.li
                  key={method}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 text-muted-foreground"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                  {method}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Consequences */}
          <div className="space-y-4">
            <p className="text-lg font-medium text-foreground">This process:</p>
            <ul className="space-y-3">
              {consequences.map((consequence, index) => (
                <motion.li
                  key={consequence}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-3 text-destructive/80"
                >
                  <X className="w-4 h-4 flex-shrink-0" />
                  {consequence}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Scale warning */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-xl font-medium text-foreground/80 border-l-4 border-destructive/50 pl-6"
          >
            And at scale — it becomes unmanageable.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};
