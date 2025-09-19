import { Button } from "@/components/ui/button";

export const ProblemCTA = () => {
  return (
    <section className="bg-charcoal/95 py-12">
      <div className="container mx-auto px-6 lg:px-8 text-center">
        <Button 
          variant="maxx-red" 
          size="lg"
          className="text-lg px-8 py-4 h-auto"
        >
          Get My Lender-Ready Report
        </Button>
        <p className="font-body text-sm text-charcoal-foreground/70 mt-4">
          2-3 week delivery. Institutional-grade analysis.
        </p>
      </div>
    </section>
  );
};