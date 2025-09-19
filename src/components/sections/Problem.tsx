import riskHeatmap from "@/assets/risk-heatmap.jpg";

export const Problem = () => {
  const painPoints = [
    {
      title: "Unseen Entitlement Risk",
      description: "Zoning variance delays trigger 9-month setbacks and costly redesigns that freeze deals."
    },
    {
      title: "Hidden Infrastructure Costs", 
      description: "Surprise $250K+ utility upgrades that your pro forma can't absorb."
    },
    {
      title: "Outdated Pro Forma Data",
      description: "20% budget overruns from stale market data jeopardize financing before groundbreaking."
    },
    {
      title: "Stakeholder Skepticism",
      description: "Lenders and LPs demand third-party validation you can't provide."
    }
  ];

  return (
    <section className="bg-charcoal py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="font-headline text-4xl md:text-5xl text-charcoal-foreground mb-6">
            STOP GUESSING. START BUILDING SMARTER.
          </h3>
          <p className="font-body text-xl text-charcoal-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Every unvetted assumption is a financial leak waiting to drain your IRR.
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