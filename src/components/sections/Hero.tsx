import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Layers, DollarSign, ShieldCheck, BarChart3, Building2, FileCheck } from "lucide-react";
import buildSmarterLogo from "@/assets/buildsmarter-logo-small.png";
import aerialPropertySite from "@/assets/aerial-property-site.jpg";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCounter } from "@/hooks/useCounter";
import { useState, useRef } from "react";
import { QuickCheckWidget } from "@/components/QuickCheckWidget";

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

  // Motion preference detection
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Performance detection for low-power mode
  const [isLowPower, setIsLowPower] = useState(false);
  
  useState(() => {
    const checkPerformance = () => {
      const connection = (navigator as any).connection;
      const isSaveData = connection?.saveData;
      const isSlowNetwork = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';
      setIsLowPower(isSaveData || isSlowNetwork || prefersReducedMotion);
    };
    checkPerformance();
  });

  // Magnetic button handler with motion preference check
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || prefersReducedMotion) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMousePosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  // Animation variants - Optimized timing (1.6s → 1.0s)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut" as const,
      },
    },
  };

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 0.08,
      transition: {
        duration: 0.2,
        delay: 0.2,
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
        delay: 0.3,
      },
    },
  };

  const subheadVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
        delay: 0.5,
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
        delay: 0.7,
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
        duration: 0.2,
        delay: 0.9 + i * 0.1,
      },
    }),
  };

  // Building footprint SVG shapes
  const BuildingFootprints = {
    rectangular: <rect width="20" height="28" rx="1" />,
    lShape: <path d="M 0 0 L 20 0 L 20 15 L 12 15 L 12 28 L 0 28 Z" />,
    complex: <path d="M 0 0 L 24 0 L 24 10 L 16 10 L 16 18 L 24 18 L 24 28 L 0 28 Z" />,
    square: <rect width="22" height="22" rx="1" />,
    tShape: <path d="M 8 0 L 16 0 L 16 12 L 26 12 L 26 20 L 0 20 L 0 12 L 8 12 Z" />,
    commercial: <path d="M 0 0 L 28 0 L 28 22 L 20 22 L 20 28 L 8 28 L 8 22 L 0 22 Z" />,
  };

  const footprintTypes = Object.keys(BuildingFootprints);

  return (
    <motion.section
      className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Step 1: Aerial Photo Background Layer */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.18 }}
        transition={{ duration: 1.5, delay: 0.2 }}
      >
        <div 
          className="absolute right-0 top-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${aerialPropertySite})`,
            filter: 'blur(2px)',
            transform: 'scale(1.05)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F2C] via-transparent to-[#0A0F2C]/60" />
      </motion.div>

      {/* Step 2: Enhanced Blueprint-Style Grid */}
      <motion.div
        className="absolute inset-0 opacity-0 z-[1]"
        variants={gridVariants}
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6, 182, 212, 0.12) 3px, transparent 3px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.12) 3px, transparent 3px),
            linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px, 80px 80px, 80px 80px, 80px 80px',
          y: gridY,
        }}
      >
        {/* Global Verification Sweep - Orange gradient wave */}
        {!isLowPower && (
          <motion.div
            className="absolute inset-0 h-full w-[200%] bg-gradient-to-r from-transparent via-[#FF7A00]/15 to-transparent will-change-transform"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: [0.45, 0, 0.2, 1],
              repeatDelay: 0,
            }}
          />
        )}

        {/* Parcel Verification Nodes with Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="verificationGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0)" />
              <stop offset="50%" stopColor="rgba(6, 182, 212, 0.8)" />
              <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
            </linearGradient>
            <radialGradient id="orangeGlow">
              <stop offset="0%" stopColor="rgba(255, 122, 0, 0.4)" />
              <stop offset="100%" stopColor="rgba(255, 122, 0, 0)" />
            </radialGradient>
          </defs>
          
          {/* Connection Lines between nodes */}
          {[...Array(window.innerWidth < 768 ? 2 : 4)].map((_, i) => {
            const startX = 15 + (i % 4) * 25;
            const startY = 20 + Math.floor(i / 4) * 25;
            const endX = startX + (Math.random() > 0.5 ? 25 : -25);
            const endY = startY + (Math.random() > 0.5 ? 25 : -25);
            return (
              <motion.path
                key={`line-${i}`}
                d={`M ${startX}% ${startY}% Q ${(startX + endX) / 2}% ${(startY + endY) / 2 - 5}% ${endX}% ${endY}%`}
                stroke="url(#verificationGlow)"
                strokeWidth="1.5"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: [0, 1, 1],
                  opacity: [0, 0.9, 0]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: [0.45, 0, 0.2, 1],
                }}
              />
            );
          })}
        </svg>

        {/* Step 2: Blueprint Corner Brackets */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {[
            { x: 10, y: 15 }, { x: 30, y: 15 }, { x: 50, y: 15 },
            { x: 10, y: 40 }, { x: 30, y: 40 }, { x: 70, y: 20 },
            { x: 15, y: 65 }, { x: 45, y: 70 }, { x: 85, y: 30 },
            { x: 65, y: 55 }, { x: 90, y: 75 }, { x: 25, y: 85 }
          ].map((pos, i) => (
            <motion.g
              key={`bracket-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 0.4, delay: 1.5 + i * 0.1 }}
            >
              <path
                d={`M ${pos.x}% ${pos.y}% h 2.5 M ${pos.x}% ${pos.y}% v 2.5`}
                stroke="rgba(255, 255, 255, 0.6)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="square"
              />
            </motion.g>
          ))}
        </svg>
      </motion.div>

      {/* Step 3: Data Verification Nodes & Building Footprints */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(window.innerWidth < 768 ? 2 : 6)].map((_, i) => {
          const x = 10 + (i % 5) * 20;
          const y = 15 + Math.floor(i / 5) * 22;
          const delay = i * 0.5;
          
          return (
            <motion.div
              key={`node-${i}`}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
              }}
            >
              {/* Orange verification glow */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  width: '60px',
                  height: '60px',
                  background: 'radial-gradient(circle, rgba(255, 122, 0, 0.3) 0%, rgba(255, 122, 0, 0) 70%)',
                  transform: 'translate(-50%, -50%) translateZ(0)',
                  willChange: 'transform, opacity',
                  contain: 'layout style paint',
                }}
                animate={{
                  scale: [0, 1.2, 0],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: delay,
                  ease: [0.45, 0, 0.2, 1],
                }}
              />
              
              {/* Cyan node */}
              <motion.div
                className="absolute w-[6px] h-[6px] rounded-full bg-[#06B6D4] shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                style={{
                  transform: 'translate(-50%, -50%) translateZ(0)',
                  willChange: 'transform, opacity',
                  contain: 'layout style paint',
                }}
                animate={{
                  opacity: [0.4, 1, 0.4],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: delay,
                  ease: [0.45, 0, 0.2, 1],
                }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Animated map background - right side with parallax */}
      <motion.div 
        className="absolute right-0 top-0 h-full w-full lg:w-1/2 opacity-20 will-change-transform"
        style={{ y: prefersReducedMotion ? 0 : backgroundY }}
      >
        <div className="relative h-full w-full">
          {/* Step 4: Data Stream Visualization with CRE Icons */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-[4]">
            <defs>
              <linearGradient id="streamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(6, 182, 212, 0)" />
                <stop offset="50%" stopColor="rgba(6, 182, 212, 0.6)" />
                <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
              </linearGradient>
            </defs>
            
            {[...Array(4)].map((_, i) => {
              const startX = Math.random() * 80 + 10;
              const startY = Math.random() * 80 + 10;
              const endX = Math.random() * 80 + 10;
              const endY = Math.random() * 80 + 10;
              
              return (
                <g key={`stream-${i}`}>
                  <motion.line
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
                  
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      delay: 0.9 + i * 0.5,
                      ease: "easeInOut",
                    }}
                  >
                    <motion.foreignObject
                      width="14"
                      height="14"
                      animate={{
                        x: [startX + '%', endX + '%'],
                        y: [startY + '%', endY + '%'],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: 0.9 + i * 0.5,
                        ease: "easeInOut",
                      }}
                      style={{ overflow: 'visible' }}
                    >
                      <div className="flex items-center justify-center w-full h-full">
                        {i % 4 === 0 && <Building2 className="w-3 h-3 text-[#06B6D4]" />}
                        {i % 4 === 1 && <DollarSign className="w-3 h-3 text-[#06B6D4]" />}
                        {i % 4 === 2 && <ShieldCheck className="w-3 h-3 text-[#06B6D4]" />}
                        {i % 4 === 3 && <FileCheck className="w-3 h-3 text-[#06B6D4]" />}
                      </div>
                    </motion.foreignObject>
                  </motion.g>
                </g>
              );
            })}
          </svg>

          {/* Simulated data nodes with pulse animation */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-[#06B6D4] shadow-[0_0_10px_rgba(6,182,212,0.5)]"
              style={{
                top: `${Math.random() * 80 + 10}%`,
                left: `${Math.random() * 80 + 10}%`,
                willChange: 'transform, opacity',
                contain: 'layout style paint',
                transform: 'translateZ(0)',
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
              className="rounded-3xl bg-[#0A0F2C]/80 backdrop-blur-2xl border border-[#06B6D4]/40 p-6 md:p-8 lg:p-12 shadow-elev relative overflow-hidden"
              style={{
                boxShadow: '0 8px 32px 0 rgba(10, 15, 44, 0.5), inset 0 0 60px rgba(6, 182, 212, 0.08)',
              }}
            >
              {/* Inner glow effect with cyan gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#06B6D4]/8 via-transparent to-[#FF7A00]/5 pointer-events-none" />

              {/* Headline */}
              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-headline font-bold text-white leading-[1.1] mb-6 md:mb-8"
                variants={headlineVariants}
              >
                Instant Feasibility Intelligence for <span className="text-[#FF7A00]">Commercial Real Estate</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                className="text-sm sm:text-base md:text-xl lg:text-2xl text-white/90 leading-relaxed mb-8 md:mb-12 font-body"
                style={{ textShadow: '0 2px 8px rgba(10, 15, 44, 0.8)' }}
                variants={subheadVariants}
              >
                SiteIntel AI™ streamlines site selection with instant insights on buildability, zoning, and compliance. Whether you're evaluating a new development or validating a project for financing, we provide the clarity and confidence to make smarter, faster decisions—so you can focus on building what's next.
              </motion.p>

              {/* QuickCheck Widget - Prominent Above CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mb-8 md:mb-10"
              >
                <QuickCheckWidget />
              </motion.div>

              {/* Divider with upgrade prompt */}
              <div className="relative mb-6 md:mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#06B6D4]/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#0A0F2C]/80 text-white/80 font-body">
                    Want Full Details?
                  </span>
                </div>
              </div>

              {/* CTA Group */}
              <motion.div variants={ctaVariants}>
                {/* Phase 1: Magnetic CTA */}
                <motion.div
                  animate={{
                    x: prefersReducedMotion ? 0 : mousePosition.x,
                    y: prefersReducedMotion ? 0 : mousePosition.y,
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 18 }}
                >
                  <Button
                    ref={buttonRef}
                    size="lg"
                    className="bg-[#FF7A00] hover:bg-[#FF9240] active:bg-[#D96500] text-white font-semibold font-cta rounded-full px-8 py-6 md:py-7 text-lg min-h-[48px] md:min-h-[3.5rem] shadow-[0_4px_20px_rgba(255,122,0,0.4)] hover:shadow-[0_6px_30px_rgba(255,122,0,0.6)] transition-all duration-200 group relative overflow-hidden focus-visible:ring-2 focus-visible:ring-[#06B6D4] focus-visible:ring-offset-2 focus-visible:outline-none"
                    onClick={() => (window.location.href = "/application?step=2")}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <span className="relative z-10">Get Report in 60 Seconds</span>
                    {/* Shimmer effect */}
                    {!prefersReducedMotion && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: '-100%' }}
                        whileHover={{
                          x: '100%',
                          transition: { duration: 0.5, ease: 'easeInOut' }
                        }}
                      />
                    )}
                  </Button>
                </motion.div>
                
                {/* Microcopy with Phase 4: Number Counter */}
                <p className="mt-4 md:mt-6 text-sm text-white/70 text-center md:text-left">
                  <span className="hidden md:inline">
                    Powered by proprietary data fusion from official sources · Cost-calibrated from real projects · 60-second turnaround
                  </span>
                  <span className="md:hidden">
                    FEMA, ArcGIS, TxDOT verified · 60-second delivery
                  </span>
                </p>
              </motion.div>

              {/* Phase 3: Value Icons Strip with Hover Interactions */}
            <TooltipProvider>
              <motion.div
                className="mt-10 md:mt-12 pt-8 md:pt-10 border-t border-[#CBD5E1]/20 text-[#CBD5E1] text-sm"
                initial="hidden"
                animate="visible"
              >
                {/* Mobile: Horizontal scroll */}
                <div className="md:hidden -mx-6 px-6">
                  <div className="overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide">
                    <div className="flex gap-6">
                      {/* Icon 1: Proprietary Data Fusion */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div
                            className="flex items-start gap-3 cursor-pointer min-w-[260px] snap-start"
                            custom={0}
                            variants={valueIconVariants}
                          >
                            <Layers className="h-5 w-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold text-white">Proprietary Data Fusion</div>
                              <div className="text-xs text-[#CBD5E1]/60 mt-0.5">Multiple verified datasets unified</div>
                            </div>
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-[#11224F] border-[#06B6D4]/40">
                          <p className="text-xs">Municipal records, zoning maps, utility data, and more</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Icon 2: Cost Intelligence */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div
                            className="flex items-start gap-3 cursor-pointer min-w-[260px] snap-start"
                            custom={1}
                            variants={valueIconVariants}
                          >
                            <DollarSign className="h-5 w-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold text-white">Cost Intelligence</div>
                              <div className="text-xs text-[#CBD5E1]/60 mt-0.5">Construction-cost benchmarks</div>
                            </div>
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-[#11224F] border-[#06B6D4]/40">
                          <p className="text-xs">Real-time material costs, labor rates, and project estimates</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Icon 3: Risk Transparency */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div
                            className="flex items-start gap-3 cursor-pointer min-w-[260px] snap-start"
                            custom={2}
                            variants={valueIconVariants}
                          >
                            <ShieldCheck className="h-5 w-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold text-white">Risk Transparency</div>
                            <div className="text-xs text-white/60 mt-0.5">Instant constraint exposure</div>
                          </div>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-[#11224F] border-[#06B6D4]/40">
                        <p className="text-xs">Flood zones, easements, environmental restrictions</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Icon 4: Decision Clarity */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          className="flex items-start gap-3 cursor-pointer min-w-[260px] snap-start"
                          custom={3}
                          variants={valueIconVariants}
                        >
                          <BarChart3 className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-white">Decision Clarity</div>
                            <div className="text-xs text-white/60 mt-0.5">Quantified feasibility scores</div>
                          </div>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-[#11224F] border-[#06B6D4]/40">
                          <p className="text-xs">0-100 scores for buildability, cost, and market potential</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Scroll indicator */}
                  <div className="flex justify-center items-center gap-1 mt-2">
                    <div className="h-1 w-1 rounded-full bg-[#06B6D4]" />
                    <div className="h-1 w-8 rounded-full bg-[#CBD5E1]/20" />
                    <p className="text-xs text-[#CBD5E1]/40 ml-2">Swipe for more →</p>
                  </div>
                </div>

                {/* Desktop: Original 2-column grid */}
                <div className="hidden md:grid md:grid-cols-2 gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className="flex items-start gap-3 cursor-pointer"
                        custom={0}
                        variants={valueIconVariants}
                        whileHover={{ scale: 1.05, x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <motion.div whileHover={{ rotate: 5 }} transition={{ duration: 0.2 }}>
                          <Layers className="h-5 w-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                        </motion.div>
                        <div>
                          <div className="font-semibold text-white">Proprietary Data Fusion</div>
                          <div className="text-xs text-white/60 mt-0.5">Multiple verified datasets unified</div>
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-[#11224F] border-[#06B6D4]/40">
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
                        <motion.div whileHover={{ rotate: 5 }} transition={{ duration: 0.2 }}>
                          <DollarSign className="h-5 w-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                        </motion.div>
                        <div>
                          <div className="font-semibold text-white">Cost Intelligence</div>
                          <div className="text-xs text-white/60 mt-0.5">Construction-cost benchmarks</div>
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-[#11224F] border-[#06B6D4]/40">
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
                      <motion.div whileHover={{ rotate: 5 }} transition={{ duration: 0.2 }}>
                        <ShieldCheck className="h-5 w-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                      </motion.div>
                      <div>
                        <div className="font-semibold text-white">Risk Transparency</div>
                        <div className="text-xs text-white/60 mt-0.5">Instant constraint exposure</div>
                      </div>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-[#11224F] border-[#06B6D4]/40">
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
                      <motion.div whileHover={{ rotate: 5 }} transition={{ duration: 0.2 }}>
                        <BarChart3 className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                      </motion.div>
                      <div>
                        <div className="font-semibold text-white">Decision Clarity</div>
                        <div className="text-xs text-white/60 mt-0.5">Quantified feasibility scores</div>
                      </div>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-[#11224F] border-[#06B6D4]/40">
                      <p className="text-xs">0-100 scores for buildability, cost, and market potential</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </motion.div>
            </TooltipProvider>

              {/* Below-the-Fold Follow-Up Line */}
              <motion.p
                className="mt-8 pt-6 border-t border-white/10 text-xs md:text-sm text-white/50 italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.4 }}
              >
                Powered by SiteIntel's proprietary intelligence engine that fuses verified public and municipal datasets into one unified model for true development clarity.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
