import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const PackagesPricing = () => {
  const packages = [
    {
      name: "QuickCheck™",
      price: "$4,500",
      timeline: "1 week",
      description: "High-level zoning + cost scan in 1 week.",
      benefit: "Best for early due diligence on potential acquisitions.",
      popular: false
    },
    {
      name: "SiteFit™", 
      price: "$10,000",
      timeline: "2 weeks",
      description: "Comprehensive zoning, utilities, cost, and risk analysis in 2 weeks.",
      benefit: "Ideal for developers and investors seeking lender-ready clarity.",
      popular: true
    },
    {
      name: "FullFeasibility™",
      price: "$18,500", 
      timeline: "3–4 weeks",
      description: "Deep-dive feasibility including zoning, entitlements, utilities, environmental red flags, and timeline modeling (3–4 weeks).",
      benefit: "Built for complex, high-stakes projects requiring investment committee approval.",
      popular: false
    }
  ];

  return (
    <section className="bg-light-gray py-20 md:py-25">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h3 className="font-headline text-2xl md:text-3xl text-charcoal mb-4 md:mb-6 tracking-wider uppercase">
            CHOOSE THE LEVEL OF FEASIBILITY THAT FITS YOUR PROJECT
          </h3>
          <h4 className="font-body text-lg md:text-xl text-charcoal max-w-5xl mx-auto leading-relaxed">
            Whether you need a fast go/no-go or a lender-ready report, BuildSmarter™ has an option designed for your property and timeline.
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 mb-12 md:mb-16 max-w-7xl mx-auto">
          {packages.map((pkg, index) => (
            <div key={index} className="relative group">
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-navy text-navy-foreground px-4 py-1 text-sm font-medium">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <div className={`bg-white border rounded-lg h-full transition-all duration-300 hover:shadow-xl hover:border-maxx-red ${
                pkg.popular ? 'border-navy/20 shadow-md' : 'border-gray-200'
              }`}>
                <div className="p-6 md:p-8">
                  <div className="text-center mb-6">
                    <h5 className="font-body font-semibold text-lg md:text-xl text-navy mb-2">
                      {pkg.name}
                    </h5>
                    <div className="text-2xl md:text-3xl font-bold text-maxx-red mb-1">
                      {pkg.price}
                    </div>
                    <div className="text-sm text-charcoal/60">
                      {pkg.timeline}
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <p className="font-body text-base text-charcoal leading-relaxed">
                      {pkg.description}
                    </p>
                    <p className="font-body text-sm text-charcoal/80 leading-relaxed">
                      {pkg.benefit}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mb-8 md:mb-10">
          <div className="bg-white border border-maxx-red/20 rounded-lg p-4 md:p-6 max-w-4xl mx-auto">
            <p className="font-body text-base md:text-lg text-charcoal leading-relaxed">
              <strong className="text-maxx-red">Risk Reversal:</strong> 100% of your feasibility fee is credited toward Preconstruction or Design-Build if you proceed with Maxx Builders.
            </p>
          </div>
        </div>
        
        <div className="text-center">
          <Button 
            variant="maxx-red" 
            size="lg"
            className="text-lg md:text-xl px-8 py-4 h-auto font-cta"
            onClick={() => window.location.href = '/application?step=2'}
          >
            Start My Feasibility Review
          </Button>
        </div>
      </div>
    </section>
  );
};