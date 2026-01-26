import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Hero } from "@/components/sections/Hero";
import { ProblemAgitation } from "@/components/sections/ProblemAgitation";
import { SolutionOverview } from "@/components/sections/SolutionOverview";
import { BeforeAfterComparison } from "@/components/sections/BeforeAfterComparison";
import { KeyFeatures } from "@/components/sections/KeyFeatures";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { AssociationLogos } from "@/components/sections/AssociationLogos";
import { IndustriesWeServe } from "@/components/sections/IndustriesWeServe";
import { PackagesPricing } from "@/components/sections/PackagesPricing";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";
import { UnifiedMobileCTA } from "@/components/sections/UnifiedMobileCTA";
import { SEOHead } from "@/components/seo/SEOHead";
import { OrganizationJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/JsonLd";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <SEOHead />
      <OrganizationJsonLd />
      <SoftwareApplicationJsonLd />
      <div className="min-h-screen">
        <Hero />
        <AssociationLogos />
        <ProblemAgitation />
        <SolutionOverview />
        <BeforeAfterComparison />
        <KeyFeatures />
        <HowItWorks />
        <IndustriesWeServe />
        <PackagesPricing />
        <FAQ />
        <FinalCTA />
        <Footer />
        <UnifiedMobileCTA />
      </div>
    </>
  );
};

export default Index;
