import { motion, type Variants } from "framer-motion";
import { Check, Zap, Target, TrendingUp, DollarSign, Gauge, LayoutGrid, FileText } from "lucide-react";

const deliverables = [
  { text: "Zoning & land-use report", stat: "8 jurisdictions verified" },
  { text: "Floodplain + BFE modeling", stat: "FEMA NFHL data" },
  { text: "Wetlands & environmental feasibility", stat: "EPA + USFWS" },
  { text: "Water/sewer serviceability profile", stat: "CCN boundary analysis" },
  { text: "Access & traffic feasibility", stat: "TxDOT AADT" },
  { text: "Topography & pad readiness", stat: "elevation grid" },
  { text: "Impervious cover & drainage", stat: "TR-55 modeling" },
  { text: "CFI™ score", stat: "0-100 lender-grade index" },
  { text: "AI-generated narrative", stat: "GPT-4 powered" },
  { text: "ROM cost premiums", stat: "±15% accuracy" },
];

const impacts = [
  { icon: Check, text: "Approve good sites faster" },
  { icon: Target, text: "Kill bad sites earlier" },
  { icon: Gauge, text: "Improve underwriting consistency" },
  { icon: DollarSign, text: "Reduce dead-deal spend" },
  { icon: TrendingUp, text: "Accelerate acquisition velocity" },
  { icon: LayoutGrid, text: "Standardize feasibility across your entire pipeline" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -15, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

const impactVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export const ProprietaryOutcome = () => {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-12"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-4 h-4 text-primary" />
              </motion.div>
              <span className="text-sm font-medium text-primary">The Result</span>
            </motion.div>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              A Fully Automated, Lender-Ready Feasibility Report in 24 Hours
            </h2>
          </div>

          {/* Deliverables */}
          <motion.div 
            className="bg-muted/30 border border-border rounded-xl p-6 md:p-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <p className="text-lg font-medium text-foreground mb-6">Your private access includes:</p>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {deliverables.map((item) => (
                <motion.div
                  key={item.text}
                  variants={itemVariants}
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                  className="flex items-start gap-3"
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="mt-0.5"
                  >
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  </motion.div>
                  <div className="flex flex-col">
                    <span className="text-foreground/90">{item.text}</span>
                    <span className="text-xs text-muted-foreground">({item.stat})</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Sample Report CTA */}
            <motion.div 
              className="flex justify-center pt-6 mt-6 border-t border-border/50"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <a 
                href="#request-access" 
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group"
              >
                <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>See a sample lender-ready report</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </motion.div>
          </motion.div>

          {/* Impact Header */}
          <div className="text-center space-y-3">
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              What This Means for Your Pipeline
            </h3>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-[#06B6D4] mx-auto rounded-full" />
          </div>

          {/* Impact Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {impacts.map((impact) => (
              <motion.div
                key={impact.text}
                variants={impactVariants}
                whileHover={{ 
                  scale: 1.03, 
                  y: -3,
                  transition: { duration: 0.2 } 
                }}
                className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg cursor-default transition-shadow duration-300 hover:shadow-md hover:shadow-primary/10"
              >
                <motion.div
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <impact.icon className="w-5 h-5 text-primary flex-shrink-0" />
                </motion.div>
                <span className="text-foreground/90 font-medium">{impact.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
