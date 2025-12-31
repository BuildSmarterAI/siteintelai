import { Building2, Shield, Zap, CheckCircle2 } from "lucide-react";

const features = [
  { 
    icon: Building2, 
    label: "Zoning & Buildability Analysis",
    description: "FAR, setbacks, height limits, permitted uses"
  },
  { 
    icon: Shield, 
    label: "Flood & Environmental Risk",
    description: "Flood zone, base elevation, wetland overlaps"
  },
  { 
    icon: Zap, 
    label: "Utilities Infrastructure Report",
    description: "Connection points, capacity notes, providers"
  },
  { 
    icon: CheckCircle2, 
    label: "Market Demographics Profile",
    description: "5-mile demographics, income tiers, 10-yr growth"
  },
];

export const FeaturesOutcomes = () => {
  return (
    <div className="space-y-3">
      <h3 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wide">
        What You'll Receive
      </h3>
      <div className="grid gap-2">
        {features.map(({ icon: Icon, label, description }) => (
          <div 
            key={label}
            className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/30"
          >
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
