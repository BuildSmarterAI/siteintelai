import { motion } from "framer-motion";
import { Building2, Landmark, Store, Briefcase } from "lucide-react";

const metrics = [
  { icon: Building2, label: "CRE development feasibility" },
  { icon: Landmark, label: "Construction & acquisition lending" },
  { icon: Store, label: "Franchise & multi-site expansion" },
  { icon: Briefcase, label: "Institutional acquisitions & IC prep" },
];

export const InlineMetrics = () => {
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 md:px-24 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <p className="text-sm text-muted-foreground font-medium whitespace-nowrap">
            For developers, lenders, franchise teams, and institutional investors.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            {metrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="flex items-center gap-2 text-sm text-foreground/80"
              >
                <metric.icon className="w-4 h-4 text-primary" />
                <span>{metric.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
