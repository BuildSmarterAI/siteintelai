import { Button } from "@/components/ui/button";
import heroBlueprint from "@/assets/hero-blueprint.jpg";
export const Hero = () => {
  return <section className="relative min-h-screen bg-light-gray flex items-center">
      {/* Blueprint Pattern Background */}
      <div className="absolute inset-0 blueprint-pattern opacity-50" />
      
      {/* Blueprint Image Overlay */}
      <div className="absolute right-0 top-0 w-1/2 h-full overflow-hidden">
        <img src={heroBlueprint} alt="Architectural site plan with risk assessment overlays" className="w-full h-full object-cover opacity-60 animate-fade-in" />
      </div>
      
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl text-charcoal mb-6 leading-tight">
            BEFORE YOU COMMIT MILLIONS, VERIFY THE DEAL IS BUILDABLE.
          </h1>
          
          <h2 className="font-body text-xl md:text-2xl text-charcoal/80 mb-8 leading-relaxed">
            BuildSmarter™ delivers AI-enhanced feasibility reviews that validate your Texas CRE deal, empowering you to make capital-secure decisions with confidence.
          </h2>
          
          <div className="mb-6">
            <Button variant="maxx-red" size="lg" className="text-lg px-8 py-4 h-auto">
              Start My Feasibility Review
            </Button>
          </div>
          
          <p className="font-body text-sm text-muted-foreground mb-12">
            Takes 60 seconds. No obligation.
          </p>
          
          {/* Trust Strip */}
          
        </div>
      </div>
    </section>;
};