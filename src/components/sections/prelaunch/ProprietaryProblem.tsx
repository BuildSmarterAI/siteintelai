import { motion } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

const legacyMethods = [
  "Outdated zoning PDFs",
  "Disconnected GIS maps",
  "Manual floodplain checks",
  "Wetlands guesswork",
  "Utility emails & uncertainty",
  "Offline spreadsheets",
  "Multiple consultants",
  "Weeks of friction and incomplete feasibility studies",
];

const consequences = [
  "Slow site selection & acquisitions",
  "Inconsistent underwriting",
  "Late-stage deal failures",
  "High due-diligence costs",
  "Missed zoning, flood, or infrastructure risks",
];

export const ProprietaryProblem = () => {
  return (
    <section className="py-24 bg-muted/30">
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
              The Commercial Real Estate Feasibility Process Is Broken
            </h2>
          </div>

          {/* Legacy methods */}
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">
              Commercial developers, lenders, and investors still rely on:
            </p>
            <ul className="grid sm:grid-cols-2 gap-3">
              {legacyMethods.map((method, index) => (
                <motion.li
                  key={method}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 text-foreground/80"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                  {method}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Consequences */}
          <div className="space-y-4 p-6 bg-destructive/5 border border-destructive/20 rounded-xl">
            <p className="text-lg font-medium text-foreground">This creates:</p>
            <ul className="grid sm:grid-cols-2 gap-3">
              {consequences.map((consequence, index) => (
                <motion.li
                  key={consequence}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-3 text-destructive/90"
                >
                  <X className="w-4 h-4 flex-shrink-0" />
                  {consequence}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Closing statement */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="border-l-4 border-primary pl-6"
          >
            <p className="text-xl text-foreground/90">
              SiteIntel solves this through proprietary automation, standardized feasibility reporting, and a deterministic risk scoring system.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
