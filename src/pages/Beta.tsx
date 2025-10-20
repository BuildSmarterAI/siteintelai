import { Helmet } from "react-helmet";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { MapPin, Cpu, FileText, Building2, ShieldCheck, Lock, ChevronDown, LineChart, CheckCircle } from "lucide-react";
import { BetaBadge } from "@/components/beta/BetaBadge";
import { SeatsCounter } from "@/components/beta/SeatsCounter";
import { BetaSignupForm } from "@/components/beta/BetaSignupForm";
import { ScorePreviewCard } from "@/components/beta/ScorePreviewCard";
import { ParcelMapPreview } from "@/components/beta/ParcelMapPreview";
import { AuditTrailTable } from "@/components/beta/AuditTrailTable";
import { ExportButtonGrid } from "@/components/beta/ExportButtonGrid";
import { DataVerificationNodes } from "@/components/beta/DataVerificationNodes";
import ShaderBackground from "@/components/ui/shader-background";
import GlobeFeatureSection from "@/components/ui/globe-feature-section";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import siteintelBetaLogo from "@/assets/siteintel-beta-logo.png";
const Beta = () => {
  const heroRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0
  });
  const [isCtaHovered, setIsCtaHovered] = useState(false);
  const [ctaRipple, setCtaRipple] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [shouldDisableAnimations, setShouldDisableAnimations] = useState(false);
  const {
    scrollYProgress
  } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -50]);
  const bgY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);
  useEffect(() => {
    // Detect mobile and reduced motion
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShouldDisableAnimations(mediaQuery.matches);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    const handler = (e: MediaQueryListEvent) => setShouldDisableAnimations(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => {
      window.removeEventListener("resize", checkMobile);
      mediaQuery.removeEventListener("change", handler);
    };
  }, []);
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isMobile || shouldDisableAnimations) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMousePosition({
      x: x * 0.3,
      y: y * 0.3
    });
  };
  const handleMouseLeave = () => {
    setMousePosition({
      x: 0,
      y: 0
    });
  };
  const navigateToBetaSignup = () => {
    window.location.href = '/beta-signup';
  };
  const steps = [{
    number: "01",
    title: "Enter an Address or Parcel ID",
    description: "Type an address or drop a pin. SiteIntel™ instantly locates the parcel boundary and verifies it against public records.",
    icon: MapPin
  }, {
    number: "02",
    title: "AI & GIS Engine Runs Analysis",
    description: "The platform cross-references zoning, infrastructure, environmental, and market data — applying proprietary feasibility scoring within seconds.",
    icon: Cpu
  }, {
    number: "03",
    title: "Receive a Lender-Ready Report",
    description: "Download a professionally formatted PDF or view online. Every insight is auditable, consistent, and ready for underwriting or investor review.",
    icon: FileText
  }];
  const audiences = [{
    title: "Developers & Investors",
    icon: Building2,
    benefit: "Instant clarity on what's buildable and what's restricted.",
    metrics: ["60s report time", "13× cost savings", "Zero wait for consultants"]
  }, {
    title: "Lenders & Underwriters",
    icon: FileText,
    benefit: "Decision-ready feasibility formatted for institutional workflows.",
    metrics: ["Lender-grade PDFs", "Timestamped validation", "Audit-trail compliance"]
  }, {
    title: "Public Agencies & Reviewers",
    icon: ShieldCheck,
    benefit: "Transparent validation trail that aligns with regulatory standards.",
    metrics: ["Public-record sourced", "Municipal compatibility", "Review-ready format"]
  }];
  const faqs = [{
    question: "How is SiteIntel™ different from other AI tools?",
    answer: "We provide parcel-level feasibility verified against official records, structured for institutional review. Unlike generic AI tools, every data point is sourced from authoritative public-record systems with full audit trails."
  }, {
    question: "Do reports show where information comes from?",
    answer: "Yes — each section cites the category of record (federal, state, or municipal) with validation timestamp. You'll see exactly when data was pulled and what category it belongs to, ensuring transparency for lenders and reviewers."
  }, {
    question: "Is the data private?",
    answer: "Only professional contact information is stored securely. All underlying records are public-domain information from government sources. We never share your contact data with third parties."
  }, {
    question: "Who can join the beta?",
    answer: "Limited seats are available for verified professionals in development, finance, and planning. We prioritize active practitioners who can provide meaningful feedback on real-world use cases."
  }, {
    question: "What's the timeline for full launch?",
    answer: "Beta participants will receive priority access to the production platform in Q2 2026. Early testers also receive lifetime discounts and input on feature roadmap."
  }, {
    question: "Can I integrate this with my existing workflow?",
    answer: "Yes — reports are available as PDFs (for manual review), JSON (for custom integrations), and OData queries (for enterprise systems). API access is available for Pro tier participants."
  }];
  const features = [{
    icon: Cpu,
    title: "AI Feasibility Engine",
    description: "Automates complex analysis so your team can focus on deals, not data."
  }, {
    icon: LineChart,
    title: "Proprietary Scoring Model",
    description: "Gives every parcel a consistent, comparable benchmark — no bias, no guesswork."
  }, {
    icon: FileText,
    title: "Lender-Ready Formatting",
    description: "Professional reports formatted to pass underwriting reviews with zero edits."
  }, {
    icon: MapPin,
    title: "Interactive Map Viewer",
    description: "Visually explore zoning, risk, and opportunity in one intuitive dashboard."
  }, {
    icon: Lock,
    title: "Enterprise-Level Security",
    description: "Protecting proprietary models, algorithms, and IP with bank-grade encryption."
  }];
  const solutionBullets = ["Zoning & Permitting Intelligence", "Infrastructure & Access Analysis", "Flood & Environmental Screening", "Feasibility Score (0–100)", "Lender-Ready Report"];
  const TimelineCard = ({
    title,
    steps,
    color,
    animated = false
  }: {
    title: string;
    steps: string[];
    color: string;
    animated?: boolean;
  }) => {
    return <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-6 text-center">{title}</h3>
        <div className="flex items-center justify-between gap-4">
          {steps.map((step, i) => <div key={i} className="flex flex-col items-center flex-1 relative">
              <motion.div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold relative z-10" style={{
            backgroundColor: color
          }} animate={animated ? {
            scale: [1, 1.1, 1]
          } : {}} transition={animated ? {
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3
          } : {}}>
                {i + 1}
              </motion.div>
              <p className="text-sm mt-2 text-center">{step}</p>
              {i < steps.length - 1 && <div className="absolute top-6 h-0.5 bg-border" style={{
            left: 'calc(50% + 24px)',
            right: 'calc(-50% + 24px)',
            width: 'calc(100% - 48px)'
          }} />}
            </div>)}
        </div>
      </div>;
  };
  return <>
      <Helmet>
        <title>Join the SiteIntel™ Feasibility Beta | Private Access</title>
        <meta name="description" content="Get early access to regulatory-grade feasibility intelligence. Join 250 verified professionals testing AI-powered commercial development analysis." />
        <meta property="og:title" content="SiteIntel™ Feasibility Beta Program" />
        <meta property="og:description" content="Instant feasibility analysis verified by public-record intelligence. Limited beta access for developers, lenders, and planners." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://siteintel.com/beta" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-secondary via-secondary/95 to-background">
        {/* Hero Section */}
        <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
          {/* Floating Join Beta Button - Top Right */}
          {/* Logo - Top Left */}
          <motion.div initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.6,
          delay: 0.2
        }} className="absolute top-4 left-4 md:top-8 md:left-8 z-20">
            <Link to="/" className="block">
              <img src={siteintelBetaLogo} alt="SiteIntel AI™" className="h-14 md:h-18 lg:h-24 w-auto drop-shadow-[0_0_12px_rgba(255,122,0,0.4)] hover:drop-shadow-[0_0_20px_rgba(255,122,0,0.6)] transition-all duration-300" />
            </Link>
          </motion.div>

          {/* Floating Join Beta Button - Top Right */}
          <motion.div initial={{
          opacity: 0,
          y: -20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.3
        }} className="absolute top-4 right-4 md:top-8 md:right-8 z-20">
            <Button variant="expandIcon" Icon={ArrowRight} iconPlacement="right" size="lg" className="font-body text-base md:text-lg font-semibold uppercase tracking-widest shadow-2xl px-8 py-6 md:px-10 md:py-7" onClick={() => window.location.href = '/beta-signup'}>
              Join Beta
            </Button>
          </motion.div>
          {/* Layer 1: WebGL Shader Background (All Devices) / Simple Gradient (Reduced Motion) 
              - Animated blueprint grid with diagonal scroll
              - Deep navy mesh gradient base
              - ASCII art overlay on major grid lines
              - Mobile: Lower pixelRatio (1.0) for performance
              - Desktop: Higher pixelRatio (1.5) for quality
           */}
          {!shouldDisableAnimations ? <div className="absolute inset-0 z-0 pointer-events-none" role="presentation" aria-hidden="true">
              <ShaderBackground pixelRatio={isMobile ? 1.0 : 1.5} className="w-full h-full" />
            </div> : <div className="absolute inset-0 z-[1]" style={{
          background: `
                  radial-gradient(ellipse at 30% 20%, hsla(var(--accent), 0.08) 0%, transparent 50%),
                  radial-gradient(ellipse at 70% 80%, hsla(var(--primary), 0.06) 0%, transparent 50%),
                  radial-gradient(ellipse at center, hsl(222 84% 8%) 0%, hsl(222 84% 5%) 100%)
                `
        }} role="presentation" aria-hidden="true" />}

          {/* Layer 5: Data Verification Nodes with Connections - Desktop only */}
          {!isMobile && !shouldDisableAnimations && <DataVerificationNodes />}

          {/* Layer 6: Data Stream Visualization */}
          {!isMobile && !shouldDisableAnimations && <svg className="absolute inset-0 w-full h-full z-[4] pointer-events-none" aria-hidden="true">
              <defs>
                <linearGradient id="streamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0" />
                  <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {[{
            x1: '15%',
            y1: '25%',
            x2: '85%',
            y2: '20%',
            delay: 0
          }, {
            x1: '20%',
            y1: '75%',
            x2: '80%',
            y2: '70%',
            delay: 2
          }, {
            x1: '10%',
            y1: '50%',
            x2: '90%',
            y2: '45%',
            delay: 4
          }].map((stream, i) => <motion.line key={`stream-${i}`} x1={stream.x1} y1={stream.y1} x2={stream.x2} y2={stream.y2} stroke="url(#streamGradient)" strokeWidth="2" strokeDasharray="8 4" initial={{
            strokeDashoffset: 0
          }} animate={{
            strokeDashoffset: -1000
          }} transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'linear',
            delay: stream.delay
          }} />)}
            </svg>}


          <motion.div style={{
          opacity: heroOpacity,
          y: heroY
        }} className="container mx-auto px-6 lg:px-8 max-w-[1120px] relative z-10">
            <div className="grid lg:grid-cols-5 gap-12 items-center">
              <div className="lg:col-span-3 space-y-8">
                <motion.div initial={{
                opacity: 0,
                y: 20
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                duration: 0.6
              }}>
                  <BetaBadge />
                </motion.div>

                <motion.h1 initial={{
                opacity: 0,
                y: 20
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                duration: 0.6,
                delay: 0.1
              }} className="font-headline text-5xl md:text-6xl lg:text-7xl font-semibold text-white leading-[1.1] tracking-tight mb-6 max-w-4xl">
                  Instant Feasibility for Commercial Real Estate Development.{" "}
                  <span className="relative inline-block">
                <span className="font-headline text-[#FF7A00] font-semibold">
                  Verified Intelligence.
                </span>
                    <motion.span className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-accent" initial={{
                    width: 0
                  }} animate={{
                    width: "100%"
                  }} transition={{
                    duration: 1,
                    delay: 0.8,
                    ease: "easeOut"
                  }} aria-hidden="true" />
                  </span>
                </motion.h1>

              <motion.p initial={{
                opacity: 0,
                y: 20
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                duration: 0.6,
                delay: 0.2
              }} className="font-body text-xl md:text-2xl lg:text-3xl text-white/90 font-normal leading-relaxed max-w-3xl mb-8">SiteIntel™ Feasibility redefines site due-diligence for developers, brokers, and lenders through automated, data-verified analysis. Join the private beta to experience instant, AI-driven feasibility reports powered by authoritative intelligence.</motion.p>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Scroll Indicator */}
          <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 1.2,
          duration: 0.6
        }} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{
          opacity: useTransform(scrollYProgress, [0, 0.3], [1, 0])
        }}>
            <span className="text-xs text-white/40 uppercase tracking-wider">Scroll to explore</span>
            <ChevronDown className="w-6 h-6 text-white/40 animate-bounce" aria-hidden="true" />
          </motion.div>
        </section>

        {/* Globe Feature Section */}
        <GlobeFeatureSection />

        {/* How It Works Section */}
        <section id="how-it-works" className="py-[120px] relative bg-gradient-to-b from-white to-[#F9FAFB] dark:from-background dark:to-muted/20">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px]">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                How It Works
              </h2>
              
              {/* Animated progress line */}
              <motion.div initial={{
              width: 0
            }} whileInView={{
              width: "100%"
            }} viewport={{
              once: true
            }} transition={{
              duration: 1,
              ease: "easeOut"
            }} className="h-0.5 bg-primary mx-auto mb-6 max-w-[200px]" />
              
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                From site input to lender-ready intelligence — every report follows a transparent, automated process powered by verified AI and geospatial logic.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => {
              const Icon = step.icon;
              return <motion.div key={index} initial={{
                opacity: 0,
                y: 20
              }} whileInView={{
                opacity: 1,
                y: 0
              }} viewport={{
                once: true
              }} transition={{
                delay: index * 0.1
              }} whileHover={{
                y: -4,
                transition: {
                  duration: 0.2
                }
              }} className="relative group">
                    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 h-full hover:border-primary transition-all duration-200 hover:shadow-xl">
                      <div className="relative mb-6">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg mb-4">
                          {step.number}
                        </div>
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                    
                    {/* Connector Line */}
                    {index < steps.length - 1 && <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-muted-foreground/30 to-transparent" />}
                  </motion.div>;
            })}
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="problem" className="py-[120px] bg-muted/30">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px]">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                When Feasibility Takes Weeks, Opportunity Disappears in Days.
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Manual feasibility reports drain time, money, and momentum. Developers wait weeks, juggling consultants and disconnected data—while competitors act first. SiteIntel™ Feasibility eliminates that lag with verified insights delivered in minutes.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <motion.div initial={{
              opacity: 0,
              x: -20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: 0.1
            }}>
                <TimelineCard title="Traditional Process – 3 Weeks" steps={["Consultant", "Analysis", "Review"]} color="#9CA3AF" />
              </motion.div>
              
              <motion.div initial={{
              opacity: 0,
              x: 20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: 0.2
            }}>
                <TimelineCard title="AI Report – 10 Minutes" steps={["Input", "AI Engine", "Report"]} color="#FF7A00" animated={true} />
              </motion.div>
            </div>
            
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.3
          }} className="text-center">
              <Button variant="outline" size="lg" asChild>
                <Link to="/beta-signup">Join Beta <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Solution Section */}
        <section id="solution" className="py-[120px] bg-background">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px]">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div initial={{
              opacity: 0,
              x: -20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }}>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  From Parcel to Proof — in Under 10 Minutes.
                </h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  SiteIntel™ Feasibility automates the entire due-diligence workflow. In a single click, the platform analyzes zoning, infrastructure, risk, and valuation to deliver a defensible, lender-ready report—faster than a meeting recap.
                </p>
                
                <ul className="space-y-3 mb-8">
                  {solutionBullets.map((item, index) => <motion.li key={index} initial={{
                  opacity: 0,
                  x: -10
                }} whileInView={{
                  opacity: 1,
                  x: 0
                }} viewport={{
                  once: true
                }} transition={{
                  delay: index * 0.1
                }} className="flex items-start gap-3">
                      <CheckCircle className="text-primary mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-foreground">{item}</span>
                    </motion.li>)}
                </ul>
                
                <Button size="lg" asChild>
                  <Link to="/beta-signup">Join Beta <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </motion.div>
              
              <motion.div initial={{
              opacity: 0,
              x: 20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: 0.2
            }} className="relative">
                <div className="rounded-xl border border-border overflow-hidden shadow-2xl bg-card">
                  <ScorePreviewCard score={87} grade="B+" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Authority Band Section */}
        <section id="authority" className="py-[120px] bg-primary text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <motion.div className="w-full h-full" animate={{
            opacity: [0.15, 0.25, 0.15]
          }} transition={{
            duration: 3,
            repeat: Infinity
          }}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,122,0,0.1)_0%,transparent_50%)]" />
            </motion.div>
          </div>
          
          <div className="container mx-auto px-6 lg:px-8 max-w-[900px] relative z-10">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Verified Intelligence. Built for Verified Professionals.
              </h2>
              <p className="text-lg text-white/80 mb-8 leading-relaxed">
                Every SiteIntel™ report is powered by verified geospatial and regulatory infrastructure—engineered for lenders, investors, and developers who need more than estimates. Your insights aren't just fast—they're auditable, defensible, and trusted.
              </p>
              <Button variant="outline" className="text-white border-white/30 hover:bg-white/10 hover:text-white" asChild>
                <Link to="/beta-signup">Join Beta <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Feature Matrix Section */}
        <section id="feature-matrix" className="py-[120px] bg-background">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px]">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Your Feasibility Advantage
              </h2>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {features.map((feature, index) => {
              const Icon = feature.icon;
              return <motion.div key={index} initial={{
                opacity: 0,
                y: 20
              }} whileInView={{
                opacity: 1,
                y: 0
              }} viewport={{
                once: true
              }} transition={{
                delay: index * 0.1
              }} whileHover={{
                y: -4
              }} className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-primary transition-all">
                    <Icon className="w-10 h-10 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </motion.div>;
            })}
            </div>
            
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.5
          }} className="text-center">
              <Button variant="outline" size="lg" asChild>
                <Link to="/beta-signup">Join Beta <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Beta Access CTA Section */}
        <section id="beta-access-cta" className="py-[120px] bg-primary text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <motion.div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white rounded-full blur-3xl" animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
            x: [-50, -50, -50],
            y: [-50, -50, -50]
          }} transition={{
            duration: 4,
            repeat: Infinity
          }} />
          </div>
          
          <div className="container mx-auto px-6 lg:px-8 max-w-[900px] relative z-10">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Private Beta Open for Verified Developers, Lenders, and Brokers
              </h2>
              <p className="text-lg text-white/90 mb-8 leading-relaxed">
                Join an exclusive group shaping the future of commercial feasibility. Early members receive direct product access, feature input privileges, and lifetime preferred pricing before public launch.
              </p>
              
              <Button size="lg" className="bg-white text-primary hover:bg-white/90" onClick={() => window.location.href = '/beta-signup'}>
                Join Beta <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <p className="mt-6 text-sm text-white/70 italic">
                Only 500 verified professionals will be accepted.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Beta Preview Section */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px]">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Beta Preview
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Experience the intelligence layer that powers institutional decisions.
              </p>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.2
          }}>
              <Tabs defaultValue="score" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                  <TabsTrigger value="score">Feasibility Score</TabsTrigger>
                  <TabsTrigger value="parcel">Parcel Snapshot</TabsTrigger>
                  <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                  <TabsTrigger value="export">Export Options</TabsTrigger>
                </TabsList>
                
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
                  <TabsContent value="score" className="m-0">
                    <ScorePreviewCard />
                  </TabsContent>
                  <TabsContent value="parcel" className="m-0 p-6">
                    <ParcelMapPreview />
                  </TabsContent>
                  <TabsContent value="audit" className="m-0 p-6">
                    <AuditTrailTable />
                  </TabsContent>
                  <TabsContent value="export" className="m-0">
                    <ExportButtonGrid />
                  </TabsContent>
                </div>
              </Tabs>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground italic">
                <Lock className="w-4 h-4" />
                <span>All intelligence originates from verified public-record systems. Proprietary AI validation ensures reproducibility and accuracy.</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Professional Benefits Section */}
        <section className="py-24">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px]">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Built for Professionals
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Tailored intelligence for every role in the development ecosystem.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {audiences.map((audience, index) => {
              const Icon = audience.icon;
              return <motion.div key={index} initial={{
                opacity: 0,
                y: 20
              }} whileInView={{
                opacity: 1,
                y: 0
              }} viewport={{
                once: true
              }} transition={{
                delay: index * 0.1
              }} whileHover={{
                y: -8,
                scale: 1.02,
                transition: {
                  duration: 0.2
                }
              }} className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-primary/30 transition-all duration-200 hover:shadow-lg group">
                    <Icon className="w-10 h-10 text-primary mb-4 group-hover:rotate-6 transition-transform duration-200" />
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {audience.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {audience.benefit}
                    </p>
                    <ul className="space-y-2">
                      {audience.metrics.map((metric, i) => <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                          {metric}
                        </li>)}
                    </ul>
                  </motion.div>;
            })}
            </div>
          </div>
        </section>

        {/* Sign-Up Form Section */}
        <section id="beta-signup-form" className="py-24 bg-muted/30">
          <div className="container mx-auto px-6 lg:px-8 max-w-[600px]">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Join the Beta Program
              </h2>
              <p className="text-lg text-muted-foreground">
                Limited to 250 verified professionals. Secure your seat today.
              </p>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.2
          }}>
              <BetaSignupForm />
            </motion.div>
          </div>
        </section>

        {/* Credibility & Compliance Section */}
        <section className="py-24">
          <div className="container mx-auto px-6 lg:px-8 max-w-[900px]">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="text-center">
              <ShieldCheck className="w-12 h-12 text-accent mx-auto mb-6" />
              
              <h2 className="text-3xl font-semibold text-foreground mb-4">
                Regulatory-Grade Intelligence
              </h2>
              
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8">
                SiteIntel™ Feasibility operates on regulated data frameworks from verified 
                public-record systems, harmonized through proprietary AI normalization. 
                Each report conforms to lender-grade transparency standards: timestamped, 
                cross-checked, and validated for auditability.
              </p>
              
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-card/50 border border-border rounded-full">
                <Lock className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-foreground">
                  Trusted data. Proven design.™
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-6 lg:px-8 max-w-[800px]">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to know about the beta program.
              </p>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.2
          }}>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left hover:text-accent">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>)}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-secondary border-t border-border">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px] py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* Column 1: Brand */}
              <div>
                <img src="/src/assets/siteintel-logo.png" alt="SiteIntel" className="h-8 mb-4" />
                <p className="text-sm text-muted-foreground">
                  Regulatory-grade feasibility intelligence for commercial development.
                </p>
              </div>
              
              {/* Column 2: Quick Links */}
              
              
              {/* Column 3: Contact */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Get in Touch</h3>
                <p className="text-sm text-muted-foreground">
                  beta@siteintel.com<br />
                  Questions about the beta? We respond within 24 hours.
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
                <p>
                  © 2025 BuildSmarter Holdings LLC. All rights reserved.<br />
                  SITEINTEL™ and BUILDSMARTER™ are registered trademarks.
                </p>
                <p className="text-right">
                  SiteIntel™ Feasibility integrates authoritative public-record frameworks<br />
                  and proprietary validation systems. All data-processing methods and AI<br />
                  scoring algorithms are protected intellectual property under trade-secret law.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>;
};
export default Beta;