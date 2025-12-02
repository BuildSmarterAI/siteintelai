import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Building2, DollarSign, Calendar, BookOpen, Code, ArrowRight } from "lucide-react";

const ecosystem = [
  {
    icon: Building2,
    label: "Feasibility",
    color: "from-primary/20 to-primary/5",
    borderColor: "border-primary/20"
  },
  {
    icon: DollarSign,
    label: "Cost",
    color: "from-status-success/20 to-status-success/5",
    borderColor: "border-status-success/20",
    highlight: true
  },
  {
    icon: Calendar,
    label: "Schedule",
    color: "from-data-cyan/20 to-data-cyan/5",
    borderColor: "border-data-cyan/20"
  },
  {
    icon: BookOpen,
    label: "Lessons",
    color: "from-accent/20 to-accent/5",
    borderColor: "border-accent/20"
  },
  {
    icon: Code,
    label: "API",
    color: "from-muted-foreground/20 to-muted-foreground/5",
    borderColor: "border-muted-foreground/20"
  }
];

export const EcosystemSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-32 bg-muted">
      <div className="container mx-auto px-6 lg:px-8">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground mb-4">
            Part of the SiteIntel™ Ecosystem
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            One platform, endless insights. SiteIntel™ unites feasibility, cost, and scheduling intelligence into one secure environment.
          </p>
        </motion.div>

        {/* Desktop Flow */}
        <div className="hidden lg:flex items-center justify-center gap-4 mb-12">
          {ecosystem.map((item, idx) => {
            const Icon = item.icon;
            
            return (
              <div key={item.label} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className={`relative group ${item.highlight ? 'lg:scale-110' : ''}`}
                >
                  <div className={`bg-card rounded-xl p-6 shadow-elev border ${item.borderColor} bg-gradient-to-br ${item.color} ${
                    item.highlight ? 'ring-2 ring-primary' : ''
                  }`}>
                    <Icon className={`w-8 h-8 mb-3 ${
                      item.highlight ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <p className={`font-cta text-sm font-semibold ${
                      item.highlight ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {item.label}
                    </p>
                  </div>

                  {item.highlight && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.6 }}
                      className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
                    >
                      <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full font-cta text-xs font-semibold">
                        You are here
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {idx < ecosystem.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
                    className="flex items-center px-4"
                  >
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Stack */}
        <div className="lg:hidden space-y-4">
          {ecosystem.map((item, idx) => {
            const Icon = item.icon;
            
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`relative ${item.highlight ? 'scale-105' : ''}`}
              >
                <div className={`bg-card rounded-xl p-6 shadow-elev border ${item.borderColor} bg-gradient-to-br ${item.color} ${
                  item.highlight ? 'ring-2 ring-primary' : ''
                }`}>
                  <div className="flex items-center gap-4">
                    <Icon className={`w-8 h-8 ${
                      item.highlight ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <p className={`font-cta text-lg font-semibold ${
                      item.highlight ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {item.label}
                    </p>
                    {item.highlight && (
                      <div className="ml-auto bg-primary text-primary-foreground px-3 py-1 rounded-full font-cta text-xs font-semibold">
                        Current
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <p className="font-body text-muted-foreground mb-6">
            Seamlessly integrate cost intelligence with site feasibility, construction scheduling, and post-project analytics.
          </p>
          <a 
            href="/feasibility" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-cta font-semibold transition-colors"
          >
            Explore the full SiteIntel™ platform
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>

      </div>
    </section>
  );
};
