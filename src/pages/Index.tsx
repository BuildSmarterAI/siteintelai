import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { Solution } from "@/components/sections/Solution";
import { SocialProof } from "@/components/sections/SocialProof";
import { Advantage } from "@/components/sections/Advantage";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Problem />
      <Solution />
      <SocialProof />
      <Advantage />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
