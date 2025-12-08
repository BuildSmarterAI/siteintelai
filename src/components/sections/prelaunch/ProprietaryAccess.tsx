import { motion } from "framer-motion";
import { Building2, Landmark, Store, Briefcase, Factory, TrendingUp, Zap } from "lucide-react";

const audiences = [
  { icon: Building2, label: "Commercial developers & site acquisition teams", value: "Screen 10x more sites per analyst" },
  { icon: TrendingUp, label: "Real estate investment firms", value: "IC-ready packages for every deal" },
  { icon: Landmark, label: "CRE lenders & underwriting teams", value: "Standardize underwriting across originators" },
  { icon: Store, label: "Franchise operators & multi-site retailers", value: "Score hundreds of sites before LOIs" },
  { icon: Factory, label: "Industrial/logistics site selectors", value: "Evaluate specialized site constraints" },
  { icon: Briefcase, label: "Brokers & advisory groups", value: "Differentiate with data-backed feasibility" },
];

export const ProprietaryAccess = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-[#0A0F2C] via-[#020617] to-[#0A0F2C]">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-12"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Who Should Apply for Access?
            </h2>
          </div>

          {/* Audience grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {audiences.map((audience, index) => (
              <motion.div
                key={audience.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-col gap-3 p-5 bg-white/5 border border-white/10 rounded-lg hover:border-primary/40 hover:bg-white/[0.08] transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <audience.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-white font-medium">{audience.label}</span>
                </div>
                <p className="text-sm text-[#06B6D4] italic pl-11">{audience.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Urgency Message */}
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-3 bg-primary/20 border border-primary/40 rounded-full">
              <Zap className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-white font-medium">
                Q1 cohort limited to 25 organizations — <span className="text-primary font-bold">12 seats remaining</span>
              </span>
            </div>
          </motion.div>

          {/* SEO Focus */}
          <p className="text-center text-sm text-white/40 italic">
            CRE developers · real estate lenders · franchise site selection · logistics site analysis
          </p>
        </motion.div>
      </div>
    </section>
  );
};
