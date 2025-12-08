import { motion } from "framer-motion";
import { Building2, Landmark, Store, Briefcase, Factory, TrendingUp } from "lucide-react";

const audiences = [
  { icon: Building2, label: "Commercial developers & site acquisition teams" },
  { icon: TrendingUp, label: "Real estate investment firms" },
  { icon: Landmark, label: "CRE lenders & underwriting teams" },
  { icon: Store, label: "Franchise operators & multi-site retailers" },
  { icon: Factory, label: "Industrial/logistics site selectors" },
  { icon: Briefcase, label: "Brokers & advisory groups" },
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
          <div className="text-center space-y-4">
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Who Should Apply for Access?
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

          {/* SEO Focus */}
          <p className="text-center text-sm text-muted-foreground italic">
            CRE developers · real estate lenders · franchise site selection · logistics site analysis
          </p>
        </motion.div>
      </div>
    </section>
  );
};
