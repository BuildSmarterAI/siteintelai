import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Shield, DollarSign, Map } from "lucide-react";
import AuthorityBadges from "@/components/sections/AuthorityBadges";

const Feasibility = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C]">
      <div className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Instant AI Feasibility Reports – <span className="text-[#FF7A00]">10 Minutes to Lender-Ready Results</span>
          </h1>
          <p className="text-xl text-white/80 mb-4 leading-relaxed">
            Replace $10K consultant studies and 3-month wait times with AI-powered reports backed by FEMA, ArcGIS, and TxDOT data.
          </p>
          <p className="text-lg text-white/70 mb-12">
            Verified intelligence that transforms complex public, municipal, and construction data into actionable feasibility insights—helping you make faster, safer, and more profitable decisions.
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
                  title: "Geospatial Intelligence",
                  description: "Zoning, flood zones, easements, and environmental constraints verified from municipal sources.",
                },
                {
                  icon: DollarSign,
                  title: "Cost Intelligence",
                  description: "Construction cost benchmarks, material prices, and labor rates calibrated from real projects.",
                },
                {
                  icon: Shield,
                  title: "Risk Analysis",
                  description: "Identify constraints, permitting challenges, and regulatory hurdles before they become problems.",
                },
                {
                  icon: FileText,
                  title: "Verified Documentation",
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
                  "SiteIntel engine queries 20+ verified data sources",
                  "AI analyzes and cross-validates all datasets",
                  "Intelligence engine generates comprehensive feasibility report",
                  "Receive verified report with complete transparency",
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

          {/* CTA */}
          <div className="text-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-[#FF7A00] to-[#FF9240] hover:shadow-[0_6px_30px_rgba(255,122,0,0.6)] text-white font-semibold rounded-full px-12 py-8 text-lg"
            >
              <Link to="/application?step=2">Run a Feasibility QuickCheck →</Link>
            </Button>
            <p className="mt-4 text-white/60 text-sm">
              10-minute turnaround · Verified from 20+ data sources
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feasibility;
