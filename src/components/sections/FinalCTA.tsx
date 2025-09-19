import { Button } from "@/components/ui/button";

export const FinalCTA = () => {
  return (
    <section className="bg-maxx-red py-20">
      <div className="container mx-auto px-6 lg:px-8 text-center">
        <h2 className="font-headline text-4xl md:text-6xl text-maxx-red-foreground mb-6">
          STOP GUESSING. START BUILDING SMARTER.
        </h2>
        
        <p className="font-body text-xl text-maxx-red-foreground/90 mb-2 max-w-3xl mx-auto leading-relaxed">
          Validate your next Texas CRE deal with institutional-grade intelligence.
        </p>
        
        <p className="font-body text-sm text-maxx-red-foreground/80 mb-8 font-semibold">
          Only 5 projects accepted monthly – secure your spot.
        </p>
        
        <div className="mb-6">
          <Button 
            variant="outline"
            size="lg"
            className="bg-maxx-red-foreground text-maxx-red border-maxx-red-foreground hover:bg-maxx-red-foreground/90 text-lg px-8 py-4 h-auto font-cta font-semibold"
          >
            Get My Lender-Ready Report
          </Button>
        </div>
        
        <p className="font-body text-sm text-maxx-red-foreground/80">
          2-3 week delivery. Institutional-grade analysis.
        </p>
      </div>
    </section>
  );
};