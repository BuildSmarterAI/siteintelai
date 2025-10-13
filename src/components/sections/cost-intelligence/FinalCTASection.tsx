import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquare } from "lucide-react";

export const FinalCTASection = () => {
  return (
    <section className="relative min-h-[60vh] flex items-center bg-gradient-to-br from-primary via-primary/90 to-data-cyan overflow-hidden">
      {/* Blueprint Pattern */}
      <div className="absolute inset-0 opacity-[0.08]">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(0deg, white 0px, transparent 1px, transparent 60px),
                           repeating-linear-gradient(90deg, white 0px, transparent 1px, transparent 60px)`
        }} />
      </div>

      {/* Animated Circles */}
      <motion.div
        className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-data-cyan/10 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto space-y-8"
        >
          
          <h2 className="font-headline text-4xl md:text-6xl lg:text-7xl text-white leading-tight">
            Know Your Costs.
            <br />
            Build With Confidence.
          </h2>
          
          <p className="font-body text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto">
            Get accurate, current, and market-aligned design and construction cost visibility before committing to design or bids.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg"
              variant="outline"
              className="bg-white text-primary hover:bg-white/90 border-white text-lg px-8 py-6 h-auto font-cta font-semibold group shadow-[0_4px_20px_rgba(255,255,255,0.3)]"
              onClick={() => window.location.href = '/application?step=2'}
            >
              <span className="flex items-center gap-2">
                Request Cost Estimate
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-2 border-white hover:bg-white/10 text-lg px-8 py-6 h-auto font-cta font-semibold"
              onClick={() => window.location.href = '/contact'}
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Talk to a Specialist
              </span>
            </Button>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/60" />
              <span>10-minute delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/60" />
              <span>Data-cited reports</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/60" />
              <span>Lender-ready format</span>
            </div>
          </div>

        </motion.div>
      </div>
    </section>
  );
};
