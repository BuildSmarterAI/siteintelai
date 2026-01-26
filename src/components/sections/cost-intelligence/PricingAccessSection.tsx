import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown } from "lucide-react";

const tiers = [
  {
    name: "Site Feasibility Intelligence™",
    icon: Zap,
    price: "$999",
    description: "Complete professional feasibility analysis",
    features: [
      "Full feasibility analysis report",
      "Complete data citations",
      "PDF + JSON export",
      "72-hour access",
      "Email support"
    ],
    cta: "Access Intelligence",
    variant: "default" as const,
    popular: false
  },
  {
    name: "Pro Subscription",
    icon: Crown,
    price: "$1,950",
    period: "/month",
    description: "For developers and firms analyzing multiple sites",
    features: [
      "Unlimited cost reports",
      "Portfolio analytics dashboard",
      "API access",
      "Priority support",
      "Custom data exports",
      "Team collaboration tools"
    ],
    cta: "Subscribe Now",
    variant: "maxx-red" as const,
    popular: true
  }
];

export const PricingAccessSection = () => {
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
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground mb-4">
            Flexible Access to Cost Intelligence
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the plan that fits your workflow—from single reports to unlimited enterprise access.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier, idx) => {
            const Icon = tier.icon;
            
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className={`relative bg-card rounded-2xl p-8 shadow-elev border ${
                  tier.popular 
                    ? 'border-primary ring-2 ring-primary/20 lg:scale-105' 
                    : 'border-border'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full font-cta text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  
                  <h3 className="font-headline text-2xl text-foreground mb-2">
                    {tier.name}
                  </h3>
                  
                  <p className="font-body text-sm text-muted-foreground mb-6">
                    {tier.description}
                  </p>

                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="font-headline text-5xl text-foreground">
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className="font-body text-lg text-muted-foreground">
                        {tier.period}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-status-success mt-0.5 flex-shrink-0" />
                      <span className="font-body text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={tier.variant}
                  size="lg"
                  className="w-full text-lg font-cta font-semibold"
                  onClick={() => window.location.href = '/application?step=2'}
                >
                  {tier.cta}
                </Button>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="font-body text-sm text-muted-foreground">
            Need custom enterprise pricing? <a href="/contact" className="text-primary hover:underline font-semibold">Contact our team</a>
          </p>
        </motion.div>

      </div>
    </section>
  );
};
