import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { 
  Layers, Clock, AlertTriangle, Brain, MapPin, DollarSign, 
  TrendingUp, FileText, Building2, Briefcase, Landmark, 
  Users, CheckCircle2, Shield, Zap, Target, ArrowRight,
  ShoppingCart, Store, Building, Stethoscope, Factory, Hotel
} from "lucide-react";

const FeasibilityAsAService = () => {
  const painPoints = [
    {
      icon: Layers,
      title: "Fragmented Data",
      description: "Zoning, utilities, constraints, and cost data live across disconnected systems with no unified workflow."
    },
    {
      icon: Clock,
      title: "Slow and Costly",
      description: "Feasibility can take 2–6 weeks and costs $15k–$50k — limiting how many opportunities teams can validate."
    },
    {
      icon: AlertTriangle,
      title: "High Risk",
      description: "One missed setback, easement, or utility constraint can invalidate millions in development assumptions."
    }
  ];

  const features = [
    {
      icon: Brain,
      title: "Automated Zoning Intelligence",
      description: "AI parses zoning codes, land-use tables, dimensional standards, parking requirements, overlays, and buildable envelopes."
    },
    {
      icon: MapPin,
      title: "Constraints & Risk Modeling",
      description: "Floodplain, utilities, easements, parcels, access, adjacencies — computed with geospatial precision."
    },
    {
      icon: DollarSign,
      title: "Cost Engine",
      description: "Dynamic per-SF costs, soft costs, contingency, escalation, and detailed capex modeling."
    },
    {
      icon: TrendingUp,
      title: "Pro Forma & ROI",
      description: "Automated IRR, NOI, DSCR, and NPV — generated with lender-grade structure."
    }
  ];

  const steps = [
    { number: "01", title: "Input Address or Parcel", icon: MapPin },
    { number: "02", title: "AI Zoning Interpretation", icon: Brain },
    { number: "03", title: "Constraints Mapping", icon: Layers },
    { number: "04", title: "Cost Modeling Engine", icon: DollarSign },
    { number: "05", title: "ROI Forecasting", icon: TrendingUp },
    { number: "06", title: "Feasibility Report", icon: FileText }
  ];

  const pillars = [
    {
      title: "Precision.",
      description: "Every constraint, every setback, every line of zoning code interpreted without assumption.",
      icon: Target
    },
    {
      title: "Proof.",
      description: "Data-backed feasibility, lender-trusted formats, transparent assumptions.",
      icon: Shield
    },
    {
      title: "Possibility.",
      description: "Evaluate more sites, move faster, reduce risk, unlock winning opportunities.",
      icon: Zap
    }
  ];

  const audiences = [
    { icon: Building2, title: "Developers", description: "Validate sites faster, reduce due diligence costs" },
    { icon: Briefcase, title: "Private Equity & Investment Groups", description: "Scale deal screening with precision" },
    { icon: Landmark, title: "Lenders & Credit Committees", description: "Trust feasibility data for underwriting" },
    { icon: ShoppingCart, title: "Retail Chains", description: "Store site selection with zoning and traffic validation" },
    { icon: Store, title: "Franchise Brands", description: "Scale expansion with pre-validated site intelligence" },
    { icon: Building, title: "REITs", description: "Portfolio-wide feasibility screening for acquisitions" },
    { icon: Users, title: "Brokers & Land Specialists", description: "Win more deals with instant feasibility" },
    { icon: Stethoscope, title: "Medical", description: "Evaluate specialized sites with unique constraints" },
    { icon: Factory, title: "Industrial", description: "Evaluate specialized sites with unique constraints" },
    { icon: Hotel, title: "Hospitality Developers", description: "Evaluate specialized sites with unique constraints" }
  ];

  const proofPoints = [
    { icon: CheckCircle2, text: "Accuracy Validated Against Real Projects" },
    { icon: CheckCircle2, text: "Developers Using It for Acquisition & Underwriting" },
    { icon: CheckCircle2, text: "Lender-Friendly Output Structures" },
    { icon: CheckCircle2, text: "Rapid Enterprise Adoption Signals" }
  ];

  return (
    <>
      <Helmet>
        <title>Feasibility-as-a-Service™ | SiteIntel™</title>
        <meta name="description" content="AI-powered feasibility, zoning, constraints, cost modeling, and ROI — delivered with the accuracy lenders trust. A new category in real-estate intelligence." />
      </Helmet>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-navy via-navy/95 to-charcoal">
        {/* Blueprint grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--data-cyan) / 0.3) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--data-cyan) / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        
        <div className="container mx-auto px-6 lg:px-8 py-24 lg:py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-tight tracking-tight">
                  Feasibility-as-a-Service™
                </h1>
                <h2 className="font-headline text-xl md:text-2xl lg:text-3xl text-slate-300 font-medium leading-snug">
                  AI-powered feasibility, zoning, constraints, cost modeling, and ROI — delivered with the accuracy lenders trust.
                </h2>
                <p className="font-body text-lg text-white/70 max-w-xl leading-relaxed">
                  A new category in real-estate intelligence. Purpose-built to turn uncertainty into clarity, and land into decision-ready outcomes.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-cta text-lg px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => window.location.href = '/beta-signup'}
                >
                  Get Feasibility Instant Access
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground font-cta text-lg px-8 py-6 h-auto transition-all duration-200"
                  onClick={() => window.location.href = '/demo'}
                >
                  Watch Demo
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
                <Card className="relative bg-white/10 backdrop-blur-xl border-white/20 rounded-2xl overflow-hidden">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm font-mono">SiteIntel™ Analysis</span>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">LIVE</span>
                      </div>
                      <div className="h-48 bg-gradient-to-br from-navy/50 to-charcoal/50 rounded-xl flex items-center justify-center border border-white/10">
                        <div className="text-center space-y-2">
                          <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                            <MapPin className="h-8 w-8 text-primary" />
                          </div>
                          <p className="text-white/60 text-sm">Parcel Visualization</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-white/5 rounded-lg">
                          <p className="text-2xl font-bold text-primary">87</p>
                          <p className="text-xs text-white/60">Feasibility Score</p>
                        </div>
                        <div className="text-center p-3 bg-white/5 rounded-lg">
                          <p className="text-2xl font-bold text-accent">C-2</p>
                          <p className="text-xs text-white/60">Zoning</p>
                        </div>
                        <div className="text-center p-3 bg-white/5 rounded-lg">
                          <p className="text-2xl font-bold text-green-400">Low</p>
                          <p className="text-xs text-white/60">Flood Risk</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — THE PROBLEM */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-6">
              The most critical stage in development is still the least efficient.
            </h2>
            <p className="font-body text-lg text-muted-foreground leading-relaxed">
              Pre-development feasibility remains slow, fragmented, and error-prone — even though every lender, investor, and developer depends on it. The industry still relies on PDFs, consultants, manual zoning lookup, and spreadsheets not built for the complexity of modern projects.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {painPoints.map((point, index) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
                      <point.icon className="h-7 w-7 text-destructive" />
                    </div>
                    <h3 className="font-headline text-xl font-semibold text-foreground mb-3">
                      {point.title}
                    </h3>
                    <p className="font-body text-muted-foreground leading-relaxed">
                      {point.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — INTRODUCING FEASIBILITY-AS-A-SERVICE */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-6">
              A new foundation for development decisions.
            </h2>
            <p className="font-body text-lg text-muted-foreground leading-relaxed">
              Feasibility-as-a-Service™ combines AI, geospatial analysis, zoning computation, cost intelligence, and automated ROI modeling into a single decision-platform. It transforms feasibility from a manual bottleneck into a scalable, repeatable, data-driven system.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="transition-transform duration-200"
              >
                <Card className="h-full bg-card border-border shadow-sm hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-headline text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="font-body text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
              Clarity in six steps.
            </h2>
          </motion.div>

          <div className="relative">
            {/* Connector line - desktop */}
            <div className="hidden lg:block absolute top-16 left-[8%] right-[8%] h-0.5 bg-accent/30" />
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center relative"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center mb-4 relative z-10 bg-background">
                    <step.icon className="h-5 w-5 text-accent" />
                  </div>
                  <span className="font-mono text-xs text-accent font-semibold mb-2 block">{step.number}</span>
                  <h3 className="font-headline text-sm font-medium text-foreground leading-tight">
                    {step.title}
                  </h3>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — WHY IT MATTERS */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-navy via-navy/95 to-charcoal">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-4">
              Precision that changes outcomes.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {pillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  <pillar.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-headline text-2xl md:text-3xl font-semibold text-white mb-4">
                  {pillar.title}
                </h3>
                <p className="font-body text-lg text-white/70 leading-relaxed max-w-sm mx-auto">
                  {pillar.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — WHO IT'S BUILT FOR */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
              Who Feasibility-as-a-Service™ Is Built For
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {audiences.map((audience, index) => (
              <motion.div
                key={audience.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full bg-card border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <audience.icon className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-headline text-lg font-semibold text-foreground mb-1">
                        {audience.title}
                      </h3>
                      <p className="font-body text-sm text-muted-foreground">
                        {audience.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7 — CATEGORY LEADERSHIP */}
      <section className="py-20 lg:py-28 bg-navy">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-6">
                A new category in commercial real estate intelligence.
              </h2>
              <p className="font-body text-lg text-white/70 leading-relaxed">
                Feasibility-as-a-Service™ is the world's first platform to unify zoning interpretation, constraints analysis, cost modeling, and ROI validation. It defines a repeatable standard for pre-development feasibility.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              {/* Category visualization */}
              <div className="relative w-full aspect-square max-w-md mx-auto">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/10" />
                {/* Middle ring */}
                <div className="absolute inset-8 rounded-full border-2 border-dashed border-white/20" />
                {/* Inner ring */}
                <div className="absolute inset-16 rounded-full border-2 border-dashed border-accent/30" />
                {/* Center */}
                <div className="absolute inset-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <div className="text-center">
                    <p className="font-headline text-white font-bold text-sm">SiteIntel™</p>
                    <p className="font-mono text-white/80 text-xs">FaaS™</p>
                  </div>
                </div>
                {/* Competitor labels */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/40 text-xs font-mono">Consultants</div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs font-mono">Manual Analysis</div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xs font-mono">Spreadsheets</div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-xs font-mono">GIS Tools</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 8 — SOCIAL PROOF */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center mb-12"
          >
            <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-6">
              Grounded in real-world development expertise.
            </h2>
            <p className="font-body text-lg text-muted-foreground leading-relaxed">
              Built by a team with over a decade of construction and design experience, millions of square feet delivered, and deep pre-development expertise.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {proofPoints.map((point, index) => (
              <motion.div
                key={point.text}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border"
              >
                <point.icon className="h-6 w-6 text-green-500 flex-shrink-0" />
                <p className="font-body text-sm text-foreground font-medium">{point.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9 — FINAL CTA */}
      <section className="py-20 lg:py-28 bg-primary">
        <div className="container mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-semibold text-primary-foreground mb-8">
              Move from uncertainty to clarity — instantly.
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-cta text-lg px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => window.location.href = '/beta-signup'}
              >
                Get Feasibility Instant Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-primary font-cta text-lg px-8 py-6 h-auto transition-all duration-200"
                onClick={() => window.location.href = '/demo'}
              >
                Request a Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default FeasibilityAsAService;
