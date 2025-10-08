import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Layers, DollarSign, ShieldCheck, BarChart3 } from "lucide-react";
import buildSmarterLogo from "@/assets/buildsmarter-logo-new.png";

export const Hero = () => {
  // Animation variants - v6.1 timing
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const,
      },
    },
  };

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 0.08,
      transition: {
        duration: 0.3,
        delay: 0.3,
      },
    },
  };

  const headlineVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        delay: 0.6,
      },
    },
  };

  const subheadVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
        delay: 0.9,
      },
    },
  };

  const ctaVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.2,
        delay: 1.1,
        type: "spring" as const,
        stiffness: 90,
      },
    },
  };

  const valueIconVariants = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: {
        duration: 0.3,
        delay: 1.3 + i * 0.1,
      },
    }),
  };

  return (
    <motion.section
      className="relative flex min-h-screen overflow-hidden bg-gradient-to-tr from-[#0A0F2C] via-[#11224F] to-[#FF7A00]/15"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated grid lines background */}
      <motion.div
        className="absolute inset-0 opacity-0"
        variants={gridVariants}
        style={{
          backgroundImage: `linear-gradient(to right, rgba(6, 182, 212, 0.08) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(6, 182, 212, 0.08) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Animated map background - right side */}
      <div className="absolute right-0 top-0 h-full w-full lg:w-1/2 opacity-20">
        <div className="relative h-full w-full">
          {/* Simulated data nodes with pulse animation */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-[#06B6D4]"
              style={{
                top: `${Math.random() * 80 + 10}%`,
                left: `${Math.random() * 80 + 10}%`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      {/* Content wrapper with glass card effect */}
      <div className="relative z-10 flex w-full items-center">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="max-w-3xl">
            {/* Frosted glass card */}
            <motion.div
              className="rounded-3xl bg-white/10 backdrop-blur-xl border border-[#06B6D4]/20 p-8 md:p-12 shadow-[0_8px_32px_0_rgba(10,15,44,0.37)] relative overflow-hidden"
              style={{
                boxShadow: '0 8px 32px 0 rgba(10, 15, 44, 0.37), inset 0 0 60px rgba(255, 122, 0, 0.05)',
              }}
            >
              {/* Inner glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF7A00]/5 to-transparent pointer-events-none" />

              {/* Logo */}
              <motion.div
                className="mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <img src={buildSmarterLogo} alt="BuildSmarter" className="h-8 md:h-10" />
              </motion.div>

              {/* Tagline */}
              <motion.p
                className="text-xs md:text-sm tracking-widest text-[#06B6D4] uppercase mb-4 font-medium"
                variants={headlineVariants}
              >
                AI-Powered Feasibility Intelligence — Built from Real-World Data
              </motion.p>

              {/* Headline */}
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-headline font-bold text-white leading-tight mb-6"
                variants={headlineVariants}
              >
                Verified Feasibility Intelligence.
                <br />
                <span className="text-[#FF7A00]">Exclusive Clarity</span> from Public Data.
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                className="text-base md:text-lg lg:text-xl text-[#CBD5E1] leading-relaxed mb-10 font-body"
                variants={subheadVariants}
              >
                BuildSmarter™ fuses thousands of municipal, cost, and infrastructure datasets into a proprietary intelligence engine—delivering instant feasibility clarity on what can be built, what it costs, and where risks live.
              </motion.p>

              {/* CTA Group */}
              <motion.div variants={ctaVariants}>
                <Button
                  size="lg"
                  className="bg-[#FF7A00] hover:bg-[#FF9240] active:bg-[#D96500] text-white font-semibold font-cta rounded-full px-8 py-6 text-lg shadow-[0_4px_20px_rgba(255,122,0,0.4)] hover:shadow-[0_6px_30px_rgba(255,122,0,0.6)] transition-all duration-250 group relative overflow-hidden focus-visible:ring-2 focus-visible:ring-[#06B6D4] focus-visible:ring-offset-2"
                  onClick={() => (window.location.href = "/application?step=2")}
                >
                  <span className="relative z-10">Run a Free QuickCheck →</span>
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{
                      x: '100%',
                      transition: { duration: 0.5, ease: 'easeInOut' }
                    }}
                  />
                </Button>
                
                {/* Microcopy */}
                <p className="mt-3 text-sm text-[#CBD5E1]/70">
                  Verified from 20+ trusted data sources · Instant report · No commitment
                </p>
              </motion.div>

              {/* Value Icons Strip */}
              <motion.div
                className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 text-[#CBD5E1] text-sm"
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  className="flex items-start gap-3"
                  custom={0}
                  variants={valueIconVariants}
                >
                  <Layers className="h-5 w-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Proprietary Data Fusion</div>
                    <div className="text-xs text-[#CBD5E1]/60 mt-0.5">20+ verified datasets unified</div>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-start gap-3"
                  custom={1}
                  variants={valueIconVariants}
                >
                  <DollarSign className="h-5 w-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Cost Intelligence</div>
                    <div className="text-xs text-[#CBD5E1]/60 mt-0.5">Construction-cost benchmarks</div>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-start gap-3"
                  custom={2}
                  variants={valueIconVariants}
                >
                  <ShieldCheck className="h-5 w-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Risk Transparency</div>
                    <div className="text-xs text-[#CBD5E1]/60 mt-0.5">Instant constraint exposure</div>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-start gap-3"
                  custom={3}
                  variants={valueIconVariants}
                >
                  <BarChart3 className="h-5 w-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Decision Clarity</div>
                    <div className="text-xs text-[#CBD5E1]/60 mt-0.5">Quantified feasibility scores</div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
