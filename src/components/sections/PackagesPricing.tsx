import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const PackagesPricing = () => {
  const packages = [
    {
      name: "Free QuickCheck™",
      price: "$0",
      timeline: "60 seconds",
      description: "Preview zoning & flood data with AI score.",
      benefit: "Perfect for initial property screening and quick go/no-go decisions.",
      popular: false,
      features: ["Zoning overview", "Flood zone status", "AI feasibility score (0-100)", "Instant results"]
    },
    {
      name: "Professional Report", 
      price: "$795",
      timeline: "10 minutes",
      description: "Full PDF + JSON with cited FEMA & ArcGIS data.",
      benefit: "Lender-ready feasibility report with comprehensive analysis and source citations.",
      popular: true,
      features: ["Complete PDF report", "JSON data export", "FEMA NFHL citations", "ArcGIS parcel data", "10-minute turnaround"]
    },
    {
      name: "Pro Subscription",
      price: "$1,950/mo", 
      timeline: "Ongoing",
      description: "10 reports per month with dashboard analytics.",
      benefit: "For active investors and developers managing multiple properties.",
      popular: false,
      features: ["10 reports/month", "Priority processing", "Dashboard analytics", "Email support", "API access"]
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
                    <p className="font-body text-sm text-charcoal/80 leading-relaxed mb-4">
                      {pkg.benefit}
                    </p>
                    <ul className="space-y-2">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="font-body text-sm text-charcoal/70 flex items-start">
                          <span className="text-maxx-red mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
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