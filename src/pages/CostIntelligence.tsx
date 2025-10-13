import { Link } from "react-router-dom";
import { Calendar, CheckCircle2 } from "lucide-react";
import { CostHeroSection } from "@/components/sections/cost-intelligence/CostHeroSection";
import { IntroChallengeSection } from "@/components/sections/cost-intelligence/IntroChallengeSection";
import { FeaturePillarsSection } from "@/components/sections/cost-intelligence/FeaturePillarsSection";
import { CostRangeVisual } from "@/components/sections/cost-intelligence/CostRangeVisual";
import { BenefitsSection } from "@/components/sections/cost-intelligence/BenefitsSection";
import { UseCasesSection } from "@/components/sections/cost-intelligence/UseCasesSection";
import { PricingAccessSection } from "@/components/sections/cost-intelligence/PricingAccessSection";
import { EcosystemSection } from "@/components/sections/cost-intelligence/EcosystemSection";
import { TrustSection } from "@/components/sections/cost-intelligence/TrustSection";
import { FinalCTASection } from "@/components/sections/cost-intelligence/FinalCTASection";
import { Helmet } from "react-helmet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const CostIntelligence = () => {
  return (
    <>
      <Helmet>
        <title>Cost Intelligence | SiteIntel™ Products</title>
        <meta name="description" content="Real-time construction cost intelligence for developers, lenders, and design teams. Market-aligned design and construction cost visibility." />
        <meta property="og:title" content="Cost Intelligence | SiteIntel™ Products" />
        <meta property="og:description" content="Track construction costs in real-time with AI-powered market intelligence." />
        <link rel="canonical" href="https://siteintel.com/products/cost-intelligence" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-6 pt-8 bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C]">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/products" className="text-white/60 hover:text-white">Products</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white/40" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">Cost Intelligence</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <CostHeroSection />
        <IntroChallengeSection />
        <FeaturePillarsSection />
        <CostRangeVisual />
        <BenefitsSection />
        <UseCasesSection />
        <PricingAccessSection />
        <EcosystemSection />
        <TrustSection />

        {/* Explore Other Products */}
        <section className="container mx-auto px-6 py-20 bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C] border-t border-white/10">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Explore Other <span className="text-[#06B6D4]">Intelligence Products</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link
              to="/products/feasibility"
              className="bg-gradient-to-br from-[#06B6D4]/20 to-[#0891B2]/20 backdrop-blur-md border border-[#06B6D4]/30 rounded-2xl p-8 hover:border-[#06B6D4] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#06B6D4] transition-colors">
                    Feasibility Intelligence
                  </h3>
                  <p className="text-white/70">Zoning, flood, utilities & compliance analysis</p>
                </div>
              </div>
            </Link>

            <Link
              to="/products/schedule-intelligence"
              className="bg-gradient-to-br from-[#8B5CF6]/20 to-[#A78BFA]/20 backdrop-blur-md border border-[#8B5CF6]/30 rounded-2xl p-8 hover:border-[#8B5CF6] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-white" />
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

        <FinalCTASection />
      </div>
    </>
  );
};

export default CostIntelligence;
