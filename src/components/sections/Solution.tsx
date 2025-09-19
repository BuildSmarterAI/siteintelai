import { Button } from "@/components/ui/button";
import { Shield, Rocket, Handshake } from "lucide-react";

export const Solution = () => {
  const benefits = [
    {
      icon: Shield,
      title: "Protect Your Capital",
      description: "We identify the costly red flags before you invest. Our analysis on entitlements, utilities, and site conditions prevents six-figure mistakes and protects your IRR from unforeseen hits."
    },
    {
      icon: Rocket,
      title: "Accelerate Your Decisions", 
      description: "Get feasibility clarity on a deal timeline. Our 2-3 week turnaround delivers the data you need to make a confident go/no-go decision, secure financing, and get to closing faster."
    },
    {
      icon: Handshake,
      title: "Earn Stakeholder Confidence",
      description: "Present your project with institutional-grade credibility. Our reports are built to satisfy the rigorous due diligence standards of lenders, LPs, and investment committees."
    }
  ];

  return (
    <section className="bg-light-gray py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="font-headline text-4xl md:text-5xl text-charcoal mb-6">
            ACCELERATE DECISIONS. PROTECT CAPITAL. EARN CONFIDENCE.
          </h3>
          <p className="font-body text-xl text-charcoal/80 max-w-4xl mx-auto leading-relaxed">
            Our feasibility reports are lender-ready intelligence packages that deliver definitive answers in under 3 weeks. We replace ambiguity with actionable data so you can move forward with speed and security.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
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
                
                <p className="font-body text-charcoal/70 leading-relaxed">
                  {benefit.description}
                </p>
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