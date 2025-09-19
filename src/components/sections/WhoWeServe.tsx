import { Building2, TrendingUp, MapPin, Heart } from "lucide-react";

export const WhoWeServe = () => {
  const audiences = [
    {
      icon: Building2,
      title: "Developers & Owners",
      description: "Validate sites before acquisition."
    },
    {
      icon: TrendingUp,
      title: "Investors & PE Firms",
      description: "Protect IRR and strengthen LP trust."
    },
    {
      icon: MapPin,
      title: "Franchise Expansion Leaders",
      description: "Scale with location-ready confidence."
    },
    {
      icon: Heart,
      title: "Healthcare & Multifamily Developers",
      description: "Confirm capacity, compliance, and financing readiness."
    }
  ];

  return (
    <section className="bg-light-gray py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="font-headline text-4xl md:text-5xl text-charcoal mb-6">
            BUILT FOR TEXAS CRE DECISION-MAKERS
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {audiences.map((audience, index) => (
            <div key={index} className="group">
              <div className="bg-background border border-navy/10 rounded-lg p-6 text-center hover:shadow-xl transition-all duration-300 h-full">
                <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-navy/20 transition-colors duration-300">
                  <audience.icon className="w-8 h-8 text-navy" />
                </div>
                
                <h4 className="font-headline text-lg text-charcoal mb-3">
                  {audience.title}
                </h4>
                
                <p className="font-body text-charcoal/70 leading-relaxed">
                  {audience.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};