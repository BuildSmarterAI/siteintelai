import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { Globe } from "@/components/ui/globe-feature-section";
import { Button } from "@/components/ui/button";

export const ProprietaryHero = () => {
  const scrollToForm = () => {
    document.getElementById('request-access-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#0A0F2C]">
      {/* Globe Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="w-[600px] h-[600px] md:w-[800px] md:h-[800px] lg:w-[1000px] lg:h-[1000px] opacity-60"
          style={{
            filter: "drop-shadow(0 0 80px rgba(6, 182, 212, 0.3))"
          }}
        >
          <Globe className="w-full h-full" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Private Access</span>
          </div>

          {/* H1 */}
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            <span className="text-white">Proprietary Feasibility Intelligence for </span>
            <span className="text-[#FF7A00]">Commercial Real Estate</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Unlock the private, state-of-the-art feasibility computation engine engineered for CRE developers, lenders, investors, and multi-site operators.
          </p>

          <p className="text-base md:text-lg text-white/70 max-w-3xl mx-auto leading-relaxed">
            SiteIntel™ delivers AI-driven commercial real estate feasibility, combining automated zoning analysis, floodplain mapping, wetlands risk detection, utility serviceability modeling, topography intelligence, traffic & access constraints, and ROM cost insights inside a proprietary protected architecture.
          </p>

          <p className="text-sm text-white/60 italic">
            This technology is not public, not replicable, and not available in any GIS platform.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              onClick={scrollToForm}
              className="bg-[#FF7A00] hover:bg-[#FF9240] text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg"
            >
              Request Access
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          <p className="text-xs text-white/50 flex items-center justify-center gap-2">
            <Lock className="w-3 h-3" />
            Access is selective. Request early access.
          </p>
        </motion.div>
      </div>
    </section>
  );
};