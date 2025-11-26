import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Layers, 
  Clock, 
  AlertTriangle,
  Target,
  Zap,
  TrendingUp,
  Users,
  Building2,
  Briefcase,
  LineChart,
  Shield,
  Globe,
  CheckCircle2,
  ArrowRight,
  MapPin,
  FileText,
  DollarSign,
  BarChart3,
  Cpu,
  Database,
  Scale
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import siteintelLogo from "@/assets/siteintel-ai-logo-cre.png";

const TOTAL_SLIDES = 13;

// Slide transition variants
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

// Slide 1: Title
const TitleSlide = () => (
  <div className="relative h-full w-full bg-gradient-to-br from-[#0A0F2C] via-[#0A0F2C] to-[#1a1f3c] flex flex-col items-center justify-center p-12 overflow-hidden">
    {/* Blueprint grid overlay */}
    <div 
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}
    />
    
    <motion.img 
      src={siteintelLogo} 
      alt="SiteIntel" 
      className="h-16 mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    />
    
    <motion.h1 
      className="text-5xl md:text-7xl font-bold text-white mb-6 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      Feasibility-as-a-Service™
    </motion.h1>
    
    <motion.p 
      className="text-xl md:text-2xl text-white/70 max-w-3xl text-center mb-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      The first AI-powered feasibility platform for zoning, constraints, cost modeling, and development underwriting.
    </motion.p>
    
    <motion.div 
      className="flex gap-3 text-[#FF7A00] text-lg font-semibold tracking-wide"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
    >
      <span>Precision</span>
      <span className="text-white/40">•</span>
      <span>Proof</span>
      <span className="text-white/40">•</span>
      <span>Possibility</span>
    </motion.div>
  </div>
);

// Slide 2: The Problem
const ProblemSlide = () => (
  <div className="h-full w-full bg-[#0A0F2C] p-12 flex flex-col">
    <h2 className="text-4xl font-bold text-white mb-4">The Problem</h2>
    <p className="text-xl text-[#FF7A00] mb-8 max-w-4xl">
      Pre-development feasibility is the most critical decision in real estate — and the least efficient.
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
      {[
        { icon: Layers, title: "Fragmented Data", desc: "Zoning, utilities, constraints, and cost data live across disconnected systems with no unified workflow." },
        { icon: Clock, title: "Slow & Costly", desc: "Feasibility takes 2–6 weeks and costs $15k–$50k — limiting how many opportunities teams can validate." },
        { icon: AlertTriangle, title: "High Risk", desc: "One missed setback, easement, or utility constraint can invalidate millions in development assumptions." }
      ].map((item, i) => (
        <motion.div 
          key={i}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.1 }}
        >
          <item.icon className="w-10 h-10 text-[#FF7A00] mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
          <p className="text-white/60 text-sm flex-1">{item.desc}</p>
        </motion.div>
      ))}
    </div>
    
    <p className="text-white/40 text-sm mt-6">
      The industry still relies on PDFs, consultants, manual zoning lookup, and spreadsheets.
    </p>
  </div>
);

