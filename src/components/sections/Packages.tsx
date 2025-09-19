import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";

export const Packages = () => {
  const packages = [
    {
      name: "QuickCheck™",
      price: "$2,500",
      duration: "5 business days",
      description: "Basic feasibility overview",
      features: [
        "Zoning compliance review",
        "Basic utility assessment", 
        "Site constraints analysis",
        "Go/no-go recommendation"
      ],
      popular: false
    },
    {
      name: "SiteFit™",
      price: "$7,500", 
      duration: "2 weeks",
      description: "Comprehensive feasibility report",
      features: [
        "Everything in QuickCheck™",
        "Detailed cost analysis",
        "Timeline projections",
        "Risk mitigation strategies",
        "Lender-ready documentation"
      ],
      popular: true
    },
    {
      name: "FullFeasibility™",
      price: "$15,000",
      duration: "3 weeks", 
      description: "Complete investment-grade analysis",
      features: [
        "Everything in SiteFit™",
        "Market analysis",
        "Financial modeling",
        "Regulatory roadmap",
        "Stakeholder presentation deck",
        "Ongoing consultation"
      ],
      popular: false
    }
  ];

  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="font-headline text-4xl md:text-5xl text-charcoal mb-6">
            CHOOSE YOUR INTELLIGENCE LEVEL
          </h3>
          <p className="font-body text-xl text-charcoal/80 max-w-3xl mx-auto leading-relaxed">
            From quick go/no-go decisions to investment-grade analysis.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {packages.map((pkg, index) => (
            <div key={index} className={`relative group ${pkg.popular ? 'transform scale-105' : ''}`}>
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-maxx-red text-maxx-red-foreground px-4 py-1 rounded-full text-sm font-cta flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}
              
              <div className={`bg-background border rounded-lg p-8 h-full transition-all duration-300 ${
                pkg.popular 
                  ? 'border-maxx-red shadow-lg' 
                  : 'border-border hover:border-navy/30 hover:shadow-md'
              }`}>
                <div className="text-center mb-6">
                  <h4 className="font-headline text-2xl text-charcoal mb-2">
                    {pkg.name}
                  </h4>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-charcoal">{pkg.price}</span>
                  </div>
                  <p className="text-sm text-navy font-cta">{pkg.duration}</p>
                  <p className="text-sm text-muted-foreground mt-2">{pkg.description}</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-navy mt-0.5 flex-shrink-0" />
                      <span className="font-body text-charcoal/80 text-sm leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={pkg.popular ? "maxx-red" : "outline"}
                  className="w-full"
                  size="lg"
                >
                  Select {pkg.name}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <p className="font-body text-sm text-muted-foreground">
            100% fee credit towards Preconstruction or Design-Build services
          </p>
        </div>
      </div>
    </section>
  );
};