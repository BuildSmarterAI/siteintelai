import { motion } from "framer-motion";
import { Brain, Map, Droplets, Zap, Mountain, BarChart3 } from "lucide-react";

const trustItems = [
  { icon: Brain, label: "AI Feasibility Engine" },
  { icon: Map, label: "Zoning Analysis" },
  { icon: Droplets, label: "Flood & Wetlands" },
  { icon: Zap, label: "Utility Feasibility" },
  { icon: Mountain, label: "Topographic Intel" },
  { icon: BarChart3, label: "CFI™ Scoring" },
];

export const ProprietaryTrustBar = () => {
  return (
    <section className="py-4 md:py-6 border-y border-border/50 bg-muted/20 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Mobile: horizontal scroll with fade indicators */}
        <div className="relative md:hidden">
          {/* Left fade gradient */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-muted/60 to-transparent z-10 pointer-events-none" />
          {/* Right fade gradient */}
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-muted/60 to-transparent z-10 pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex overflow-x-auto scrollbar-hide gap-4 pb-2 -mx-4 px-6"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {trustItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-background/50 border border-border/50 rounded-full"
              >
                <item.icon className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground whitespace-nowrap">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Desktop: flex wrap */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="hidden md:flex flex-wrap justify-center items-center gap-8 lg:gap-12"
        >
          {trustItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <item.icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
