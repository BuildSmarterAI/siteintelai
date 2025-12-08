import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export const ProprietaryFinalCTA = () => {
  return (
    <section className="py-24 bg-[#0A0F2C]">
      <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            <span className="text-white">Feasibility, Reimagined.</span>
            <br />
            <span className="text-[#FF7A00]">Powered by Proprietary Intelligence.</span>
          </h2>

          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Request access to the platform redefining how CRE feasibility is computed.
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="pt-4"
          >
            <a
              href="#request-access"
              className="inline-flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#FF9240] text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-[1.02] shadow-lg"
            >
              Request Access
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
