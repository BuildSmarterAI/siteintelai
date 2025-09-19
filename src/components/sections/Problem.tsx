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
      description: "Inadequate sewer or power capacity can force a $250K+ utility upgrade mid-project.",
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
    <section className="bg-white py-20 lg:py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h3 className="font-headline text-3xl md:text-4xl lg:text-5xl text-charcoal-foreground mb-3 lg:mb-4 tracking-wide uppercase">
            THE RISKS HIDING IN EVERY CRE PROPERTY
          </h3>
          <h4 className="font-body text-lg md:text-xl text-charcoal-foreground/80 max-w-4xl mx-auto leading-relaxed">
            Skipping feasibility quietly erodes IRR, derails schedules, and jeopardizes financing.
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10 mb-12">
          {painPoints.map((point, index) => {
            const IconComponent = point.icon;
            return (
              <div key={index} className="group">
                <div className="bg-charcoal-foreground/5 backdrop-blur-sm rounded-lg p-6 border border-charcoal-foreground/10 hover:bg-charcoal-foreground/10 transition-all duration-300 h-full">
                  <div className="text-center">
                    <div className="inline-flex w-16 h-16 bg-gradient-to-br from-maxx-red/20 to-navy/20 rounded-lg items-center justify-center border border-maxx-red/30 mb-4">
                      <IconComponent 
                        className="w-8 h-8 text-maxx-red"
                        strokeWidth={2}
                      />
                    </div>
                    <h5 className="font-body font-semibold text-base lg:text-lg text-charcoal-foreground mb-3">
                      {point.title}
                    </h5>
                    <p className="font-body text-sm lg:text-base text-charcoal-foreground/70 leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Optional Secondary CTA */}
        <div className="text-center">
          <Button 
            variant="maxx-red" 
            size="lg"
            className="text-base px-8 py-4 h-auto font-cta"
          >
            Start My Feasibility Review
          </Button>
        </div>
      </div>
    </section>
  );
};