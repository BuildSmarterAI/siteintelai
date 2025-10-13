import { motion, useInView } from "framer-motion";
import { Database, Layers, CheckCircle2, Brain, Map, Zap, Shield, DollarSign, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useCounter } from "@/hooks/useCounter";
import { useRef } from "react";

const HowItWorks = () => {
  const metricsRef = useRef(null);
  const isMetricsInView = useInView(metricsRef, { once: true, margin: "-100px" });

  // Counter animations for metrics
  const timeCounter = useCounter(isMetricsInView ? 9.42 : 0, 2000, 0);
  const accuracyCounter = useCounter(isMetricsInView ? 97.3 : 0, 2000, 200);
  const savingsCounter = useCounter(isMetricsInView ? 10 : 0, 2000, 400);
  const speedCounter = useCounter(isMetricsInView ? 95 : 0, 2000, 600);

  const flowStages = [
    {
      icon: Database,
      title: "Data Collection",
      description: "Builds live connections to municipal, environmental, and infrastructure sources.",
      color: "#06B6D4",
      delay: 0,
    },
    {
      icon: Layers,
      title: "Normalization",
      description: "Cleans and aligns heterogeneous formats into a unified schema.",
      color: "#14B8A6",
      delay: 0.2,
    },
    {
      icon: CheckCircle2,
      title: "Verification",
      description: "Cross-checks values across datasets and internal cost intelligence.",
      color: "#FF7A00",
      delay: 0.4,
    },
    {
      icon: Brain,
      title: "Insight Generation",
      description: "AI model calculates feasibility, cost, and risk outputs.",
      color: "#FF9240",
      delay: 0.6,
    },
  ];

  const verificationLayers = [
    {
      number: 1,
      title: "Parcel & Zoning",
      description: "Defines buildable footprint, use, and density constraints.",
      icon: Map,
      detail: "Municipal zoning codes, setback requirements, permitted uses, and density restrictions verified from official records.",
    },
    {
      number: 2,
      title: "Infrastructure & Utilities",
      description: "Detects nearest connections and capacity.",
      icon: Zap,
      detail: "Water, sewer, electric, and gas infrastructure mapped with distance calculations and capacity verification.",
    },
    {
      number: 3,
      title: "Environmental & Risk",
      description: "Highlights flood, soil, and environmental overlays.",
      icon: Shield,
      detail: "FEMA flood zones, soil composition, wetlands, endangered species habitats, and environmental restrictions.",
    },
    {
      number: 4,
      title: "Cost & Schedule Intelligence",
      description: "Applies SiteIntel's proprietary cost database for true project feasibility.",
      icon: DollarSign,
      detail: "Real-time material costs, labor rates, and schedule estimates calibrated from thousands of completed projects.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C]">
      {/* 1️⃣ Hero Intro */}
      <section className="relative overflow-hidden py-32">
        {/* Background animation */}
        <motion.div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(6, 182, 212, 0.08) 2px, transparent 2px),
                            linear-gradient(to bottom, rgba(6, 182, 212, 0.08) 2px, transparent 2px)`,
            backgroundSize: '80px 80px',
          }}
          animate={{
            backgroundPosition: ['0px 0px', '80px 80px'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              className="text-5xl md:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              How SiteIntel™ Feasibility Works.
              <br />
              <span className="text-[#FF7A00]">From Public Data to Proprietary Intelligence.</span>
            </motion.h1>

            <motion.div
              className="w-[60px] h-[3px] bg-[#06B6D4] mx-auto mb-6"
              initial={{ width: 0 }}
              animate={{ width: 60 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            />

            <motion.p
              className="text-xl text-white/80 mb-12 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Every QuickCheck activates SiteIntel's proprietary data fusion engine—verifying 20+ public and internal datasets in seconds to produce a single, lender-ready source of truth.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[#FF7A00] to-[#FF9240] hover:shadow-[0_6px_30px_rgba(255,122,0,0.6)] text-white font-semibold rounded-full px-12 py-6"
              >
                <Link to="/application?step=2">Run a Feasibility QuickCheck →</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2️⃣ Data → Intelligence Flow Diagram */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              className="text-4xl font-bold text-white mb-16 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              The Data Fusion Process
            </motion.h2>

            {/* Desktop: Horizontal Flow */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-6 mb-12">
              {flowStages.map((stage, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: stage.delay, duration: 0.5 }}
                  className="relative"
                >
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-full hover:bg-white/10 transition-all">
                    <motion.div
                      className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${stage.color}20` }}
                      animate={{
                        boxShadow: [
                          `0 0 0 0 ${stage.color}40`,
                          `0 0 0 10px ${stage.color}00`,
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: stage.delay,
                      }}
                    >
                      <stage.icon className="h-7 w-7" style={{ color: stage.color }} />
                    </motion.div>
                    <h3 className="text-lg font-bold text-white mb-2">{stage.title}</h3>
                    <p className="text-sm text-white/70">{stage.description}</p>
                  </div>

                  {/* Arrow connector */}
                  {idx < flowStages.length - 1 && (
                    <motion.div
                      className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: stage.delay + 0.3, duration: 0.4 }}
                    >
                      <ArrowRight className="h-6 w-6 text-[#06B6D4]" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Mobile: Stacked */}
            <div className="lg:hidden space-y-6">
              {flowStages.map((stage, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: stage.delay, duration: 0.5 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${stage.color}20` }}
                    >
                      <stage.icon className="h-6 w-6" style={{ color: stage.color }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">{stage.title}</h3>
                      <p className="text-sm text-white/70">{stage.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Animated data flow visualization */}
            <motion.div
              className="mt-16 bg-gradient-to-r from-[#06B6D4]/10 to-[#FF7A00]/10 rounded-2xl p-8 border border-[#06B6D4]/20 relative overflow-hidden"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#06B6D4]/20 to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <p className="text-white/80 text-center relative z-10">
                <span className="font-semibold text-[#06B6D4]">Live data fusion:</span> Every report queries 20+ sources simultaneously, normalizes formats, cross-validates accuracy, and generates verified intelligence—all in under 60 seconds.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3️⃣ Four Verification Layers */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <motion.h2
              className="text-4xl font-bold text-white mb-4 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              The Four Verification Layers
            </motion.h2>
            <motion.p
              className="text-white/70 text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Every feasibility report is built on these four pillars of verified intelligence
            </motion.p>

            <div className="space-y-8">
              {verificationLayers.map((layer, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#FF7A00] flex items-center justify-center font-bold text-white text-2xl">
                        {layer.number}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <layer.icon className="h-6 w-6 text-[#06B6D4]" />
                        <h3 className="text-2xl font-bold text-white">{layer.title}</h3>
                      </div>
                      <p className="text-white/80 mb-4 text-lg">{layer.description}</p>
                      <p className="text-white/60 text-sm leading-relaxed">{layer.detail}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4️⃣ Real-Time Example */}
      <section className="py-24 bg-gradient-to-b from-transparent to-[#0A0F2C]/50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-5 gap-12 items-center">
              <div className="lg:col-span-2">
                <motion.h2
                  className="text-4xl font-bold text-white mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  Verified in <span className="text-[#FF7A00]">Seconds.</span>
                </motion.h2>
                <motion.p
                  className="text-white/80 text-lg leading-relaxed"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  Watch SiteIntel™ analyze a real parcel—connecting datasets, validating cost inputs, and generating an executive-ready feasibility score.
                </motion.p>
              </div>

              <motion.div
                className="lg:col-span-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 aspect-video flex items-center justify-center group cursor-pointer hover:bg-white/10 transition-all"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-center">
                  <motion.div
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF7A00] to-[#FF9240] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"
                    whileHover={{ scale: 1.1 }}
                  >
                    <Play className="h-10 w-10 text-white ml-1" />
                  </motion.div>
                  <p className="text-white/70 text-sm">Demo: QuickCheck in Action</p>
                  <p className="text-white/50 text-xs mt-2">Geocoding → Verification → Cost Model → Report Ready</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 5️⃣ Outcome Metrics */}
      <section className="py-24" ref={metricsRef}>
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <motion.h2
              className="text-4xl font-bold text-white mb-4 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Measured Impact. <span className="text-[#FF7A00]">Proven Performance.</span>
            </motion.h2>
            <motion.p
              className="text-white/70 text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Real metrics from thousands of feasibility reports
            </motion.p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <motion.div
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0 }}
              >
                <div className="text-5xl font-bold text-[#06B6D4] mb-2">
                  {timeCounter.toFixed(2)}
                </div>
                <div className="text-white/60 text-sm">min</div>
                <div className="text-white font-semibold mt-2">Average feasibility time</div>
              </motion.div>

              <motion.div
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-5xl font-bold text-[#06B6D4] mb-2">
                  {accuracyCounter.toFixed(1)}%
                </div>
                <div className="text-white font-semibold mt-2">Data accuracy verified</div>
              </motion.div>

              <motion.div
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-3xl font-bold text-[#FF7A00] mb-2">
                  ${savingsCounter.toFixed(0)}K → {"<"}$1K
                </div>
                <div className="text-white font-semibold mt-2">Avg cost savings per report</div>
              </motion.div>

              <motion.div
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
              >
                <div className="text-5xl font-bold text-[#FF7A00] mb-2">
                  {speedCounter}%
                </div>
                <div className="text-white font-semibold mt-2">Faster than manual methods</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 6️⃣ CTA Strip */}
      <section className="py-24 relative overflow-hidden">
        {/* Background grid animation */}
        <motion.div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(6, 182, 212, 0.08) 2px, transparent 2px),
                            linear-gradient(to bottom, rgba(6, 182, 212, 0.08) 2px, transparent 2px)`,
            backgroundSize: '80px 80px',
          }}
        />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              className="bg-gradient-to-r from-[#FF7A00]/10 to-[#06B6D4]/10 rounded-3xl p-12 border border-[#FF7A00]/20 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#06B6D4] via-[#FF7A00] to-[#06B6D4]"
                animate={{
                  backgroundPosition: ['0% 0%', '200% 0%'],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: '200% 100%',
                }}
              />

              <h2 className="text-4xl font-bold text-white mb-4">
                Get Verified Feasibility in Minutes.
              </h2>
              <p className="text-white/70 mb-8 text-lg">
                Trusted by developers, lenders, and design-build teams across Texas and beyond.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[#FF7A00] to-[#FF9240] hover:shadow-[0_8px_40px_rgba(255,122,0,0.6)] text-white font-semibold rounded-full px-12 py-8 text-lg w-full md:w-auto"
              >
                <Link to="/application?step=2">Run a Feasibility QuickCheck →</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
