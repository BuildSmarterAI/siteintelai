import { motion, type Variants } from "framer-motion";
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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const consequenceVariants: Variants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export const ProprietaryProblem = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-12"
        >
          {/* Header */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatDelay: 3 
                }}
              >
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </motion.div>
              <span className="text-sm font-medium text-destructive uppercase tracking-wider">The Problem</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              The Commercial Real Estate Feasibility Process Is Broken
            </h2>
          </motion.div>

          {/* Legacy methods */}
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">
              Commercial developers, lenders, and investors still rely on:
            </p>
            <motion.ul 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 gap-3"
            >
              {legacyMethods.map((method) => (
                <motion.li
                  key={method}
                  variants={itemVariants}
                  className="flex items-center gap-3 text-foreground/80"
                >
                  <motion.span 
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                    whileHover={{ scale: 1.5, backgroundColor: "hsl(var(--primary))" }}
                  />
                  {method}
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Consequences */}
          <motion.div 
            className="space-y-4 p-6 bg-destructive/5 border border-destructive/20 rounded-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <p className="text-lg font-medium text-foreground">This creates:</p>
            <motion.ul 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 gap-3"
            >
              {consequences.map((consequence) => (
                <motion.li
                  key={consequence}
                  variants={consequenceVariants}
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 text-destructive/90"
                >
                  <motion.div
                    whileHover={{ rotate: 90, scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <X className="w-4 h-4 flex-shrink-0" />
                  </motion.div>
                  {consequence}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Closing statement */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
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