// Slide 3: The Opportunity
const OpportunitySlide = () => (
  <div className="h-full w-full bg-gradient-to-br from-[#F9FAFB] to-white p-12 flex flex-col">
    <h2 className="text-4xl font-bold text-[#0A0F2C] mb-4">The Opportunity</h2>
    <p className="text-xl text-[#FF7A00] mb-8">
      The world needs a standardized feasibility engine — and none exists.
    </p>
    
    <div className="grid grid-cols-2 gap-8 flex-1">
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-[#374151] uppercase tracking-wide">Before</h3>
        {["Manual zoning lookup", "Spreadsheet cost models", "2-6 week timelines", "Consultant dependency", "Fragmented data sources"].map((item, i) => (
          <motion.div 
            key={i} 
            className="flex items-center gap-3 text-[#374151]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span>{item}</span>
          </motion.div>
        ))}
      </div>
      
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-[#374151] uppercase tracking-wide">After (FaaS)</h3>
        {["AI zoning interpretation", "Automated cost engine", "60-second reports", "Self-service platform", "Unified data layer"].map((item, i) => (
          <motion.div 
            key={i} 
            className="flex items-center gap-3 text-[#374151]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>{item}</span>
          </motion.div>
        ))}
      </div>
    </div>
    
    <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-[#374151]/10">
      {[
        { value: "$21.6B", label: "U.S. TAM" },
        { value: "$110B", label: "Global TAM" },
        { value: "0", label: "Category Incumbents" }
      ].map((stat, i) => (
        <motion.div 
          key={i} 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + i * 0.1 }}
        >
          <p className="text-3xl font-bold text-[#FF7A00]">{stat.value}</p>
          <p className="text-sm text-[#374151]">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  </div>
);

// Slide 4: Our Solution
const SolutionSlide = () => (
  <div className="h-full w-full bg-[#0A0F2C] p-12 flex flex-col">
    <h2 className="text-4xl font-bold text-white mb-2">Our Solution</h2>
    <p className="text-2xl text-[#FF7A00] mb-8">A new layer in CRE intelligence.</p>
    
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1">
      {[
        { icon: Scale, title: "AI Zoning Interpretation", desc: "Parse codes, land-use tables, dimensional standards, overlays" },
        { icon: MapPin, title: "Constraints Mapping", desc: "Floodplain, utilities, easements, parcels, adjacencies" },
        { icon: Zap, title: "Utility Analysis", desc: "Water, sewer, power capacity and proximity" },
        { icon: DollarSign, title: "Cost Modeling", desc: "Dynamic per-SF costs, soft costs, contingency" },
        { icon: TrendingUp, title: "ROI Forecasting", desc: "IRR, NOI, DSCR, NPV calculations" },
        { icon: Target, title: "Feasibility Score™", desc: "Single metric combining all risk factors" }
      ].map((item, i) => (
        <motion.div 
          key={i}
          className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 + i * 0.05 }}
        >
          <item.icon className="w-8 h-8 text-[#06B6D4] mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
          <p className="text-white/50 text-sm">{item.desc}</p>
        </motion.div>
      ))}
    </div>
  </div>
);

// Slide 5: Product Demo
const ProductDemoSlide = () => (
  <div className="h-full w-full bg-gradient-to-br from-[#F9FAFB] to-white p-12 flex flex-col">
    <h2 className="text-4xl font-bold text-[#0A0F2C] mb-2">How It Works</h2>
    <p className="text-xl text-[#374151] mb-8">Clarity in six steps.</p>
    
    <div className="flex-1 flex items-center">
      <div className="grid grid-cols-6 gap-4 w-full">
        {[
          { num: "01", title: "Input", desc: "Address or Parcel" },
          { num: "02", title: "Zoning", desc: "AI Interpretation" },
          { num: "03", title: "Constraints", desc: "Risk Mapping" },
          { num: "04", title: "Costs", desc: "Cost Engine" },
          { num: "05", title: "ROI", desc: "Forecasting" },
          { num: "06", title: "Report", desc: "Generation" }
        ].map((step, i) => (
          <motion.div 
            key={i} 
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
          >
            <div className="bg-white border-2 border-[#06B6D4] rounded-xl p-4 text-center shadow-lg">
              <span className="text-xs font-mono text-[#06B6D4]">{step.num}</span>
              <h3 className="text-lg font-bold text-[#0A0F2C] mt-1">{step.title}</h3>
              <p className="text-xs text-[#374151] mt-1">{step.desc}</p>
            </div>
            {i < 5 && (
              <ArrowRight className="absolute -right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#06B6D4] z-10" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
    
    <div className="bg-[#0A0F2C] rounded-2xl p-6 mt-8">
      <p className="text-white/60 text-center">
        <span className="text-[#FF7A00] font-semibold">Result:</span> Lender-ready feasibility report in under 60 seconds
      </p>
    </div>
  </div>
);

// Slide 6: Why Now
const WhyNowSlide = () => (
  <div className="h-full w-full bg-[#0A0F2C] p-12 flex flex-col">
    <h2 className="text-4xl font-bold text-white mb-2">Why Now</h2>
    <p className="text-xl text-[#FF7A00] mb-8">Market timing is everything.</p>
    
    <div className="grid grid-cols-2 gap-8 flex-1">
      <div className="space-y-4">
        {[
          { icon: Cpu, title: "AI + GIS Maturity", desc: "LLMs can now parse complex zoning codes at scale" },
          { icon: Shield, title: "Higher Lender Scrutiny", desc: "Post-2023 credit tightening demands precision" },
          { icon: TrendingUp, title: "Cost Volatility", desc: "Construction costs up 40% since 2020" },
          { icon: Clock, title: "Shorter CRE Cycles", desc: "Developers need faster go/no-go decisions" },
          { icon: FileText, title: "Regulatory Complexity", desc: "Zoning codes grow more complex annually" }
        ].map((item, i) => (
          <motion.div 
            key={i}
            className="flex items-start gap-4 bg-white/5 rounded-lg p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <item.icon className="w-6 h-6 text-[#06B6D4] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-semibold">{item.title}</h3>
              <p className="text-white/50 text-sm">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="bg-white/5 rounded-2xl p-6 flex flex-col justify-center">
        <p className="text-white/40 text-sm uppercase tracking-wide mb-4">Market Inflection</p>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/60">AI Adoption in CRE</span>
              <span className="text-[#06B6D4] font-mono">↑ 340%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#06B6D4] to-[#FF7A00]"
                initial={{ width: 0 }}
                animate={{ width: "78%" }}
                transition={{ delay: 0.5, duration: 1 }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/60">Lender Due Diligence Requirements</span>
              <span className="text-[#06B6D4] font-mono">↑ 85%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#06B6D4] to-[#FF7A00]"
                initial={{ width: 0 }}
                animate={{ width: "65%" }}
                transition={{ delay: 0.6, duration: 1 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Slide 7: Market Size
const MarketSizeSlide = () => (
  <div className="h-full w-full bg-gradient-to-br from-[#F9FAFB] to-white p-12 flex flex-col">
    <h2 className="text-4xl font-bold text-[#0A0F2C] mb-2">Market Size</h2>
    <p className="text-xl text-[#374151] mb-8">A multi-billion dollar opportunity.</p>
    
    <div className="flex-1 flex items-center justify-center">
      <div className="relative">
        {/* TAM Circle */}
        <motion.div 
          className="w-80 h-80 rounded-full border-4 border-[#FF7A00]/30 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* SAM Circle */}
          <motion.div 
            className="w-56 h-56 rounded-full border-4 border-[#FF7A00]/50 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            {/* SOM Circle */}
            <motion.div 
              className="w-32 h-32 rounded-full bg-[#FF7A00] flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="text-center text-white">
                <p className="text-2xl font-bold">$850M</p>
                <p className="text-xs">SOM</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Labels */}
        <div className="absolute -right-32 top-4 text-right">
          <p className="text-2xl font-bold text-[#0A0F2C]">$110B</p>
          <p className="text-sm text-[#374151]">Global TAM</p>
        </div>
        <div className="absolute -right-32 top-1/2 -translate-y-1/2 text-right">
          <p className="text-xl font-bold text-[#0A0F2C]">$21.6B</p>
          <p className="text-sm text-[#374151]">U.S. SAM</p>
        </div>
      </div>
    </div>
    
    <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#374151]/10">
      {[
        { value: "$1.4T", label: "U.S. CRE Annual Spend" },
        { value: "3-5%", label: "Pre-Dev as % of Project" },
        { value: "40K+", label: "Active U.S. Developers" },
        { value: "$15-50K", label: "Avg Feasibility Cost" }
      ].map((stat, i) => (
        <div key={i} className="text-center">
          <p className="text-xl font-bold text-[#0A0F2C]">{stat.value}</p>
          <p className="text-xs text-[#374151]">{stat.label}</p>
        </div>
      ))}
    </div>
  </div>
);

// Slide 8: Business Model
const BusinessModelSlide = () => (
  <div className="h-full w-full bg-[#0A0F2C] p-12 flex flex-col">
    <h2 className="text-4xl font-bold text-white mb-2">Business Model</h2>
    <p className="text-xl text-[#FF7A00] mb-8">Multiple revenue streams, high margins.</p>
    
    <div className="grid grid-cols-2 gap-8 flex-1">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white/60 uppercase tracking-wide">Revenue Streams</h3>
        {[
          { icon: Building2, title: "SaaS Subscription", desc: "$1,950/mo Pro tier", highlight: true },
          { icon: FileText, title: "Per-Feasibility Credits", desc: "$795 per report" },
          { icon: Database, title: "Enterprise API", desc: "$9,990/mo + usage" },
          { icon: Briefcase, title: "Lender Packages", desc: "Custom enterprise deals" }
        ].map((item, i) => (
          <motion.div 
            key={i}
            className={cn(
              "flex items-center gap-4 rounded-lg p-4",
              item.highlight ? "bg-[#FF7A00]/20 border border-[#FF7A00]/30" : "bg-white/5"
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <item.icon className="w-6 h-6 text-[#06B6D4]" />
            <div>
              <h4 className="text-white font-semibold">{item.title}</h4>
              <p className="text-white/50 text-sm">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="bg-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white/60 uppercase tracking-wide mb-6">Unit Economics</h3>
        <div className="space-y-6">
          {[
            { label: "Gross Margin", value: "95%", bar: 95 },
            { label: "API Cost per Report", value: "$12", bar: 15 },
            { label: "CAC Payback", value: "3 mo", bar: 25 },
            { label: "Target LTV:CAC", value: "8:1", bar: 80 }
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">{item.label}</span>
                <span className="text-[#06B6D4] font-mono">{item.value}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-[#06B6D4]"
                  initial={{ width: 0 }}
                  animate={{ width: `${item.bar}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Slide 9: Traction
const TractionSlide = () => (
  <div className="h-full w-full bg-gradient-to-br from-[#F9FAFB] to-white p-12 flex flex-col">
    <h2 className="text-4xl font-bold text-[#0A0F2C] mb-2">Traction & Validation</h2>
    <p className="text-xl text-[#374151] mb-8">Data-backed confidence.</p>
    
    <div className="grid grid-cols-4 gap-6 mb-8">
      {[
        { value: "500+", label: "Feasibility Reports Generated" },
        { value: "98.2%", label: "Data Accuracy Rate" },
        { value: "$2.4M", label: "Project Value Analyzed" },
        { value: "47", label: "Beta Waitlist" }
      ].map((stat, i) => (
        <motion.div 
          key={i}
          className="bg-white border border-[#374151]/10 rounded-xl p-6 text-center shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.05 }}
        >
          <p className="text-3xl font-bold text-[#FF7A00]">{stat.value}</p>
          <p className="text-sm text-[#374151] mt-1">{stat.label}</p>
        </motion.div>
      ))}
    </div>
    
    <div className="flex-1 grid grid-cols-2 gap-6">
      <div className="bg-[#0A0F2C] rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Validation Milestones</h3>
        <div className="space-y-3">
          {[
            "Internal usage at Maxx Builders (dogfooding)",
            "Developer waitlist growing organically",
            "Accuracy validated against real projects",
            "Early enterprise interest from lenders"
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#06B6D4]" />
              <span className="text-white/70 text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white border border-[#374151]/10 rounded-2xl p-6">
        <h3 className="text-[#0A0F2C] font-semibold mb-4">Pipeline</h3>
        <div className="space-y-3">
          {[
            { stage: "Qualified Leads", count: 23 },
            { stage: "Demo Scheduled", count: 12 },
            { stage: "Pilot Discussion", count: 6 },
            { stage: "Contract Negotiation", count: 2 }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[#374151] text-sm">{item.stage}</span>
              <span className="text-[#FF7A00] font-mono font-bold">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Slide 10: Competitive Landscape
const CompetitiveLandscapeSlide = () => (
  <div className="h-full w-full bg-[#0A0F2C] p-12 flex flex-col">
    <h2 className="text-4xl font-bold text-white mb-2">Competitive Landscape</h2>
    <p className="text-xl text-[#FF7A00] mb-8">Category creator, not competitor.</p>
    
    <div className="flex-1 flex items-center justify-center relative">
      {/* Quadrant grid */}
      <div className="relative w-full max-w-2xl aspect-square">
        {/* Axes */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
        
        {/* Axis labels */}
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-white/40">Automated</span>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/40">Manual</span>
        <span className="absolute top-1/2 -left-16 -translate-y-1/2 text-xs text-white/40">Point Solution</span>
        <span className="absolute top-1/2 -right-16 -translate-y-1/2 text-xs text-white/40">Full Platform</span>
        
        {/* Competitors */}
        <motion.div 
          className="absolute top-[20%] left-[70%] bg-[#FF7A00] rounded-full w-20 h-20 flex items-center justify-center text-white font-bold text-xs text-center shadow-lg shadow-[#FF7A00]/30"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          SiteIntel™
        </motion.div>
        
        {[
          { name: "GIS Tools", pos: "top-[30%] left-[25%]" },
          { name: "Zoning Lookup", pos: "top-[60%] left-[20%]" },
          { name: "Consultants", pos: "top-[75%] left-[60%]" },
          { name: "Spreadsheets", pos: "top-[80%] left-[35%]" },
          { name: "CoStar", pos: "top-[40%] left-[75%]" }
        ].map((item, i) => (
          <motion.div 
            key={i}
            className={cn("absolute bg-white/10 rounded-full w-16 h-16 flex items-center justify-center text-white/60 text-xs text-center", item.pos)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.1 }}
          >
            {item.name}
          </motion.div>
        ))}
      </div>
    </div>
    
    <p className="text-center text-white/60 mt-4">
      <span className="text-[#FF7A00] font-semibold">SiteIntel™</span> is the only Feasibility-as-a-Service™ platform.
    </p>
  </div>
);

// Slide 11: Team
const TeamSlide = () => (
  <div className="h-full w-full bg-gradient-to-br from-[#F9FAFB] to-white p-12 flex flex-col">
    <h2 className="text-4xl font-bold text-[#0A0F2C] mb-2">Team</h2>
    <p className="text-xl text-[#374151] mb-8">Built by operators who understand the problem.</p>
    
    <div className="grid grid-cols-2 gap-8 flex-1">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[#374151] uppercase tracking-wide">Unfair Advantages</h3>
        {[
          { icon: Building2, title: "Construction Expertise", desc: "Decade of pre-development experience" },
          { icon: BarChart3, title: "Millions of SF Delivered", desc: "Real-world feasibility validation" },
          { icon: Cpu, title: "AI/GIS Development", desc: "Full-stack technical capability" },
          { icon: Database, title: "Proprietary Data Access", desc: "Texas parcel + zoning database" },
          { icon: Target, title: "Dogfooding", desc: "We use SiteIntel for our own projects" }
        ].map((item, i) => (
          <motion.div 
            key={i}
            className="flex items-start gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <div className="w-10 h-10 rounded-lg bg-[#FF7A00]/10 flex items-center justify-center shrink-0">
              <item.icon className="w-5 h-5 text-[#FF7A00]" />
            </div>
            <div>
              <h4 className="text-[#0A0F2C] font-semibold">{item.title}</h4>
              <p className="text-[#374151] text-sm">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="bg-[#0A0F2C] rounded-2xl p-6 flex flex-col justify-center">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF7A00] to-[#06B6D4] mx-auto mb-4 flex items-center justify-center">
            <Users className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-white text-xl font-bold">Founding Team</h3>
          <p className="text-white/60 mt-2">Construction + Technology</p>
          <div className="mt-6 space-y-2">
            <p className="text-white/40 text-sm">Maxx Builders • Maxx Design Group</p>
            <p className="text-white/40 text-sm">Houston, Texas</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Slide 12: Financials
const FinancialsSlide = () => (
  <div className="h-full w-full bg-[#0A0F2C] p-12 flex flex-col">
    <h2 className="text-4xl font-bold text-white mb-2">Financial Projections</h2>
    <p className="text-xl text-[#FF7A00] mb-8">Path to $10M ARR.</p>
    
    <div className="flex-1 flex items-center">
      <div className="w-full">
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { year: "Y1", arr: "$500K", customers: "50" },
            { year: "Y2", arr: "$2M", customers: "150" },
            { year: "Y3", arr: "$5M", customers: "350" },
            { year: "Y4", arr: "$10M", customers: "700" },
            { year: "Y5", arr: "$20M", customers: "1,400" }
          ].map((item, i) => (
            <motion.div 
              key={i}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <p className="text-white/40 text-sm font-mono">{item.year}</p>
              <p className="text-2xl font-bold text-[#FF7A00] mt-2">{item.arr}</p>
              <p className="text-white/50 text-xs mt-1">{item.customers} customers</p>
            </motion.div>
          ))}
        </div>
        
        {/* Simple bar chart */}
        <div className="flex items-end justify-between h-40 gap-4 px-8">
          {[5, 20, 50, 100, 200].map((height, i) => (
            <motion.div 
              key={i}
              className="flex-1 bg-gradient-to-t from-[#FF7A00] to-[#06B6D4] rounded-t-lg"
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
            />
          ))}
        </div>
      </div>
    </div>
    
    <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-white/10">
      {[
        { label: "Break-even", value: "Month 18" },
        { label: "Gross Margin", value: "95%" },
        { label: "Net Revenue Retention", value: "120%" }
      ].map((item, i) => (
        <div key={i} className="text-center">
          <p className="text-xl font-bold text-[#06B6D4]">{item.value}</p>
          <p className="text-white/50 text-sm">{item.label}</p>
        </div>
      ))}
    </div>
  </div>
);

// Slide 13: The Ask
const AskSlide = () => (
  <div className="relative h-full w-full bg-gradient-to-br from-[#0A0F2C] via-[#0A0F2C] to-[#1a1f3c] p-12 flex flex-col items-center justify-center overflow-hidden">
    {/* Blueprint grid overlay */}
    <div 
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}
    />
    
    <motion.h2 
      className="text-4xl md:text-5xl font-bold text-white mb-6 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      We're raising <span className="text-[#FF7A00]">$3M–$8M</span>
    </motion.h2>
    
    <motion.p 
      className="text-xl text-white/70 mb-12 text-center max-w-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      to establish Feasibility-as-a-Service™ as the global standard.
    </motion.p>
    
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      {[
        { icon: Cpu, label: "Engineering" },
        { icon: Globe, label: "Zoning Expansion" },
        { icon: Users, label: "Sales Team" },
        { icon: Database, label: "API Development" }
      ].map((item, i) => (
        <div key={i} className="text-center">
          <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2">
            <item.icon className="w-7 h-7 text-[#06B6D4]" />
          </div>
          <p className="text-white/60 text-sm">{item.label}</p>
        </div>
      ))}
    </motion.div>
    
    <motion.p 
      className="text-lg text-white/50 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      Join us in defining the next category of CRE intelligence.
    </motion.p>
    
    <motion.div 
      className="flex gap-3 text-[#FF7A00] text-lg font-semibold tracking-wide mt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
    >
      <span>Precision</span>
      <span className="text-white/40">•</span>
      <span>Proof</span>
      <span className="text-white/40">•</span>
      <span>Possibility</span>
    </motion.div>
  </div>
);

// All slides array
const slides = [
  TitleSlide,
  ProblemSlide,
  OpportunitySlide,
  SolutionSlide,
  ProductDemoSlide,
  WhyNowSlide,
  MarketSizeSlide,
  BusinessModelSlide,
  TractionSlide,
  CompetitiveLandscapeSlide,
  TeamSlide,
  FinancialsSlide,
  AskSlide
];

const slideNames = [
  "Title",
  "Problem",
  "Opportunity",
  "Solution",
  "Product Demo",
  "Why Now",
  "Market Size",
  "Business Model",
  "Traction",
  "Competition",
  "Team",
  "Financials",
  "The Ask"
];

export default function InvestorDeck() {
  const [[page, direction], setPage] = useState([0, 0]);
  const deckRef = useRef<HTMLDivElement>(null);

  const paginate = useCallback((newDirection: number) => {
    const newPage = page + newDirection;
    if (newPage >= 0 && newPage < TOTAL_SLIDES) {
      setPage([newPage, newDirection]);
    }
  }, [page]);

  const goToSlide = (index: number) => {
    const direction = index > page ? 1 : -1;
    setPage([index, direction]);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        paginate(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        paginate(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        setPage([0, -1]);
      } else if (e.key === "End") {
        e.preventDefault();
        setPage([TOTAL_SLIDES - 1, 1]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paginate]);

  const handleExportPDF = async () => {
    // Dynamic import for PDF generation
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [1920, 1080]
    });

    const currentPage = page;
    
    for (let i = 0; i < TOTAL_SLIDES; i++) {
      setPage([i, 1]);
      
      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (deckRef.current) {
        const canvas = await html2canvas(deckRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#0A0F2C"
        });
        
        const imgData = canvas.toDataURL("image/png");
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, "PNG", 0, 0, 1920, 1080);
      }
    }
    
    // Restore current page
    setPage([currentPage, 0]);
    
    pdf.save("SiteIntel-Investor-Deck.pdf");
  };

  const CurrentSlide = slides[page];

  return (
    <div className="h-screen w-screen bg-[#0A0F2C] flex flex-col overflow-hidden">
      {/* Navigation bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/20 backdrop-blur-sm border-b border-white/10 z-50">
        <div className="flex items-center gap-4">
          <img src={siteintelLogo} alt="SiteIntel" className="h-6" />
          <span className="text-white/40 text-sm">Investor Deck</span>
        </div>
        
        <div className="flex items-center gap-2">
          {slideNames.map((name, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === page ? "bg-[#FF7A00] w-6" : "bg-white/20 hover:bg-white/40"
              )}
              title={name}
            />
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-sm font-mono">
            {String(page + 1).padStart(2, "0")} / {TOTAL_SLIDES}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>
      
      {/* Slide container */}
      <div ref={deckRef} className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(_, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="absolute inset-0"
          >
            <CurrentSlide />
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Navigation arrows */}
      <button
        onClick={() => paginate(-1)}
        disabled={page === 0}
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white transition-all z-40",
          page === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20"
        )}
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        onClick={() => paginate(1)}
        disabled={page === TOTAL_SLIDES - 1}
        className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white transition-all z-40",
          page === TOTAL_SLIDES - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20"
        )}
      >
        <ChevronRight className="w-6 h-6" />
      </button>
      
      {/* Keyboard hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-xs flex items-center gap-4">
        <span>← → Arrow keys to navigate</span>
        <span>•</span>
        <span>Space for next</span>
      </div>
    </div>
  );
}
