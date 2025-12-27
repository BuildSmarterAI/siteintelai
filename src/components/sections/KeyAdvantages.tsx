import { motion, useInView } from "framer-motion";
import { Shield, Zap, FileCheck, TrendingUp } from "lucide-react";
import { useRef } from "react";

export const KeyAdvantages = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-midnight-blue via-midnight-blue/95 to-midnight-blue">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="max-w-6xl mx-auto border-t border-data-cyan/15 pt-12 md:pt-16"
        >
          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold text-cloud-white mb-6 md:mb-8 text-center"
          >
            Why Texas Developers Trust SiteIntel™
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <motion.div
              variants={itemVariants}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 8px 32px rgba(6, 182, 212, 0.25)",
              }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="glass-subtle border-data-cyan/20 hover:border-data-cyan/60 hover:bg-white/8 transition-all duration-250 hover:shadow-lg hover:shadow-data-cyan/20 rounded-2xl p-5 md:p-7 flex flex-col gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-data-cyan/15 ring-1 ring-data-cyan/30 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-data-cyan" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-heading text-feasibility-orange mb-2">
                    Lender-Ready Reports
                  </h3>
                  <p className="text-sm sm:text-[15px] text-cloud-white/90 leading-[1.7]">
                    Every report includes complete citations from FEMA, ArcGIS, TxDOT, and EPA datasets—formatted for immediate lender submission.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 8px 32px rgba(6, 182, 212, 0.25)",
              }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="glass-subtle border-data-cyan/20 hover:border-data-cyan/60 hover:bg-white/8 transition-all duration-250 hover:shadow-lg hover:shadow-data-cyan/20 rounded-2xl p-5 md:p-7 flex flex-col gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-data-cyan/15 ring-1 ring-data-cyan/30 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-data-cyan" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-heading text-feasibility-orange mb-2">
                    10-Minute Delivery
                  </h3>
                  <p className="text-sm sm:text-[15px] text-cloud-white/90 leading-[1.7]">
                    From address input to PDF download in under 10 minutes. Move faster than your competition and close deals while consultants are still drafting proposals.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 8px 32px rgba(6, 182, 212, 0.25)",
              }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="glass-subtle border-data-cyan/20 hover:border-data-cyan/60 hover:bg-white/8 transition-all duration-250 hover:shadow-lg hover:shadow-data-cyan/20 rounded-2xl p-5 md:p-7 flex flex-col gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-data-cyan/15 ring-1 ring-data-cyan/30 flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-6 h-6 text-data-cyan" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-heading text-feasibility-orange mb-2">
                    Zero Guesswork
                  </h3>
                  <p className="text-sm sm:text-[15px] text-cloud-white/90 leading-[1.7]">
                    Every data point is sourced from verified government APIs—no estimates, no assumptions, no liability. Just facts your lender can trust.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 8px 32px rgba(6, 182, 212, 0.25)",
              }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="glass-subtle border-data-cyan/20 hover:border-data-cyan/60 hover:bg-white/8 transition-all duration-250 hover:shadow-lg hover:shadow-data-cyan/20 rounded-2xl p-5 md:p-7 flex flex-col gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-data-cyan/15 ring-1 ring-data-cyan/30 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-data-cyan" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-heading text-feasibility-orange mb-2">
                    $10K+ Saved Per Site
                  </h3>
                  <p className="text-sm sm:text-[15px] text-cloud-white/90 leading-[1.7]">
                    Traditional feasibility studies cost $10,000–$25,000 and take 3+ weeks. SiteIntel delivers the same intelligence for $999 in minutes.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.p
            variants={itemVariants}
            className="text-center text-sm text-cloud-white/70 mt-12 max-w-3xl mx-auto leading-relaxed"
          >
            Trusted by commercial developers across Austin, Dallas, Houston, and San Antonio. Every report backed by live data from FEMA National Flood Hazard Layer, TxDOT infrastructure databases, and EPA environmental screening APIs.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};