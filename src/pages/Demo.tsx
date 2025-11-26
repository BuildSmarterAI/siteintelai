import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Play, 
  ArrowRight, 
  Clock, 
  AlertTriangle, 
  TrendingDown,
  Users,
  Target,
  Zap,
  MapPin,
  Droplets,
  Building2,
  DollarSign,
  Shield,
  Wrench,
  Calendar,
  FileSearch,
  MessageSquare,
  CheckCircle2,
  Briefcase,
  LineChart,
  Award,
  Star,
  Quote
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Demo = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const developerPains = [
    { icon: Clock, text: "Feasibility takes 3–6 weeks." },
    { icon: AlertTriangle, text: "Zoning and utilities cause the most deal failures." },
    { icon: TrendingDown, text: "Bad data leads to multi-million dollar mistakes." }
  ];

  const brokerPains = [
    { icon: Clock, text: "Clients want answers yesterday." },
    { icon: Target, text: "You lose listings without feasibility clarity." },
    { icon: Zap, text: "Competitors are using data-driven tools." }
  ];

  const investorPains = [
    { icon: TrendingDown, text: "Underwriting blind kills IRR." },
    { icon: AlertTriangle, text: "You can't afford a zoning/FEMA surprise." },
    { icon: Clock, text: "Every bad parcel wastes time you can't get back." }
  ];

  const demoSteps = [
    { 
      step: "01", 
      icon: MapPin, 
      title: "We load a real Texas parcel (or yours).",
      description: "Enter any Texas address or bring your own site for live analysis."
    },
    { 
      step: "02", 
      icon: FileSearch, 
      title: "SiteIntel analyzes zoning, flood, utilities, envelope, and costs automatically.",
      description: "Watch real-time data aggregation from 15+ authoritative sources."
    },
    { 
      step: "03", 
      icon: CheckCircle2, 
      title: "See a full feasibility summary + red flags + recommendations.",
      description: "Get instant clarity on buildability, risks, and next steps."
    },
    { 
      step: "04", 
      icon: MessageSquare, 
      title: "Ask live questions about your projects or land opportunities.",
      description: "Our team answers your specific questions in real-time."
    }
  ];

  const featureCards = [
    { 
      icon: Building2, 
      title: "Zoning Breakdown", 
      description: "Permitted uses, setbacks, height limits, parking requirements, and overlay districts." 
    },
    { 
      icon: Droplets, 
      title: "Flood & Environmental", 
      description: "FEMA zones, wetlands, EPA proximity, and environmental constraints." 
    },
    { 
      icon: Wrench, 
      title: "Utilities & Extension Risk", 
      description: "Water, sewer, gas, power availability and extension cost estimates." 
    },
    { 
      icon: Target, 
      title: "Buildable Envelope", 
      description: "Maximum footprint calculation with or without survey data." 
    },
    { 
      icon: DollarSign, 
      title: "Cost Modeling", 
      description: "Texas-specific construction costs, permit timelines, and budget ranges." 
    },
    { 
      icon: Shield, 
      title: "Deal-Killer Detection", 
      description: "Instant identification of fatal flaws and feasibility score." 
    }
  ];

  const developerBenefits = [
    "Instant site viability",
    "Faster LOIs",
    "Risk elimination",
    "Engineering-grade insights"
  ];

  const brokerBenefits = [
    "Win more listings",
    "Provide more value to clients",
    "Faster tours & pitches",
    "Build credibility instantly"
  ];

  const investorBenefits = [
    "Better underwriting",
    "Faster deal screening",
    "Avoid bad land early",
    "Faster capital deployment"
  ];

  const testimonials = [
    {
      quote: "The demo showed me exactly what I needed — we identified 3 deal-killers on a site we almost bought.",
      author: "Marcus Chen",
      role: "Commercial Developer",
      location: "Houston, TX"
    },
    {
      quote: "I now include SiteIntel feasibility in every listing presentation. Clients are impressed.",
      author: "Sarah Williams",
      role: "Land Broker",
      location: "Dallas, TX"
    },
    {
      quote: "This changed how we underwrite land. We screen 10x more parcels in the same time.",
      author: "David Park",
      role: "CRE Investor",
      location: "Austin, TX"
    }
  ];

  const faqs = [
    {
      question: "How long is the demo?",
      answer: "Our live demos typically run 20-30 minutes. We'll show you a complete feasibility analysis on a real Texas parcel and answer your questions."
    },
    {
      question: "Can you analyze my parcel?",
      answer: "Absolutely! Bring any Texas address or parcel ID to the demo. We'll run a live analysis so you can see exactly how SiteIntel works on your actual projects."
    },
    {
      question: "Does this work for all Texas cities?",
      answer: "Yes. SiteIntel covers all Texas jurisdictions including Houston, Dallas, Austin, San Antonio, Fort Worth, and every city and county in between."
    },
    {
      question: "What data sources do you use?",
      answer: "We aggregate data from 15+ authoritative sources including FEMA, EPA, HCAD, TxDOT, county appraisal districts, city GIS systems, and utility providers."
    },
    {
      question: "Can we upload surveys during the demo?",
      answer: "Yes! If you have a survey (PDF, DWG, DXF, or image), we can demonstrate our survey extraction capabilities live during your demo."
    },
    {
      question: "Do you offer enterprise plans?",
      answer: "Yes. We offer multi-seat licenses, API access, and custom integrations for teams and enterprises. Ask about enterprise pricing during your demo."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeInUp}>
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Play className="w-3 h-3 mr-1" />
                Live demo with real Texas site data
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
                See Feasibility Generated in{" "}
                <span className="text-primary">60 Seconds</span>.
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Experience how SiteIntel™ instantly analyzes zoning, flood, utilities, 
                buildable envelope, cost feasibility, and deal-killers — all using real Texas datasets.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book an Instant Demo
                </Button>
                <Button size="lg" variant="outline">
                  Watch Sample Feasibility Report
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-3 gap-2 p-4 opacity-30">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="bg-primary/20 rounded animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                  <div className="relative z-10 text-center">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <Play className="w-8 h-8 text-primary-foreground ml-1" />
                    </div>
                    <p className="text-sm text-muted-foreground">Parcel → Zoning → Flood → Utilities → Envelope</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Live Demo Preview</span>
                  <Badge variant="secondary">Interactive</Badge>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pain Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Still Evaluating Sites the{" "}
              <span className="text-destructive">Old Way</span>?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Developers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">For Developers</h3>
                  </div>
                  <ul className="space-y-4">
                    {developerPains.map((pain, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <pain.icon className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{pain.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Brokers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">For Brokers</h3>
                  </div>
                  <ul className="space-y-4">
                    {brokerPains.map((pain, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <pain.icon className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{pain.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Investors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Card className="h-full border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <LineChart className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">For Investors</h3>
                  </div>
                  <ul className="space-y-4">
                    {investorPains.map((pain, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <pain.icon className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{pain.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Book Your Demo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Demo Preview Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              What You'll See in the Demo
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete walkthrough of SiteIntel's instant feasibility analysis
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {demoSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl font-display font-bold text-primary/20">{step.step}</span>
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <step.icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 leading-snug">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Your Demo Covers Every Feasibility Layer
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how each critical data layer is analyzed in real-time
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {featureCards.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
              >
                <Card className="h-full border-border/50 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Book Demo Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ICP Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Why Developers, Brokers, and Investors Book Demos
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Developers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
                    <Building2 className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">Developers</h3>
                  <ul className="space-y-3">
                    {developerBenefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Brokers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
                    <Briefcase className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">Brokers</h3>
                  <ul className="space-y-3">
                    {brokerBenefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Investors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Card className="h-full border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
                    <LineChart className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">Investors</h3>
                  <ul className="space-y-3">
                    {investorBenefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Trusted Across The Texas CRE Market
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-border/50">
                  <CardContent className="p-6">
                    <Quote className="w-8 h-8 text-primary/30 mb-4" />
                    <p className="text-foreground mb-6 italic">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {testimonial.author.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{testimonial.author}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}, {testimonial.location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Trust badges placeholder */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 flex flex-wrap justify-center gap-8 items-center opacity-50"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="w-5 h-5" />
              <span className="text-sm">Early Testers</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-5 h-5" />
              <span className="text-sm">50+ Developers</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="w-5 h-5" />
              <span className="text-sm">Texas-Focused</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Demo Booking Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Ready to See Instant Feasibility?
              </h2>
              <p className="text-xl text-muted-foreground">
                Book your personalized demo and see SiteIntel in action.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-primary/20 shadow-xl">
                <CardContent className="p-8">
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Your full name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="you@company.com" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="developer">Developer</SelectItem>
                            <SelectItem value="broker">Broker</SelectItem>
                            <SelectItem value="investor">Investor</SelectItem>
                            <SelectItem value="architect">Architect</SelectItem>
                            <SelectItem value="engineer">Civil Engineer</SelectItem>
                            <SelectItem value="planner">City Planner</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your city" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="houston">Houston</SelectItem>
                            <SelectItem value="dallas">Dallas</SelectItem>
                            <SelectItem value="austin">Austin</SelectItem>
                            <SelectItem value="san-antonio">San Antonio</SelectItem>
                            <SelectItem value="fort-worth">Fort Worth</SelectItem>
                            <SelectItem value="other">Other Texas City</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project">Project or site you want us to demo (optional)</Label>
                      <Textarea 
                        id="project" 
                        placeholder="Enter an address, parcel ID, or describe your project..."
                        rows={3}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button type="submit" size="lg" className="flex-1 bg-primary hover:bg-primary/90">
                        <Calendar className="w-5 h-5 mr-2" />
                        Book Instant Demo
                      </Button>
                      <Button type="button" size="lg" variant="outline" asChild>
                        <Link to="/beta-signup">
                          Get Early Access Instead
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                FAQ: Before You Book Your Demo…
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
                    className="bg-card border border-border/50 rounded-lg px-6"
                  >
                    <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Get Feasibility Clarity in Minutes — Not Weeks.
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join the Texas developers, brokers, and investors who are making faster, smarter land decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Calendar className="w-5 h-5 mr-2" />
                Book Demo Now
              </Button>
              <Button size="lg" variant="outline">
                See Sample Report
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Demo;
