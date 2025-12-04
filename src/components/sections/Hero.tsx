import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Boxes } from "@/components/ui/background-boxes";
import { Database, Calculator, ShieldAlert, FileCheck, ShieldCheck, TrendingUp } from "lucide-react";
import siteintelLogo from "@/assets/siteintel-ai-logo-main.png";
import { useCounter } from "@/hooks/useCounter";
import { useState, useRef, useEffect, useCallback } from "react";
import { QuickCheckWidget } from "@/components/QuickCheckWidget";
export const Hero = () => {
  // Phase 1: Magnetic CTA - Mouse tracking
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0
  });
  const [isMobile, setIsMobile] = useState(false);
  const [shouldDisableAnimations, setShouldDisableAnimations] = useState(false);
  const [ripples, setRipples] = useState<Array<{
    x: number;
    y: number;
    id: number;
  }>>([]);
  const [isCtaLoading, setIsCtaLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lastUpdateTime = useRef(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Phase 4: Number Counter
  const dataSourceCount = useCounter(20, 2000, 1300);

  // Motion preference detection
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Device and animation preference detection
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
    return () => {
      window.removeEventListener('resize', checkDevice);
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
    setMousePosition({
      x: x * 0.1,
      y: y * 0.1
    });
  }, [shouldDisableAnimations]);
  const handleMouseLeave = useCallback(() => {
    setMousePosition({
      x: 0,
      y: 0
    });
  }, []);
  const handleCtaClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples([...ripples, {
      x,
      y,
      id: Date.now()
    }]);
    setIsCtaLoading(true);
    setTimeout(() => {
      window.location.href = "/beta-signup";
    }, 300);
  };

  // Animation variants - Optimized timing (1.6s → 1.0s)
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut" as const
      }
    }
  };
  const headlineVariants = {
    hidden: {
      y: 20,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        delay: 0.3
      }
    }
  };
  const subheadVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
        delay: 0.5
      }
    }
  };
  const ctaVariants = {
    hidden: {
      y: 10,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        delay: 0.7,
        ease: "easeOut" as const
      }
    }
  };
  const valueIconVariants = {
    hidden: {
      opacity: 0
    },
    visible: (i: number) => ({
      opacity: 1,
      transition: {
        duration: 0.2,
        delay: 0.9 + i * 0.1
      }
    })
  };

  return <motion.section ref={sectionRef} className="relative flex min-h-screen overflow-hidden bg-[#0A0F2C]" variants={containerVariants} initial="hidden" animate="visible">
      {/* Skip Link - visible only on keyboard focus */}
      <a href="#quickcheck-form" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-[#FF7A00] focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:ring-offset-2" tabIndex={0}>
        Skip to QuickCheck form
      </a>
      {/* Solid Midnight Blue Base Background */}
      <div className="absolute inset-0 z-0 bg-[#0A0F2C]" />

      {/* Interactive Background Boxes - Performance guarded */}
      {!shouldDisableAnimations && !isMobile && (
        <div className="absolute inset-0 z-[5] overflow-hidden">
          {/* Radial mask to fade edges and focus on center content */}
          <div className="absolute inset-0 w-full h-full bg-[#0A0F2C] z-20 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)] pointer-events-none" />
          <Boxes />
        </div>
      )}

      {/* Mobile fallback gradient */}
      {(shouldDisableAnimations || isMobile) && (
        <div className="absolute inset-0 z-[1] bg-gradient-to-br from-[#0A0F2C] via-[#11224F]/50 to-[#0A0F2C]" />
      )}

      {/* Content wrapper - pointer-events-none allows hover on boxes, children opt back in */}
      <div className="relative z-[10] flex w-full items-center pointer-events-none">
        <div className="container relative mx-auto px-4 py-12 md:px-6 md:py-20 lg:py-24">
          <motion.div className="p-4 md:p-6 lg:p-8 xl:p-12 relative overflow-hidden" initial={{
          opacity: 0,
          scale: 0.95,
          y: 20
        }} animate={{
          opacity: 1,
          scale: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.3,
          ease: [0.22, 1, 0.36, 1]
        }}>

            <div className="mx-auto max-w-3xl text-center md:text-left relative z-20">
              

              {/* Headline */}
              <motion.h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6 md:mb-8" variants={headlineVariants} initial="hidden" animate="visible">
                <span className="text-white">Instant Feasibility Intelligence for</span>
                <br />
              <span className="font-heading text-[#FF7A00]">
                Commercial Real Estate
              </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p className="text-sm sm:text-base md:text-xl lg:text-2xl text-white/90 leading-relaxed mb-8 md:mb-12 font-body" style={{
              textShadow: '0 2px 8px rgba(10, 15, 44, 0.8)'
            }} variants={subheadVariants} initial="hidden" animate="visible">
                SiteIntel AI™ streamlines site selection with instant insights on buildability, zoning, and compliance. Whether you're evaluating a new development or validating a project for financing, we provide the clarity and confidence to make smarter, faster decisions—so you can focus on building what's next.
              </motion.p>

              {/* QuickCheck Widget - Prominent Above CTA */}
              <motion.div id="quickcheck-form" initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.6,
              delay: 0.8
            }} className="mb-8 md:mb-10 pointer-events-auto">
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
              <motion.div variants={ctaVariants} className="mb-6 md:mb-8 px-4 pointer-events-auto">
                <motion.div animate={{
                x: shouldDisableAnimations ? 0 : mousePosition.x,
                y: shouldDisableAnimations ? 0 : mousePosition.y
              }} transition={{
                type: "spring",
                stiffness: 200,
                damping: 18
              }} whileTap={{
                scale: 0.97
              }}>
                  <Button ref={buttonRef} size="lg" aria-label="Start your free feasibility QuickCheck in 60 seconds - Opens application form" className="bg-[#FF7A00] hover:bg-[#FF9240] active:bg-[#D96500] text-white font-heading font-semibold rounded-full px-8 py-6 md:py-7 text-lg min-h-[48px] md:min-h-[3.5rem] shadow-[0_4px_20px_rgba(255,122,0,0.4)] hover:shadow-[0_6px_30px_rgba(255,122,0,0.6)] transition-all duration-200 group relative overflow-hidden focus-visible:ring-2 focus-visible:ring-[#06B6D4] focus-visible:ring-offset-2 focus-visible:outline-none w-full md:w-auto" onClick={handleCtaClick} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} disabled={isCtaLoading}>
                    {ripples.map(ripple => <motion.span key={ripple.id} className="absolute bg-white/30 rounded-full pointer-events-none" initial={{
                    width: 0,
                    height: 0,
                    x: ripple.x,
                    y: ripple.y
                  }} animate={{
                    width: 200,
                    height: 200,
                    x: ripple.x - 100,
                    y: ripple.y - 100,
                    opacity: 0
                  }} transition={{
                    duration: 0.6
                  }} onAnimationComplete={() => setRipples(r => r.filter(rr => rr.id !== ripple.id))} />)}
                    
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isCtaLoading ? <>
                          <motion.div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" animate={{
                        rotate: 360
                      }} transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                      }} />
                          Launching...
                        </> : "Get Report in 60 Seconds"}
                    </span>
                    
                    {!shouldDisableAnimations && !isCtaLoading && <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" initial={{
                    x: '-100%'
                  }} whileHover={{
                    x: '100%',
                    transition: {
                      duration: 0.5,
                      ease: 'easeInOut'
                    }
                  }} />}
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>;
};