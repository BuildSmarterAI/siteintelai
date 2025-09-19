export const AssociationLogos = () => {
  return (
    <section className="bg-background py-8 border-t border-b border-border/20">
      <div className="container mx-auto px-6 lg:px-8">
        <p className="font-body text-sm text-muted-foreground text-center mb-6">
          Trusted by Texas developers, investors, and national franchise operators
        </p>
        <div className="flex justify-center items-center space-x-12 opacity-60">
          <div className="w-24 h-12 bg-charcoal/20 rounded flex items-center justify-center">
            <span className="font-cta text-xs text-charcoal/60">NAIOP</span>
          </div>
          <div className="w-24 h-12 bg-charcoal/20 rounded flex items-center justify-center">
            <span className="font-cta text-xs text-charcoal/60">ULI</span>
          </div>
          <div className="w-24 h-12 bg-charcoal/20 rounded flex items-center justify-center">
            <span className="font-cta text-xs text-charcoal/60">CCIM</span>
          </div>
          <div className="w-24 h-12 bg-charcoal/20 rounded flex items-center justify-center">
            <span className="font-cta text-xs text-charcoal/60">ICSC</span>
          </div>
        </div>
      </div>
    </section>
  );
};