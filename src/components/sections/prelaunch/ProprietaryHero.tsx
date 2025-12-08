import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Lock, ArrowRight } from "lucide-react";
import { Globe } from "@/components/ui/globe-feature-section";

const techStack = [
  "Geospatial Inference Stack™",
  "Neural Constraint Resolution Engine™",
  "Composite Feasibility Index (CFI™)",
  "Structured Geospatial Orchestration Layer™",
  "Topographic Intelligence Model™",
  "Infrastructure Serviceability Model™",
];

export const ProprietaryHero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background">
      {/* Radial gradient background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: "radial-gradient(ellipse at 70% 50%, hsl(var(--primary) / 0.4) 0%, transparent 60%)"
        }}
      />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--foreground) / 0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }}
      />

      {/* Globe Background */}
      <div className="absolute right-0 md:-right-32 lg:-right-48 top-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] lg:w-[800px] lg:h-[800px] opacity-20 pointer-events-none z-0">
        <Globe />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-24 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Eyebrow */}
          <Badge 
            variant="outline" 
            className="border-primary/30 text-primary bg-primary/10 px-4 py-1.5 text-sm font-medium"
          >
            Feasibility-as-a-Service™, Reinvented
          </Badge>

          {/* Heading */}
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-foreground">
            Unlock the world's first{" "}
            <span className="text-primary">proprietary feasibility</span>{" "}
            computation engine.
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
            A state-of-the-art, non-replicable, AI-powered system engineered from first principles to compute commercial development feasibility with underwriting-grade precision.
          </p>

          {/* Tech Stack */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Built on:</p>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech, index) => (
                <motion.span
                  key={tech}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="px-3 py-1.5 bg-muted/50 border border-border/50 rounded-md text-sm text-foreground/80"
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Not replicable statement */}
          <p className="text-muted-foreground italic">
            This technology is not public, not open-source, and not replicable by consultants or competing platforms.
          </p>

          {/* Private access badge */}
          <div className="flex items-center gap-2 text-primary">
            <Lock className="w-4 h-4" />
            <span className="font-medium">Access is private and application-based.</span>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
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
