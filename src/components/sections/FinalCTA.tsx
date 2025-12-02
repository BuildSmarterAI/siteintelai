import { Button } from "@/components/ui/button";

export const FinalCTA = () => {
  return (
    <section className="bg-maxx-red py-20">
      <div className="container mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-maxx-red-foreground to-maxx-red-foreground/70 mb-6">
          STOP GUESSING. START BUILDING SMARTER.
        </h2>
        
        <p className="font-body text-xl text-maxx-red-foreground/90 mb-2 max-w-3xl mx-auto leading-relaxed">
          Join the private beta and get early access to instant feasibility intelligence.
        </p>
        
        <p className="font-body text-sm text-maxx-red-foreground/80 mb-8 font-semibold">
          Limited to 500 verified professionals. Secure your spot today.
        </p>
        
        <div className="mb-6">
          <Button 
            variant="outline"
            size="lg"
            className="bg-maxx-red-foreground text-maxx-red border-maxx-red-foreground hover:bg-maxx-red-foreground/90 text-lg px-8 py-4 h-auto font-cta font-semibold"
            onClick={() => window.location.href = '/beta-signup'}
          >
            Join Beta →
          </Button>
        </div>
        
        <p className="font-body text-sm text-maxx-red-foreground/80">
          Free beta access · 3 report credits included · Founding member pricing locked.
        </p>
      </div>
    </section>
  );
};