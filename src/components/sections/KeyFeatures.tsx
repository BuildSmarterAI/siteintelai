import { motion, useInView } from "framer-motion";
import { 
  Gauge, 
  Building2, 
  Waves, 
  Droplets, 
  Leaf, 
  BarChart3,
  ArrowRight,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export const KeyFeatures = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const navigate = useNavigate();
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const features = [
    {
      icon: Gauge,
      title: "AI Feasibility Score (0-100)",
      subtitle: "Instant go/no-go intelligence",
      description: "A composite score based on zoning compliance, flood risk, utility access, environmental constraints, and market indicators. Scores above 80 indicate strong feasibility. Scores below 60 flag significant concerns.",
      details: [
        "Score bands: A (80-100), B (60-79), C (<60)",
        "Verdicts: PROCEED, CONDITIONAL, DO NOT PROCEED",
      ],
      color: "bg-gradient-to-br from-[#FF7A00] to-[#FF9240]",
      iconBg: "bg-[#FF7A00]/10",
      iconColor: "text-[#FF7A00]",
    },
    {
      icon: Building2,
      title: "Zoning & Buildability Analysis",
      subtitle: "Understand exactly what you can build",
      description: "Land use codes, permitted uses, setback requirements, height limits, FAR calculations, and overlay districts—automatically parsed and explained. Know your buildable envelope before you negotiate.",
      details: [
        "Setback & height limit extraction",
        "FAR and lot coverage calculations",
      ],
      color: "bg-gradient-to-br from-[#0A0F2C] to-[#1a2550]",
      iconBg: "bg-[#0A0F2C]/10",
      iconColor: "text-[#0A0F2C]",
    },
    {
      icon: Waves,
      title: "FEMA Flood Risk Assessment",
      subtitle: "Critical risk data from authoritative sources",
      description: "Flood zone classification, Base Flood Elevation, NFIP claims history, and historical flood events. Floodway designations automatically flagged as kill factors.",
      details: [
        "Zone AE, VE, X classification",
        "Historical flood event mapping",
      ],
      color: "bg-gradient-to-br from-[#EF4444] to-[#DC2626]",
      iconBg: "bg-red-100",
      iconColor: "text-red-500",
    },
    {
      icon: Droplets,
      title: "Utility Infrastructure Mapping",
      subtitle: "Know your connection costs before they surprise you",
      description: "Water mains, sewer lines, stormwater infrastructure, and force main proximity—measured in feet from parcel boundary. Includes utility district identification and capacity indicators.",
      details: [
        "Distance to nearest connections",
        "MUD/WCID district identification",
      ],
      color: "bg-gradient-to-br from-[#1F6AE1] to-[#3B82F6]",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-500",
    },
    {
      icon: Leaf,
      title: "EPA Environmental Analysis",
      subtitle: "Environmental risk within a 1-mile radius",
      description: "Regulated facilities from EPA ECHO, wetlands from NWI, soil characteristics, and brownfield proximity. Critical for Phase I scoping and lender requirements.",
      details: [
        "ECHO facility proximity search",
        "Wetlands classification & area",
      ],
      color: "bg-gradient-to-br from-[#0D9488] to-[#14B8A6]",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-500",
    },
    {
      icon: BarChart3,
      title: "Census Demographics & Market Intelligence",
      subtitle: "83+ variables plus 6 proprietary CRE indices",
      description: "Exclusive metrics unavailable elsewhere: Retail Spending Index, Workforce Availability Score, Growth Potential Index, Affluence Concentration, Labor Pool Depth, and Daytime Population Estimate.",
      details: [
        "1mi, 3mi, 5mi trade area analysis",
        "5-year growth projections",
      ],
      color: "bg-gradient-to-br from-[#06B6D4] to-[#22D3EE]",
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-500",
    },
  ];

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

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" as const },
    },
  };

  return (
    <section ref={ref} className="bg-white py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] text-[#0A0F2C] mb-4">
            Everything You Need to Know About Any Site
          </h2>
          <p className="font-body text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            From zoning analysis to market demographics, SiteIntel delivers comprehensive intelligence that used to require multiple consultants and weeks of research.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12"
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            const isExpanded = expandedCard === index;
            
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group cursor-pointer transition-all duration-300"
                onClick={() => setExpandedCard(isExpanded ? null : index)}
              >
                <div className="p-6 md:p-8">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`w-14 h-14 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-5`}
                  >
                    <IconComponent className={`w-7 h-7 ${feature.iconColor}`} />
                  </motion.div>

                  {/* Content */}
                  <h3 className="font-heading text-xl font-semibold text-[#0A0F2C] mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#FF7A00] font-medium mb-3">
                    {feature.subtitle}
                  </p>
                  <p className="font-body text-slate-600 leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  {/* Expandable Details */}
                  <motion.div
                    initial={false}
                    animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-slate-100">
                      {feature.details.map((detail, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
                          <span className="text-sm text-slate-600">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Expand Indicator */}
                  <div className="flex items-center gap-1 text-sm text-slate-400 mt-4">
                    <span>{isExpanded ? 'Less' : 'More'}</span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            size="lg"
            className="bg-[#FF7A00] hover:bg-[#FF9240] text-white font-heading font-semibold rounded-full px-10 py-7 text-lg shadow-lg hover:shadow-xl transition-all group"
            onClick={() => navigate('/data-sources')}
          >
            Explore All Data Points
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-[#0A0F2C] text-[#0A0F2C] hover:bg-[#0A0F2C]/5 font-heading rounded-full px-10 py-7 text-lg"
            onClick={() => navigate('/sample-report')}
          >
            Download Sample Report
          </Button>
        </motion.div>
      </div>
    </section>
  );
};