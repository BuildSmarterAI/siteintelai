import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Shield } from "lucide-react";

const dataSources = [
  { name: "FEMA", description: "Flood & Environmental Data" },
  { name: "Esri ArcGIS", description: "Geospatial Intelligence" },
  { name: "TxDOT", description: "Transportation Data" },
  { name: "EPA", description: "Environmental Protection" },
  { name: "USFWS", description: "Wildlife & Conservation" },
  { name: "U.S. Census", description: "Demographic Data" }
];

export const TrustSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-6 lg:px-8">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-status-success/10 text-status-success px-4 py-2 rounded-full mb-6">
            <Shield className="w-4 h-4" />
            <span className="font-cta text-sm font-semibold">Trusted Data Sources</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground mb-4">
            Built on Reliable, Verified Intelligence
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            Every cost estimate is backed by transparent, verifiable data from trusted government and industry sources.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 max-w-6xl mx-auto">
          {dataSources.map((source, idx) => (
            <motion.div
              key={source.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="group"
            >
              <div className="bg-card rounded-xl p-6 shadow-elev border border-border hover:border-primary/40 transition-all duration-200 text-center h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-muted rounded-lg mb-3 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-250">
                  <span className="font-headline text-2xl text-muted-foreground group-hover:text-primary transition-colors">
                    {source.name.charAt(0)}
                  </span>
                </div>
                <p className="font-cta text-sm font-semibold text-foreground mb-1">
                  {source.name}
                </p>
                <p className="font-body text-xs text-muted-foreground">
                  {source.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <p className="font-body text-sm text-muted-foreground max-w-2xl mx-auto">
            All data sources are refreshed regularly, citations are provided in every report, and methodologies are transparent. No proprietary "black boxes"—just verifiable market intelligence.
          </p>
        </motion.div>

      </div>
    </section>
  );
};
