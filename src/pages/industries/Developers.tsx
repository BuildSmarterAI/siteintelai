import { Button } from "@/components/ui/button";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { Link } from "react-router-dom";
import { 
  Building2, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Database, 
  Bot, 
  Layers
} from "lucide-react";

const Developers = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex min-h-[85vh] overflow-hidden bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C]">
        <div className="relative z-10 flex w-full items-center">
          <div className="container mx-auto px-6 lg:px-20">
            <div className="max-w-3xl">
              <div className="rounded-3xl bg-white/15 backdrop-blur-xl border border-[#06B6D4]/20 p-8 md:p-12 shadow-[0_8px_32px_0_rgba(10,15,44,0.37)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0A0F2C]/40 to-transparent pointer-events-none rounded-3xl" />
                
                <div className="relative z-10">
                  <h1 className="text-5xl sm:text-6xl md:text-7xl font-headline font-bold text-white leading-[1.1] mb-6">
                    AI Feasibility Built for <span className="text-[#FF7A00]">Commercial Developers & Investors</span>
                  </h1>
                  <p className="text-lg md:text-xl lg:text-2xl text-[#CBD5E1]/90 leading-relaxed mb-10 font-body">
                    SiteIntel™ Feasibility delivers AI-verified, data-cited reports that help developers and investors move faster, reduce risk, and unlock higher returns.
                  </p>
                  <Button
                    asChild
                    variant="maxx-red"
                    size="lg"
                    className="text-lg md:text-xl px-8 py-4 h-auto font-cta"
                  >
                    <Link to="/application?step=2">
                      Start Your Analysis →
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <p className="font-body text-lg md:text-xl text-charcoal/85 leading-relaxed mb-6">
              SiteIntel™ Feasibility gives commercial real-estate professionals the confidence to act quickly on profitable opportunities. Instead of waiting weeks for traditional consultants, developers and investors generate a data-verified, due diligence feasibility report instantly.
            </p>
            <p className="font-body text-lg md:text-xl text-charcoal/85 leading-relaxed mb-6">
              Each report consolidates zoning, floodplain, utility, environmental, traffic, and market data into one authoritative source.
            </p>
            <p className="font-body text-lg md:text-xl text-charcoal leading-relaxed">
              Powered by datasets from <strong className="text-[#FF7A00]">FEMA NFHL</strong>, <strong className="text-[#FF7A00]">ArcGIS Parcels</strong>, <strong className="text-[#FF7A00]">TxDOT Traffic</strong>, <strong className="text-[#FF7A00]">EPA FRS</strong>, <strong className="text-[#FF7A00]">USFWS Wetlands</strong>, and <strong className="text-[#FF7A00]">U.S. Census ACS</strong>, SiteIntel™ turns fragmented research into one clear answer: <strong className="text-[#FF7A00]">is this site investment-ready?</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose SiteIntel - Feature Grid */}
      <section className="bg-light-gray py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-8">
          <h2 className="font-headline text-4xl md:text-5xl text-charcoal text-center mb-12 md:mb-16">
            Why CRE Developers & Investors Choose SiteIntel™
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: Zap,
                title: "Speed to Decision",
                description: "Evaluate development and acquisition opportunities in minutes — not weeks.",
              },
              {
                icon: ShieldCheck,
                title: "Capital Protection",
                description: "Identify zoning, flood, or infrastructure constraints before committing earnest money or pre-development capital.",
              },
              {
                icon: Database,
                title: "Data Integrity",
                description: "Verified GIS and federal data — no third-party estimates or assumptions.",
              },
              {
                icon: Bot,
                title: "AI Precision",
                description: "Deterministic modeling and schema validation deliver 99% accuracy.",
              },
              {
                icon: Layers,
                title: "Portfolio Scale",
                description: "Screen multiple sites rapidly to prioritize the best investments.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full"
              >
                <feature.icon className="w-8 h-8 text-navy mb-4" />
                <h3 className="font-body font-semibold text-lg md:text-xl text-navy mb-3">
                  {feature.title}
                </h3>
                <p className="font-body text-base text-charcoal leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credibility Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h3 className="font-headline text-4xl md:text-5xl text-charcoal text-center mb-8">
              The New Standard in CRE Feasibility
            </h3>
            <p className="font-body text-lg md:text-xl text-charcoal/85 leading-relaxed text-center mb-6 max-w-4xl mx-auto">
              For commercial developers and investors, time kills opportunity. SiteIntel™ replaces weeks of consultant coordination with a single AI-driven platform that delivers verified data and clear answers, fast.
            </p>
            <p className="font-body text-lg md:text-xl text-charcoal/85 leading-relaxed text-center mb-12 max-w-4xl mx-auto">
              Each report pulls directly from authoritative datasets — FEMA NFHL, ArcGIS Parcels, TxDOT Traffic, EPA FRS, USFWS Wetlands, and U.S. Census ACS — ensuring accuracy that's trusted by institutions and private-equity partners alike.
            </p>
            
            {/* Dataset Badges */}
            <div className="mb-8">
              <p className="font-headline text-2xl text-navy text-center mb-6">Powered by Verified Data Sources</p>
              <div className="flex flex-wrap gap-3 justify-center items-center">
                <DataSourceBadge 
                  datasetName="FEMA NFHL" 
                  timestamp={new Date().toISOString()} 
                />
                <DataSourceBadge 
                  datasetName="ArcGIS Parcels" 
                  timestamp={new Date().toISOString()} 
                />
                <DataSourceBadge 
                  datasetName="TxDOT Traffic" 
                  timestamp={new Date().toISOString()} 
                />
                <DataSourceBadge 
                  datasetName="EPA FRS" 
                  timestamp={new Date().toISOString()} 
                />
                <DataSourceBadge 
                  datasetName="USFWS Wetlands" 
                  timestamp={new Date().toISOString()} 
                />
                <DataSourceBadge 
                  datasetName="U.S. Census ACS" 
                  timestamp={new Date().toISOString()} 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lifecycle Section */}
      <section className="bg-light-gray py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-8">
          <h2 className="font-headline text-4xl md:text-5xl text-charcoal text-center mb-12 md:mb-16">
            Built for the Commercial Real Estate Lifecycle
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* For Developers */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-8 h-8 text-navy" />
                <h3 className="font-body font-semibold text-lg md:text-xl text-navy">For Developers</h3>
              </div>
              <p className="font-body text-base md:text-lg text-charcoal leading-relaxed">
                SiteIntel™ lets development teams qualify parcels before bidding or design. Instant zoning and infrastructure visibility eliminate costly surprises, reduce feasibility extensions, and speed entitlement decisions.
              </p>
            </div>

            {/* For Investors */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-8 h-8 text-navy" />
                <h3 className="font-body font-semibold text-lg md:text-xl text-navy">For Investors & Equity Partners</h3>
              </div>
              <p className="font-body text-base md:text-lg text-charcoal leading-relaxed">
                Private-equity groups, REITs, and institutional investors rely on SiteIntel™ to verify assumptions before closing. Each AI-generated report includes citations from authoritative datasets — providing verifiable proof that accelerates underwriting and de-risks acquisitions.
              </p>
            </div>
          </div>

          <p className="font-body text-lg md:text-xl text-center mt-10 font-semibold text-charcoal max-w-4xl mx-auto">
            By integrating SiteIntel™ into pre-acquisition workflows, CRE firms cut due-diligence time by over 90% and redirect savings straight to returns.
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-8">
          <h2 className="font-headline text-4xl md:text-5xl text-charcoal text-center mb-12">
            Replace Manual Feasibility with Automated Intelligence
          </h2>
          
          <div className="overflow-x-auto max-w-5xl mx-auto">
            <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-md">
              <thead>
                <tr className="bg-navy">
                  <th className="text-white py-4 px-6 text-left font-body font-semibold">Method</th>
                  <th className="text-white py-4 px-6 text-left font-body font-semibold">Cost</th>
                  <th className="text-white py-4 px-6 text-left font-body font-semibold">Turnaround</th>
                  <th className="text-white py-4 px-6 text-left font-body font-semibold">Data Sources</th>
                  <th className="text-white py-4 px-6 text-left font-body font-semibold">Verification</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6 font-body text-charcoal">Traditional Consultant Study</td>
                  <td className="py-4 px-6 font-body text-charcoal">$10,000+</td>
                  <td className="py-4 px-6 font-body text-charcoal">3–4 weeks</td>
                  <td className="py-4 px-6 font-body text-charcoal">Manual research</td>
                  <td className="py-4 px-6 font-body text-charcoal">Human interpretation</td>
                </tr>
                <tr className="bg-[#FF7A00]/10">
                  <td className="py-4 px-6 font-body font-semibold text-charcoal">SiteIntel™ Feasibility</td>
                  <td className="py-4 px-6 font-body font-semibold text-[#FF7A00]">$795</td>
                  <td className="py-4 px-6 font-body font-semibold text-[#FF7A00]">≈ 10 minutes</td>
                  <td className="py-4 px-6 font-body text-charcoal">FEMA, ArcGIS, EPA, TxDOT</td>
                  <td className="py-4 px-6 font-body text-charcoal">AI-validated JSON schema</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="font-body text-lg md:text-xl font-semibold text-center mt-8 text-charcoal">
            Result: 99% faster delivery and up to 12× cost savings per project — with audit-ready data that investors trust.
          </p>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="bg-maxx-red text-white text-center py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-4xl md:text-5xl mb-6">
              See Your Site's Feasibility in 60 Seconds
            </h2>
            <p className="font-body text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Run your first QuickCheck™ free and discover how commercial developers and investors are modernizing feasibility analysis with SiteIntel™ Feasibility.
            </p>
            <Button
              asChild
              variant="default"
              size="lg"
              className="bg-white text-maxx-red hover:bg-white/90 text-lg md:text-xl px-8 py-4 h-auto font-cta"
            >
              <Link to="/application?step=2">
                Run Free QuickCheck™ Now →
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Developers;
