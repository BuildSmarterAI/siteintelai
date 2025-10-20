import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Database, Calculator, ShieldAlert, FileCheck, Building2, DollarSign, ShieldCheck, TrendingUp } from "lucide-react";
import siteintelIconLogo from "@/assets/siteintel-icon-logo.png";
import aerialPropertySite1920webp from "@/assets/aerial-property-site-1920w.webp";
import aerialPropertySite1024webp from "@/assets/aerial-property-site-1024w.webp";
import aerialPropertySite768webp from "@/assets/aerial-property-site-768w.webp";
import aerialPropertySite1920jpg from "@/assets/aerial-property-site.jpg";

import { useCounter } from "@/hooks/useCounter";
import { useState, useRef, useEffect, useCallback } from "react";
import { QuickCheckWidget } from "@/components/QuickCheckWidget";

export const Hero = () => {
  // Phase 1: Magnetic CTA - Mouse tracking
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [shouldDisableAnimations, setShouldDisableAnimations] = useState(false);
  const [ripples, setRipples] = useState<Array<{x: number, y: number, id: number}>>([]);
  const [isCtaLoading, setIsCtaLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lastUpdateTime = useRef(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Phase 4: Number Counter
  const dataSourceCount = useCounter(20, 2000, 1300);

  // Phase 5: Parallax Scroll
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);
  const backgroundScale = useTransform(scrollY, [0, 500], [1.05, 1.15]);
  const backgroundOpacity = useTransform(scrollY, [0, 400], [0.18, 0]);
  const nodeX = useTransform(scrollY, [0, 500], [0, 50]);
  const gridY = useTransform(scrollY, [0, 500], [0, 100]);

  // Motion preference detection
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Performance detection for low-power mode
  const [isLowPower, setIsLowPower] = useState(false);
  
  useEffect(() => {
    const checkPerformance = () => {
      const connection = (navigator as any).connection;
      const isSaveData = connection?.saveData;
      const isSlowNetwork = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';
      setIsLowPower(isSaveData || isSlowNetwork || prefersReducedMotion);
    };
    checkPerformance();
  }, [prefersReducedMotion]);

  // IntersectionObserver for lazy loading animations
  useEffect(() => {
    const checkDevice = () => {
      const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const smallScreen = window.innerWidth < 768;
      setIsMobile(mobileCheck || smallScreen);
      
      const connection = (navigator as any).connection;
      const isSaveData = connection?.saveData;
      const isSlowNetwork = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';
      const shouldDisable = mobileCheck || prefersReducedMotion || isSaveData || isSlowNetwork;
      
      setShouldDisableAnimations(shouldDisable);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      window.removeEventListener('resize', checkDevice);
      observer.disconnect();
    };
  }, [prefersReducedMotion]);

  // Throttled mouse tracking (60fps)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || shouldDisableAnimations) return;
    
    const now = performance.now();
    if (now - lastUpdateTime.current < 16) return;
    lastUpdateTime.current = now;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMousePosition({ x: x * 0.1, y: y * 0.1 });
  }, [shouldDisableAnimations]);

  const handleMouseLeave = useCallback(() => {
    setMousePosition({ x: 0, y: 0 });
  }, []);

  const handleCtaClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples([...ripples, { x, y, id: Date.now() }]);
    
    setIsCtaLoading(true);
    
    setTimeout(() => {
      window.location.href = "/beta-signup";
    }, 300);
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
        duration: 0.3,
        delay: 0.7,
        ease: "easeOut" as const,
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
      ref={sectionRef}
      className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Skip Link - visible only on keyboard focus */}
      <a 
        href="#quickcheck-form"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-[#FF7A00] focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:ring-offset-2"
        tabIndex={0}
      >
        Skip to QuickCheck form
      </a>
      {/* Step 1: Background Layer - Mobile conditional & parallax */}
      {!isMobile ? (
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.18 }}
          transition={{ duration: 1.5, delay: 0.2 }}
          style={{ 
            y: backgroundY,
            scale: backgroundScale,
            opacity: backgroundOpacity
          }}
        >
          <picture className="absolute right-0 top-0 w-full h-full">
            <source 
              srcSet={`${aerialPropertySite768webp} 768w, ${aerialPropertySite1024webp} 1024w, ${aerialPropertySite1920webp} 1920w`}
              sizes="100vw"
              type="image/webp"
            />
            <img
              src={aerialPropertySite1920jpg}
              alt=""
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover blur-[2px] scale-105"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F2C] via-transparent to-[#0A0F2C]/60" />
        </motion.div>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,15,44,0.6)_70%,rgba(10,15,44,0.9)_100%)]" />
        </div>
      )}

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
        {/* Global Verification Sweep - CSS Optimized */}
        {!shouldDisableAnimations && isVisible && (
          <div
            className="absolute inset-0 h-full w-[200%] bg-gradient-to-r from-transparent via-[#FF7A00]/15 to-transparent"
            style={{
              animation: 'verificationSweep 20s cubic-bezier(0.45, 0, 0.2, 1) infinite',
              willChange: 'transform'
            }}
            aria-hidden="true"
            role="presentation"
          />
        )}

        {/* Parcel Verification Nodes with Connections - CSS Optimized */}
        {!shouldDisableAnimations && isVisible && (
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
            role="presentation"
          >
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
            
            {/* Connection Lines between nodes - CSS animation */}
            {[...Array(window.innerWidth < 768 ? 2 : 4)].map((_, i) => {
              const startX = 15 + (i % 4) * 25;
              const startY = 20 + Math.floor(i / 4) * 25;
              const endX = startX + (Math.random() > 0.5 ? 25 : -25);
              const endY = startY + (Math.random() > 0.5 ? 25 : -25);
              return (
                <path
                  key={`line-${i}`}
                  d={`M ${startX}% ${startY}% Q ${(startX + endX) / 2}% ${(startY + endY) / 2 - 5}% ${endX}% ${endY}%`}
                  stroke="url(#verificationGlow)"
                  strokeWidth="1.5"
                  fill="none"
                  strokeDasharray="1000"
                  strokeDashoffset="1000"
                  style={{
                    animation: `connectionFlow 5s cubic-bezier(0.45, 0, 0.2, 1) ${i * 0.4}s infinite`
                  }}
                />
              );
            })}
          </svg>
        )}

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

      {/* Step 3: Data Verification Nodes & Building Footprints - Reduced count */}
      {!shouldDisableAnimations && isVisible && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true" role="presentation">
          {[...Array(isMobile ? 3 : 4)].map((_, i) => {
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
                x: nodeX,
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
      )}

      {/* Animated map background - right side with parallax */}
      <motion.div 
        className="absolute right-0 top-0 h-full w-full lg:w-1/2 opacity-20"
        style={{ y: prefersReducedMotion ? 0 : backgroundY }}
      >
        <div className="relative h-full w-full">
          {/* Step 4: Data Stream Visualization - Reduced count */}
          {!shouldDisableAnimations && isVisible && (
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none z-[4]"
              aria-hidden="true"
              role="presentation"
            >
              <defs>
                <linearGradient id="streamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(6, 182, 212, 0)" />
                  <stop offset="50%" stopColor="rgba(6, 182, 212, 0.6)" />
                  <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
                </linearGradient>
              </defs>
              
              {[...Array(isMobile ? 2 : 3)].map((_, i) => {
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
          )}

          {/* Simulated data nodes with pulse animation - Reduced count */}
          {!shouldDisableAnimations && isVisible && [...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-[#06B6D4] shadow-[0_0_10px_rgba(6,182,212,0.5)]"
              style={{
                top: `${Math.random() * 80 + 10}%`,
                left: `${Math.random() * 80 + 10}%`,
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

      {/* Content wrapper with glass card effect - Enhanced z-index & breathing */}
      <div className="relative z-20 flex w-full items-center">
        <div className="container relative mx-auto px-4 py-12 md:px-6 md:py-20 lg:py-24">
          <motion.div
            className="rounded-3xl bg-[#0A0F2C]/90 backdrop-blur-2xl border border-[#06B6D4]/40 p-4 md:p-6 lg:p-8 xl:p-12 relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              boxShadow: '0 16px 48px rgba(10, 15, 44, 0.8), inset 0 0 60px rgba(6, 182, 212, 0.08)',
            }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-[#06B6D4]/8 via-transparent to-[#FF7A00]/5 pointer-events-none"
              animate={{
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
            />
            
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                boxShadow: [
                  '0 16px 48px rgba(10, 15, 44, 0.8)',
                  '0 20px 56px rgba(6, 182, 212, 0.15)',
                  '0 16px 48px rgba(10, 15, 44, 0.8)',
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
            />

            <div className="mx-auto max-w-3xl text-center md:text-left relative z-20">
              <motion.div
                className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-[#FF7A00]/10 border border-[#FF7A00]/30 backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.25 }}
              >
                <TrendingUp className="w-4 h-4 text-[#FF7A00]" aria-hidden="true" />
                <span className="text-[#FF7A00] text-xs md:text-sm font-semibold">
                  10× Faster • 13× Cheaper
                </span>
              </motion.div>

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
                id="quickcheck-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mb-8 md:mb-10"
              >
                <h2 className="sr-only">Get Instant Feasibility Reports</h2>
                <QuickCheckWidget />
              </motion.div>

              {/* Divider with upgrade prompt */}
              <div className="relative mb-6 md:mb-8" aria-hidden="true" role="presentation">
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
              <motion.div 
                variants={ctaVariants}
                className="mb-6 md:mb-8 px-4"
              >
                <motion.div
                  animate={{
                    x: shouldDisableAnimations ? 0 : mousePosition.x,
                    y: shouldDisableAnimations ? 0 : mousePosition.y,
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 18 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    ref={buttonRef}
                    size="lg"
                    aria-label="Start your free feasibility QuickCheck in 60 seconds - Opens application form"
                    className="bg-[#FF7A00] hover:bg-[#FF9240] active:bg-[#D96500] text-white font-semibold font-cta rounded-full px-8 py-6 md:py-7 text-lg min-h-[48px] md:min-h-[3.5rem] shadow-[0_4px_20px_rgba(255,122,0,0.4)] hover:shadow-[0_6px_30px_rgba(255,122,0,0.6)] transition-all duration-200 group relative overflow-hidden focus-visible:ring-2 focus-visible:ring-[#06B6D4] focus-visible:ring-offset-2 focus-visible:outline-none w-full md:w-auto"
                    onClick={handleCtaClick}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    disabled={isCtaLoading}
                  >
                    {ripples.map(ripple => (
                      <motion.span
                        key={ripple.id}
                        className="absolute bg-white/30 rounded-full pointer-events-none"
                        initial={{ width: 0, height: 0, x: ripple.x, y: ripple.y }}
                        animate={{ 
                          width: 200, 
                          height: 200, 
                          x: ripple.x - 100, 
                          y: ripple.y - 100, 
                          opacity: 0 
                        }}
                        transition={{ duration: 0.6 }}
                        onAnimationComplete={() => setRipples(r => r.filter(rr => rr.id !== ripple.id))}
                      />
                    ))}
                    
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isCtaLoading ? (
                        <>
                          <motion.div
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Launching...
                        </>
                      ) : (
                        "Get Report in 60 Seconds"
                      )}
                    </span>
                    
                    {!shouldDisableAnimations && !isCtaLoading && (
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
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};
