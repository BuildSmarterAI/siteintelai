import { motion } from "framer-motion";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  MapPin, 
  Droplets, 
  Zap, 
  Building2, 
  Shield, 
  DollarSign,
  Clock,
  CheckCircle,
  X,
  FileText,
  Layers,
  AlertTriangle,
  Factory,
  Home,
  Stethoscope,
  Hotel,
  Store,
  Warehouse,
  Users,
  Landmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const TexasDevelopers = () => {
  // Developer ICP types
  const developerTypes = [
    { icon: Building2, title: "Ground-Up", benefit: "Validate buildable envelope before you close on land." },
    { icon: Store, title: "Retail", benefit: "Confirm traffic counts, visibility, and signage rights instantly." },
    { icon: Warehouse, title: "Industrial", benefit: "Verify utility capacity for heavy power and water needs." },
    { icon: Home, title: "Multifamily", benefit: "Check density allowances and parking requirements upfront." },
    { icon: Stethoscope, title: "Medical/Dental", benefit: "Ensure zoning permits medical office use and signage." },
    { icon: Hotel, title: "Hospitality", benefit: "Assess flood risk, parking ratios, and access points." },
    { icon: Layers, title: "Mixed-Use", benefit: "Navigate complex overlay districts and use restrictions." },
    { icon: Factory, title: "Build-to-Suit", benefit: "Confirm site fits tenant specs before LOI." },
    { icon: Landmark, title: "Owner/Developer", benefit: "De-risk land acquisition with verified feasibility data." },
  ];

  // Features grid items
  const features = [
    { icon: MapPin, title: "Zoning Breakdown", description: "Instant zoning classification, permitted uses, setbacks, and overlay district analysis." },
    { icon: Droplets, title: "Flood & Environmental", description: "FEMA flood zones, wetlands, EPA sites, and environmental constraints mapped." },
    { icon: Zap, title: "Utilities", description: "Water, sewer, electric capacity and distance to connection points." },
    { icon: Building2, title: "Buildable Envelope", description: "FAR, height limits, setbacks, and maximum buildable area calculated." },
    { icon: DollarSign, title: "Cost Modeling", description: "Texas-specific construction costs, utility fees, and permitting timelines." },
    { icon: AlertTriangle, title: "Deal-Killer Detection", description: "Red flags surfaced automatically: deed restrictions, MUDs, and hidden constraints." },
  ];

  // Workflow steps
  const workflowSteps = [
    { step: "01", title: "Enter Address", description: "Type an address, parcel ID, or upload a survey." },
    { step: "02", title: "Get Instant Report", description: "AI analyzes 15+ data sources in under 60 seconds." },
    { step: "03", title: "Review Feasibility", description: "See buildability, costs, risks, and deal-killers." },
    { step: "04", title: "Decide Confidently", description: "Move forward or walk away — with verified data." },
  ];

  // Comparison data
  const comparisonData = {
    traditional: [
      "4-6 weeks for feasibility study",
      "$8,000-$15,000 consultant fees",
      "Manual data collection",
      "Outdated FEMA maps",
      "Missed deed restrictions",
    ],
    siteintel: [
      "60 seconds to full report",
      "$1,495 per Feasibility Report™",
      "15+ live data sources",
      "Current FEMA + local flood data",
      "AI-detected constraints",
    ],
  };

  return (
    <>
      <SEOHead
        title="Texas Commercial Developers"
        description="Site feasibility in 60 seconds for Texas commercial developers. Instant zoning, flood, utility, and buildability analysis before you spend a dollar."
        keywords={["Texas developers", "Houston real estate", "Texas feasibility", "commercial development Texas"]}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://siteintel.lovable.app" },
          { name: "Industries", url: "https://siteintel.lovable.app/industries" },
          { name: "Texas Developers", url: "https://siteintel.lovable.app/industries/texas-developers" },
        ]}
      />

      <div className="min-h-screen bg-background">
        {/* HERO SECTION */}
        <section className="relative bg-gradient-to-br from-midnight-blue via-midnight-blue to-slate-900 overflow-hidden">
          {/* Grid overlay */}
          <div className="absolute inset-0 ai-grid-overlay opacity-30" />
          
          <div className="container mx-auto px-6 lg:px-8 py-20 md:py-28 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 bg-feasibility-orange/10 border border-feasibility-orange/30 rounded-full px-4 py-1.5 mb-6">
                  <span className="w-2 h-2 bg-feasibility-orange rounded-full animate-pulse" />
                  <span className="text-feasibility-orange text-sm font-medium">Built for Texas Developers</span>
                </div>

                <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Texas Site Feasibility in 60 Seconds —{" "}
                  <span className="text-feasibility-orange">Built for Developers Who Build Texas.</span>
                </h1>

                <p className="text-lg md:text-xl text-white/70 mb-8 max-w-xl leading-relaxed">
                  Instant clarity on zoning, flood, utilities, buildability & costs — before you spend a dollar.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/beta-signup">
                    <Button
                      variant="expandIcon"
                      Icon={ArrowRight}
                      iconPlacement="right"
                      size="lg"
                      className="text-base md:text-lg font-semibold px-8 py-6 w-full sm:w-auto"
                    >
                      Get Early Access
                    </Button>
                  </Link>
                  <a href="#workflow">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-white/20 text-white hover:bg-white/10 px-8 py-6 w-full sm:w-auto"
                    >
                      See Developer Workflow →
                    </Button>
                  </a>
                </div>

                {/* Trust badges */}
                <div className="mt-10 pt-8 border-t border-white/10">
                  <p className="text-white/50 text-sm mb-3">Powered by verified government data</p>
                  <div className="flex flex-wrap gap-4 text-white/40 text-xs font-mono">
                    {["FEMA", "TxDOT", "HCAD", "EPA", "USGS"].map((badge) => (
                      <span key={badge} className="bg-white/5 px-3 py-1 rounded">{badge}</span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Right: Visualization placeholder */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative hidden lg:block"
              >
                <div className="relative aspect-square max-w-lg mx-auto">
                  {/* Glowing background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-feasibility-orange/20 via-data-cyan/10 to-transparent rounded-3xl blur-3xl" />
                  
                  {/* Map visualization card */}
                  <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-full">
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <div className="w-3 h-3 bg-status-success rounded-full animate-pulse" />
                      <span className="text-white/60 text-sm font-mono">Live Data Feed</span>
                    </div>
                    
                    {/* Simulated parcel grid */}
                    <div className="mt-12 grid grid-cols-4 gap-2">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div
                          key={i}
                          className={`aspect-square rounded border ${
                            i === 5 || i === 6 || i === 9 || i === 10
                              ? "bg-feasibility-orange/30 border-feasibility-orange/50"
                              : "bg-white/5 border-white/10"
                          }`}
                        />
                      ))}
                    </div>
                    
                    {/* Score badge */}
                    <div className="absolute bottom-6 right-6 bg-midnight-blue border border-feasibility-orange/30 rounded-xl px-4 py-3">
                      <p className="text-white/60 text-xs mb-1">Feasibility Score</p>
                      <p className="text-feasibility-orange text-2xl font-bold font-mono">87/100</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* PAIN SECTION */}
        <section className="py-20 md:py-28 bg-slate-50">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Feasibility Shouldn't Take 6 Weeks.
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Every week you wait is capital at risk. Every surprise kills your margin.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Clock, title: "Slow Consultants", description: "Traditional studies take 4-6 weeks. Deals move faster." },
                { icon: MapPin, title: "Zoning Surprises", description: "Houston's no-zoning myth hides deed restrictions that kill deals." },
                { icon: Droplets, title: "Flood Traps", description: "FEMA maps update constantly. Yesterday's clear lot is today's SFHA." },
                { icon: Zap, title: "Utility Unknowns", description: "That shovel-ready site? Might need $500K in extensions." },
              ].map((pain, index) => (
                <motion.div
                  key={pain.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full border-destructive/20 bg-destructive/5 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                        <pain.icon className="w-6 h-6 text-destructive" />
                      </div>
                      <h3 className="font-headline text-lg font-semibold text-foreground mb-2">{pain.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{pain.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-10"
            >
              <Link to="/beta-signup">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Join Developer Early Access →
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Everything Developers Need — Automated.
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                15+ data sources analyzed in seconds. No phone calls. No waiting.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg hover:border-feasibility-orange/30 transition-all group">
                    <CardContent className="p-6">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-feasibility-orange/20 to-feasibility-orange/5 flex items-center justify-center mb-5 group-hover:from-feasibility-orange/30 group-hover:to-feasibility-orange/10 transition-all">
                        <feature.icon className="w-7 h-7 text-feasibility-orange" />
                      </div>
                      <h3 className="font-headline text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* DEVELOPER ICP GRID */}
        <section className="py-20 md:py-28 bg-midnight-blue">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Built for Every Type of Developer in Texas.
              </h2>
              <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
                From ground-up to build-to-suit — SiteIntel™ speaks your language.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {developerTypes.map((dev, index) => (
                <motion.div
                  key={dev.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-feasibility-orange/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-feasibility-orange/10 flex items-center justify-center flex-shrink-0 group-hover:bg-feasibility-orange/20 transition-colors">
                      <dev.icon className="w-5 h-5 text-feasibility-orange" />
                    </div>
                    <div>
                      <h3 className="font-headline text-lg font-semibold text-white mb-1">{dev.title}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{dev.benefit}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section id="workflow" className="py-20 md:py-28 bg-background scroll-mt-24">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Your New Developer Feasibility Workflow.
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                From address to decision in under a minute.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {workflowSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Connector line */}
                  {index < workflowSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-feasibility-orange/50 to-transparent z-0" />
                  )}
                  
                  <Card className="h-full border-2 hover:border-feasibility-orange/50 transition-colors relative z-10">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-feasibility-orange to-feasibility-orange/80 flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl font-mono">
                        {step.step}
                      </div>
                      <h3 className="font-headline text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ROI / VALUE COMPARISON */}
        <section className="py-20 md:py-28 bg-slate-50">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Save Months. Prevent $250K+ Mistakes. Win Deals Faster.
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                See how SiteIntel™ compares to traditional feasibility studies.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Traditional */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-destructive/30 bg-destructive/5">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                        <X className="w-5 h-5 text-destructive" />
                      </div>
                      <h3 className="font-headline text-xl font-semibold text-foreground">Traditional Feasibility</h3>
                    </div>
                    <ul className="space-y-4">
                      {comparisonData.traditional.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <X className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* SiteIntel */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-status-success/30 bg-status-success/5">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-status-success/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-status-success" />
                      </div>
                      <h3 className="font-headline text-xl font-semibold text-foreground">SiteIntel™ Feasibility Report</h3>
                    </div>
                    <ul className="space-y-4">
                      {comparisonData.siteintel.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-status-success mt-0.5 flex-shrink-0" />
                          <span className="text-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Texas Developers Trust SiteIntel™
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote: "We caught a $400K utility extension we would've missed. SiteIntel paid for itself 500x over.",
                  author: "Industrial Developer",
                  location: "Houston, TX"
                },
                {
                  quote: "I run multiple sites through SiteIntel before breakfast. It's changed how we source deals.",
                  author: "Retail Developer",
                  location: "Austin, TX"
                },
                {
                  quote: "Our lenders now ask for SiteIntel reports. It's become the standard for Texas feasibility.",
                  author: "Multifamily Developer",
                  location: "Dallas, TX"
                },
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="w-5 h-5 text-feasibility-orange">★</div>
                        ))}
                      </div>
                      <p className="text-foreground mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                      <div className="border-t border-border pt-4">
                        <p className="font-semibold text-foreground">{testimonial.author}</p>
                        <p className="text-muted-foreground text-sm">{testimonial.location}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-feasibility-orange to-feasibility-orange/90">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px] text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                Be One of the First Texas Developers to Try SiteIntel™.
              </h2>
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Early access is limited to 500 verified developers. Lock in founding member pricing today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link to="/beta-signup">
                  <Button
                    size="lg"
                    className="bg-white text-feasibility-orange hover:bg-white/90 font-semibold px-8 py-6 text-lg w-full sm:w-auto"
                  >
                    Get Early Access →
                  </Button>
                </Link>
                <Link to="/application">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg w-full sm:w-auto"
                  >
                    Get Your Report - $1,495
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-white/70 text-sm">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Free beta access
                </span>
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  3 report credits included
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Founding member pricing locked
                </span>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default TexasDevelopers;
