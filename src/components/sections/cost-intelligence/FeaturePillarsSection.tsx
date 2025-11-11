import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { TrendingUp, Layers, Calculator } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Real-Time Market Awareness",
    description: "Track material and labor cost fluctuations as they happen. Stay ahead of market shifts with live data integration from verified sources."
  },
  {
    icon: Layers,
    title: "Design & Preconstruction Cost Clarity",
    description: "Validate budgets before breaking ground. Align design scope with current market costs to eliminate expensive surprises."
  },
  {
    icon: Calculator,
    title: "Construction Benchmarking",
    description: "Compare actual costs against market norms. Identify cost optimization opportunities with transparent, data-backed benchmarks."
  }
];

export const FeaturePillarsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-6 lg:px-8">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-headline text-4xl md:text-5xl text-foreground mb-4">
            Cost Intelligence Built for Action
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            Three core capabilities that transform how you approach construction economics.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                whileHover={{ scale: 1.02 }}
                className="bg-card rounded-2xl p-8 shadow-elev border border-border hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200"
              >
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-data-cyan/20 to-data-cyan/5 border border-data-cyan/20">
                    <Icon className="w-8 h-8 text-data-cyan" />
                  </div>
                </div>

                <h3 className="font-headline text-2xl text-foreground mb-4">
                  {feature.title}
                </h3>

                <p className="font-body text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
