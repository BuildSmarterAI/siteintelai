import { Hero } from "@/components/sections/Hero";
import { AssociationLogos } from "@/components/sections/AssociationLogos";
import { Problem } from "@/components/sections/Problem";
import { ProblemCTA } from "@/components/sections/ProblemCTA";
import { Solution } from "@/components/sections/Solution";
import { Packages } from "@/components/sections/Packages";
import { SocialProof } from "@/components/sections/SocialProof";
import { Advantage } from "@/components/sections/Advantage";
import { FAQ } from "@/components/sections/FAQ";
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
      <Packages />
      <SocialProof />
      <Advantage />
      <FAQ />
      <FinalCTA />
      <Footer />
      <MobileCTA />
    </div>
  );
};

export default Index;
