import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import aerialImage from "@/assets/aerial-property-site.jpg";
import { AlertTriangle } from "lucide-react";

export const IntroChallengeSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-32 bg-muted">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-cta text-sm font-semibold">Industry Challenge</span>
            </div>

            <h2 className="font-headline text-4xl md:text-5xl text-foreground leading-tight">
              The Challenge: Costs Change Faster Than Plans
            </h2>
            
            <div className="space-y-4 font-body text-lg text-muted-foreground leading-relaxed">
              <p>
                Construction costs are volatile. Material prices fluctuate weekly, labor rates shift by region and season, and supply chain disruptions create unpredictable delays.
              </p>
              
              <p>
                Traditional feasibility studies rely on outdated assumptions. By the time a consultant delivers a cost estimate, the market has already moved. Developers commit to projects based on numbers that no longer reflect reality.
              </p>
              
              <p>
                <strong className="text-foreground">The result?</strong> Budget overruns, redesign cycles, and lost investor confidence. You need cost intelligence that moves as fast as the market does.
              </p>
            </div>
          </motion.div>

          {/* Right: Image with Overlay */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-elev">
              <img 
                src={aerialImage} 
                alt="Construction site with project plans" 
                className="w-full h-auto"
              />
              
              {/* Overlay Text */}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/50 to-transparent flex items-end p-8">
                <div className="space-y-2">
                  <p className="font-headline text-3xl text-white">
                    Real-Time Market Data
                  </p>
                  <p className="font-body text-white/80">
                    Stop guessing. Start building smarter.
                  </p>
                </div>
              </div>

              {/* Floating Cost Alert */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="absolute top-6 right-6 bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg"
              >
                <p className="font-cta text-sm font-semibold">↑ 12% Material Cost Shift</p>
                <p className="text-xs opacity-90">Last 30 days</p>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
