import { motion, useInView } from "framer-motion";
import { Database, Shield, FileCheck, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

export const SolutionOverview = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const navigate = useNavigate();

  const dataSources = [
    "FEMA", "EPA", "Census", "TxDOT", "HCAD", "USGS", "NWI", "ACS"
  ];

  const solutionPillars = [
    {
      icon: Database,
      title: "Unified Data Fusion",
      description: "We query FEMA flood maps, county parcel records, EPA environmental databases, traffic counts, Census demographics, and utility infrastructure in parallel—then synthesize it all into actionable intelligence.",
      badge: "20+ Sources, One Query",
    },
    {
      icon: Shield,
      title: "Instant Kill-Factor Detection",
      description: "Our AI automatically flags deal-breakers: floodway designations, high-risk zones, wetlands, zoning conflicts, and missing utilities. Know what's wrong before you commit.",
      badge: "Automatic Kill-Factor Detection",
    },
    {
      icon: FileCheck,
      title: "Lender-Ready Output",
      description: "Every data point is cited with source attribution and timestamps. Download a professional PDF that meets institutional underwriting standards—ready to submit to banks.",
      badge: "Lender-Ready Format",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" as const },
    },
  };

  return (
    <section id="solution" ref={ref} className="bg-white py-16 md:py-24 lg:py-32 relative overflow-hidden">
      {/* Subtle accent lines */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF7A00]/20 to-transparent" />
      
      <div className="container mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] text-[#0A0F2C] mb-4">
            One Address. 60 Seconds. Every Answer You Need.
          </h2>
          <p className="font-body text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            SiteIntel aggregates 20+ authoritative government and municipal data sources into a single AI-powered analysis—delivered in 60 seconds and formatted for institutional review.
          </p>
        </motion.div>

        {/* Data Fusion Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative max-w-4xl mx-auto mb-16"
        >
          <div className="bg-gradient-to-br from-[#0A0F2C] to-[#1a2550] rounded-3xl p-8 md:p-12 relative overflow-hidden">
            {/* Background grid */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="fusion-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#06B6D4" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#fusion-grid)" />
              </svg>
            </div>

            <div className="relative z-10">
              {/* Data Sources Row */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {dataSources.map((source, index) => (
                  <motion.div
                    key={source}
                    initial={{ opacity: 0, y: -10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20"
                  >
                    <span className="text-sm text-white font-medium">{source}</span>
                  </motion.div>
                ))}
              </div>

              {/* Flow Lines Animation */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={isInView ? { scaleY: 1 } : {}}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="w-px h-12 bg-gradient-to-b from-[#06B6D4] to-[#FF7A00] origin-top"
                />
              </div>

              {/* Fusion Engine */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={isInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ delay: 1, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-6"
              >
                <div className="bg-gradient-to-r from-[#FF7A00] to-[#FF9240] rounded-2xl px-8 py-4 shadow-lg shadow-[#FF7A00]/30">
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-white" />
                    <span className="font-heading font-semibold text-white text-lg">SiteIntel™ AI Engine</span>
                  </div>
                </div>
              </motion.div>

              {/* Output Line */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={isInView ? { scaleY: 1 } : {}}
                  transition={{ delay: 1.3, duration: 0.5 }}
                  className="w-px h-12 bg-gradient-to-b from-[#FF7A00] to-[#22C55E] origin-top"
                />
              </div>

              {/* Output */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.6 }}
                className="flex justify-center"
              >
                <div className="bg-white rounded-xl px-6 py-4 shadow-lg flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#22C55E] flex items-center justify-center">
                    <span className="text-lg font-bold text-white">82</span>
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-[#0A0F2C]">Lender-Ready Report</p>
                    <p className="text-sm text-slate-500">Complete feasibility analysis</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Solution Pillars */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12"
        >
          {solutionPillars.map((pillar, index) => {
            const IconComponent = pillar.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
              >
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF7A00] to-[#06B6D4] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                
                <div className="w-14 h-14 rounded-2xl bg-[#FF7A00]/10 flex items-center justify-center mb-6">
                  <IconComponent className="w-7 h-7 text-[#FF7A00]" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-[#0A0F2C] mb-3">
                  {pillar.title}
                </h3>
                <p className="font-body text-slate-600 leading-relaxed mb-4">
                  {pillar.description}
                </p>
                <div className="inline-flex items-center gap-2 bg-[#06B6D4]/10 px-3 py-1.5 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
                  <span className="text-sm font-medium text-[#06B6D4]">{pillar.badge}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            size="lg"
            className="bg-[#FF7A00] hover:bg-[#FF9240] text-white font-heading font-semibold rounded-full px-10 py-7 text-lg shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate('/quickcheck')}
          >
            Try Free QuickCheck
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-[#0A0F2C] text-[#0A0F2C] hover:bg-[#0A0F2C]/5 font-heading rounded-full px-10 py-7 text-lg"
            onClick={() => navigate('/features')}
          >
            View All Features
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};