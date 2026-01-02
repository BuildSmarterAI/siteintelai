import { motion, type Variants } from "framer-motion";
import { AlertTriangle, FileText, Map, Droplets, Leaf, Zap, Sheet, Users, Clock, ArrowDown, Quote } from "lucide-react";

const legacyMethods = [
  { text: "Outdated zoning PDFs", icon: FileText },
  { text: "Disconnected GIS maps", icon: Map },
  { text: "Manual floodplain checks", icon: Droplets },
  { text: "Wetlands guesswork", icon: Leaf },
  { text: "Utility emails & uncertainty", icon: Zap },
  { text: "Offline spreadsheets", icon: Sheet },
  { text: "Multiple consultants", icon: Users },
  { text: "Weeks of friction", icon: Clock },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export const ProprietaryProblem = () => {
  const scrollToTechStack = () => {
    document.getElementById('tech-stack')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-24 bg-gradient-to-b from-[hsl(229,72%,11%)] via-[hsl(222,84%,5%)] to-[hsl(229,72%,11%)]">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-12"
        >
          {/* Header */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatDelay: 3 
                }}
              >
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </motion.div>
              <span className="text-sm font-medium text-destructive uppercase tracking-wider">The Problem</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              The Commercial Real Estate Feasibility Process Is Broken
            </h2>
          </motion.div>

          {/* Legacy methods with icons */}
          <div className="space-y-4">
            <p className="text-lg text-white/70">
              Commercial developers, lenders, and investors still rely on:
            </p>
            <motion.ul 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 gap-3"
            >
              {legacyMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <motion.li
                    key={method.text}
                    variants={itemVariants}
                    className="flex items-center gap-3 text-white/80"
                  >
                    <IconComponent className="w-4 h-4 text-[hsl(187,94%,43%)] flex-shrink-0" />
                    {method.text}
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>

          {/* Before/After Teaser */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 py-4 border-y border-white/10"
          >
            <div className="text-center sm:text-right">
              <span className="text-white/50 text-sm uppercase tracking-wider">Traditional</span>
              <p className="text-white/70 font-medium">3-4 weeks, $15K+</p>
            </div>
            <ArrowDown className="w-5 h-5 text-[hsl(27,100%,50%)] rotate-0 sm:-rotate-90" />
            <div className="text-center sm:text-left">
              <span className="text-[hsl(27,100%,50%)] text-sm uppercase tracking-wider">SiteIntel</span>
              <p className="text-white font-semibold">24 hours, $1,495</p>
            </div>
          </motion.div>

          {/* Closing statement with micro-CTA */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="border-l-4 border-[hsl(27,100%,50%)] pl-6 space-y-3"
          >
            <p className="text-xl text-white/90">
              SiteIntel solves this through proprietary automation, standardized feasibility reporting, and a deterministic risk scoring system.
            </p>
            <button 
              onClick={scrollToTechStack}
              className="text-[hsl(187,94%,43%)] hover:text-[hsl(187,94%,53%)] text-sm font-medium inline-flex items-center gap-2 group transition-colors"
            >
              See how we solve this 
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </button>
          </motion.div>

          {/* Mini Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-5"
          >
            <div className="flex gap-4">
              <Quote className="w-6 h-6 text-[hsl(27,100%,50%)] flex-shrink-0 opacity-50" />
              <div>
                <p className="text-white/80 italic text-sm md:text-base">
                  "We discovered a $400K utility extension cost 2 weeks before closing. SiteIntel would have caught it Day 1."
                </p>
                <p className="text-white/50 text-sm mt-2">— Texas Commercial Developer</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
