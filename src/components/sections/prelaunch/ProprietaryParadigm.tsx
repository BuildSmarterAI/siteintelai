import { motion } from "framer-motion";
import { Sparkles, MapPin, Cpu, FileText, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const differentiators = [
  { stat: "90%", label: "faster than consultant workflows" },
  { stat: "24hr", label: "lender-ready documentation" },
  { stat: "8", label: "constraint layers analyzed simultaneously" },
  { stat: "100%", label: "deterministic scoring — not AI guesses" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
};

const flowSteps = [
  { icon: MapPin, label: "Raw Site Data", color: "#6366F1" },
  { icon: Cpu, label: "FaaS Engine", color: "#FF7A00" },
  { icon: FileText, label: "Feasibility Report", color: "#06B6D4" },
];

export const ProprietaryParadigm = () => {
  const scrollToTechStack = () => {
    const techStack = document.getElementById("tech-stack");
    if (techStack) {
      techStack.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-[#0A0F2C] via-[#020617] to-[#0A0F2C] relative overflow-hidden">
      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#06B6D4 1px, transparent 1px), linear-gradient(90deg, #06B6D4 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      
      <motion.div 
        className="max-w-4xl mx-auto px-6 md:px-12 text-center relative z-10"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Eyebrow */}
        <motion.div variants={itemVariants} className="flex justify-center mb-6">
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF7A00]/10 border border-[#FF7A00]/30 rounded-full"
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255, 122, 0, 0.3)" }}
          >
            <Sparkles className="w-4 h-4 text-[#FF7A00]" />
            <span className="text-sm font-medium text-[#FF7A00]">The New Paradigm</span>
          </motion.div>
        </motion.div>

        {/* H2 */}
        <motion.h2 
          variants={itemVariants}
          className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#F9FAFB] mb-4"
        >
          Feasibility-as-a-Service™
        </motion.h2>

        <motion.p 
          variants={itemVariants}
          className="text-lg md:text-xl text-[#FF7A00] font-medium mb-6"
        >
          A New Category in Commercial Real Estate Technology
        </motion.p>

        <motion.p 
          variants={itemVariants}
          className="text-base md:text-lg text-[#9CA3AF] max-w-2xl mx-auto mb-12"
        >
          SiteIntel replaces weeks of fragmented due diligence with a single AI-driven 
          feasibility engine that delivers:
        </motion.p>

        {/* Outcome Differentiators */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-16"
        >
          {differentiators.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.03, y: -2 }}
              className="flex items-center gap-3 p-4 bg-[#0F172A]/60 border border-[#1E293B] rounded-xl backdrop-blur-sm"
            >
              <span className="text-2xl md:text-3xl font-bold text-[#FF7A00]">{item.stat}</span>
              <span className="text-sm text-[#D1D5DB] text-left">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* FaaS Flow Diagram */}
        <motion.div 
          variants={itemVariants}
          className="mb-16"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            {flowSteps.map((step, index) => (
              <div key={step.label} className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + index * 0.2 }}
                  whileHover={{ scale: 1.08, y: -4 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div 
                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center border-2 shadow-lg"
                    style={{ 
                      backgroundColor: `${step.color}15`,
                      borderColor: step.color,
                      boxShadow: `0 0 30px ${step.color}20`
                    }}
                  >
                    <step.icon className="w-7 h-7 md:w-9 md:h-9" style={{ color: step.color }} />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-[#D1D5DB]">{step.label}</span>
                </motion.div>
                
                {/* Arrow connector */}
                {index < flowSteps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7 + index * 0.2 }}
                    className="hidden md:flex items-center"
                  >
                    <div className="w-12 h-[2px] bg-gradient-to-r from-[#06B6D4] to-[#06B6D4]/50" />
                    <ArrowRight className="w-5 h-5 text-[#06B6D4] -ml-1" />
                  </motion.div>
                )}
                {index < flowSteps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scaleY: 0 }}
                    whileInView={{ opacity: 1, scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7 + index * 0.2 }}
                    className="flex md:hidden items-center justify-center"
                  >
                    <ChevronDown className="w-5 h-5 text-[#06B6D4]" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Enhanced Closing Statement */}
        <motion.div
          variants={itemVariants}
          className="relative"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02 }}
            className="p-6 md:p-8 rounded-2xl bg-[#0F172A]/80 border border-[#FF7A00]/30 backdrop-blur-sm"
            style={{ boxShadow: "0 0 60px rgba(255, 122, 0, 0.15)" }}
          >
            <p className="text-base md:text-lg text-[#9CA3AF] mb-2">
              This is not a mapping tool.
            </p>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-[#F9FAFB] mb-6">
              This is a <span className="text-[#FF7A00]">proprietary feasibility computation system</span>.
            </p>
            
            <Button
              onClick={scrollToTechStack}
              variant="outline"
              className="border-[#06B6D4]/50 text-[#06B6D4] hover:bg-[#06B6D4]/10 hover:border-[#06B6D4] group"
            >
              Explore the Engine Stack
              <ChevronDown className="w-4 h-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};
