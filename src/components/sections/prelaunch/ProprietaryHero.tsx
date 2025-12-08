import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { Globe } from "@/components/ui/globe-feature-section";
import { Button } from "@/components/ui/button";

export const ProprietaryHero = () => {
  const scrollToForm = () => {
    document.getElementById('request-access')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#0A0F2C]">
      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F2C]/85 via-[#0A0F2C]/50 to-[#0A0F2C]/80 z-[1]" />

      {/* Globe Background - prominent visibility */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="w-[320px] h-[320px] sm:w-[450px] sm:h-[450px] md:w-[650px] md:h-[650px] lg:w-[850px] lg:h-[850px] opacity-55 md:opacity-70"
          style={{
            filter: "drop-shadow(0 0 120px rgba(6, 182, 212, 0.4))"
          }}
        >
          <Globe className="!w-full !h-full !max-w-none" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-8 md:py-0 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-5">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Private Access</span>
          </div>

          {/* H1 - with text shadow for readability */}
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] md:leading-[1.1] max-w-[90%] md:max-w-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            <span className="text-white">Proprietary Feasibility Intelligence for </span>
            <span className="text-[#FF7A00] block sm:inline">Commercial Real Estate</span>
          </h1>

          {/* CTA - moved up, hero-first approach */}
          <div className="mt-6 md:mt-8">
            <Button 
              size="lg" 
              onClick={scrollToForm}
              className="bg-[#FF7A00] hover:bg-[#FF9240] text-white font-semibold px-8 min-h-[54px] py-4 text-lg rounded-xl shadow-lg shadow-[#FF7A00]/25 transition-all hover:shadow-xl hover:shadow-[#FF7A00]/30"
            >
              Request Private Beta Access
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          {/* Subheadline - short, readable, after CTA */}
          <p className="mt-8 text-base md:text-lg text-white leading-[1.4] max-w-[85%] md:max-w-2xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            <span className="md:hidden">AI-driven feasibility combining zoning, floodplain, wetlands, utilities, and cost intelligence.</span>
            <span className="hidden md:inline">Unlock the private, state-of-the-art feasibility computation engine engineered for CRE developers, lenders, investors, and multi-site operators.</span>
          </p>

          {/* Extended description - desktop only */}
          <p className="hidden md:block mt-4 text-base text-white/80 max-w-3xl leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
            SiteIntel™ delivers AI-driven commercial real estate feasibility, combining automated zoning analysis, floodplain mapping, wetlands risk detection, utility serviceability modeling, topography intelligence, traffic & access constraints, and ROM cost insights inside a proprietary protected architecture.
          </p>

          {/* Access note - desktop only */}
          <p className="hidden md:flex text-xs text-white/60 items-center justify-center gap-2 mt-6">
            <Lock className="w-3 h-3" />
            This technology is not public, not replicable, and not available in any GIS platform.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
