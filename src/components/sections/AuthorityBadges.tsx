import { Shield, MapPin, Building2, Leaf } from "lucide-react";

const AuthorityBadges = () => {
  const dataSources = [
    {
      icon: Shield,
      name: "FEMA",
      description: "Floodplain & Disaster Data",
      color: "text-blue-400"
    },
    {
      icon: MapPin,
      name: "ArcGIS",
      description: "Geospatial Intelligence",
      color: "text-cyan-400"
    },
    {
      icon: Building2,
      name: "TxDOT",
      description: "Infrastructure & Utilities",
      color: "text-orange-400"
    },
    {
      icon: Leaf,
      name: "EPA",
      description: "Environmental Compliance",
      color: "text-green-400"
    }
  ];

  return (
    <section className="py-12 border-y border-white/10 bg-white/5 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <p className="text-sm uppercase tracking-wider text-white/60 mb-2">
            Trusted by Lenders & Developers
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 mb-2">
            Every Data Point Verified from Official Government Sources
          </h2>
          <p className="text-white/70">
            Unlike competitor reports, every claim is cited and traceable to authoritative data sources
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {dataSources.map((source, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <div className={`mb-3 ${source.color}`}>
                <source.icon className="h-12 w-12" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{source.name}</h3>
              <p className="text-sm text-white/60">{source.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm">
            <span className="text-[#06B6D4] font-semibold">20+ verified data sources</span> • Updated daily • Full citation trail
          </p>
        </div>
      </div>
    </section>
  );
};

export default AuthorityBadges;
