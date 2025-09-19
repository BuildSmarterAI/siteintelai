import riskHeatmap from "@/assets/risk-heatmap.jpg";

export const Problem = () => {
  const painPoints = [
    {
      title: "Unseen Entitlement Risk",
      description: "Your project hinges on a zoning variance you don't know you need, triggering a 9-month delay and a costly redesign that puts the entire deal on ice."
    },
    {
      title: "Latent Infrastructure Costs", 
      description: "The site is perfect, but the utility capacity isn't. You're now facing a surprise $250,000 upgrade that your pro forma can't absorb."
    },
    {
      title: "Pro Forma Inaccuracy",
      description: "Your budget relies on outdated data. Real-time Texas market volatility means your project is already 20% over budget, jeopardizing financing before you break ground."
    },
    {
      title: "Stakeholder Skepticism",
      description: "You pitch to lenders and LPs, but without credible, third-party validation, your project lacks the data-driven certainty they require to commit capital."
    }
  ];

  return (
    <section className="bg-charcoal py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="font-headline text-4xl md:text-5xl text-charcoal-foreground mb-6">
            THE FINANCIAL LEAKS HIDDEN IN EVERY UNVETTED DEAL
          </h3>
          <p className="font-body text-xl text-charcoal-foreground/80 max-w-4xl mx-auto leading-relaxed">
            Untested assumptions are the leading cause of project failure. A single unverified detail on zoning, utilities, or cost can quietly drain your IRR, delay your timeline, and erode stakeholder trust.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {painPoints.map((point, index) => (
            <div key={index} className="group">
              <div className="bg-charcoal-foreground/5 backdrop-blur-sm rounded-lg p-6 border border-charcoal-foreground/10 hover:bg-charcoal-foreground/10 transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-maxx-red/20 to-navy/20 rounded-lg flex items-center justify-center">
                    <img 
                      src={riskHeatmap} 
                      alt="Risk visualization"
                      className="w-12 h-12 object-cover rounded opacity-80"
                    />
                  </div>
                  <div>
                    <h4 className="font-headline text-lg text-charcoal-foreground mb-3">
                      {point.title}
                    </h4>
                    <p className="font-body text-charcoal-foreground/70 leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};