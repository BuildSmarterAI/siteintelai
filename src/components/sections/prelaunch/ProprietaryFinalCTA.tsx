import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";

export const ProprietaryFinalCTA = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/50">
      <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            This is the future of feasibility.
          </h2>
          
          <p className="text-xl md:text-2xl text-muted-foreground flex items-center justify-center gap-2">
            <Lock className="w-5 h-5" />
            And it is not available to everyone.
          </p>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join the private waitlist to access the proprietary computation engine shaping the next generation of CRE due diligence.
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <a
              href="#request-access"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-medium text-lg transition-colors"
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
