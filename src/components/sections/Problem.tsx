import { AlertTriangle, Gavel, DollarSign, Handshake } from "lucide-react";

export const Problem = () => {
  const painPoints = [
    {
      title: "Unseen Entitlement Risk",
      description: "Zoning overlays, deed restrictions, or missing variances can stop your project cold.",
      detail: "What looks like a shovel-ready site suddenly requires rezoning, adding 9–12 months of delay and six-figure redesign costs.",
      icon: Gavel
    },
    {
      title: "Latent Infrastructure Costs", 
      description: "The site plan works on paper, but the ground tells a different story.",
      detail: "Inadequate water, sewer, or power capacity forces a $250,000+ unplanned utility upgrade, throwing your pro forma into chaos.",
      icon: AlertTriangle
    },
    {
      title: "Pro Forma Inaccuracy",
      description: "Outdated $/SF data and market volatility don't forgive errors.",
      detail: "A budget misaligned with real Texas construction costs can leave you 20% over budget before breaking ground—jeopardizing financing and partner confidence.",
      icon: DollarSign
    },
    {
      title: "Stakeholder Skepticism",
      description: "Investors and lenders demand objective validation.",
      detail: "Without third-party feasibility, your project pitch risks being dismissed as unverified and high-risk, leading to lost capital commitments.",
      icon: Handshake
    }
  ];

  return (
    <section className="bg-charcoal py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="font-headline text-4xl md:text-5xl text-charcoal-foreground mb-6">
            👉 THE FINANCIAL LEAKS HIDDEN IN EVERY UNVETTED DEAL
          </h3>
          <p className="font-body text-xl text-charcoal-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Untested assumptions quietly erode IRR, delay timelines, and destroy credibility with lenders and LPs.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {painPoints.map((point, index) => {
            const IconComponent = point.icon;
            return (
              <div key={index} className="group">
                <div className="bg-charcoal-foreground/5 backdrop-blur-sm rounded-lg p-6 border border-charcoal-foreground/10 hover:bg-charcoal-foreground/10 transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-maxx-red/20 to-orange-500/20 rounded-lg flex items-center justify-center border border-maxx-red/30">
                      <IconComponent 
                        className="w-8 h-8 text-maxx-red"
                        strokeWidth={2.5}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-headline text-lg text-charcoal-foreground mb-3">
                        {point.title}
                      </h4>
                      <p className="font-body text-charcoal-foreground/70 leading-relaxed mb-3">
                        {point.description}
                      </p>
                      <p className="font-body text-sm text-charcoal-foreground/60 leading-relaxed">
                        {point.detail}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};