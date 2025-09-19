import { Hero } from "@/components/sections/Hero";
import { AssociationLogos } from "@/components/sections/AssociationLogos";
import { Problem } from "@/components/sections/Problem";
import { ProblemCTA } from "@/components/sections/ProblemCTA";
import { Solution } from "@/components/sections/Solution";
import { Process } from "@/components/sections/Process";
import { Packages } from "@/components/sections/Packages";
import { WhoWeServe } from "@/components/sections/WhoWeServe";
import { SocialProof } from "@/components/sections/SocialProof";
import { Advantage } from "@/components/sections/Advantage";
import { FAQ } from "@/components/sections/FAQ";
import { ValueComparison } from "@/components/sections/ValueComparison";
import { LeadMagnet } from "@/components/sections/LeadMagnet";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";
import { MobileCTA } from "@/components/sections/MobileCTA";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <AssociationLogos />
      <Problem />
      <ProblemCTA />
      <Solution />
      <Process />
      <Packages />
      <WhoWeServe />
      <SocialProof />
      <Advantage />
      <FAQ />
      <ValueComparison />
      <LeadMagnet />
      <FinalCTA />
      <Footer />
      <MobileCTA />
    </div>
  );
};

export default Index;
