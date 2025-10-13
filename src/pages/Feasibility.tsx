import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Shield, DollarSign, Map, TrendingUp, CheckCircle2 } from "lucide-react";
import AuthorityBadges from "@/components/sections/AuthorityBadges";
import { Helmet } from "react-helmet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const Feasibility = () => {
  return (
    <>
      <Helmet>
        <title>Feasibility Intelligence | SiteIntel™ Products</title>
        <meta
          name="description"
          content="AI-powered feasibility analysis for commercial real estate. Zoning, flood, utilities & compliance verified in minutes."
        />
        <link rel="canonical" href="https://siteintel.com/products/feasibility" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C]">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-6 pt-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/products" className="text-white/60 hover:text-white">Products</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white/40" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">Feasibility Intelligence</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            AI-Powered Due Diligence Feasibility for <span className="text-[#FF7A00]">Commercial Real Estate</span>
          </h1>
          <p className="text-xl text-white/90 mb-12 leading-relaxed">
            Accelerate your commercial real estate feasibility and due diligence process with SiteIntel™ — the only AI platform that delivers cited, lender-ready reports instantly.
          </p>
        </div>
      </div>

      {/* Authority Badges */}
      <AuthorityBadges />

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* What's Inside the Report */}
          <section className="mb-16" id="reports">
            <h2 className="text-3xl font-bold text-white mb-8">
              What's Inside Your <span className="text-[#06B6D4]">Commercial Real Estate Feasibility Report</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: Map,
                  title: "Zoning & Floodplain Analysis",
                  description: "Zoning, flood zones, easements, and environmental constraints verified from municipal sources.",
                },
                {
                  icon: DollarSign,
                  title: "Cost & Timeline Estimates",
                  description: "Construction cost benchmarks, material prices, and labor rates calibrated from real projects.",
                },
                {
                  icon: Shield,
                  title: "Risk & Compliance Assessment",
                  description: "Identify constraints, permitting challenges, and regulatory hurdles before they become problems.",
                },
                {
                  icon: FileText,
                  title: "Utilities & Infrastructure Data",
                  description: "Every data point traced back to its source—complete transparency and audit trail.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
                >
                  <item.icon className="h-10 w-10 text-[#06B6D4] mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-white/70">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Verification Process */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">
              AI-Powered Feasibility Analysis Process – <span className="text-[#06B6D4]">Zoning, Floodplain & Utilities</span>
            </h2>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <ol className="space-y-6">
                {[
                  "Enter property address and project parameters",
                  "Our proprietary AI engine retrieves data from 20+ verified federal and municipal sources",
                  "Texas-trained AI models analyze and cross-validate all datasets",
                  "Intelligence engine generates comprehensive feasibility report with proprietary risk scoring",
                  "Receive verified report with complete source transparency",
                ].map((step, idx) => (
                  <li key={idx} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#06B6D4] text-[#0A0F2C] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-white/80 pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Social Proof */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Trusted by <span className="text-[#FF7A00]">Developers, Lenders & Investors</span> Across Texas
            </h2>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-[#06B6D4] mb-2">20+</div>
                  <div className="text-white/80">Verified Data Sources</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-[#06B6D4] mb-2">10 min</div>
                  <div className="text-white/80">Average Turnaround</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-[#06B6D4] mb-2">$795</div>
                  <div className="text-white/80">Starting Price</div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <p className="text-white/70">
                  Powered by proprietary AI models trained on Texas commercial real estate patterns. Built by Texas commercial builders.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-[#FF7A00] to-[#FF9240] hover:shadow-[0_6px_30px_rgba(255,122,0,0.6)] text-white font-semibold rounded-full px-12 py-8 text-lg"
            >
              <Link to="/application?step=2">Run Free QuickCheck →</Link>
            </Button>
            <p className="mt-4 text-white/60 text-sm">
              60-second turnaround · Powered by proprietary AI
            </p>
          </div>
        </div>
      </div>

        {/* Explore Other Products */}
        <section className="container mx-auto px-6 py-20 border-t border-white/10 bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C]">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Explore Other <span className="text-[#06B6D4]">Intelligence Products</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link
              to="/products/cost-intelligence"
              className="bg-gradient-to-br from-[#FF7A00]/20 to-[#FF9240]/20 backdrop-blur-md border border-[#FF7A00]/30 rounded-2xl p-8 hover:border-[#FF7A00] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#FF9240] flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#FF7A00] transition-colors">
                    Cost Intelligence
                  </h3>
                  <p className="text-white/70">Real-time construction cost tracking & benchmarking</p>
                </div>
              </div>
            </Link>

            <Link
              to="/products/schedule-intelligence"
              className="bg-gradient-to-br from-[#8B5CF6]/20 to-[#A78BFA]/20 backdrop-blur-md border border-[#8B5CF6]/30 rounded-2xl p-8 hover:border-[#8B5CF6] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#8B5CF6] transition-colors">
                    Schedule Intelligence
                  </h3>
                  <p className="text-white/70">Timeline risk & permit duration forecasting</p>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default Feasibility;
