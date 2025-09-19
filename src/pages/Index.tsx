import { Hero } from "@/components/sections/Hero";
import { AssociationLogos } from "@/components/sections/AssociationLogos";
import { Problem } from "@/components/sections/Problem";
import { Solution } from "@/components/sections/Solution";
import { InteractiveCalculator } from "@/components/sections/InteractiveCalculator";
import { InteractiveProcess } from "@/components/sections/InteractiveProcess";
import { Process } from "@/components/sections/Process";
import { Comparison } from "@/components/sections/Comparison";
import { WhoWeServe } from "@/components/sections/WhoWeServe";
import { PackagesPricing } from "@/components/sections/PackagesPricing";
import { Advantage } from "@/components/sections/Advantage";
import { ValueComparison } from "@/components/sections/ValueComparison";
import { FAQ } from "@/components/sections/FAQ";
import { LeadMagnet } from "@/components/sections/LeadMagnet";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";
import { MobileCTA } from "@/components/sections/MobileCTA";
import { StickyCTA } from "@/components/sections/StickyCTA";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <AssociationLogos />
      <Problem />
      <Solution />
      <InteractiveCalculator />
      <InteractiveProcess />
      <Process />
      <Comparison />
      <WhoWeServe />
      <PackagesPricing />
      <Advantage />
      <ValueComparison />
      <FAQ />
      <LeadMagnet />
      <FinalCTA />
      <Footer />
      <MobileCTA />
      <StickyCTA />
    </div>
  );
};

export default Index;
