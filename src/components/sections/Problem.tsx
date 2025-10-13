import { Gavel, Wrench, DollarSign, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Problem = () => {
  const painPoints = [
    {
      title: "Unseen Zoning Risks",
      description: "Rezoning requirements or overlays can add 9–12 months and six-figure redesign costs.",
      icon: Gavel
    },
    {
      title: "Infrastructure Surprises", 
      description: "Inadequate utility infrastructure capacity can force a $250K+ upgrade mid-project.",
      icon: Wrench
    },
    {
      title: "Faulty Pro Formas",
      description: "Outdated $/SF data means your budget is already 15–20% over plan before breaking ground.",
      icon: DollarSign
    },
    {
      title: "Investor Doubt",
      description: "Without third-party validation, lenders and LPs hesitate, stalling capital commitments.",
      icon: Handshake
    }
  ];

  return (
    <section className="bg-white py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 lg:mb-20">
          <h3 className="font-headline text-4xl md:text-5xl lg:text-6xl text-charcoal mb-4 lg:mb-6">
            The Hidden Risks Costing Texas Developers $250K+ Per Project
          </h3>
          <h4 className="font-body text-lg md:text-xl lg:text-2xl text-charcoal/85 max-w-4xl mx-auto leading-relaxed">
            Without proper feasibility analysis, profit margins shrink, timelines explode, and financing falls through.
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10 mb-12">
          {painPoints.map((point, index) => {
            const IconComponent = point.icon;
            return (
              <div key={index} className="group">
                <div className="bg-charcoal/5 backdrop-blur-sm rounded-lg p-6 border border-charcoal/20 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] hover:bg-charcoal/10 hover:border-maxx-red/30 transition-all duration-300 h-full">
                  <div className="text-center">
                    <div className="inline-flex w-16 h-16 bg-gradient-to-br from-maxx-red/20 to-navy/20 rounded-lg items-center justify-center border border-maxx-red/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                      <IconComponent 
                        className="w-8 h-8 text-maxx-red group-hover:text-maxx-red transition-colors duration-300"
                        strokeWidth={2}
                      />
                    </div>
                    <h5 className="font-body font-semibold text-base lg:text-lg text-charcoal mb-3 group-hover:text-maxx-red transition-colors duration-300">
                      {point.title}
                    </h5>
                    <p className="font-body text-sm lg:text-base text-charcoal/70 leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Bar */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 text-sm text-charcoal/70 font-body">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-maxx-red"></span>
              Texas-trained AI
            </span>
            <span className="text-charcoal/30">·</span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-maxx-red"></span>
              Lender-validated
            </span>
            <span className="text-charcoal/30">·</span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-maxx-red"></span>
              60-second delivery
            </span>
          </div>
        </div>

        {/* Dual CTA Strategy */}
        <div className="text-center space-y-4">
          <div>
            <Button 
              variant="maxx-red" 
              size="lg"
              className="text-base px-8 py-4 h-auto font-cta"
              onClick={() => window.location.href = '/application?step=2'}
            >
              Run Free QuickCheck™ (No Login Required)
            </Button>
            <p className="text-sm text-charcoal/60 mt-2">
              Instant feasibility score in 60 seconds
            </p>
          </div>
          
          <Button 
            variant="outline" 
            size="lg"
            className="text-base px-8 py-4 h-auto font-cta border-charcoal/20 text-charcoal hover:bg-charcoal/5"
            onClick={() => document.getElementById('solution')?.scrollIntoView({ behavior: 'smooth' })}
          >
            See How We Eliminate These Risks
          </Button>
        </div>
      </div>
    </section>
  );
};