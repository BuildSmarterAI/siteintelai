import { X, Check } from "lucide-react";

export const ValueComparison = () => {
  const withoutItems = [
    "Surprise $250K utility upgrade",
    "9-month rezoning delay", 
    "Investor and lender skepticism"
  ];

  const withItems = [
    "$10K feasibility prevents $250K+ losses",
    "3-week turnaround, lender-ready clarity",
    "Confident green light from LPs and banks"
  ];

  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="font-headline text-4xl md:text-5xl text-charcoal mb-6">
            THE COST OF CLARITY VS. THE COST OF RISK
          </h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Without Feasibility */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-headline text-2xl text-charcoal mb-2">
                WITHOUT FEASIBILITY
              </h4>
              <p className="font-body text-sm text-red-700">
                The hidden costs of unvetted deals
              </p>
            </div>
            
            <ul className="space-y-4">
              {withoutItems.map((item, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <X className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="font-body text-charcoal/80 leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* With BuildSmarter */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-navy rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-navy-foreground" />
              </div>
              <h4 className="font-headline text-2xl text-charcoal mb-2">
                WITH SITEINTEL™
              </h4>
              <p className="font-body text-sm text-navy">
                Protect capital with intelligence
              </p>
            </div>
            
            <ul className="space-y-4">
              {withItems.map((item, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-navy mt-0.5 flex-shrink-0" />
                  <span className="font-body text-charcoal/80 leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};