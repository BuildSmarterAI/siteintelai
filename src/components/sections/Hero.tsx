import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Database, Clock, Shield, Search } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const Hero = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [shouldDisableAnimations, setShouldDisableAnimations] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [isCtaLoading, setIsCtaLoading] = useState(false);
  const [_isAuthenticated, setIsAuthenticated] = useState(false);
  const [addressInput, setAddressInput] = useState("");
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

  const handlePrimaryCtaClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples([...ripples, { x, y, id: Date.now() }]);
    setIsCtaLoading(true);
    setTimeout(() => {
      navigate('/quickcheck');
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

  const searchVariants = {
    hidden: { y: 10, opacity: 0, scale: 0.95 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.3, delay: 0.6, ease: "easeOut" as const } }
  };

  const trustVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, delay: 0.9 } }
  };

  const trustBadges = [
    { label: "20+ Data Sources", delay: 0 },
    { label: "97.3% Accuracy", delay: 0.2 },
    { label: "60-Second Delivery", delay: 0.4 },
  ];

  return (
    <motion.section
      ref={sectionRef}
      className="relative flex min-h-screen overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Gradient Background: Midnight Blue to Cloud White */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0A0F2C] via-[#0A0F2C]/90 to-[#F9FAFB]" />

      {/* Animated Map Grid Background */}
      {!shouldDisableAnimations && (
        <div className="absolute inset-0 z-[1] overflow-hidden opacity-20">
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#06B6D4" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          {/* Animated parcel outlines */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute border border-[#FF7A00]/30 rounded"
              style={{
                width: `${80 + i * 40}px`,
                height: `${60 + i * 30}px`,
                left: `${10 + i * 15}%`,
                top: `${20 + i * 10}%`,
              }}
              animate={{
                opacity: [0, 0.5, 0],
                scale: [0.95, 1, 0.95],
              }}
              transition={{
                duration: 4,
                delay: i * 0.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Mobile fallback gradient */}
      {(shouldDisableAnimations || isMobile) && (
        <div className="absolute inset-0 z-[1] bg-gradient-to-br from-[#0A0F2C] via-[#11224F]/50 to-[#0A0F2C]" />
      )}

      {/* Content wrapper */}
      <div className="relative z-[10] flex w-full items-center pointer-events-none">
        <div className="container relative mx-auto px-4 py-12 md:px-6 md:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
            {/* Left Column: Copy (60%) */}
            <motion.div
              className="lg:col-span-3 p-4 md:p-6 lg:p-8 relative overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="max-w-2xl text-center lg:text-left relative z-20">
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
                  className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed mb-6 font-body"
                  style={{ textShadow: '0 2px 8px rgba(10, 15, 44, 0.8)' }}
                  variants={subheadVariants}
                  initial="hidden"
                  animate="visible"
                >
                  AI-powered feasibility reports that aggregate 20+ authoritative government sources into lender-ready intelligence. Screen more deals. Kill bad sites faster. Close with confidence.
                </motion.p>

                {/* Body Copy */}
                <motion.p
                  className="text-sm md:text-base text-white/70 leading-relaxed mb-8 font-body"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  SiteIntel™ transforms commercial real estate due diligence from a fragmented, weeks-long process into instant, verified analysis. Enter any address and receive a comprehensive feasibility score with zoning, flood risk, utilities, environmental constraints, traffic counts, and market demographics—all cited from authoritative sources.
                </motion.p>

                {/* Address Search Input */}
                <motion.div
                  variants={searchVariants}
                  initial="hidden"
                  animate="visible"
                  className="mb-6 pointer-events-auto"
                >
                  <div className="relative max-w-xl mx-auto lg:mx-0">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter property address, cross-streets, or CAD/APN..."
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-base rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/20 focus:outline-none transition-all"
                    />
                  </div>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col sm:flex-row gap-4 mb-8 pointer-events-auto justify-center lg:justify-start"
                >
                  <motion.div
                    animate={{ x: shouldDisableAnimations ? 0 : mousePosition.x, y: shouldDisableAnimations ? 0 : mousePosition.y }}
                    transition={{ type: "spring", stiffness: 200, damping: 18 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      ref={buttonRef}
                      size="lg"
                      aria-label="Get your free site score"
                      className="bg-[#FF7A00] hover:bg-[#FF9240] active:bg-[#D96500] text-white font-heading font-semibold rounded-full px-10 py-7 text-lg min-h-[56px] shadow-[0_4px_20px_rgba(255,122,0,0.4)] hover:shadow-[0_6px_30px_rgba(255,122,0,0.6)] transition-all duration-200 group relative overflow-hidden focus-visible:ring-2 focus-visible:ring-[#06B6D4] focus-visible:ring-offset-2 focus-visible:outline-none w-full sm:w-auto"
                      onClick={handlePrimaryCtaClick}
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
                          "Get Free Site Score"
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

                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-7 text-lg font-heading"
                    onClick={() => navigate('/sample-report')}
                  >
                    See Sample Report →
                  </Button>
                </motion.div>

                {/* Trust Badges with Stagger Animation */}
                <motion.div
                  variants={trustVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-6 pointer-events-auto"
                >
                  {trustBadges.map((badge, index) => (
                    <motion.div
                      key={badge.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + badge.delay }}
                      className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                      <span className="text-sm text-white/80 font-medium">{badge.label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>

            {/* Right Column: Report Preview (40%) */}
            <motion.div
              className="lg:col-span-2 hidden lg:flex justify-center items-center pointer-events-none"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <motion.div
                className="relative"
                animate={!shouldDisableAnimations ? { y: [0, -10, 0] } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Report Preview Card */}
                <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-[320px] border border-slate-200">
                  {/* Score Badge */}
                  <motion.div
                    className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-[#22C55E] to-[#16A34A] rounded-full flex flex-col items-center justify-center shadow-lg border-4 border-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                  >
                    <span className="text-2xl font-bold text-white">82</span>
                    <span className="text-xs font-semibold text-white/90">A</span>
                  </motion.div>

                  {/* Report Header */}
                  <div className="mb-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded bg-[#FF7A00]/10 flex items-center justify-center">
                        <Database className="w-4 h-4 text-[#FF7A00]" />
                      </div>
                      <span className="font-heading font-semibold text-slate-900 text-sm">Site Feasibility Report</span>
                    </div>
                    <p className="text-xs text-slate-500">1234 Main Street, Houston, TX 77001</p>
                  </div>

                  {/* Report Sections Preview */}
                  <div className="space-y-3">
                    {[
                      { label: "Zoning", status: "C-2 Commercial", color: "bg-green-100 text-green-700" },
                      { label: "Flood Zone", status: "Zone X (Minimal)", color: "bg-green-100 text-green-700" },
                      { label: "Utilities", status: "All Available", color: "bg-green-100 text-green-700" },
                      { label: "Environmental", status: "No Constraints", color: "bg-green-100 text-green-700" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{item.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${item.color}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Shield className="w-3 h-3" />
                      <span>Lender-Ready</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>60s Delivery</span>
                    </div>
                  </div>
                </div>

                {/* Glow Effect */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#FF7A00]/20 to-[#06B6D4]/20 blur-3xl rounded-full scale-150" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};