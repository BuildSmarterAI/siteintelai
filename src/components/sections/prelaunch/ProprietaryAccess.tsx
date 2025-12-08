import { motion } from "framer-motion";
import { Users, Building2, Landmark, Store, Factory, Briefcase } from "lucide-react";

const audiences = [
  { icon: Building2, label: "Developers & acquisition teams" },
  { icon: Landmark, label: "Commercial lenders & credit committees" },
  { icon: Store, label: "Franchise & multi-site expansion groups" },
  { icon: Briefcase, label: "Institutional investment groups" },
  { icon: Factory, label: "Industrial & logistics site selectors" },
  { icon: Users, label: "CRE funds and operators" },
];

export const ProprietaryAccess = () => {
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
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Who Gets Access
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Private prelaunch access is limited to teams who can benefit from underwriting-grade feasibility intelligence:
            </p>
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
                className="flex items-center gap-4 p-4 bg-muted/30 border border-border rounded-lg"
              >
                <audience.icon className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-foreground/90">{audience.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="border-l-4 border-primary/50 pl-6 space-y-2">
            <p className="text-foreground font-medium">
              This is not for casual users.
            </p>
            <p className="text-muted-foreground">
              We prioritize high-volume teams who need computational feasibility at scale.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
