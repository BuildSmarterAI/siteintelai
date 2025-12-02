import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Building, Briefcase, TrendingUp, Compass } from "lucide-react";

const useCases = [
  {
    icon: Building,
    role: "Commercial Developers",
    benefit: "Budget with confidence before design.",
    description: "Screen multiple sites and validate cost assumptions in minutes, not weeks."
  },
  {
    icon: Briefcase,
    role: "Lenders & Investors",
    benefit: "Validate borrower cost assumptions.",
    description: "Verify proformas with real-time market data to reduce underwriting risk."
  },
  {
    icon: TrendingUp,
    role: "Equity Partners",
    benefit: "Assess proforma accuracy in minutes.",
    description: "Make faster investment decisions with transparent, data-backed cost intelligence."
  },
  {
    icon: Compass,
    role: "Design-Build Teams",
    benefit: "Align design scope with market costs.",
    description: "Avoid costly redesigns by validating budgets against current construction economics."
  }
];

export const UseCasesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-32 bg-muted">
      <div className="container mx-auto px-6 lg:px-8">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground mb-4">
            Built for Every Role in the Deal
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            Whether you're developing, financing, or designing—cost intelligence accelerates your workflow.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, idx) => {
            const Icon = useCase.icon;
            
            return (
              <motion.div
                key={useCase.role}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="group bg-card rounded-2xl p-8 shadow-elev border border-border hover:border-t-4 hover:border-t-primary hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200"
              >
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-200">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <h3 className="font-headline text-2xl text-foreground mb-3">
                  {useCase.role}
                </h3>

                <p className="font-cta text-lg text-primary mb-4 font-semibold">
                  {useCase.benefit}
                </p>

                <p className="font-body text-muted-foreground leading-relaxed">
                  {useCase.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
