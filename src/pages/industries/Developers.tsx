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
  Layers,
  ChevronRight 
} from "lucide-react";

const Developers = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-midnight-blue text-cloud-white py-lg px-md text-center">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-h1 mb-md">
            AI Feasibility Built for Commercial Developers & Investors
          </h1>
          <h2 className="text-h2 text-cloud-white/90 mb-lg max-w-4xl mx-auto">
            SiteIntel™ Feasibility delivers AI-verified, data-cited reports that help developers and investors move faster, reduce risk, and unlock higher returns.
          </h2>
          <Button
            asChild
            className="bg-feasibility-orange hover-scale transition-design duration-100 text-cloud-white font-semibold px-lg py-md rounded-xl text-body-l inline-flex items-center gap-sm border-0"
          >
            <Link to="/application?step=2">
              Start Your Analysis
              <ChevronRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Overview Section */}
      <section className="bg-cloud-white py-lg px-md">
        <div className="container mx-auto max-w-5xl text-center">
          <p className="text-body-l leading-relaxed text-slate-gray mb-md">
            SiteIntel™ Feasibility gives commercial real-estate professionals the confidence to act quickly on profitable opportunities. Instead of waiting weeks for traditional consultants, developers and investors generate a data-verified, due diligence feasibility report instantly.
          </p>
          <p className="text-body-l leading-relaxed text-slate-gray mb-md">
            Each report consolidates zoning, floodplain, utility, environmental, traffic, and market data into one authoritative source.
          </p>
          <p className="text-body-l leading-relaxed text-slate-gray">
            Powered by datasets from <strong className="text-feasibility-orange">FEMA NFHL</strong>, <strong className="text-feasibility-orange">ArcGIS Parcels</strong>, <strong className="text-feasibility-orange">TxDOT Traffic</strong>, <strong className="text-feasibility-orange">EPA FRS</strong>, <strong className="text-feasibility-orange">USFWS Wetlands</strong>, and <strong className="text-feasibility-orange">U.S. Census ACS</strong>, SiteIntel™ turns fragmented research into one clear answer: <strong className="text-feasibility-orange">is this site investment-ready?</strong>
          </p>
        </div>
      </section>

      {/* Why Choose SiteIntel - Feature Grid */}
      <section className="bg-gray-50 py-lg px-md">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-h2 text-center mb-lg">
            Why CRE Developers & Investors Choose SiteIntel™
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
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
                className="bg-cloud-white shadow-elev rounded-xl p-md hover:shadow-strong transition-all duration-250"
              >
                <feature.icon className="h-6 w-6 stroke-2 text-feasibility-orange mb-sm" />
                <h3 className="text-h3 text-feasibility-orange mb-sm">{feature.title}</h3>
                <p className="text-body-s text-slate-gray">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credibility Section */}
      <section className="bg-cloud-white py-lg px-md">
        <div className="container mx-auto max-w-5xl">
          <h3 className="text-h2 text-center mb-md">
            The New Standard in CRE Feasibility
          </h3>
          <p className="text-body-l leading-relaxed text-slate-gray text-center mb-md max-w-4xl mx-auto">
            For commercial developers and investors, time kills opportunity. SiteIntel™ replaces weeks of consultant coordination with a single AI-driven platform that delivers verified data and clear answers, fast.
          </p>
          <p className="text-body-l leading-relaxed text-slate-gray text-center mb-lg max-w-4xl mx-auto">
            Each report pulls directly from authoritative datasets — FEMA NFHL, ArcGIS Parcels, TxDOT Traffic, EPA FRS, USFWS Wetlands, and U.S. Census ACS — ensuring accuracy that's trusted by institutions and private-equity partners alike.
          </p>
          
          {/* Dataset Badges */}
          <div className="mb-md">
            <p className="text-h3 text-center mb-sm">Powered by Verified Data Sources</p>
            <div className="flex flex-wrap gap-sm justify-center items-center">
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
      </section>

      {/* Lifecycle Section */}
      <section className="bg-gray-50 py-lg px-md">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-h2 text-center mb-lg">
            Built for the Commercial Real Estate Lifecycle
          </h2>
          
          <div className="grid md:grid-cols-2 gap-lg">
            {/* For Developers */}
            <div className="bg-gradient-to-br from-cloud-white to-gray-50 p-lg rounded-xl shadow-elev">
              <div className="flex items-center gap-sm mb-md">
                <Building2 className="h-6 w-6 stroke-2 text-feasibility-orange" />
                <h3 className="text-h3 text-feasibility-orange">For Developers</h3>
              </div>
              <p className="text-body-l text-slate-gray mb-sm">
                SiteIntel™ lets development teams qualify parcels before bidding or design. Instant zoning and infrastructure visibility eliminate costly surprises, reduce feasibility extensions, and speed entitlement decisions.
              </p>
            </div>

            {/* For Investors */}
            <div className="bg-gradient-to-br from-cloud-white to-gray-50 p-lg rounded-xl shadow-elev">
              <div className="flex items-center gap-sm mb-md">
                <TrendingUp className="h-6 w-6 stroke-2 text-feasibility-orange" />
                <h3 className="text-h3 text-feasibility-orange">For Investors & Equity Partners</h3>
              </div>
              <p className="text-body-l text-slate-gray mb-sm">
                Private-equity groups, REITs, and institutional investors rely on SiteIntel™ to verify assumptions before closing. Each AI-generated report includes citations from authoritative datasets — providing verifiable proof that accelerates underwriting and de-risks acquisitions.
              </p>
            </div>
          </div>

          <p className="text-body-l text-center mt-lg font-semibold text-slate-gray max-w-4xl mx-auto">
            By integrating SiteIntel™ into pre-acquisition workflows, CRE firms cut due-diligence time by over 90% and redirect savings straight to returns.
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-cloud-white py-lg px-md">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-h2 text-center mb-lg">
            Replace Manual Feasibility with Automated Intelligence
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-midnight-blue text-cloud-white py-sm px-md text-left text-body-s font-semibold">Method</th>
                  <th className="bg-midnight-blue text-cloud-white py-sm px-md text-left text-body-s font-semibold">Cost</th>
                  <th className="bg-midnight-blue text-cloud-white py-sm px-md text-left text-body-s font-semibold">Turnaround</th>
                  <th className="bg-midnight-blue text-cloud-white py-sm px-md text-left text-body-s font-semibold">Data Sources</th>
                  <th className="bg-midnight-blue text-cloud-white py-sm px-md text-left text-body-s font-semibold">Verification</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-sm px-md border-b border-gray-200 text-body-s text-slate-gray">Traditional Consultant Study</td>
                  <td className="py-sm px-md border-b border-gray-200 text-body-s text-slate-gray">$10,000+</td>
                  <td className="py-sm px-md border-b border-gray-200 text-body-s text-slate-gray">3–4 weeks</td>
                  <td className="py-sm px-md border-b border-gray-200 text-body-s text-slate-gray">Manual research</td>
                  <td className="py-sm px-md border-b border-gray-200 text-body-s text-slate-gray">Human interpretation</td>
                </tr>
                <tr className="bg-feasibility-orange/5">
                  <td className="py-sm px-md border-b border-gray-200 text-body-s text-slate-gray font-semibold">SiteIntel™ Feasibility</td>
                  <td className="py-sm px-md border-b border-gray-200 text-body-s text-feasibility-orange font-semibold">$795</td>
                  <td className="py-sm px-md border-b border-gray-200 text-body-s text-feasibility-orange font-semibold">≈ 10 minutes</td>
                  <td className="py-sm px-md border-b border-gray-200 text-body-s text-slate-gray">FEMA, ArcGIS, EPA, TxDOT</td>
                  <td className="py-sm px-md border-b border-gray-200 text-body-s text-slate-gray">AI-validated JSON schema</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-body-l font-semibold text-center mt-md text-slate-gray">
            Result: 99% faster delivery and up to 12× cost savings per project — with audit-ready data that investors trust.
          </p>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="bg-feasibility-orange text-cloud-white text-center py-lg px-md">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-h2 mb-md">
            See Your Site's Feasibility in 60 Seconds
          </h2>
          <p className="text-body-l mb-lg max-w-2xl mx-auto">
            Run your first QuickCheck™ free and discover how commercial developers and investors are modernizing feasibility analysis with SiteIntel™ Feasibility.
          </p>
          <Button
            asChild
            className="bg-cloud-white text-feasibility-orange hover-scale transition-design duration-100 font-semibold px-lg py-md rounded-xl text-body-l inline-flex items-center gap-sm border-0"
          >
            <Link to="/application?step=2">
              Run Free QuickCheck™ Now
              <ChevronRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Developers;
