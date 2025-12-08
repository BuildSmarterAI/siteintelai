import { motion, type Variants } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { Globe } from "@/components/ui/globe-feature-section";
import { Button } from "@/components/ui/button";
const containerVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
};
const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};
const badgeVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};
export const ProprietaryHero = () => {
  const scrollToForm = () => {
    document.getElementById('request-access')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  return <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#0A0F2C]">
      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F2C]/85 via-[#0A0F2C]/50 to-[#0A0F2C]/80 z-[1]" />

      {/* Globe Background - prominent visibility */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <motion.div initial={{
        opacity: 0,
        scale: 0.8,
        rotate: -5
      }} animate={{
        opacity: 1,
        scale: 1,
        rotate: 0
      }} transition={{
        duration: 2,
        ease: "easeOut"
      }} className="w-[320px] h-[320px] sm:w-[450px] sm:h-[450px] md:w-[650px] md:h-[650px] lg:w-[850px] lg:h-[850px] opacity-55 md:opacity-70" style={{
        filter: "drop-shadow(0 0 120px rgba(6, 182, 212, 0.4))"
      }}>
          <Globe className="!w-full !h-full !max-w-none" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-8 md:py-0 text-center">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col items-center">
          {/* Eyebrow */}
          <motion.div variants={badgeVariants} className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-5">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Private Access</span>
          </motion.div>

          {/* H1 - with text shadow for readability */}
          <motion.h1 variants={itemVariants} className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] md:leading-[1.1] max-w-[90%] md:max-w-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            <span className="text-white">Proprietary Feasibility Intelligence for </span>
            <span className="text-[#FF7A00] block sm:inline">Commercial Real Estate</span>
          </motion.h1>

          {/* CTA - moved up, hero-first approach */}
          <motion.div variants={itemVariants} className="mt-6 md:mt-8">
            <Button size="lg" onClick={scrollToForm} className="bg-[#FF7A00] hover:bg-[#FF9240] text-white font-semibold px-8 min-h-[54px] py-4 text-lg rounded-xl shadow-lg shadow-[#FF7A00]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#FF7A00]/30 hover:scale-[1.02] active:scale-[0.98]">
              Request Private Beta Access
              <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </motion.div>

          {/* Subheadline - short, readable, after CTA */}
          <motion.p variants={itemVariants} className="mt-8 text-base md:text-lg text-white leading-[1.4] max-w-[85%] md:max-w-2xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            <span className="md:hidden">AI-driven feasibility combining zoning, floodplain, wetlands, utilities, and cost intelligence.</span>
            <span className="hidden md:inline">Unlock the private, state-of-the-art feasibility computation engine engineered for CRE developers, lenders, investors, and multi-site operators.</span>
          </motion.p>

          {/* Extended description - desktop only */}
          <motion.p variants={itemVariants} className="hidden md:block mt-4 text-base text-white/80 max-w-3xl leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
            SiteIntel™ delivers AI-driven commercial real estate feasibility, combining automated zoning analysis, floodplain mapping, wetlands risk detection, utility serviceability modeling, topography intelligence, traffic & access constraints, and ROM cost insights inside a proprietary protected architecture.
          </motion.p>

          {/* Access note - desktop only */}
          
        </motion.div>
      </div>
    </section>;
};