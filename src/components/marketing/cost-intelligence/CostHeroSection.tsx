import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { TrendingUp, BarChart3, DollarSign } from "lucide-react";

export const CostHeroSection = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center bg-gradient-to-br from-background via-background to-muted overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(0deg, hsl(var(--primary)) 0px, transparent 1px, transparent 40px),
                           repeating-linear-gradient(90deg, hsl(var(--primary)) 0px, transparent 1px, transparent 40px)`
        }} />
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div>
              <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl text-foreground mb-4 leading-tight">
                Cost Intelligence —{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">Real-Time Design</span>
                  <span className="absolute bottom-2 left-0 w-full h-3 bg-primary/20 -z-0" />
                </span>
                {" "}& Construction Cost Insights
              </h1>
              
              <p className="font-body text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Accurate, current, and market-aligned cost visibility.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                className="text-lg px-8 py-6 h-auto font-cta font-semibold group relative overflow-hidden"
                onClick={() => window.location.href = '/application?step=2'}
              >
                <span className="relative z-10">Request Cost Estimate</span>
                <motion.div
                  className="absolute inset-0 bg-white/10"
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.5, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </Button>
              
              <Button 
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 h-auto font-cta font-semibold border-2"
                onClick={() => window.location.href = '/application'}
              >
                See Example Report
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span>Market-Aligned</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-data-cyan" />
                <span>Real-Time Data</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-card rounded-2xl p-8 shadow-elev border border-border">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="font-headline text-lg text-foreground">Cost Analysis</span>
                  <BarChart3 className="w-6 h-6 text-data-cyan" />
                </div>
                
                {/* Simulated Cost Bars */}
                <div className="space-y-4">
                  {[
                    { label: "Retail", value: 85, color: "bg-primary" },
                    { label: "Medical", value: 92, color: "bg-status-success" },
                    { label: "Industrial", value: 78, color: "bg-data-cyan" },
                    { label: "Multifamily", value: 88, color: "bg-accent" }
                  ].map((item, idx) => (
                    <motion.div 
                      key={item.label}
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.8, delay: 0.4 + idx * 0.1 }}
                    >
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-body text-foreground">{item.label}</span>
                        <span className="font-mono text-muted-foreground">${item.value}k/sq ft</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${item.color} rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 1, delay: 0.6 + idx * 0.1 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Updated in real-time • Market-verified data
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg font-cta text-sm"
            >
              ⚡ Live Data
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
