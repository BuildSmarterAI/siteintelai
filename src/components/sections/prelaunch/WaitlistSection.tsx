import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { WaitlistForm } from "./WaitlistForm";

const benefits = [
  "Early access to feasibility reports in Texas launch markets",
  "Redacted lender-ready sample reports",
  "Roadmap updates and feature previews",
  "Preferred pricing and enterprise onboarding options",
];

export const WaitlistSection = () => {
  return (
    <section id="waitlist" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge 
            variant="outline" 
            className="border-primary/30 text-primary bg-primary/10 px-4 py-1.5 text-sm font-medium mb-6"
          >
            Prelaunch Access
          </Badge>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            Get early access to the SiteIntel Feasibility Engine.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're onboarding a limited group of developers, lenders, and franchise teams in our Texas-first launch markets. Join the waitlist to get sample reports, roadmap updates, and priority onboarding.
          </p>
        </motion.div>

        {/* Two-panel layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left - Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-8 bg-card border border-border rounded-2xl"
          >
            <WaitlistForm />
          </motion.div>

          {/* Right - Benefits */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col justify-center"
          >
            <h3 className="font-heading text-xl font-semibold text-foreground mb-6">
              What you'll get:
            </h3>
            
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground/80">{benefit}</span>
                </motion.li>
              ))}
            </ul>

            {/* Trust indicators */}
            <div className="mt-10 pt-8 border-t border-border">
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Texas-first launch</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span>Priority onboarding</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
