import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Building2, Landmark, Store, Briefcase } from "lucide-react";

const personas = [
  {
    icon: Building2,
    title: "Developers & Sponsors",
    body: "Screen more sites, kill bad ones faster, and walk into lender conversations with defensible feasibility.",
  },
  {
    icon: Landmark,
    title: "Lenders & Credit Committees",
    body: "Standardize feasibility across originators, reduce dead deals, and align with HVCRE, flood, and environmental risk frameworks.",
  },
  {
    icon: Store,
    title: "Franchise & Multi-Site Teams",
    body: "Score hundreds of candidate sites on zoning, access, and infrastructure before committing to LOIs and leases.",
  },
  {
    icon: Briefcase,
    title: "Institutional Investors",
    body: "Give your IC a repeatable feasibility package for every deal in the pipeline — not just the ones that justify full consulting spend.",
  },
];

export const PersonaStrip = () => {
  return (
    <section id="personas" className="py-24 bg-background">
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
            Who It's For
          </Badge>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Built for people who can't afford bad feasibility.
          </h2>
        </motion.div>

        {/* Persona Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {personas.map((persona, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="group p-6 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <persona.icon className="w-6 h-6 text-primary" />
              </div>
              
              <h3 className="font-heading text-lg font-semibold text-foreground mb-3">
                {persona.title}
              </h3>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {persona.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
