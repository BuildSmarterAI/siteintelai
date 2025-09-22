import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle } from "lucide-react";

export const Comparison = () => {
  const withoutItems = [
    "Rezoning delays add 9–12 months",
    "Surprise $250K+ utility upgrades", 
    "Pro forma 15–20% over budget before breaking ground",
    "Investor and lender skepticism stalls financing"
  ];

  const withItems = [
    "Land use validated before acquisition",
    "Utility capacity confirmed, no surprise costs",
    "Pro forma aligned with Texas-specific benchmarks", 
    "Lender-ready report builds investor confidence"
  ];

  return (
    <section className="bg-white py-20 md:py-25">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h3 className="font-headline text-2xl md:text-3xl text-charcoal mb-4 md:mb-6 tracking-wider uppercase">
            THE COST OF RISK VS. THE VALUE OF CLARITY
          </h3>
          <h4 className="font-body text-lg md:text-xl text-charcoal max-w-4xl mx-auto leading-relaxed">
            Skipping feasibility can sink your project. BuildSmarter™ transforms unknowns into lender-ready confidence.
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mb-10 md:mb-15 max-w-6xl mx-auto">
          {/* Without Feasibility Column */}
          <div className="bg-red-50 border border-red-100 rounded-lg p-6 md:p-8">
            <div className="text-center mb-6">
              <h5 className="font-body font-semibold text-lg md:text-xl text-charcoal mb-2">
                Without Feasibility
              </h5>
            </div>
            
            <div className="space-y-4">
              {withoutItems.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-maxx-red mt-0.5 flex-shrink-0" />
                  <span className="font-body text-base md:text-lg text-charcoal leading-relaxed">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* With BuildSmarter Column */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 md:p-8">
            <div className="text-center mb-6">
              <h5 className="font-body font-semibold text-lg md:text-xl text-charcoal mb-2">
                With BuildSmarter™
              </h5>
            </div>
            
            <div className="space-y-4">
              {withItems.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-navy mt-0.5 flex-shrink-0" />
                  <span className="font-body text-base md:text-lg text-charcoal leading-relaxed">
                    {item}
                  </span>
                </div>
              ))}
            </div>
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