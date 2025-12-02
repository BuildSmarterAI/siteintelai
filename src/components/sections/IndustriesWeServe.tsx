import { 
  ShoppingBag,
  Heart,
  Building2,
  Warehouse,
  MapPin,
  Coffee,
  Briefcase,
  Archive,
  GraduationCap,
  Home,
  Settings,
  Tent
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const IndustriesWeServe = () => {
  const industries = [
    {
      icon: ShoppingBag,
      title: "Retail & Commercial",
      description: "Identify profitable retail and shopping center sites faster with precise real estate feasibility analysis. Evaluate zoning, traffic flow, and access points to secure high-visibility locations before lease or acquisition.",
      ctaLabel: "View Retail Example",
      ctaUrl: "/industries/retail-feasibility"
    },
    {
      icon: Heart,
      title: "Healthcare & Medical",
      description: "Streamline development feasibility studies for clinics, urgent care centers, and medical campuses. SiteIntel™ evaluates location access, zoning compliance, and demographic alignment to help healthcare developers make confident site decisions.",
      ctaLabel: "View Healthcare Example",
      ctaUrl: "/industries/healthcare-feasibility"
    },
    {
      icon: Building2,
      title: "Multifamily & Mixed-Use",
      description: "Simplify early-stage planning for apartments, condominiums, and mixed-use projects. Feasibility intelligence helps developers balance density, parking, and entitlement requirements for faster design approvals.",
      ctaLabel: "View Multifamily Example",
      ctaUrl: "/industries/multifamily-feasibility"
    },
    {
      icon: Warehouse,
      title: "Industrial & Logistics",
      description: "Optimize warehouse, cold storage, and distribution site selection with accurate construction and land feasibility data. SiteIntel™ identifies access corridors, utility infrastructure, and buildable acreage instantly.",
      ctaLabel: "View Industrial Example",
      ctaUrl: "/industries/industrial-logistics-feasibility"
    },
    {
      icon: MapPin,
      title: "Land Development & Redevelopment",
      description: "Accelerate land development feasibility studies for subdivisions, infill sites, or redevelopment parcels. Instantly evaluate topography, flood zones, and infrastructure potential for informed acquisition decisions.",
      ctaLabel: "View Land Example",
      ctaUrl: "/industries/land-development-feasibility"
    },
    {
      icon: Coffee,
      title: "Hospitality & Entertainment",
      description: "Assess potential for hotels, resorts, and entertainment venues with detailed project feasibility studies covering land use, traffic, and tourist density. SiteIntel™ ensures your hospitality investment starts with verified data.",
      ctaLabel: "View Hospitality Example",
      ctaUrl: "/industries/hospitality-feasibility"
    },
    {
      icon: Briefcase,
      title: "Office & Corporate",
      description: "Conduct quick, data-verified feasibility studies for corporate campuses, professional office parks, and government facilities. Understand zoning limits, access, and cost ranges early for strategic capital planning.",
      ctaLabel: "View Office Example",
      ctaUrl: "/industries/office-feasibility"
    },
    {
      icon: Archive,
      title: "Self Storage",
      description: "Run a complete self storage feasibility study in minutes. Analyze surrounding density, demand ratios, and site access metrics to confirm build potential and projected ROI before development.",
      ctaLabel: "View Storage Example",
      ctaUrl: "/industries/storage-feasibility"
    },
    {
      icon: GraduationCap,
      title: "Education & Institutional",
      description: "Evaluate campuses, schools, and training centers with geographic and demographic precision. SiteIntel™ supports institutional planning with real estate feasibility reports that align with growth and funding goals.",
      ctaLabel: "View Education Example",
      ctaUrl: "/industries/education-feasibility"
    },
    {
      icon: Home,
      title: "Affordable & Senior Housing",
      description: "Streamline development feasibility studies for senior living and affordable housing. Identify compliant parcels, utility readiness, and local policy overlays to move faster toward funding and entitlements.",
      ctaLabel: "View Housing Example",
      ctaUrl: "/industries/housing-feasibility"
    },
    {
      icon: Settings,
      title: "Infrastructure & Utilities",
      description: "Evaluate large-scale infrastructure, utility, and energy projects with full land feasibility analysis — from easements to flood risk and right-of-way mapping.",
      ctaLabel: "View Infrastructure Example",
      ctaUrl: "/industries/infrastructure-feasibility"
    },
    {
      icon: Tent,
      title: "Hospitality & Recreational Developments",
      description: "Plan resorts, RV parks, marinas, and eco-lodges with precision. SiteIntel™'s feasibility insights consider environmental constraints, zoning overlays, and nearby amenities for smart land utilization.",
      ctaLabel: "View Recreation Example",
      ctaUrl: "/industries/recreation-feasibility"
    }
  ];

  const handleCtaClick = (industryTitle: string) => {
    toast({
      title: "Industry Landing Page Coming Soon!",
      description: `We're building detailed ${industryTitle} feasibility resources. Stay tuned!`,
    });
  };

  return (
    <section className="bg-gray-50 py-20 md:py-25">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground mb-4 md:mb-6">
            Industries We Serve — Feasibility and Due Diligence for Every Type of Development
          </h2>
          <p className="font-body text-lg md:text-xl text-charcoal max-w-4xl mx-auto leading-relaxed">
            From multifamily housing to hospitality and logistics, SiteIntel™ adapts to every asset class. Our platform streamlines real estate feasibility and development feasibility studies across the full spectrum of commercial and mixed-use projects.
          </p>
        </div>
        
        {/* Industry Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {industries.map((industry, index) => (
            <article
              key={index}
              className="group"
              aria-labelledby={`industry-${index}-title`}
            >
              <div 
                className={`
                  ${(index % 8 < 4) ? 'bg-white' : 'bg-gray-50'}
                  border border-gray-200 
                  rounded-lg 
                  p-6 md:p-8 
                  min-h-[320px]
                  flex flex-col
                  transition-all duration-300
                  hover:scale-[1.02]
                  hover:shadow-[0_0_20px_rgba(255,122,0,0.1)]
                `}
              >
                {/* Icon */}
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                  <industry.icon 
                    className="w-12 h-12 text-[#06B6D4]" 
                    aria-hidden="true"
                  />
                </div>
                
                {/* Title */}
                <h3 
                  id={`industry-${index}-title`}
                  className="font-body font-semibold text-xl md:text-2xl text-charcoal mb-3 text-center"
                >
                  {industry.title}
                </h3>
                
                {/* Description */}
                <p className="font-body text-base text-charcoal leading-relaxed text-center mb-4 flex-grow">
                  {industry.description}
                </p>
                
                {/* CTA */}
                <button
                  onClick={() => handleCtaClick(industry.title)}
                  className="font-body text-base text-maxx-red hover:underline transition-all duration-200 text-center mt-auto"
                  aria-label={`View ${industry.title.toLowerCase()} feasibility example`}
                >
                  {industry.ctaLabel} →
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Optional Bottom CTA */}
        <div className="text-center mt-12 md:mt-16">
          <h3 className="font-headline text-2xl md:text-3xl text-charcoal mb-4">
            See How SiteIntel™ Supports Every Industry in Commercial Development
          </h3>
          <p className="font-body text-lg text-charcoal max-w-3xl mx-auto leading-relaxed">
            Each market moves differently — SiteIntel™ gives your team the data clarity to move first. Explore how instant feasibility insights improve outcomes across all property types.
          </p>
        </div>
      </div>
    </section>
  );
};
