import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { BarChart3 } from "lucide-react";

const costData = [
  { type: "Retail", min: 120, max: 180, avg: 150, color: "bg-primary" },
  { type: "Medical", min: 200, max: 280, avg: 240, color: "bg-status-success" },
  { type: "Industrial", min: 90, max: 140, avg: 115, color: "bg-data-cyan" },
  { type: "Multifamily", min: 150, max: 210, avg: 180, color: "bg-accent" }
];

export const CostRangeVisual = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-24 md:py-36 bg-charcoal overflow-hidden">
      {/* Blueprint Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(0deg, white 0px, transparent 1px, transparent 50px),
                           repeating-linear-gradient(90deg, white 0px, transparent 1px, transparent 50px)`
        }} />
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full">
              <BarChart3 className="w-4 h-4" />
              <span className="font-cta text-sm font-semibold">Market Intelligence</span>
            </div>

            <h2 className="font-headline text-4xl md:text-5xl text-white leading-tight">
              Visualize Cost Scenarios Instantly
            </h2>
            
            <p className="font-body text-xl text-white/80 leading-relaxed">
              Compare cost ranges across project types — Retail, Medical, Industrial, Multifamily — with interactive visualizations powered by live market data.
            </p>

            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-white/70 font-body">Real-time material cost tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-white/70 font-body">Regional labor rate benchmarking</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-white/70 font-body">Historical trend analysis</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Cost Visualization */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            {costData.map((item, idx) => (
              <motion.div
                key={item.type}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-headline text-lg text-white">{item.type}</span>
                  <span className="font-mono text-sm text-white/60">
                    ${item.min}-${item.max}/sq ft
                  </span>
                </div>

                <div className="relative h-12 bg-white/5 rounded-lg overflow-hidden">
                  {/* Average Marker */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${(item.avg / 300) * 100}%` } : {}}
                    transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                    className="absolute inset-y-0 left-0 flex items-center justify-end pr-3"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-primary" />
                    <span className="relative z-10 font-mono text-xs text-white font-semibold">
                      Avg: ${item.avg}
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="pt-6 border-t border-white/10"
            >
              <p className="text-xs text-white/50 text-center font-body">
                Data sourced from verified construction cost databases • Updated daily
              </p>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
