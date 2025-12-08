import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { 
  Scale, 
  Waves, 
  Leaf, 
  Workflow, 
  Mountain, 
  Construction, 
  Droplets, 
  Calculator, 
  DollarSign 
} from "lucide-react";

const features = [
  {
    icon: Scale,
    title: "Zoning & Entitlements Engine",
    body: "RAG-powered zoning analysis, buildable envelopes, setbacks, use-by-right vs. discretionary, and variance flags.",
  },
  {
    icon: Waves,
    title: "Floodplain & BFE Engine",
    body: "NFHL-based flood zones, multi-zone parcel logic, BFE deltas, and floodway kill-factors with lender-grade scoring.",
  },
  {
    icon: Leaf,
    title: "Wetlands & Environmental Engine",
    body: "NWI + hydric soils, likely jurisdictional wetlands, mitigation cost proxies, and environmental red flags.",
  },
  {
    icon: Workflow,
    title: "Utilities & Sewer Capacity Engine",
    body: "Served vs not served, distance to mains, lift-station requirements, moratoria, and pressure-zone risk.",
  },
  {
    icon: Mountain,
    title: "Topography & Pad Engine",
    body: "Slope classes, pad detection, cut/fill volumes, and topography-based kill-factors for large pads.",
  },
  {
    icon: Construction,
    title: "Traffic, Access & Driveway Engine",
    body: "TIA triggers, TxDOT driveway spacing, access deal-killers, and likely off-site improvements.",
  },
  {
    icon: Droplets,
    title: "Drainage & Impervious Cover Engine",
    body: "Impervious cover estimates, detention triggers, and drainage risk tiers for lenders and engineers.",
  },
  {
    icon: Calculator,
    title: "Feasibility Score & Risk Engine",
    body: "Weighted, transparent feasibility score with category scores for zoning, hazards, utilities, and access.",
  },
  {
    icon: DollarSign,
    title: "CostDB ROM Cost Engine",
    body: "Texas-specific ROM cost ranges, flood/utility/topography premiums, and scenario-ready outputs.",
  },
];

export const FeatureGrid = () => {
  return (
    <section id="engines" className="py-24 bg-muted/30">
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
            What SiteIntel Automates
          </Badge>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            One platform. Nine engines. Zero guesswork.
          </h2>
        </motion.div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="group p-6 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
