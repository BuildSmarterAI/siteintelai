import { Button } from "@/components/ui/button";
import { Shield, Rocket, Handshake } from "lucide-react";

export const Solution = () => {
  const benefits = [
    {
      icon: Shield,
      title: "Protect Your Capital",
      points: ["Identify costly red flags before investment", "Prevent six-figure mistakes", "Protect IRR from unforeseen hits"]
    },
    {
      icon: Rocket,
      title: "Accelerate Decisions", 
      points: ["2-3 week turnaround", "Confident go/no-go decisions", "Faster path to closing"]
    },
    {
      icon: Handshake,
      title: "Earn Stakeholder Confidence",
      points: ["Institutional-grade credibility", "Satisfy lender due diligence", "Investment committee ready"]
    },
    {
      icon: Shield,
      title: "Lender-Ready Intelligence",
      points: ["Third-party validation", "Risk-adjusted analysis", "Financing-grade reports"]
    }
  ];

  return (
    <section className="bg-light-gray py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="font-headline text-4xl md:text-5xl text-charcoal mb-6">
            FEASIBILITY FIRST: PROTECT YOUR IRR, SECURE YOUR FINANCING.
          </h3>
          <p className="font-body text-xl text-charcoal/80 max-w-3xl mx-auto leading-relaxed">
            Lender-ready intelligence in under 3 weeks.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="group">
              <div className="bg-background border border-navy/10 rounded-lg p-8 hover:shadow-xl transition-all duration-300 h-full">
                {/* Navy Blue Title Bar */}
                <div className="bg-navy rounded-t-lg -mx-8 -mt-8 mb-6 p-4">
                  <div className="flex items-center space-x-3">
                    <benefit.icon className="w-6 h-6 text-navy-foreground" />
                    <h4 className="font-headline text-lg text-navy-foreground">
                      {benefit.title}
                    </h4>
                  </div>
                </div>
                
                <ul className="space-y-3">
                  {benefit.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-navy rounded-full mt-2 flex-shrink-0" />
                      <span className="font-body text-charcoal/70 leading-relaxed">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <Button 
            variant="maxx-red" 
            size="lg"
            className="text-lg px-8 py-4 h-auto"
          >
            Start My Feasibility Review
          </Button>
        </div>
      </div>
    </section>
  );
};