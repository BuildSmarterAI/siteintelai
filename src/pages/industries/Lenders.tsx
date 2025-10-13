import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { useCounter } from "@/hooks/useCounter";
import { 
  Building2, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Bot, 
  Layers,
  Lightbulb,
  Shield,
  CheckCircle,
  XCircle,
  Navigation,
  Droplets,
  Users,
  AlertTriangle,
  Upload,
  FileCheck,
  Lock,
  Clock,
  Grid3x3,
  Target
} from "lucide-react";

const Lenders = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 150]);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const accuracyCount = useCounter(10, 2000, 300);
  const timeReductionCount = useCounter(85, 2000, 600);
  const savingsCount = useCounter(4205, 2000, 900);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHovering || prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMousePosition({ x: x * 0.1, y: y * 0.1 });
  };

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "SiteIntel™ Feasibility for Lenders",
      "applicationCategory": "BusinessApplication",
      "description": "AI-verified feasibility reports for commercial real estate underwriting. Standardized, audit-ready intelligence that reduces review time by 85%.",
      "offers": {
        "@type": "Offer",
        "price": "795",
        "priceCurrency": "USD"
      },
      "audience": {
        "@type": "Audience",
        "audienceType": "Commercial Real Estate Lenders and Underwriters"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta Tags */}
      <title>Lender-Ready Feasibility | SiteIntel™ for Underwriters</title>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[90vh] overflow-hidden bg-gradient-to-br from-navy via-midnight-blue to-charcoal">
        {/* Parallax Background */}
        <motion.div 
          style={{ y: prefersReducedMotion ? 0 : heroY }}
          className="absolute inset-0 opacity-20"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_hsl(var(--data-cyan))_0%,_transparent_50%)]" />
        </motion.div>

        {/* Blueprint Grid Overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-data-cyan" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Corner Brackets */}
            <path d="M 0 0 L 60 0 L 60 10 M 0 0 L 0 60 L 10 60" stroke="currentColor" strokeWidth="2" className="text-feasibility-orange" fill="none" />
            <path d="M 100% 0 L calc(100% - 60px) 0 L calc(100% - 60px) 10 M 100% 0 L 100% 60 L calc(100% - 10px) 60" stroke="currentColor" strokeWidth="2" className="text-feasibility-orange" fill="none" />
          </svg>
        </div>

        {/* Animated Verification Nodes */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { x: '15%', y: '20%', delay: 0 },
            { x: '85%', y: '25%', delay: 0.3 },
            { x: '20%', y: '75%', delay: 0.6 },
            { x: '80%', y: '70%', delay: 0.9 },
          ].map((node, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: node.delay + 0.5, duration: 0.5 }}
              className="absolute"
              style={{ left: node.x, top: node.y }}
            >
              <div className="relative">
                <motion.div
                  animate={prefersReducedMotion ? {} : { scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: node.delay }}
                  className="w-3 h-3 rounded-full bg-data-cyan shadow-[0_0_20px_hsl(var(--data-cyan))]"
                />
                <motion.div
                  animate={prefersReducedMotion ? {} : { scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: node.delay }}
                  className="absolute inset-0 w-3 h-3 rounded-full bg-data-cyan"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Content Container */}
        <div className="relative z-10 container mx-auto px-6 lg:px-8 pt-24 pb-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto text-center"
          >
            {/* Logo */}
            <motion.div variants={itemVariants} className="mb-8">
              <img 
                src="/src/assets/buildsmarter-logo-new.png" 
                alt="BuildSmarter Logo" 
                className="h-12 mx-auto"
              />
            </motion.div>

            {/* Headline */}
            <motion.h1 
              variants={itemVariants}
              className="font-headline text-5xl md:text-7xl text-white mb-6 leading-tight"
            >
              AI-Verified Feasibility for Confident CRE Underwriting
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              variants={itemVariants}
              className="font-body text-xl md:text-2xl text-white/90 mb-8 leading-relaxed max-w-3xl mx-auto"
            >
              Replace incomplete borrower data with standardized, lender-ready feasibility intelligence you can verify.
            </motion.p>

            {/* Body Copy */}
            <motion.p 
              variants={itemVariants}
              className="font-body text-lg text-white/80 mb-12 leading-relaxed max-w-2xl mx-auto"
            >
              SiteIntel™ Feasibility transforms how lenders and underwriters evaluate commercial real-estate projects. 
              Instead of relying on inconsistent borrower documents or outdated reports, you can access a complete, 
              AI-verified feasibility summary — zoning, floodplain, utilities, and environmental risk — in under 60 seconds.
            </motion.p>

            {/* Data Source Icons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap gap-4 justify-center items-center mb-10"
            >
              {[
                { name: "FEMA NFHL", icon: Shield },
                { name: "ArcGIS", icon: Layers },
                { name: "EPA FRS", icon: ShieldCheck },
                { name: "TxDOT", icon: Navigation },
                { name: "USFWS", icon: Droplets },
                { name: "U.S. Census", icon: Users },
              ].map((source) => (
                <div key={source.name} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <source.icon className="w-4 h-4 text-data-cyan" />
                  <span className="text-sm font-semibold text-white">{source.name}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Button with Magnetic Effect */}
            <motion.div
              variants={itemVariants}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => {
                setIsHovering(false);
                setMousePosition({ x: 0, y: 0 });
              }}
              onMouseMove={handleMouseMove}
              className="inline-block"
            >
              <motion.div
                animate={prefersReducedMotion ? {} : {
                  x: mousePosition.x,
                  y: mousePosition.y,
                }}
                transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
              >
                <Button
                  variant="maxx-red"
                  size="lg"
                  className="text-lg px-10 py-6 h-auto font-cta font-bold relative overflow-hidden group"
                  onClick={() => window.location.href = '/application?step=2'}
                >
                  <span className="relative z-10">Run Free QuickCheck™ →</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={prefersReducedMotion ? {} : {
                      x: ['-200%', '200%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust Badge */}
            <motion.div variants={itemVariants} className="mt-8">
              <Badge variant="outline" className="bg-white/5 backdrop-blur-sm border-white/20 text-white text-sm px-4 py-2">
                AI-Verified | Data-Cited | FEMA-Backed
              </Badge>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main id="main-content" className="relative z-10">
        {/* Overview Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="font-headline text-4xl md:text-5xl text-navy mb-6">
                The New Standard for Transparent CRE Underwriting
              </h2>
              <p className="font-body text-lg text-charcoal/80 max-w-3xl mx-auto leading-relaxed">
                Inconsistent feasibility reports slow credit decisions and create compliance risk. 
                SiteIntel™ Feasibility eliminates guesswork by delivering standardized, audit-ready 
                intelligence — formatted specifically for underwriting workflows.
              </p>
            </motion.div>

            {/* Three Sub-Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  icon: AlertTriangle,
                  title: "Inconsistent Feasibility Creates Risk",
                  description: "Inconsistent feasibility reports slow credit decisions and create compliance risk. Borrowers submit inconsistent formats, outdated flood maps, or unverifiable utility information.",
                  color: "text-red-500",
                  bgColor: "bg-red-500/10",
                },
                {
                  icon: Zap,
                  title: "Standardized Intelligence",
                  description: "SiteIntel™ Feasibility eliminates guesswork by delivering standardized, audit-ready intelligence — formatted specifically for underwriting workflows.",
                  color: "text-feasibility-orange",
                  bgColor: "bg-feasibility-orange/10",
                },
                {
                  icon: ShieldCheck,
                  title: "AI-Verified Data",
                  description: "Lenders use our AI engine to confirm that every zoning, flood, and infrastructure claim is backed by authoritative data.",
                  color: "text-status-success",
                  bgColor: "bg-status-success/10",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="bg-white rounded-xl p-8 shadow-elev hover:shadow-strong transition-shadow border border-gray-100"
                >
                  <div className={`w-14 h-14 ${item.bgColor} rounded-xl flex items-center justify-center mb-6`}>
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <h3 className="font-headline text-xl text-navy mb-3">{item.title}</h3>
                  <p className="font-body text-charcoal/70 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Animated Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  value: `≈${accuracyCount} Minutes`, 
                  label: "Traditional vs SiteIntel™ Turnaround", 
                  color: "text-data-cyan",
                  from: "2-3 Weeks" 
                },
                { 
                  value: `${timeReductionCount}% Faster`, 
                  label: "Review Time Reduction", 
                  color: "text-feasibility-orange" 
                },
                { 
                  value: "Audit-Ready", 
                  label: "Compliance Documentation", 
                  color: "text-status-success" 
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="text-center p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200"
                >
                  {stat.from && (
                    <p className="font-body text-sm text-gray-400 line-through mb-1">{stat.from}</p>
                  )}
                  <p className={`font-headline text-3xl md:text-4xl ${stat.color} mb-2`}>{stat.value}</p>
                  <p className="font-body text-sm text-charcoal/70">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Secondary CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button variant="outline" size="lg" onClick={() => window.location.href = '/contact'}>
                Schedule a Demo →
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Pain Point Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-headline text-4xl md:text-5xl text-navy mb-6">
                Why Traditional Feasibility Slows Underwriting
              </h2>
              <p className="font-body text-lg text-charcoal/80 max-w-3xl mx-auto">
                Manual feasibility reports often lack data provenance. This creates friction across 
                credit committees and introduces unnecessary risk.
              </p>
            </motion.div>

            {/* Pain Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {[
                {
                  title: "No Data Provenance",
                  description: "Manual feasibility reports often lack data provenance, forcing underwriters to spend days validating assumptions.",
                },
                {
                  title: "Inconsistent Formats",
                  description: "Borrowers submit inconsistent formats across projects, creating review bottlenecks.",
                },
                {
                  title: "Outdated Information",
                  description: "Flood maps and utility data may be months or years old, introducing hidden risk.",
                },
                {
                  title: "Credit Committee Delays",
                  description: "Unverifiable information creates friction across credit committees and slows approvals.",
                },
              ].map((pain, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="bg-white rounded-xl p-6 shadow-md border-l-4 border-red-500"
                >
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-headline text-lg text-navy mb-2">{pain.title}</h3>
                      <p className="font-body text-charcoal/70">{pain.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button variant="outline" size="lg" onClick={() => window.location.href = '/how-it-works'}>
                See How It Works →
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-headline text-4xl md:text-5xl text-navy mb-6">
                Automated Feasibility Intelligence Built for Lenders
              </h2>
              <p className="font-body text-lg text-charcoal/80 max-w-3xl mx-auto">
                SiteIntel™ Feasibility standardizes borrower data into a single, AI-verified report that 
                integrates seamlessly with underwriting checklists. Each section is cited, timestamped, 
                and cross-checked against authoritative databases.
              </p>
            </motion.div>

            {/* Animated Timeline */}
            <div className="max-w-4xl mx-auto mb-16">
              <div className="relative">
                {/* Connection Line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 via-data-cyan to-status-success transform -translate-y-1/2 hidden md:block" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                  {[
                    { icon: Upload, title: "Borrower Submission", description: "Project data uploaded", color: "text-gray-500" },
                    { icon: Bot, title: "AI Validation", description: "Real-time verification", color: "text-data-cyan" },
                    { icon: FileCheck, title: "Lender Report", description: "Audit-ready output", color: "text-status-success" },
                  ].map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.2, duration: 0.5 }}
                      className="text-center"
                    >
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-white shadow-lg flex items-center justify-center border-4 ${i === 1 ? 'border-data-cyan' : i === 2 ? 'border-status-success' : 'border-gray-300'}`}>
                        <step.icon className={`w-10 h-10 ${step.color}`} />
                      </div>
                      <h3 className="font-headline text-xl text-navy mb-2">{step.title}</h3>
                      <p className="font-body text-sm text-charcoal/70">{step.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Benefits List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Zap, title: "Speed", description: "Review feasibility data in minutes — not days" },
                { icon: ShieldCheck, title: "Citations", description: "Every data point sourced from FEMA, ArcGIS, EPA, TxDOT" },
                { icon: Clock, title: "Timestamps", description: "Real-time data with verification timestamps" },
                { icon: FileCheck, title: "Audit Trail", description: "Complete documentation for regulatory compliance" },
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <CheckCircle className="w-8 h-8 text-status-success mb-4" />
                  <h3 className="font-headline text-lg text-navy mb-2">{benefit.title}</h3>
                  <p className="font-body text-sm text-charcoal/70">{benefit.description}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button variant="maxx-red" size="lg" onClick={() => window.location.href = '/contact'}>
                Book a 15-Minute Demo →
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Feature Grid (4 Pillars) */}
        <section className="py-20 bg-gradient-to-br from-navy via-midnight-blue to-charcoal text-white">
          <div className="container mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-headline text-4xl md:text-5xl mb-6">
                Why Lending Teams Choose SiteIntel™
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Zap,
                  title: "Speed",
                  description: "Review feasibility data in minutes — not days.",
                  hoverText: "Eliminate 2-3 week consultant delays",
                  number: 1,
                },
                {
                  icon: ShieldCheck,
                  title: "Data Trust",
                  description: "Every source is federally verified and cited.",
                  hoverText: "FEMA, EPA, ArcGIS, TxDOT verification",
                  number: 2,
                },
                {
                  icon: Layers,
                  title: "Standardization",
                  description: "Unified format across borrowers and asset classes.",
                  hoverText: "Consistent reports every time",
                  number: 3,
                },
                {
                  icon: FileCheck,
                  title: "Compliance Support",
                  description: "Audit-ready documentation aligned with OCC and FDIC expectations.",
                  hoverText: "Regulatory-grade documentation",
                  number: 4,
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="group relative bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:border-feasibility-orange/50 hover:bg-white/10 transition-all duration-300"
                >
                  {/* Number Badge */}
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-feasibility-orange/20 flex items-center justify-center text-feasibility-orange font-bold text-sm">
                    {feature.number}
                  </div>

                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-feasibility-orange/20 to-data-cyan/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-7 h-7 text-feasibility-orange" />
                  </div>

                  {/* Content */}
                  <h3 className="font-headline text-xl mb-3">{feature.title}</h3>
                  <p className="font-body text-white/80 mb-4">{feature.description}</p>
                  
                  {/* Hover Text */}
                  <p className="font-body text-sm text-data-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {feature.hoverText}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-navy">
                Get a Sample Report →
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Use Case Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-headline text-4xl md:text-5xl text-navy mb-6">
                From Submission to Credit Decision in One Day
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto bg-white rounded-2xl shadow-strong p-10 border border-gray-200"
            >
              {/* Case Study Header */}
              <div className="mb-8">
                <Badge className="mb-4">Case Study</Badge>
                <h3 className="font-headline text-2xl text-navy mb-4">
                  National CRE Lender: $12M Mixed-Use Project
                </h3>
                <p className="font-body text-charcoal/80 leading-relaxed">
                  A national CRE lender used SiteIntel™ Feasibility to validate borrower-submitted 
                  feasibility for a $12 million mixed-use project. The underwriting team confirmed 
                  zoning compliance and flood safety in under 15 minutes — reducing review time by 85%.
                </p>
              </div>

              {/* Before/After Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-red-50 rounded-xl p-6 border-l-4 border-red-500">
                  <h4 className="font-headline text-lg text-navy mb-3">Before SiteIntel™</h4>
                  <ul className="space-y-2 font-body text-sm text-charcoal/70">
                    <li className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      3 days of manual review
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      Multiple follow-up calls
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      Unverified data sources
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 rounded-xl p-6 border-l-4 border-status-success">
                  <h4 className="font-headline text-lg text-navy mb-3">After SiteIntel™</h4>
                  <ul className="space-y-2 font-body text-sm text-charcoal/70">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-status-success flex-shrink-0" />
                      30 minutes total review
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-status-success flex-shrink-0" />
                      Zero back-and-forth
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-status-success flex-shrink-0" />
                      AI-verified citations
                    </li>
                  </ul>
                </div>
              </div>

              {/* Pull Quote */}
              <blockquote className="border-l-4 border-feasibility-orange pl-6 italic text-xl text-navy mb-6">
                "We cut underwriting time from 3 days to 30 minutes."
              </blockquote>
              <p className="font-body text-sm text-charcoal/60">
                — Senior Underwriter, National CRE Lender
              </p>

              {/* Impact Metric */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <p className="font-headline text-4xl text-feasibility-orange mb-2">85% Faster</p>
                  <p className="font-body text-charcoal/70">Review Time Reduction</p>
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button variant="outline" size="lg">
                Read the Full Case →
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-headline text-4xl md:text-5xl text-navy mb-6">
                Traditional Feasibility vs SiteIntel™ for Underwriting
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="overflow-x-auto"
            >
              <table className="w-full max-w-6xl mx-auto border-collapse bg-white rounded-xl shadow-strong overflow-hidden">
                <thead>
                  <tr className="bg-navy text-white">
                    <th className="font-headline text-left p-6">Method</th>
                    <th className="font-headline text-center p-6">Status</th>
                    <th className="font-headline text-left p-6">Turnaround</th>
                    <th className="font-headline text-left p-6">Data Verification</th>
                    <th className="font-headline text-left p-6">Compliance Readiness</th>
                    <th className="font-headline text-left p-6">Cost Per Report</th>
                    <th className="font-headline text-left p-6">You Save</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Traditional Consultant */}
                  <tr className="border-b border-gray-200">
                    <td className="font-body p-6">Traditional Consultant</td>
                    <td className="text-center p-6">
                      <XCircle className="w-6 h-6 text-red-500 mx-auto" />
                    </td>
                    <td className="font-body p-6">2–3 Weeks</td>
                    <td className="font-body p-6">Manual</td>
                    <td className="font-body p-6">Low</td>
                    <td className="font-body p-6">$5,000+</td>
                    <td className="font-body p-6 text-gray-400">—</td>
                  </tr>

                  {/* Borrower Self-Reported */}
                  <tr className="border-b border-gray-200">
                    <td className="font-body p-6">Borrower Self-Reported</td>
                    <td className="text-center p-6">
                      <XCircle className="w-6 h-6 text-red-500 mx-auto" />
                    </td>
                    <td className="font-body p-6">Varies</td>
                    <td className="font-body p-6">Unverified</td>
                    <td className="font-body p-6">Inconsistent</td>
                    <td className="font-body p-6">N/A</td>
                    <td className="font-body p-6 text-gray-400">—</td>
                  </tr>

                  {/* SiteIntel™ */}
                  <motion.tr 
                    className="bg-gradient-to-r from-feasibility-orange/5 to-data-cyan/5 border-2 border-feasibility-orange relative"
                    animate={prefersReducedMotion ? {} : {
                      scale: [1, 1.01, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  >
                    <td className="font-body p-6 font-bold text-navy">
                      SiteIntel™ Feasibility
                      <Badge className="ml-2 bg-feasibility-orange text-white text-xs">RECOMMENDED</Badge>
                    </td>
                    <td className="text-center p-6">
                      <CheckCircle className="w-6 h-6 text-status-success mx-auto" />
                    </td>
                    <td className="font-body p-6 font-semibold">
                      ≈60 Seconds
                      <div className="mt-2 bg-gray-200 h-2 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-status-success"
                          initial={{ width: 0 }}
                          whileInView={{ width: "5%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </td>
                    <td className="font-body p-6">
                      AI-Verified Citations
                      <div className="text-xs text-charcoal/60 mt-1">(FEMA, ArcGIS, EPA)</div>
                    </td>
                    <td className="font-body p-6 font-semibold text-status-success">Audit-Ready</td>
                    <td className="font-body p-6 font-bold text-navy">
                      $795
                      <div className="mt-2 bg-gray-200 h-2 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-feasibility-orange"
                          initial={{ width: 0 }}
                          whileInView={{ width: "15.9%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </td>
                    <td className="font-body p-6">
                      <div className="font-bold text-feasibility-orange text-lg">$4,205</div>
                      <div className="text-sm text-charcoal/60">(84% less)</div>
                      <div className="font-bold text-status-success text-lg mt-2">2.9 weeks</div>
                      <div className="text-sm text-charcoal/60">(99% faster)</div>
                    </td>
                  </motion.tr>
                </tbody>
              </table>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button 
                variant="maxx-red" 
                size="lg"
                onClick={() => window.location.href = '/application?step=2'}
              >
                Run Free QuickCheck™ →
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-20 bg-gradient-to-br from-navy via-midnight-blue to-charcoal text-white">
          <div className="container mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-headline text-4xl md:text-5xl mb-6">
                Trusted by Lenders and Credit Teams Nationwide
              </h2>
              <p className="font-body text-lg text-white/80 max-w-3xl mx-auto">
                From regional banks to private credit funds, lending teams trust SiteIntel™ to verify 
                borrower data and streamline risk review. Our platform standardizes feasibility documentation 
                so underwriters can focus on analysis — not data chasing.
              </p>
            </motion.div>

            {/* Logo Wall */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 max-w-4xl mx-auto"
            >
              {["Regional Bank", "Private Credit Fund", "Commercial Lender", "Community Bank"].map((name, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-8 flex items-center justify-center border border-white/10 hover:border-white/30 transition-colors"
                >
                  <p className="font-headline text-sm text-white/60 text-center">{name}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Testimonials */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  quote: "SiteIntel™ cut our due diligence from 3 weeks to 1 day. Game changer.",
                  author: "Senior VP, Regional CRE Lender",
                },
                {
                  quote: "The data citations give our credit committee confidence we never had before.",
                  author: "Underwriting Manager, Private Credit",
                },
                {
                  quote: "We standardized feasibility review across 40+ loans. Regulatory compliance is seamless.",
                  author: "Chief Credit Officer, Community Bank",
                },
              ].map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <span key={j} className="text-feasibility-orange text-lg">★</span>
                    ))}
                  </div>
                  <p className="font-body text-white/90 mb-6 italic">"{testimonial.quote}"</p>
                  <p className="font-body text-sm text-white/60">— {testimonial.author}</p>
                </motion.div>
              ))}
            </div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex flex-wrap gap-6 justify-center items-center"
            >
              {[
                { icon: Shield, text: "SOC 2 Compliant" },
                { icon: Lock, text: "Bank-Level Encryption" },
                { icon: CheckCircle, text: "WCAG 2.1 AA" },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                  <badge.icon className="w-5 h-5 text-data-cyan" />
                  <span className="font-body text-sm text-white">{badge.text}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-navy">
                See Why Lenders Choose SiteIntel™ →
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Dataset Badges Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="text-center">
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
                    className="inline-flex items-center gap-2"
                  >
                    <source.icon className="w-5 h-5 text-data-cyan" />
                    <DataSourceBadge 
                      datasetName={source.name}
                      timestamp={new Date().toISOString()}
                    />
                  </motion.div>
                ))}
              </div>
              <p className="font-body text-sm text-charcoal/60 mt-6">
                6 verified data sources • Updated in real-time
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-navy text-white">
          <div className="container mx-auto px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-headline text-4xl md:text-6xl mb-6">
                Standardize Your Feasibility Process Today
              </h2>
              
              <p className="font-body text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                Start using AI-verified feasibility reports that reduce underwriting friction and speed 
                loan decisions. Run a QuickCheck™ now to see how SiteIntel™ transforms commercial 
                lending workflow in minutes.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Button 
                  variant="maxx-red"
                  size="lg"
                  className="text-lg px-10 py-6 h-auto font-cta font-bold"
                  onClick={() => window.location.href = '/application?step=2'}
                >
                  Run Free QuickCheck™ →
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-navy text-lg px-10 py-6 h-auto"
                  onClick={() => window.location.href = '/contact'}
                >
                  Request Enterprise Demo →
                </Button>
              </div>

              {/* Security Footer */}
              <div className="flex flex-wrap gap-6 justify-center items-center pt-8 border-t border-white/20">
                {[
                  { icon: Shield, text: "SOC 2 Compliant" },
                  { icon: Lock, text: "Data Encrypted" },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <badge.icon className="w-4 h-4 text-data-cyan" />
                    <span className="font-body text-sm text-white/80">{badge.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Lenders;
