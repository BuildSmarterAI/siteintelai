import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Building2, TrendingUp, Shield } from "lucide-react";

const Developers = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C]">
      <div className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-6">
            BuildSmarter™ for <span className="text-[#FF7A00]">Developers & Investors</span>
          </h1>
          <p className="text-xl text-white/80 mb-16 leading-relaxed">
            Make faster, smarter acquisition decisions with verified feasibility intelligence—before you commit capital.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: Building2,
                title: "Site Evaluation",
                description: "Instant feasibility analysis for acquisition pipeline review",
              },
              {
                icon: TrendingUp,
                title: "Cost Intelligence",
                description: "Real-time construction costs and budget validation",
              },
              {
                icon: Shield,
                title: "Risk Mitigation",
                description: "Identify deal-breaking constraints before due diligence",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
              >
                <item.icon className="h-10 w-10 text-[#06B6D4] mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/70">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-[#FF7A00] to-[#FF9240] hover:shadow-[0_6px_30px_rgba(255,122,0,0.6)] text-white font-semibold rounded-full px-12 py-8 text-lg"
            >
              <Link to="/application?step=2">Analyze Your Next Site →</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Developers;
