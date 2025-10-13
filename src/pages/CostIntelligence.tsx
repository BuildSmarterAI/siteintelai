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

const CostIntelligence = () => {
  return (
    <>
      <Helmet>
        <title>Cost Intelligence | SiteIntel™ Construction Cost Analytics</title>
        <meta name="description" content="Real-time construction cost intelligence for developers, lenders, and design teams. Market-aligned design and construction cost visibility." />
        <meta property="og:title" content="Cost Intelligence - SiteIntel™" />
        <meta property="og:description" content="Track construction costs in real-time with AI-powered market intelligence." />
      </Helmet>

      <main id="main-content">
        <CostHeroSection />
        <IntroChallengeSection />
        <FeaturePillarsSection />
        <CostRangeVisual />
        <BenefitsSection />
        <UseCasesSection />
        <PricingAccessSection />
        <EcosystemSection />
        <TrustSection />
        <FinalCTASection />
      </main>
    </>
  );
};

export default CostIntelligence;
