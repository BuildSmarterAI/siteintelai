import { Button } from "@/components/ui/button";
import heroBlueprint from "@/assets/hero-blueprint.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen bg-light-gray flex items-center">
      {/* Blueprint Pattern Background */}
      <div className="absolute inset-0 blueprint-pattern opacity-50" />
      
      {/* Blueprint Image Overlay */}
      <div className="absolute right-0 top-0 w-1/2 h-full overflow-hidden">
        <img 
          src={heroBlueprint} 
          alt="Architectural site plan with risk assessment overlays"
          className="w-full h-full object-cover opacity-60 animate-fade-in"
        />
      </div>
      
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl text-charcoal mb-6 leading-tight">
            BEFORE YOU COMMIT MILLIONS, VERIFY THE DEAL IS BUILDABLE.
          </h1>
          
          <h2 className="font-body text-xl md:text-2xl text-charcoal/80 mb-8 leading-relaxed">
            BuildSmarter™ delivers AI-enhanced feasibility reviews that protect your IRR and secure your financing with lender-ready intelligence.
          </h2>
          
          <div className="mb-6">
            <Button 
              variant="maxx-red" 
              size="lg"
              className="text-lg px-8 py-4 h-auto"
            >
              Protect My Capital – Start Review
            </Button>
          </div>
          
          <p className="font-body text-sm text-muted-foreground mb-12">
            Takes 60 seconds. No obligation to proceed.
          </p>
          
          {/* Trust Strip */}
          <div className="bg-charcoal/5 backdrop-blur-sm rounded-lg p-6">
            <p className="font-body text-sm text-charcoal/70 text-center mb-4">
              The trusted feasibility partner for Texas developers, investors, and national franchise operators.
            </p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="w-20 h-8 bg-charcoal/20 rounded" />
              <div className="w-20 h-8 bg-charcoal/20 rounded" />
              <div className="w-20 h-8 bg-charcoal/20 rounded" />
              <div className="w-20 h-8 bg-charcoal/20 rounded" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};