import { Button } from "@/components/ui/button";
import { MapPin, Droplets, DollarSign, Clock } from "lucide-react";

export const Solution = () => {
  const pillars = [
    {
      icon: MapPin,
      iconColor: "text-maxx-red",
      title: "Zoning & Entitlements",
      description: "Using advanced geospatial analysis techniques, we decode zoning overlays, variances, and deed restrictions before you close.",
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
      description: "Through proprietary market intelligence models, validate $/SF with Texas-specific historical and real-time market data.",
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
    <section className="bg-light-gray py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 lg:mb-20">
          <h3 className="font-headline text-4xl md:text-5xl lg:text-6xl text-charcoal mb-6 lg:mb-8">
            Accelerate Decisions. Protect Capital. Earn Confidence.
          </h3>
          <h4 className="font-body text-lg md:text-xl lg:text-2xl text-charcoal/85 max-w-4xl mx-auto leading-relaxed">
            Powered by proprietary AI models trained on Texas commercial real estate patterns, our lender-ready reports validate every property in under 3 weeks—delivering the clarity you need before capital is at risk.
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mb-10 md:mb-15">
          {pillars.map((pillar, index) => (
            <div key={index} className="group">
              <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] hover:border-navy transition-all duration-300 h-full">
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