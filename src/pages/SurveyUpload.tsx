import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Upload,
  FileText,
  MapPin,
  Layers,
  AlertTriangle,
  Zap,
  Building2,
  CheckCircle,
  X,
  Clock,
  DollarSign,
  Eye,
  Target,
  Shield,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const SurveyUpload = () => {
  // Pain points
  const painPoints = [
    { text: "Setbacks hidden in fine print" },
    { text: "Easements not clear visually" },
    { text: "Encroachments only visible to experts" },
    { text: "Utility lines often overlooked" },
    { text: "Footprint calculations take hours or days" },
    { text: "Developers lose weeks waiting for feasibility" },
  ];

  // Survey extraction features
  const extractionFeatures = [
    { 
      icon: Target, 
      title: "Boundary Extraction", 
      description: "Exact geometry from PDF, DWG, DXF, or scanned images." 
    },
    { 
      icon: Layers, 
      title: "Setback Detection", 
      description: "Front, side, rear setbacks automatically identified." 
    },
    { 
      icon: MapPin, 
      title: "Easement Detection", 
      description: "Utility, drainage, access, and mystery easements." 
    },
    { 
      icon: AlertTriangle, 
      title: "Encroachment Identification", 
      description: "Fences, structures, utility conflicts flagged." 
    },
    { 
      icon: Zap, 
      title: "Utility Line Mapping", 
      description: "Water, sewer, gas, power, fiber lines traced." 
    },
    { 
      icon: Building2, 
      title: "Buildable Envelope", 
      description: "Instant calculation of maximum building footprint." 
    },
  ];

  // Workflow steps
  const workflowSteps = [
    { 
      step: "01", 
      title: "Upload Survey", 
      description: "Drop your PDF, DWG, DXF, or image file." 
    },
    { 
      step: "02", 
      title: "AI Analysis", 
      description: "SiteIntel™ analyzes zoning, flood, utilities & survey data." 
    },
    { 
      step: "03", 
      title: "Get Report", 
      description: "Receive your Survey-Enhanced QuickCheck™ instantly." 
    },
  ];

  // Pricing comparison
  const pricingComparison = [
    { label: "Faster than civil review", check: true },
    { label: "More visual than raw survey", check: true },
    { label: "More accurate than guessing", check: true },
    { label: "More complete than a zoning letter", check: true },
    { label: "More actionable than a parcel viewer", check: true },
  ];

  // Testimonials
  const testimonials = [
    {
      quote: "The envelope extraction saved our Austin project. We caught a 15-foot setback issue before we signed.",
      author: "Ground-Up Developer",
      location: "Austin, TX"
    },
    {
      quote: "My civil engineer said this was more accurate than their quick review. And it took 2 minutes.",
      author: "Land Acquisition Manager",
      location: "Houston, TX"
    },
    {
      quote: "This would've saved us a month on our Houston site. We're uploading every survey now.",
      author: "CRE Investor",
      location: "Dallas, TX"
    },
  ];

  return (
    <>
      <Helmet>
        <title>Survey Upload | Extract Buildable Envelope Instantly | SiteIntel™</title>
        <meta name="description" content="Upload your survey (PDF, DWG, DXF) and get instant buildable envelope, setbacks, easements, and feasibility analysis. Survey-Enhanced QuickCheck™ for Texas developers." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* HERO SECTION */}
        <section className="relative bg-gradient-to-br from-midnight-blue via-midnight-blue to-slate-900 overflow-hidden">
          <div className="absolute inset-0 ai-grid-overlay opacity-30" />
          
          <div className="container mx-auto px-6 lg:px-8 py-20 md:py-28 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 bg-data-cyan/10 border border-data-cyan/30 rounded-full px-4 py-1.5 mb-6">
                  <Upload className="w-4 h-4 text-data-cyan" />
                  <span className="text-data-cyan text-sm font-medium">Survey Intelligence</span>
                </div>

                <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Upload Your Survey —{" "}
                  <span className="text-data-cyan">Get Instant Buildable Envelope & Feasibility</span>
                </h1>

                <p className="text-lg md:text-xl text-white/70 mb-8 max-w-xl leading-relaxed">
                  Turn any survey (PDF, DWG, DXF, image) into zoning, flood, utility, setbacks, easements, encroachments, buildable envelope, cost feasibility, and red flags — instantly.
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
                      Upload Survey for Early Access
                    </Button>
                  </Link>
                  <a href="#demo">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-white/20 text-white hover:bg-white/10 px-8 py-6 w-full sm:w-auto"
                    >
                      See Sample Report →
                    </Button>
                  </a>
                </div>

                {/* Supported formats */}
                <div className="mt-10 pt-8 border-t border-white/10">
                  <p className="text-white/50 text-sm mb-3">Supported Formats</p>
                  <div className="flex flex-wrap gap-3">
                    {["PDF", "DWG", "DXF", "PNG", "JPG", "TIFF"].map((format) => (
                      <span 
                        key={format} 
                        className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-white/70 text-sm font-mono"
                      >
                        .{format.toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Right: Visualization */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative hidden lg:block"
              >
                <div className="relative aspect-[4/3] max-w-lg mx-auto">
                  {/* Glowing background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-data-cyan/20 via-feasibility-orange/10 to-transparent rounded-3xl blur-3xl" />
                  
                  {/* Survey to Envelope visualization */}
                  <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-full">
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <div className="w-3 h-3 bg-data-cyan rounded-full animate-pulse" />
                      <span className="text-white/60 text-sm font-mono">AI Processing</span>
                    </div>
                    
                    {/* Simulated survey layers */}
                    <div className="mt-12 relative h-48">
                      {/* Boundary */}
                      <div className="absolute inset-4 border-2 border-white/30 rounded-lg" />
                      
                      {/* Setbacks */}
                      <div className="absolute inset-8 border border-dashed border-data-cyan/50 rounded" />
                      
                      {/* Easement stripe */}
                      <div className="absolute top-1/2 left-0 right-0 h-4 bg-feasibility-orange/20 border-y border-feasibility-orange/40" />
                      
                      {/* Buildable envelope */}
                      <div className="absolute inset-12 bg-status-success/20 border-2 border-status-success rounded">
                        <span className="absolute inset-0 flex items-center justify-center text-status-success text-xs font-semibold">
                          BUILDABLE
                        </span>
                      </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="mt-4 flex flex-wrap gap-4 text-xs">
                      <span className="flex items-center gap-1.5">
                        <div className="w-3 h-3 border border-white/30 rounded" />
                        <span className="text-white/60">Boundary</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <div className="w-3 h-3 border border-dashed border-data-cyan/50" />
                        <span className="text-white/60">Setbacks</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-feasibility-orange/30" />
                        <span className="text-white/60">Easement</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-status-success/30 rounded" />
                        <span className="text-white/60">Buildable</span>
                      </span>
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
                Surveys Are Valuable — But Hard to Interpret.
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                You paid thousands for that survey. Now extract every insight instantly.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {painPoints.map((pain, index) => (
                <motion.div
                  key={pain.text}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 bg-destructive/5 border border-destructive/20 rounded-xl p-4"
                >
                  <X className="w-5 h-5 text-destructive flex-shrink-0" />
                  <span className="text-foreground">{pain.text}</span>
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
                <Button variant="expandIcon" Icon={Upload} iconPlacement="left">
                  Upload Your Survey →
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* EXTRACTION FEATURES GRID */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                SiteIntel™ Extracts <span className="text-feasibility-orange">EVERYTHING</span> From Your Survey.
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                AI-powered extraction finds what human eyes miss.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {extractionFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg hover:border-data-cyan/30 transition-all group">
                    <CardContent className="p-6">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-data-cyan/20 to-data-cyan/5 flex items-center justify-center mb-5 group-hover:from-data-cyan/30 group-hover:to-data-cyan/10 transition-all">
                        <feature.icon className="w-7 h-7 text-data-cyan" />
                      </div>
                      <h3 className="font-headline text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
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
                <Button variant="expandIcon" Icon={ArrowRight} iconPlacement="right" size="lg">
                  Get Survey-Enhanced QuickCheck™
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* BEFORE/AFTER DEMO */}
        <section id="demo" className="py-20 md:py-28 bg-midnight-blue scroll-mt-24">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                From Raw Survey → Instant Buildable Envelope
              </h2>
              <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
                This replaces 2–3 weeks of manual feasibility review.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Before: Raw Survey */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-white/60" />
                    <span className="text-white/60 font-medium">BEFORE: Raw Survey PDF</span>
                  </div>
                  
                  {/* Simulated survey document */}
                  <div className="aspect-[4/3] bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-white/20 mx-auto mb-3" />
                      <p className="text-white/40 text-sm">Complex survey document</p>
                      <p className="text-white/30 text-xs mt-1">Setbacks, easements, utilities hidden in fine print</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="bg-destructive/20 text-destructive text-xs px-2 py-1 rounded">Manual interpretation</span>
                    <span className="bg-destructive/20 text-destructive text-xs px-2 py-1 rounded">2-3 week review</span>
                    <span className="bg-destructive/20 text-destructive text-xs px-2 py-1 rounded">$1,500-$3,000</span>
                  </div>
                </div>
              </motion.div>

              {/* After: Analyzed Output */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="bg-white/5 border border-data-cyan/30 rounded-2xl p-6 h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-5 h-5 text-data-cyan" />
                    <span className="text-data-cyan font-medium">AFTER: SiteIntel™ Analysis</span>
                  </div>
                  
                  {/* Simulated analyzed output */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-data-cyan/10 to-transparent rounded-lg border border-data-cyan/20 relative overflow-hidden">
                    {/* Extracted layers visualization */}
                    <div className="absolute inset-4 border-2 border-white/40 rounded">
                      <div className="absolute inset-3 border border-dashed border-data-cyan/60 rounded" />
                      <div className="absolute top-1/3 left-0 right-0 h-3 bg-feasibility-orange/30" />
                      <div className="absolute inset-6 bg-status-success/30 rounded flex items-center justify-center">
                        <span className="text-status-success font-bold text-sm">12,450 SF BUILDABLE</span>
                      </div>
                    </div>
                    
                    {/* Data callouts */}
                    <div className="absolute bottom-2 left-2 right-2 flex gap-2 flex-wrap">
                      <span className="bg-midnight-blue/80 text-white text-[10px] px-2 py-0.5 rounded">Setbacks: 25'/10'/10'/5'</span>
                      <span className="bg-midnight-blue/80 text-white text-[10px] px-2 py-0.5 rounded">Easement: 20' utility</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="bg-status-success/20 text-status-success text-xs px-2 py-1 rounded">AI extraction</span>
                    <span className="bg-status-success/20 text-status-success text-xs px-2 py-1 rounded">60 seconds</span>
                    <span className="bg-status-success/20 text-status-success text-xs px-2 py-1 rounded">$349–$399</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                How Survey Upload Works
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Three steps to engineering-grade feasibility.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-data-cyan/50 to-transparent z-0" />
                  )}
                  
                  <Card className="h-full border-2 hover:border-data-cyan/50 transition-colors relative z-10">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-data-cyan to-data-cyan/80 flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl font-mono">
                        {step.step}
                      </div>
                      <h3 className="font-headline text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
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
                <Button variant="expandIcon" Icon={Upload} iconPlacement="left" size="lg">
                  Upload Survey Now
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section className="py-20 md:py-28 bg-slate-50">
          <div className="container mx-auto px-6 lg:px-8 max-w-[900px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-2 border-data-cyan/30 overflow-hidden">
                <div className="bg-gradient-to-r from-data-cyan/10 to-transparent p-8 md:p-12">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-data-cyan/10 border border-data-cyan/30 rounded-full px-4 py-1.5 mb-4">
                      <DollarSign className="w-4 h-4 text-data-cyan" />
                      <span className="text-data-cyan text-sm font-medium">Premium Feature</span>
                    </div>
                    <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground mb-4">
                      Survey-Enhanced Feasibility
                    </h2>
                    <div className="flex items-baseline justify-center gap-2 mb-4">
                      <span className="text-5xl md:text-6xl font-bold text-data-cyan">$349–$399</span>
                    </div>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                      Equivalent to a $1,500–$3,000 civil pre-design review — delivered instantly.
                    </p>
                  </div>

                  <div className="max-w-md mx-auto">
                    <ul className="space-y-3 mb-8">
                      {pricingComparison.map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-status-success flex-shrink-0" />
                          <span className="text-foreground">{item.label}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="text-center">
                      <Link to="/beta-signup">
                        <Button variant="expandIcon" Icon={ArrowRight} iconPlacement="right" size="lg" className="w-full sm:w-auto">
                          Get Survey-Enhanced Access
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
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
                What Developers Are Saying
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
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
                          <div key={i} className="w-5 h-5 text-data-cyan">★</div>
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
        <section className="py-20 md:py-28 bg-gradient-to-br from-data-cyan to-data-cyan/90">
          <div className="container mx-auto px-6 lg:px-8 max-w-[1120px] text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                Upload Your Survey — Get Instant Accuracy.
              </h2>
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Join Early Access for Survey-Enhanced Feasibility. Limited seats for Texas developers.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link to="/beta-signup">
                  <Button
                    size="lg"
                    className="bg-white text-data-cyan hover:bg-white/90 font-semibold px-8 py-6 text-lg w-full sm:w-auto"
                  >
                    Upload Survey for Early Access →
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg w-full sm:w-auto"
                  >
                    View Sample Reports
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-white/70 text-sm">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Secure upload
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  60-second analysis
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Limited early access
                </span>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default SurveyUpload;
