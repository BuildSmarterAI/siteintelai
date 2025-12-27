import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Boxes } from "@/components/ui/background-boxes";
import { Database, Clock, Shield, Check } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Globe } from "@/components/ui/globe-feature-section";
import { supabase } from "@/integrations/supabase/client";

export const Hero = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [shouldDisableAnimations, setShouldDisableAnimations] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [isCtaLoading, setIsCtaLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lastUpdateTime = useRef(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    return () => window.removeEventListener('resize', checkDevice);
  }, [prefersReducedMotion]);

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
      navigate('/get-started');
    }, 300);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" as const } }
  };

  const headlineVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3, delay: 0.3 } }
  };

  const subheadVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2, delay: 0.5 } }
  };

  const ctaVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3, delay: 0.7, ease: "easeOut" as const } }
  };

  const trustVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, delay: 0.9 } }
  };

  return (
    <motion.section
      ref={sectionRef}
      className="relative flex min-h-screen overflow-hidden bg-[#0A0F2C]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Solid Midnight Blue Base Background */}
      <div className="absolute inset-0 z-0 bg-[#0A0F2C]" />

      {/* Interactive Background Boxes - Performance guarded */}
      {!shouldDisableAnimations && !isMobile && (
        <div className="absolute inset-0 z-[5] overflow-hidden">
          <div className="absolute inset-0 w-full h-full bg-[#0A0F2C] z-20 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)] pointer-events-none" />
          <Boxes />
        </div>
      )}

      {/* Mobile fallback gradient */}
      {(shouldDisableAnimations || isMobile) && (
        <div className="absolute inset-0 z-[1] bg-gradient-to-br from-[#0A0F2C] via-[#11224F]/50 to-[#0A0F2C]" />
      )}

      {/* Content wrapper */}
      <div className="relative z-[10] flex w-full items-center pointer-events-none">
        <div className="container relative mx-auto px-4 py-12 md:px-6 md:py-20 lg:py-24">
          <motion.div
            className="p-4 md:p-6 lg:p-8 xl:p-12 relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mx-auto max-w-3xl text-center md:text-left relative z-20">
              
              {/* Globe Background Layer */}
              <div className="absolute -right-32 md:-right-64 lg:-right-80 top-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] lg:w-[800px] lg:h-[800px] opacity-30 pointer-events-none z-0">
                <Globe />
              </div>

              {/* Headline */}
              <motion.h1
                className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6 md:mb-8"
                variants={headlineVariants}
                initial="hidden"
                animate="visible"
              >
                <span className="text-white">Instant Feasibility Intelligence for</span>
                <br />
                <span className="font-heading text-[#FF7A00]">Commercial Real Estate</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                className="text-sm sm:text-base md:text-xl lg:text-2xl text-white/90 leading-relaxed mb-8 md:mb-10 font-body"
                style={{ textShadow: '0 2px 8px rgba(10, 15, 44, 0.8)' }}
                variants={subheadVariants}
                initial="hidden"
                animate="visible"
              >
                Complete lender-ready feasibility reports in 60 seconds. Zoning, flood zones, utilities, environmental, traffic, and market data—all from authoritative sources.
              </motion.p>

              {/* Primary CTA */}
              <motion.div variants={ctaVariants} initial="hidden" animate="visible" className="mb-8 md:mb-10 pointer-events-auto">
                <motion.div
                  animate={{ x: shouldDisableAnimations ? 0 : mousePosition.x, y: shouldDisableAnimations ? 0 : mousePosition.y }}
                  transition={{ type: "spring", stiffness: 200, damping: 18 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    ref={buttonRef}
                    size="lg"
                    aria-label="Get your feasibility report for $999"
                    className="bg-[#FF7A00] hover:bg-[#FF9240] active:bg-[#D96500] text-white font-heading font-semibold rounded-full px-10 py-7 text-xl min-h-[56px] shadow-[0_4px_20px_rgba(255,122,0,0.4)] hover:shadow-[0_6px_30px_rgba(255,122,0,0.6)] transition-all duration-200 group relative overflow-hidden focus-visible:ring-2 focus-visible:ring-[#06B6D4] focus-visible:ring-offset-2 focus-visible:outline-none w-full md:w-auto"
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
                        animate={{ width: 200, height: 200, x: ripple.x - 100, y: ripple.y - 100, opacity: 0 }}
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
                          Loading...
                        </>
                      ) : (
                        "Get Your Report - $999"
                      )}
                    </span>
                    
                    {!shouldDisableAnimations && !isCtaLoading && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%', transition: { duration: 0.5, ease: 'easeInOut' } }}
                      />
                    )}
                  </Button>
                </motion.div>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                variants={trustVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 text-white/70 pointer-events-auto"
              >
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#06B6D4]" />
                  <span className="text-sm">FEMA • EPA • TxDOT</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#06B6D4]" />
                  <span className="text-sm">60-Second Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#06B6D4]" />
                  <span className="text-sm">Lender-Ready</span>
                </div>
              </motion.div>

              {/* Value Props */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1.1 }}
                className="mt-8 md:mt-10 flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-white/60 text-sm pointer-events-auto"
              >
                <span className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-400" />
                  Zoning Analysis
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-400" />
                  Flood Zone Data
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-400" />
                  Utility Infrastructure
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-400" />
                  Environmental
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-400" />
                  Traffic Data
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};
