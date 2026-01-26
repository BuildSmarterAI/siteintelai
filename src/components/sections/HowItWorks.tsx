import { motion, useInView } from "framer-motion";
import { MapPin, MousePointer, Zap, FileCheck, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

export const HowItWorks = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      icon: MapPin,
      title: "Enter Any Address",
      description: "Type or paste any property address in Texas. Our geocoding system validates the location and identifies the parcel boundary. You can also search by cross-streets or CAD/APN number.",
      visual: "Address search input with autocomplete dropdown",
    },
    {
      number: 2,
      icon: MousePointer,
      title: "Confirm Your Parcel",
      description: "Review the parcel boundary on our interactive map. Click to select, or draw a custom boundary for multi-parcel analysis. Confirm with one click.",
      visual: "Interactive map with highlighted parcel",
    },
    {
      number: 3,
      icon: Zap,
      title: "Generate Your Report",
      description: "SiteIntel queries 20+ data sources in parallel, runs AI analysis, and generates your comprehensive feasibility report. Watch real-time progress as each data layer completes.",
      visual: "Progress bar with data source icons checking off",
      badge: "60 seconds",
    },
    {
      number: 4,
      icon: FileCheck,
      title: "Review, Download, Submit",
      description: "Access your interactive report immediately. Download the lender-ready PDF. Share via secure link. Submit directly to banks, investors, or partners.",
      visual: "Report interface with download and share buttons",
    },
  ];

  return (
    <section ref={ref} className="bg-[#F4F4F5] py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] text-[#0A0F2C] mb-4">
            From Address to Analysis in 4 Steps
          </h2>
          <p className="font-body text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            No training required. No software to install. Enter an address and receive institutional-grade intelligence.
          </p>
        </motion.div>

        {/* Steps Timeline - Desktop */}
        <div className="hidden lg:block max-w-6xl mx-auto mb-12">
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-16 left-0 right-0 h-1 bg-slate-200">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 1.5, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-[#FF7A00] to-[#06B6D4] origin-left"
              />
            </div>

            {/* Steps */}
            <div className="grid grid-cols-4 gap-8 relative z-10">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.3 + index * 0.2 }}
                    className="text-center"
                  >
                    {/* Step Circle */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="relative mx-auto mb-6"
                    >
                      <div className="w-32 h-32 rounded-full bg-white shadow-lg border-4 border-slate-100 flex items-center justify-center mx-auto relative">
                        <IconComponent className="w-12 h-12 text-[#FF7A00]" />
                        {step.badge && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={isInView ? { scale: 1 } : {}}
                            transition={{ delay: 1.5, type: "spring" }}
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#22C55E] text-white text-xs font-semibold px-3 py-1 rounded-full"
                          >
                            {step.badge}
                          </motion.div>
                        )}
                      </div>
                      {/* Step Number */}
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#0A0F2C] text-white flex items-center justify-center text-sm font-bold">
                        {step.number}
                      </div>
                    </motion.div>

                    {/* Card */}
                    <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
                      <h3 className="font-heading text-lg font-semibold text-[#0A0F2C] mb-2">
                        {step.title}
                      </h3>
                      <p className="font-body text-sm text-slate-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Steps - Mobile/Tablet */}
        <div className="lg:hidden space-y-6 mb-12">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2 + index * 0.15 }}
                className="bg-white rounded-xl p-6 shadow-md border border-slate-200 relative"
              >
                {/* Step Number */}
                <div className="absolute top-6 left-6 w-8 h-8 rounded-full bg-[#0A0F2C] text-white flex items-center justify-center text-sm font-bold">
                  {step.number}
                </div>

                <div className="ml-12">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FF7A00]/10 flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-[#FF7A00]" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-[#0A0F2C]">
                        {step.title}
                      </h3>
                      {step.badge && (
                        <span className="text-xs bg-[#22C55E] text-white px-2 py-0.5 rounded-full">
                          {step.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="font-body text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-10 bottom-0 w-px h-6 bg-gradient-to-b from-slate-200 to-transparent translate-y-full" />
                )}
              </motion.div>
            );
          })}
        </div>

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
            onClick={() => navigate('/get-started')}
          >
            Start Your First Report
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-[#0A0F2C] text-[#0A0F2C] hover:bg-[#0A0F2C]/5 font-heading rounded-full px-10 py-7 text-lg group"
            onClick={() => {/* Open demo video modal */}}
          >
            <Play className="mr-2 w-5 h-5" />
            Watch 2-Minute Demo
          </Button>
        </motion.div>
      </div>
    </section>
  );
};