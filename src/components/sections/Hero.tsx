import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Layers, DollarSign, ShieldCheck, BarChart3 } from "lucide-react";
import buildSmarterLogo from "@/assets/buildsmarter-logo-new.png";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCounter } from "@/hooks/useCounter";
import { useState, useRef } from "react";

export const Hero = () => {
  // Phase 1: Magnetic CTA - Mouse tracking
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Phase 4: Number Counter
  const dataSourceCount = useCounter(20, 2000, 1300);

  // Phase 5: Parallax Scroll
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);
  const gridY = useTransform(scrollY, [0, 500], [0, 100]);

  // Magnetic button handler
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMousePosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

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
      {/* Animated grid lines background with parallax */}
      <motion.div
        className="absolute inset-0 opacity-0"
        variants={gridVariants}
        style={{
          backgroundImage: `linear-gradient(to right, rgba(6, 182, 212, 0.08) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(6, 182, 212, 0.08) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          y: gridY,
        }}
      >
        {/* Phase 2: Grid scan effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-[#06B6D4]/20 to-transparent h-32"
          animate={{
            y: ['-100%', '200%'],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 5,
          }}
        />
      </motion.div>

      {/* Animated map background - right side with parallax */}
      <motion.div 
        className="absolute right-0 top-0 h-full w-full lg:w-1/2 opacity-20"
        style={{ y: backgroundY }}
      >
        <div className="relative h-full w-full">
          {/* Phase 2: Data Stream Visualization */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="streamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(6, 182, 212, 0)" />
                <stop offset="50%" stopColor="rgba(6, 182, 212, 0.6)" />
                <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
              </linearGradient>
            </defs>
            {[...Array(8)].map((_, i) => {
              const startX = Math.random() * 80 + 10;
              const startY = Math.random() * 80 + 10;
              const endX = Math.random() * 80 + 10;
              const endY = Math.random() * 80 + 10;
              return (
                <motion.line
                  key={i}
                  x1={`${startX}%`}
                  y1={`${startY}%`}
                  x2={`${endX}%`}
                  y2={`${endY}%`}
                  stroke="url(#streamGradient)"
                  strokeWidth="1"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: [0, 1, 0],
                    opacity: [0, 0.8, 0]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: 0.9 + i * 0.5,
                    ease: "easeInOut",
                  }}
                />
              );
            })}
          </svg>

          {/* Simulated data nodes with pulse animation */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-[#06B6D4] shadow-[0_0_10px_rgba(6,182,212,0.5)]"
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
      </motion.div>

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

              {/* Headline */}
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-headline font-bold text-white leading-tight mb-6"
                variants={headlineVariants}
              >
                BuildSmarter™ Feasibility.
                <br />
                <span className="text-[#FF7A00]">Verified Intelligence</span> for Every Site, Every Cost, Every Decision.
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                className="text-base md:text-lg lg:text-xl text-[#CBD5E1] leading-relaxed mb-10 font-body"
                variants={subheadVariants}
              >
                BuildSmarter™ Feasibility transforms complex public, municipal, and construction data into a single verified source of truth—helping you make faster, safer, and more profitable decisions.
              </motion.p>

              {/* CTA Group */}
              <motion.div variants={ctaVariants}>
                {/* Phase 1: Magnetic CTA */}
                <motion.div
                  animate={{
                    x: mousePosition.x,
                    y: mousePosition.y,
                  }}
                  transition={{ type: "spring", stiffness: 150, damping: 15 }}
                >
                  <Button
                    ref={buttonRef}
                    size="lg"
                    className="bg-[#FF7A00] hover:bg-[#FF9240] active:bg-[#D96500] text-white font-semibold font-cta rounded-full px-8 py-6 text-lg shadow-[0_4px_20px_rgba(255,122,0,0.4)] hover:shadow-[0_6px_30px_rgba(255,122,0,0.6)] transition-all duration-250 group relative overflow-hidden focus-visible:ring-2 focus-visible:ring-[#06B6D4] focus-visible:ring-offset-2"
                    onClick={() => (window.location.href = "/application?step=2")}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <span className="relative z-10">Generate My Feasibility Report</span>
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
                </motion.div>
                
                {/* Microcopy with Phase 4: Number Counter */}
                <p className="mt-3 text-sm text-[#CBD5E1]/70">
                  Verified from <span className="font-semibold text-[#06B6D4]">{dataSourceCount}+</span> trusted data sources · Cost-calibrated from real projects · 10-minute turnaround
                </p>
              </motion.div>

              {/* Phase 3: Value Icons Strip with Hover Interactions */}
              <TooltipProvider>
                <motion.div
                  className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 text-[#CBD5E1] text-sm"
                  initial="hidden"
                  animate="visible"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className="flex items-start gap-3 cursor-pointer"
                        custom={0}
                        variants={valueIconVariants}
                        whileHover={{ scale: 1.05, x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <motion.div
                          whileHover={{ rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Layers className="h-5 w-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                        </motion.div>
                        <div>
                          <div className="font-semibold text-white">Proprietary Data Fusion</div>
                          <div className="text-xs text-[#CBD5E1]/60 mt-0.5">20+ verified datasets unified</div>
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-[#0A0F2C] border-[#06B6D4]/30">
                      <p className="text-xs">Municipal records, zoning maps, utility data, and more</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className="flex items-start gap-3 cursor-pointer"
                        custom={1}
                        variants={valueIconVariants}
                        whileHover={{ scale: 1.05, x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <motion.div
                          whileHover={{ rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <DollarSign className="h-5 w-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                        </motion.div>
                        <div>
                          <div className="font-semibold text-white">Cost Intelligence</div>
                          <div className="text-xs text-[#CBD5E1]/60 mt-0.5">Construction-cost benchmarks</div>
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-[#0A0F2C] border-[#06B6D4]/30">
                      <p className="text-xs">Real-time material costs, labor rates, and project estimates</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className="flex items-start gap-3 cursor-pointer"
                        custom={2}
                        variants={valueIconVariants}
                        whileHover={{ scale: 1.05, x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <motion.div
                          whileHover={{ rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ShieldCheck className="h-5 w-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                        </motion.div>
                        <div>
                          <div className="font-semibold text-white">Risk Transparency</div>
                          <div className="text-xs text-[#CBD5E1]/60 mt-0.5">Instant constraint exposure</div>
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-[#0A0F2C] border-[#06B6D4]/30">
                      <p className="text-xs">Flood zones, easements, environmental restrictions</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className="flex items-start gap-3 cursor-pointer"
                        custom={3}
                        variants={valueIconVariants}
                        whileHover={{ scale: 1.05, x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <motion.div
                          whileHover={{ rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <BarChart3 className="h-5 w-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                        </motion.div>
                        <div>
                          <div className="font-semibold text-white">Decision Clarity</div>
                          <div className="text-xs text-[#CBD5E1]/60 mt-0.5">Quantified feasibility scores</div>
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-[#0A0F2C] border-[#06B6D4]/30">
                      <p className="text-xs">0-100 scores for buildability, cost, and market potential</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              </TooltipProvider>

              {/* Below-the-Fold Follow-Up Line */}
              <motion.p
                className="mt-8 pt-6 border-t border-white/10 text-xs md:text-sm text-[#CBD5E1]/50 italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.4 }}
              >
                Powered by BuildSmarter's proprietary intelligence engine that fuses 20+ verified datasets into one model for true development clarity.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
