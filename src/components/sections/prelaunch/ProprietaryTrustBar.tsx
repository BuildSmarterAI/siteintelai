import { motion } from "framer-motion";
import { Brain, Map, Droplets, Zap, Mountain, BarChart3 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const trustItems = [
  { 
    icon: Brain, 
    label: "AI Feasibility Engine",
    description: "Multi-layer constraint analysis",
    isFlagship: false
  },
  { 
    icon: Map, 
    label: "Zoning Analysis",
    description: "Automated code interpretation",
    isFlagship: false
  },
  { 
    icon: Droplets, 
    label: "Flood & Wetlands",
    description: "FEMA & NWI risk detection",
    isFlagship: false
  },
  { 
    icon: Zap, 
    label: "Utility Feasibility",
    description: "Serviceability & extension costs",
    isFlagship: false
  },
  { 
    icon: Mountain, 
    label: "Topographic Intel",
    description: "Slope, grading, drainage",
    isFlagship: false
  },
  { 
    icon: BarChart3, 
    label: "CFI™ Scoring",
    description: "Lender-calibrated site score",
    isFlagship: true
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    } as const,
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

const scrollToTechStack = () => {
  const techStackSection = document.getElementById('tech-stack');
  if (techStackSection) {
    techStackSection.scrollIntoView({ behavior: 'smooth' });
  }
};

export const ProprietaryTrustBar = () => {
  return (
    <TooltipProvider delayDuration={200}>
      <section className="py-6 md:py-8 border-y border-[#06B6D4]/20 bg-gradient-to-r from-[#0A0F2C] via-[#020617] to-[#0A0F2C] overflow-hidden relative">
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#06B6D4]/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-4 md:px-6 relative">
          {/* Eyebrow Label */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-4 md:mb-5"
          >
            <span className="text-xs uppercase tracking-[0.2em] text-[#06B6D4] font-medium">
              Powered by 6 Proprietary Engines
            </span>
          </motion.div>

          {/* Mobile: horizontal scroll with fade indicators */}
          <div className="relative md:hidden">
            {/* Left fade gradient */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0A0F2C] to-transparent z-10 pointer-events-none" />
            {/* Right fade gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0A0F2C] to-transparent z-10 pointer-events-none" />
            
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex overflow-x-auto scrollbar-hide gap-3 pb-2 -mx-4 px-6"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {trustItems.map((item) => (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <motion.button
                      variants={itemVariants}
                      onClick={scrollToTechStack}
                      className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 cursor-pointer ${
                        item.isFlagship
                          ? 'bg-[#FF7A00]/15 border border-[#FF7A00]/40 shadow-[0_0_12px_rgba(255,122,0,0.2)]'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#06B6D4]/30'
                      }`}
                    >
                      <item.icon className={`w-3.5 h-3.5 ${item.isFlagship ? 'text-[#FF7A00]' : 'text-[#06B6D4]'}`} />
                      <span className={`text-xs font-medium whitespace-nowrap ${item.isFlagship ? 'text-[#FF7A00]' : 'text-white/90'}`}>
                        {item.isFlagship && <span className="mr-1">★</span>}
                        {item.label}
                      </span>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="bottom" 
                    className="bg-[#0A0F2C] border-[#06B6D4]/30 text-white/90"
                  >
                    <p className="text-xs">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </motion.div>
            
            {/* Mobile scroll indicator */}
            <div className="flex justify-center mt-2 gap-1">
              <span className="text-[10px] text-white/40">Scroll for more</span>
              <span className="text-[10px] text-white/40">→</span>
            </div>
          </div>

          {/* Desktop: Continuous marquee with pause on hover */}
          <div className="hidden md:block relative overflow-hidden">
            {/* Left fade gradient */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0A0F2C] to-transparent z-10 pointer-events-none" />
            {/* Right fade gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0A0F2C] to-transparent z-10 pointer-events-none" />
            
            <div className="group">
              {/* Marquee track - duplicated for seamless loop */}
              <div className="flex items-center gap-8 animate-marquee group-hover:[animation-play-state:paused]">
                {/* First set of items */}
                {trustItems.map((item) => (
                  <Tooltip key={`first-${item.label}`}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={scrollToTechStack}
                        className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-full border transition-all cursor-pointer whitespace-nowrap hover:scale-105 ${
                          item.isFlagship 
                            ? 'bg-[#FF7A00]/10 border-[#FF7A00]/40 hover:bg-[#FF7A00]/20 hover:border-[#FF7A00]/60 shadow-[0_0_16px_rgba(255,122,0,0.2)]' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#06B6D4]/40'
                        }`}
                      >
                        {item.isFlagship && (
                          <span className="absolute -top-1 -right-1 text-[#FF7A00] text-xs">★</span>
                        )}
                        <item.icon className={`w-4 h-4 ${item.isFlagship ? 'text-[#FF7A00]' : 'text-[#06B6D4]'}`} />
                        <span className={`text-sm font-medium ${item.isFlagship ? 'text-[#FF7A00]' : 'text-white'}`}>
                          {item.label}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="bottom" 
                      className="bg-[#0A0F2C] border-[#06B6D4]/30 text-white"
                    >
                      <p className="text-xs">{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {/* Duplicate set for seamless loop */}
                {trustItems.map((item) => (
                  <Tooltip key={`second-${item.label}`}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={scrollToTechStack}
                        className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-full border transition-all cursor-pointer whitespace-nowrap hover:scale-105 ${
                          item.isFlagship 
                            ? 'bg-[#FF7A00]/10 border-[#FF7A00]/40 hover:bg-[#FF7A00]/20 hover:border-[#FF7A00]/60 shadow-[0_0_16px_rgba(255,122,0,0.2)]' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#06B6D4]/40'
                        }`}
                      >
                        {item.isFlagship && (
                          <span className="absolute -top-1 -right-1 text-[#FF7A00] text-xs">★</span>
                        )}
                        <item.icon className={`w-4 h-4 ${item.isFlagship ? 'text-[#FF7A00]' : 'text-[#06B6D4]'}`} />
                        <span className={`text-sm font-medium ${item.isFlagship ? 'text-[#FF7A00]' : 'text-white'}`}>
                          {item.label}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="bottom" 
                      className="bg-[#0A0F2C] border-[#06B6D4]/30 text-white"
                    >
                      <p className="text-xs">{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
};
