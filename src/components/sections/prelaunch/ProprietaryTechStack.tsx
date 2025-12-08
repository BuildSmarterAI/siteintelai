import { motion, type Variants } from "framer-motion";

const layers = [
  {
    label: "Layer 1",
    title: "Raw Data Intake",
    description: "Parcels, zoning text and maps, FEMA flood and BFE data, wetlands and hydric soils, water and sewer networks, TxDOT access geometry and elevation models ingested into the SiteIntel pipeline.",
    accentColor: "#4B5563",
    elevation: "flat" as const,
  },
  {
    label: "Engine 2",
    title: "Structured Geospatial Orchestration Layer™ (SGOL™)",
    description: "Normalization layer that converts noisy, inconsistent city, county and state GIS feeds into a clean, standardized regulatory dataset ready for automated feasibility.",
    accentColor: "#0EA5E9",
    elevation: "low" as const,
  },
  {
    label: "Engine 1",
    title: "Geospatial Inference Stack™",
    description: "Cross-layer regulatory intelligence that merges zoning codes, FEMA flood data, wetlands, parcels, utilities, driveways and elevation models to detect conflicts and compute buildability.",
    accentColor: "#6366F1",
    elevation: "low" as const,
  },
  {
    label: "Engine 3",
    title: "Neural Constraint Resolution Engine™ (NCRE™)",
    description: "Multi-pass AI feasibility reasoning that reconciles zoning, flood, environmental, utility, access and topographic constraints into a single, defensible feasibility determination for the site.",
    accentColor: "#EAB308",
    elevation: "low" as const,
  },
  {
    label: "Engines 5–6",
    title: "Specialized Feasibility Modules",
    description: "TIM™ evaluates slope, grading, drainage and pad viability. ISM™ determines water, sewer and electric serviceability based on real engineering logic, not GIS proximity, and ties both into overall feasibility.",
    accentColor: "#22C55E",
    elevation: "low" as const,
  },
  {
    label: "Engine 4",
    title: "Composite Feasibility Index™ (CFI™)",
    description: "Lender-calibrated feasibility scoring that consolidates zoning conformity, environmental risk, utility readiness, access constraints, topographic difficulty and ROM cost impact into one consistent site score.",
    accentColor: "#F97316",
    elevation: "medium" as const,
  },
  {
    label: "Final Output",
    title: "24-Hour Automated Feasibility Report",
    description: "Zoning, floodplain, wetlands, utilities, access, topography, impervious cover, drainage, ROM cost premiums and a lender-ready narrative packaged in a single feasibility report.",
    accentColor: "#06B6D4",
    elevation: "high" as const,
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const getElevationStyles = (elevation: "flat" | "low" | "medium" | "high") => {
  switch (elevation) {
    case "high":
      return "shadow-lg shadow-cyan-500/20";
    case "medium":
      return "shadow-md shadow-orange-500/15";
    case "low":
      return "shadow-sm";
    default:
      return "";
  }
};

export const ProprietaryTechStack = () => {
  return (
    <section className="py-[72px] px-6 bg-[#020617]">
      <div className="max-w-[1120px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-8 space-y-3"
        >
          <p className="text-xs tracking-[0.18em] uppercase text-[#06B6D4] font-medium">
            SiteIntel™ Regulatory Compute Stack
          </p>
          <h2 className="font-heading text-[28px] md:text-3xl lg:text-4xl font-bold text-[#F9FAFB]">
            How the Feasibility Engine Computes a Site in 24 Hours
          </h2>
          <p className="text-[15px] text-[#9CA3AF] max-w-[720px] mx-auto leading-relaxed">
            From raw GIS feeds to a lender-calibrated feasibility score, each engine layer builds on the last to produce a defensible decision for any commercial site.
          </p>
        </motion.div>

        {/* Stack Diagram */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="flex flex-col gap-2.5 max-w-[880px] mx-auto"
        >
          {layers.map((layer, index) => (
            <motion.div
              key={layer.title}
              variants={cardVariants}
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              className={`
                relative p-5 md:p-6 rounded-xl border backdrop-blur-sm
                bg-[rgba(15,23,42,0.9)] ${getElevationStyles(layer.elevation)}
                transition-all duration-300 hover:bg-[rgba(15,23,42,0.95)]
              `}
              style={{ 
                borderColor: layer.accentColor,
                borderLeftWidth: '3px'
              }}
            >
              {/* Label Badge */}
              <div 
                className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wider mb-3"
                style={{ 
                  backgroundColor: `${layer.accentColor}20`,
                  color: layer.accentColor
                }}
              >
                {layer.label}
              </div>
              
              {/* Title */}
              <h3 className="font-heading text-lg md:text-xl font-semibold text-[#F9FAFB] mb-2">
                {layer.title}
              </h3>
              
              {/* Description */}
              <p className="text-sm md:text-[15px] text-[#9CA3AF] leading-relaxed">
                {layer.description}
              </p>

              {/* Connection Line (except last) */}
              {index < layers.length - 1 && (
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-px h-2.5 bg-gradient-to-b from-[#4B5563] to-transparent" />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-[13px] text-[#9CA3AF] text-center max-w-[720px] mx-auto mt-6"
        >
          Every layer feeds the next, so by the time CFI™ is computed, every major constraint has been evaluated, reconciled and scored using the same engine for every site in the pipeline.
        </motion.p>
      </div>
    </section>
  );
};
