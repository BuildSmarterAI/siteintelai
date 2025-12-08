import { motion } from "framer-motion";
import { Building2, Landmark, Store, Briefcase, Factory, Users, ShieldCheck } from "lucide-react";

const audiences = [
  { icon: Building2, label: "Developers & Acquisition Teams" },
  { icon: Landmark, label: "Commercial Lenders & Credit Committees" },
  { icon: Briefcase, label: "Institutional Investment Groups" },
  { icon: Store, label: "Franchise & Multi-Site Expansion Teams" },
  { icon: Factory, label: "Industrial & Logistics Site Selectors" },
  { icon: Users, label: "Brokerage & Advisory Teams" },
];

export const ProprietaryAccess = () => {
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
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Built for high-volume, high-stakes CRE operators:
            </h2>
          </div>

          {/* Audience grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {audiences.map((audience, index) => (
              <motion.div
                key={audience.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-5 bg-background border border-border rounded-lg hover:border-primary/30 transition-colors"
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <audience.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground font-medium">{audience.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg"
          >
            <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-foreground font-medium">
              Only serious operators will be approved.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
