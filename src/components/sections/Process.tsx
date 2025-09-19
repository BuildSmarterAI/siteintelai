import { Button } from "@/components/ui/button";
import { Clock, Search, FileText } from "lucide-react";

export const Process = () => {
  const steps = [
    {
      icon: Clock,
      title: "Apply in 60 Seconds",
      description: "Complete our short application to qualify your project."
    },
    {
      icon: Search,
      title: "Expert Review",
      description: "We validate zoning, utilities, costs, and schedule risks."
    },
    {
      icon: FileText,
      title: "Lender-Ready Report",
      description: "Receive a detailed feasibility package + consultation call in 1–4 weeks."
    }
  ];

  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="font-headline text-4xl md:text-5xl text-charcoal mb-6">
            HOW BUILDSMARTER™ WORKS
          </h3>
        </div>
        
        {/* Desktop Timeline */}
        <div className="hidden md:block mb-12">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-navy/20 transform -translate-y-1/2" />
            
            <div className="grid grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative text-center">
                  {/* Timeline Node */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-navy rounded-full flex items-center justify-center mb-6 z-10">
                    <step.icon className="w-6 h-6 text-navy-foreground" />
                  </div>
                  
                  {/* Step Number */}
                  <div className="absolute -top-2 -right-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-maxx-red rounded-full flex items-center justify-center z-20">
                    <span className="text-xs font-cta font-semibold text-maxx-red-foreground">
                      {index + 1}
                    </span>
                  </div>
                  
                  <div className="pt-16">
                    <h4 className="font-headline text-xl text-charcoal mb-3">
                      {step.title}
                    </h4>
                    <p className="font-body text-charcoal/70 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mobile Vertical Stack */}
        <div className="md:hidden mb-12">
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 relative">
                  <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-navy-foreground" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-maxx-red rounded-full flex items-center justify-center">
                    <span className="text-xs font-cta font-semibold text-maxx-red-foreground">
                      {index + 1}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="font-headline text-lg text-charcoal mb-2">
                    {step.title}
                  </h4>
                  <p className="font-body text-charcoal/70 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
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