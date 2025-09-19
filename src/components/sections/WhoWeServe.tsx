import { 
  Building2, 
  TrendingUp, 
  MapPin, 
  Heart, 
  Briefcase, 
  ShoppingCart, 
  Warehouse, 
  Coffee,
  Church
} from "lucide-react";

export const WhoWeServe = () => {
  const audiences = [
    {
      icon: Building2,
      title: "Developers & Owners",
      description: "Validate sites before acquisition and avoid entitlement surprises.",
      accentColor: "text-maxx-red",
      hoverBorder: "hover:border-maxx-red"
    },
    {
      icon: TrendingUp,
      title: "Investors & PE Firms", 
      description: "Protect IRR and satisfy LPs with lender-ready clarity.",
      accentColor: "text-navy",
      hoverBorder: "hover:border-navy"
    },
    {
      icon: MapPin,
      title: "Franchise Expansion Leaders",
      description: "Scale faster by knowing which sites pass zoning and infrastructure checks.",
      accentColor: "text-charcoal",
      hoverBorder: "hover:border-charcoal"
    },
    {
      icon: Heart,
      title: "Healthcare & Multifamily Developers",
      description: "Confirm capacity, compliance, and financing readiness before breaking ground.",
      accentColor: "text-green-700",
      hoverBorder: "hover:border-green-700"
    },
    {
      icon: Briefcase,
      title: "Corporate CRE Teams",
      description: "Evaluate office, industrial, and HQ sites with lender-grade validation.",
      accentColor: "text-purple-700",
      hoverBorder: "hover:border-purple-700"
    },
    {
      icon: ShoppingCart,
      title: "Retail Chains & QSR Operators",
      description: "Choose only location-ready sites to streamline rollouts.",
      accentColor: "text-orange-500",
      hoverBorder: "hover:border-orange-500"
    },
    {
      icon: Warehouse,
      title: "Logistics & Industrial Developers",
      description: "Verify access, utilities, and permitting for warehouses and distribution hubs.",
      accentColor: "text-blue-600",
      hoverBorder: "hover:border-blue-600"
    },
    {
      icon: Coffee,
      title: "Hospitality Developers (Hotels/Resorts)",
      description: "De-risk projects with early entitlement and infrastructure validation.",
      accentColor: "text-teal-600",
      hoverBorder: "hover:border-teal-600"
    },
    {
      icon: Church,
      title: "Religious & Nonprofit Institutions",
      description: "Ensure compliance and financing readiness for community and institutional developments.",
      accentColor: "text-amber-700",
      hoverBorder: "hover:border-amber-700"
    }
  ];

  return (
    <section className="bg-white py-20 md:py-25">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h3 className="font-headline text-2xl md:text-3xl text-charcoal mb-4 md:mb-6 tracking-wider uppercase">
            BUILT FOR TEXAS CRE DECISION-MAKERS
          </h3>
          <h4 className="font-body text-lg md:text-xl text-charcoal max-w-4xl mx-auto leading-relaxed">
            From developers to investors, BuildSmarter™ Feasibility helps every CRE leader protect capital and move projects forward with confidence.
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {audiences.map((audience, index) => (
            <div key={index} className="group">
              <div className={`bg-white border border-gray-200 rounded-lg p-6 md:p-8 text-center hover:shadow-lg transition-all duration-300 h-full ${audience.hoverBorder}`}>
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-100 transition-colors duration-300">
                  <audience.icon className={`w-8 h-8 ${audience.accentColor} transition-colors duration-300`} />
                </div>
                
                <h4 className={`font-body font-semibold text-lg md:text-xl mb-3 ${audience.accentColor}`}>
                  {audience.title}
                </h4>
                
                <p className="font-body text-base text-charcoal leading-relaxed">
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