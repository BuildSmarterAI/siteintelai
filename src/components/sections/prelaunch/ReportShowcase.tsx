import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";

const bullets = [
  "Executive summary with feasibility score and kill-factors",
  "Zoning compliance matrix and buildable envelope overview",
  "Flood, wetlands, utilities, topography, traffic, drainage sections",
  "ROM cost summary with key premiums and sensitivities",
];

export const ReportShowcase = () => {
  return (
    <section id="sample-report" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 md:px-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <Badge 
              variant="outline" 
              className="border-primary/30 text-primary bg-primary/10 px-4 py-1.5 text-sm font-medium"
            >
              Output
            </Badge>
            
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Lender-ready feasibility report, standardized across every deal.
            </h2>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              Stop stitching together PDFs and emails. SiteIntel delivers a single, consistent report format built for credit committees and ICs.
            </p>

            <ul className="space-y-3">
              {bullets.map((bullet, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                  className="flex items-start gap-3"
                >
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/80">{bullet}</span>
                </motion.li>
              ))}
            </ul>

            <div className="pt-4">
              <a
                href="#waitlist"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Download Sample Report
                <ArrowRight className="w-4 h-4" />
              </a>
              <p className="text-sm text-muted-foreground mt-2">
                We'll email you a redacted lender-ready sample.
              </p>
            </div>
          </motion.div>

          {/* Right - Browser mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-6 bg-background rounded-md flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">feasibility-report.pdf</span>
                  </div>
                </div>
              </div>
              
              {/* Report preview placeholder */}
              <div className="p-6 space-y-4 aspect-[4/5] max-h-[500px]">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="space-y-2">
                    <div className="h-5 w-48 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-32 bg-muted/50 rounded animate-pulse" />
                  </div>
                  <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">A</span>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="space-y-2">
                  <div className="h-4 w-36 bg-muted rounded" />
                  <div className="h-3 w-full bg-muted/30 rounded" />
                  <div className="h-3 w-4/5 bg-muted/30 rounded" />
                </div>

                {/* Score cards */}
                <div className="grid grid-cols-4 gap-2">
                  {["Zoning", "Flood", "Utilities", "Access"].map((label, i) => (
                    <div key={i} className="p-3 bg-muted/20 rounded-lg text-center border border-border/50">
                      <div className="h-6 w-6 mx-auto rounded-full bg-primary/20 mb-1" />
                      <div className="text-[10px] text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Content sections */}
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-1">
                      <div className="h-3 w-28 bg-muted rounded" />
                      <div className="h-2 w-full bg-muted/20 rounded" />
                      <div className="h-2 w-3/4 bg-muted/20 rounded" />
                    </div>
                  ))}
                </div>

                {/* Kill factors */}
                <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <div className="h-3 w-24 bg-destructive/30 rounded mb-2" />
                  <div className="h-2 w-full bg-destructive/10 rounded" />
                </div>
              </div>
            </div>

            {/* Floating accent */}
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
