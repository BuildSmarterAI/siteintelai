import { Button } from "@/components/ui/button";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import { useCounter } from "@/hooks/useCounter";
import siteintelLogo from "@/assets/siteintel-ai-logo-main.png";
import { 
  Building2, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Bot, 
  Layers,
  Target,
  Lightbulb,
  Shield,
  CheckCircle,
  XCircle,
  Navigation,
  Droplets,
  Users
} from "lucide-react";

const Developers = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  
  // Animated counters for stats
  const accuracyCounter = useCounter(99, 2000, 400);
  const savingsCounter = useCounter(92, 2000, 600);
  const timeCounter = useCounter(99, 2000, 800);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMousePosition({ x, y });
  };

  // Schema markup for SEO
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "SiteIntel™ Feasibility",
      "description": "AI-verified feasibility reports for commercial developers and investors",
      "brand": {
        "@type": "Brand",
        "name": "BuildSmarter"
      },
      "offers": {
        "@type": "Offer",
        "price": "795",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "500"
      }
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Skip to main content - Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-feasibility-orange focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none focus:ring-4 focus:ring-feasibility-orange/50"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      {/* Hero Section with Parallax & Animations */}
      <section className="relative flex min-h-[85vh] overflow-hidden bg-gradient-to-br from-midnight-blue via-[#11224F] to-midnight-blue">
        {/* Parallax Background */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-midnight-blue/95 via-[#11224F]/90 to-midnight-blue/95"
          style={{ y: heroY }}
        />
        
        {/* Blueprint Grid Overlay */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="blueprint-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="hsl(var(--data-cyan))" strokeWidth="1" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
          </svg>
          
          {/* Corner Brackets */}
          {[
            { top: '10%', left: '15%' },
            { top: '25%', right: '20%' },
            { top: '60%', left: '10%' },
            { top: '75%', right: '25%' },
          ].map((pos, i) => (
            <motion.div
              key={i}
              className="absolute w-8 h-8"
              style={pos}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
            >
              <svg viewBox="0 0 32 32" className="text-data-cyan">
                <path d="M0,8 L0,0 L8,0" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M24,0 L32,0 L32,8" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M32,24 L32,32 L24,32" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M8,32 L0,32 L0,24" fill="none" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </motion.div>
          ))}
        </div>

        {/* Animated Verification Nodes */}
        {[
          { top: '15%', left: '20%', delay: 0 },
          { top: '30%', right: '15%', delay: 0.4 },
          { top: '70%', left: '12%', delay: 0.8 },
          { top: '55%', right: '18%', delay: 1.2 },
        ].map((node, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ top: node.top, ...(node.left ? { left: node.left } : { right: node.right }) }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: node.delay, duration: 0.4 }}
          >
            <div className="relative">
              {/* Pulsing outer ring */}
              <motion.div
                className="absolute inset-0 w-12 h-12 rounded-full bg-data-cyan/30"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: node.delay,
                }}
              />
              {/* Inner solid circle */}
              <div className="relative w-12 h-12 rounded-full bg-data-cyan/40 backdrop-blur-sm flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-data-cyan shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
              </div>
            </div>
          </motion.div>
        ))}

        <div className="relative z-10 flex w-full items-center">
          <div className="container mx-auto px-6 lg:px-20">
            <motion.div 
              className="max-w-3xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="rounded-3xl bg-white/15 backdrop-blur-xl border border-data-cyan/20 p-8 md:p-12 shadow-[0_8px_32px_0_rgba(10,15,44,0.37)]">
                <div className="absolute inset-0 bg-gradient-to-br from-midnight-blue/40 to-transparent pointer-events-none rounded-3xl" />
                
                <div className="relative z-10">
                  {/* BuildSmarter Logo */}
                  <motion.div
                    className="mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <img 
                      src={siteintelLogo} 
                      alt="SiteIntel AI Logo" 
                      className="h-14 w-auto drop-shadow-[0_0_12px_rgba(255,122,0,0.6)]"
                    />
                  </motion.div>

                  <h1 className="text-5xl sm:text-6xl md:text-7xl font-headline font-bold text-white leading-[1.1] mb-6">
                    AI Feasibility Built for <span className="text-feasibility-orange">Commercial Developers & Investors</span>
                  </h1>
                  <p className="text-lg md:text-xl lg:text-2xl text-cloud-white/90 leading-relaxed mb-10 font-body">
                    SiteIntel™ Feasibility delivers AI-verified, data-cited reports that help developers and investors move faster, reduce risk, and unlock higher returns.
                  </p>
                  
                  {/* Magnetic CTA Button */}
                  <motion.div
                    className="inline-block"
                    animate={isHovering ? {
                      x: mousePosition.x * 0.3,
                      y: mousePosition.y * 0.3,
                    } : {
                      x: 0,
                      y: 0,
                    }}
                    transition={{ type: "spring", stiffness: 150, damping: 15 }}
                  >
                    <Button
                      asChild
                      variant="maxx-red"
                      size="lg"
                      className="text-lg md:text-xl px-8 py-4 h-auto font-cta relative overflow-hidden group"
                      onMouseMove={handleMouseMove}
                      onMouseEnter={() => setIsHovering(true)}
                      onMouseLeave={() => {
                        setIsHovering(false);
                        setMousePosition({ x: 0, y: 0 });
                      }}
                      aria-label="Start your feasibility analysis now"
                    >
                      <Link to="/application?step=2">
                        <span className="relative z-10">Start Your Analysis →</span>
                        {/* Shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: '-100%' }}
                          whileHover={{
                            x: '100%',
                            transition: { duration: 0.6, ease: "easeInOut" }
                          }}
                        />
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main id="main-content">
        {/* Overview Section - Visual Hierarchy with 3 Sub-Sections */}
        <section className="bg-white py-16 md:py-24">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                {/* The Challenge */}
                <motion.div
                  className="bg-white border-l-4 border-feasibility-orange p-6 rounded-lg hover:shadow-lg transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0 }}
                >
                  <Target className="w-12 h-12 text-feasibility-orange mb-4" aria-hidden="true" />
                  <h3 className="text-h3 text-navy mb-3">The Challenge</h3>
                  <p className="font-body text-base text-charcoal/85 leading-relaxed">
                    Instead of waiting weeks for traditional consultants, developers and investors need instant, verified answers to move on profitable opportunities.
                  </p>
                </motion.div>

                {/* The Solution */}
                <motion.div
                  className="bg-white border-l-4 border-data-cyan p-6 rounded-lg hover:shadow-lg transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <Lightbulb className="w-12 h-12 text-data-cyan mb-4" aria-hidden="true" />
                  <h3 className="text-h3 text-navy mb-3">The Solution</h3>
                  <p className="font-body text-base text-charcoal/85 leading-relaxed">
                    Each report consolidates zoning, floodplain, utility, environmental, traffic, and market data into one authoritative source in minutes.
                  </p>
                </motion.div>

                {/* The Trust */}
                <motion.div
                  className="bg-white border-l-4 border-status-success p-6 rounded-lg hover:shadow-lg transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <Shield className="w-12 h-12 text-status-success mb-4" aria-hidden="true" />
                  <h3 className="text-h3 text-navy mb-3">The Trust</h3>
                  <p className="font-body text-base text-charcoal/85 leading-relaxed">
                    Powered by datasets from FEMA, ArcGIS, EPA, TxDOT, USFWS, and Census — verified data that investors trust.
                  </p>
                </motion.div>
              </div>

              {/* Pull Quote Stats */}
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <motion.div
                  className="text-center p-6 bg-gradient-to-br from-data-cyan/5 to-data-cyan/10 rounded-xl"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-5xl font-headline font-bold text-data-cyan mb-2" aria-live="polite">
                    {accuracyCounter}%
                  </div>
                  <div className="text-sm font-body text-charcoal/70">Accuracy Rate</div>
                </motion.div>

                <motion.div
                  className="text-center p-6 bg-gradient-to-br from-feasibility-orange/5 to-feasibility-orange/10 rounded-xl"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="text-5xl font-headline font-bold text-feasibility-orange mb-2" aria-live="polite">
                    {savingsCounter}%
                  </div>
                  <div className="text-sm font-body text-charcoal/70">Cost Savings</div>
                </motion.div>

                <motion.div
                  className="text-center p-6 bg-gradient-to-br from-status-success/5 to-status-success/10 rounded-xl"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="text-5xl font-headline font-bold text-status-success mb-2" aria-live="polite">
                    {timeCounter}%
                  </div>
                  <div className="text-sm font-body text-charcoal/70">Faster Delivery</div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose SiteIntel - Feature Grid */}
        <section className="bg-light-gray py-16 md:py-24">
          <div className="container mx-auto px-6 lg:px-8">
            <h2 className="font-headline text-4xl md:text-5xl text-charcoal text-center mb-12 md:mb-16">
              Why CRE Developers & Investors Choose SiteIntel™
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  icon: Zap,
                  title: "Speed to Decision",
                  description: "Evaluate development and acquisition opportunities in minutes — not weeks.",
                  number: 1,
                },
                {
                  icon: ShieldCheck,
                  title: "Capital Protection",
                  description: "Identify zoning, flood, or infrastructure constraints before committing earnest money or pre-development capital.",
                  number: 2,
                },
                {
                  icon: ShieldCheck,
                  title: "Data Integrity",
                  description: "Verified GIS and federal data — no third-party estimates or assumptions.",
                  number: 3,
                },
                {
                  icon: Bot,
                  title: "AI Precision",
                  description: "Deterministic modeling and schema validation deliver 99% accuracy.",
                  number: 4,
                },
                {
                  icon: Layers,
                  title: "Portfolio Scale",
                  description: "Screen multiple sites rapidly to prioritize the best investments.",
                  number: 5,
                },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  {/* Number Badge */}
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gradient-to-br from-feasibility-orange to-maxx-red flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {feature.number}
                  </div>
                  
                  {/* Gradient Icon Background */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-data-cyan/20 to-navy/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-8 h-8 text-navy" aria-hidden="true" />
                  </div>
                  
                  <h3 className="font-body font-semibold text-lg md:text-xl text-navy mb-3">
                    {feature.title}
                  </h3>
                  <p className="font-body text-base text-charcoal leading-relaxed">{feature.description}</p>
                  
                  {/* Border animation on hover */}
                  <motion.div
                    className="absolute inset-0 border-2 border-feasibility-orange rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none"
                    initial={false}
                    animate={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Credibility Section */}
        <section className="bg-white py-16 md:py-24">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <h3 className="font-headline text-4xl md:text-5xl text-charcoal text-center mb-8">
                The New Standard in CRE Feasibility
              </h3>
              <p className="font-body text-lg md:text-xl text-charcoal/85 leading-relaxed text-center mb-6 max-w-4xl mx-auto">
                For commercial developers and investors, time kills opportunity. SiteIntel™ replaces weeks of consultant coordination with a single AI-driven platform that delivers verified data and clear answers, fast.
              </p>
              <p className="font-body text-lg md:text-xl text-charcoal/85 leading-relaxed text-center mb-12 max-w-4xl mx-auto">
                Each report pulls directly from authoritative datasets — FEMA NFHL, ArcGIS Parcels, TxDOT Traffic, EPA FRS, USFWS Wetlands, and U.S. Census ACS — ensuring accuracy that's trusted by institutions and private-equity partners alike.
              </p>
              
              {/* Dataset Badges with Staggered Animation */}
              <div className="mb-8">
                <p className="font-headline text-2xl text-navy text-center mb-6">Powered by Verified Data Sources</p>
                <div className="flex flex-wrap gap-3 justify-center items-center">
                {[
                  { name: "FEMA NFHL", icon: Shield },
                  { name: "ArcGIS Parcels", icon: Layers },
                  { name: "TxDOT Traffic", icon: Navigation },
                  { name: "EPA FRS", icon: ShieldCheck },
                  { name: "USFWS Wetlands", icon: Droplets },
                  { name: "U.S. Census ACS", icon: Users },
                ].map((source, i) => (
                    <motion.div
                      key={source.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                    >
                      <DataSourceBadge 
                        datasetName={source.name}
                        timestamp={new Date().toISOString()} 
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lifecycle Section */}
        <section className="bg-light-gray py-16 md:py-24">
          <div className="container mx-auto px-6 lg:px-8">
            <h2 className="font-headline text-4xl md:text-5xl text-charcoal text-center mb-12 md:mb-16">
              Built for the Commercial Real Estate Lifecycle
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {/* For Developers */}
              <motion.div
                className="bg-gradient-to-br from-data-cyan/5 to-white border border-gray-200 rounded-lg p-6 md:p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-8 h-8 text-navy" aria-hidden="true" />
                  <h3 className="font-body font-semibold text-lg md:text-xl text-navy">For Developers</h3>
                </div>
                <p className="font-body text-base md:text-lg text-charcoal leading-relaxed">
                  SiteIntel™ lets development teams qualify parcels before bidding or design. Instant zoning and infrastructure visibility eliminate costly surprises, reduce feasibility extensions, and speed entitlement decisions.
                </p>
              </motion.div>

              {/* For Investors */}
              <motion.div
                className="bg-gradient-to-br from-status-success/5 to-white border border-gray-200 rounded-lg p-6 md:p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-8 h-8 text-navy" aria-hidden="true" />
                  <h3 className="font-body font-semibold text-lg md:text-xl text-navy">For Investors & Equity Partners</h3>
                </div>
                <p className="font-body text-base md:text-lg text-charcoal leading-relaxed">
                  Private-equity groups, REITs, and institutional investors rely on SiteIntel™ to verify assumptions before closing. Each AI-generated report includes citations from authoritative datasets — providing verifiable proof that accelerates underwriting and de-risks acquisitions.
                </p>
              </motion.div>
            </div>

            <p className="font-body text-lg md:text-xl text-center mt-10 font-semibold text-charcoal max-w-4xl mx-auto">
              By integrating SiteIntel™ into pre-acquisition workflows, CRE firms cut due-diligence time by over 90% and redirect savings straight to returns.
            </p>
          </div>
        </section>

        {/* Enhanced Comparison Table */}
        <section className="bg-white py-16 md:py-24">
          <div className="container mx-auto px-6 lg:px-8">
            <h2 className="font-headline text-4xl md:text-5xl text-charcoal text-center mb-12">
              Replace Manual Feasibility with Automated Intelligence
            </h2>
            
            <div className="overflow-x-auto max-w-6xl mx-auto">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-lg">
                <thead>
                  <tr className="bg-navy">
                    <th className="text-white py-4 px-6 text-left font-body font-semibold" scope="col">Status</th>
                    <th className="text-white py-4 px-6 text-left font-body font-semibold" scope="col">Method</th>
                    <th className="text-white py-4 px-6 text-left font-body font-semibold" scope="col">Cost</th>
                    <th className="text-white py-4 px-6 text-left font-body font-semibold" scope="col">Turnaround</th>
                    <th className="text-white py-4 px-6 text-left font-body font-semibold" scope="col">You Save</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Traditional Row */}
                  <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6" aria-label="Not recommended">
                      <XCircle className="w-6 h-6 text-destructive" aria-hidden="true" />
                    </td>
                    <td className="py-4 px-6 font-body text-charcoal">Traditional Consultant Study</td>
                    <td className="py-4 px-6">
                      <div className="font-body text-charcoal mb-2">$10,000+</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-destructive to-status-warning h-2 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: '100%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3 }}
                          aria-label="Full cost bar"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-body text-charcoal mb-2">3–4 weeks</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-gray-400 to-gray-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: '100%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.5 }}
                          aria-label="Full time bar"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6 font-body text-charcoal/50">—</td>
                  </tr>
                  
                  {/* SiteIntel Row with Pulse Animation */}
                  <motion.tr
                    className="bg-feasibility-orange/10 relative"
                    animate={{
                      boxShadow: [
                        '0 0 0 0 rgba(255, 122, 0, 0)',
                        '0 0 20px 2px rgba(255, 122, 0, 0.2)',
                        '0 0 0 0 rgba(255, 122, 0, 0)',
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  >
                    <td className="py-4 px-6" aria-label="Recommended">
                      <CheckCircle className="w-6 h-6 text-status-success" aria-hidden="true" />
                      <Badge className="absolute top-2 left-2 bg-status-success text-white text-xs">
                        RECOMMENDED
                      </Badge>
                    </td>
                    <td className="py-4 px-6 font-body font-semibold text-charcoal">SiteIntel™ Feasibility</td>
                    <td className="py-4 px-6">
                      <div className="font-body font-semibold text-feasibility-orange mb-2">$795</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-feasibility-orange to-status-warning h-2 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: '7.95%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3 }}
                          aria-label="Cost bar showing 7.95% of traditional cost"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-body font-semibold text-feasibility-orange mb-2">≈ 60 seconds</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-status-success to-data-cyan h-2 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: '0.5%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.5 }}
                          aria-label="Time bar showing 0.5% of traditional time"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-body font-bold text-feasibility-orange text-lg">$9,205</div>
                      <div className="text-xs text-charcoal/70">(92% less)</div>
                      <div className="font-body font-bold text-status-success text-sm mt-1">3.9 weeks</div>
                      <div className="text-xs text-charcoal/70">(99% faster)</div>
                    </td>
                  </motion.tr>
                </tbody>
              </table>
            </div>

            <motion.p
              className="font-body text-lg md:text-xl font-semibold text-center mt-8 text-charcoal"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1 }}
            >
              Result: 99% faster delivery and up to 12× cost savings per project — with audit-ready data that investors trust.
            </motion.p>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="bg-maxx-red text-white text-center py-16 md:py-24">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-headline text-4xl md:text-5xl mb-6">
                See Your Site's Feasibility in 60 Seconds
              </h2>
              <p className="font-body text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                Run your first QuickCheck™ free and discover how commercial developers and investors are modernizing feasibility analysis with SiteIntel™ Feasibility.
              </p>
              <Button
                asChild
                variant="default"
                size="lg"
                className="bg-white text-maxx-red hover:bg-white/90 text-lg md:text-xl px-8 py-4 h-auto font-cta focus:outline-none focus:ring-4 focus:ring-white/50"
                aria-label="Run free QuickCheck now"
              >
                <Link to="/application?step=2">
                  Run Free QuickCheck™ Now →
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Developers;