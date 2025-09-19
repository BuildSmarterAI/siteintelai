import { Button } from "@/components/ui/button";
import heroBlueprint from "@/assets/hero-blueprint.jpg";
import buildsmarterLogo from "@/assets/buildsmarter-logo.png";
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
          <img 
            src={buildsmarterLogo} 
            alt="BuildSmarter Feasibility" 
            className="h-32 md:h-40 lg:h-48 mb-8 object-contain"
          />
          
          <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl text-charcoal mb-6 leading-[1.15] tracking-[-0.02em] font-medium bg-gradient-to-br from-charcoal via-charcoal/90 to-charcoal/70 bg-clip-text text-transparent relative">
            <span className="block">Evaluate Your CRE Property</span>
            <span className="block text-[#D00E07] font-semibold">Before You Buy—or Before You Build.</span>
          </h1>
          
          <h2 className="font-body text-xl md:text-2xl text-charcoal/80 mb-8 leading-relaxed">
            Get a full feasibility evaluation before you commit millions. Identify construction, zoning, utility risks early to protect IRR.
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