import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowRight } from "lucide-react";

export const PrelaunchHero = () => {
  const heroStats = [
    { value: "Feasibility speed", label: "14–30 days → 24 hours" },
    { value: "Zoning to cost", label: "9+ engines" },
    { value: "Built for credit committees", label: "Lender-first" },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-background">
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-24 py-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
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
              Feasibility-as-a-Service™
            </Badge>

            {/* Heading */}
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-foreground">
              Lender-ready feasibility in{" "}
              <span className="text-primary">24 hours</span>, not 30 days.
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
              SiteIntel™ automates zoning, floodplain, wetlands, utilities, topography, traffic, and ROM costs into a single, committee-ready feasibility report.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#waitlist"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Join Prelaunch Waitlist
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#sample-report"
                className="inline-flex items-center justify-center gap-2 border border-border hover:bg-muted text-foreground px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <FileText className="w-4 h-4" />
                View Sample Report
              </a>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-3 gap-6 pt-4">
              {heroStats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                  className="space-y-1"
                >
                  <p className="text-sm font-medium text-primary">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.value}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right content - Image placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden aspect-[4/3]">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-6 bg-background rounded-md flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">siteintel.ai/feasibility</span>
                  </div>
                </div>
              </div>
              
              {/* Dashboard placeholder */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-40 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-8 bg-primary/20 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-muted/50 rounded-lg border border-border/50" />
                  ))}
                </div>
                <div className="h-32 bg-muted/30 rounded-lg border border-border/50" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 bg-muted/40 rounded-lg" />
                  <div className="h-16 bg-primary/10 rounded-lg border border-primary/20" />
                </div>
              </div>
            </div>

            {/* Floating accent */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
