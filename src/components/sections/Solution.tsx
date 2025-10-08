import { Button } from "@/components/ui/button";
import { MapPin, Droplets, DollarSign, Clock } from "lucide-react";

export const Solution = () => {
  const pillars = [
    {
      icon: MapPin,
      iconColor: "text-maxx-red",
      title: "Zoning & Entitlements",
      description: "Decode zoning overlays, variances, and deed restrictions before you close.",
      benefit: "Avoid 9–12 month rezoning delays and six-figure redesigns."
    },
    {
      icon: Droplets,
      iconColor: "text-navy",
      title: "Utilities & Infrastructure", 
      description: "Verify site capacity for water, sewer, and power.",
      benefit: "Prevent costly $250K+ mid-project upgrades."
    },
    {
      icon: DollarSign,
      iconColor: "text-green-600",
      title: "Cost Benchmarking",
      description: "Validate $/SF with Texas-specific historical and market data.",
      benefit: "Align your pro forma with reality and keep investors confident."
    },
    {
      icon: Clock,
      iconColor: "text-amber-500",
      title: "Schedule & Risk Map",
      description: "Uncover permitting timelines, municipal bottlenecks, and site risks.",
      benefit: "Protect IRR and ensure lender-ready schedules."
    }
  ];

  return (
    <section className="bg-light-gray py-20 md:py-25">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-16">
          <h3 className="font-headline text-3xl md:text-4xl text-charcoal mb-6 md:mb-6">
            Accelerate Decisions. Protect Capital. Earn Confidence.
          </h3>
          <h4 className="font-body text-lg md:text-xl text-charcoal max-w-4xl mx-auto leading-relaxed">
            Our lender-ready feasibility reports validate every CRE property in under 3 weeks—delivering the clarity you need before capital is at risk.
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mb-10 md:mb-15">
          {pillars.map((pillar, index) => (
            <div key={index} className="group">
              <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 hover:shadow-lg hover:border-navy transition-all duration-300 h-full">
                <div className="flex items-center space-x-4 mb-4">
                  <pillar.icon className={`w-8 h-8 ${pillar.iconColor}`} />
                  <h5 className="font-body font-semibold text-lg md:text-xl text-navy">
                    {pillar.title}
                  </h5>
                </div>
                
                <p className="font-body text-base md:text-lg text-charcoal mb-3 leading-relaxed">
                  {pillar.description}
                </p>
                
                <p className="font-body text-sm md:text-base text-charcoal/80 leading-relaxed">
                  <span className="font-bold text-maxx-red">Benefit:</span> {pillar.benefit}
                </p>
              </div>
            </div>
          ))}
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