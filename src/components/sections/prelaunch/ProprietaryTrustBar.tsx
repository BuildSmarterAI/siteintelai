import { motion } from "framer-motion";
import { Shield, Brain, BarChart3, Lock } from "lucide-react";

const trustItems = [
  { icon: Shield, label: "Protected Computation Models" },
  { icon: Brain, label: "Neural Reasoning Stack" },
  { icon: BarChart3, label: "Composite Feasibility Index™" },
  { icon: Lock, label: "Restricted Prelaunch Access" },
];

export const ProprietaryTrustBar = () => {
  return (
    <section className="py-6 border-y border-border/50 bg-muted/20">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center items-center gap-6 md:gap-12"
        >
          {trustItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <item.icon className="w-4 h-4 text-primary/70" />
              <span className="text-sm font-medium">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
