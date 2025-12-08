import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Database, Brain, FileCheck } from "lucide-react";

const steps = [
  {
    label: "1. Ingest & Normalize",
    icon: Database,
    title: "We pull zoning, flood, utilities, wetlands, topo, and traffic data into one record.",
    body: "SiteIntel connects to public GIS, FEMA, environmental datasets, and your internal parcel data to build a single, normalized data layer for each site.",
  },
  {
    label: "2. AI Reasoning & Scoring",
    icon: Brain,
    title: "Our AI engine runs multi-pass reasoning to detect kill-factors and compute feasibility.",
    body: "The LLM pipeline extracts constraints, plans reasoning, and executes structured analysis across zoning, hazards, utilities, and access. JSON is validated and self-healed for consistency.",
  },
  {
    label: "3. Report & Committee Package",
    icon: FileCheck,
    title: "You get a standardized, lender-ready feasibility report in 24 hours.",
    body: "Parcel summary, zoning matrix, flood & wetlands, utilities, traffic, topography, feasibility score, ROM costs, and red-flag list — ready for IC decks and credit memos.",
  },
];

export const StepsTimeline = () => {
  return (
    <section id="how-it-works" className="py-24 bg-background">
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
            How It Works
          </Badge>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            From parcel to lender-ready report in three passes.
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-px hidden md:block" />
          
          <div className="space-y-12 md:space-y-24">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className={`relative flex flex-col md:flex-row gap-8 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Content */}
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right md:pr-16" : "md:text-left md:pl-16"}`}>
                  <Badge 
                    variant="secondary" 
                    className="mb-4 font-mono text-xs"
                  >
                    {step.label}
                  </Badge>
                  
                  <h3 className="font-heading text-xl md:text-2xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {step.body}
                  </p>
                </div>

                {/* Icon circle - center */}
                <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-16 h-16 rounded-full bg-primary/10 border-4 border-background flex items-center justify-center z-10 hidden md:flex">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>

                {/* Empty space for opposite side */}
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
