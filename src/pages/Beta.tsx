import { SEOHead } from "@/components/seo/SEOHead";
import { ProprietaryHero } from "@/components/sections/prelaunch/ProprietaryHero";
import { ProprietaryTrustBar } from "@/components/sections/prelaunch/ProprietaryTrustBar";
import { ProprietarySocialProof } from "@/components/sections/prelaunch/ProprietarySocialProof";
import { ProprietaryProblem } from "@/components/sections/prelaunch/ProprietaryProblem";
import { ProprietaryParadigm } from "@/components/sections/prelaunch/ProprietaryParadigm";
import { ProprietaryTechStack } from "@/components/sections/prelaunch/ProprietaryTechStack";
import { ProprietaryOutcome } from "@/components/sections/prelaunch/ProprietaryOutcome";
import { ProprietaryAccess } from "@/components/sections/prelaunch/ProprietaryAccess";
import { ProprietaryRequestForm } from "@/components/sections/prelaunch/ProprietaryRequestForm";
import { ProprietaryFAQ } from "@/components/sections/prelaunch/ProprietaryFAQ";
import { ProprietaryFinalCTA } from "@/components/sections/prelaunch/ProprietaryFinalCTA";
import { PrelaunchFooter } from "@/components/sections/prelaunch/PrelaunchFooter";
import { BetaStickyHeader } from "@/components/sections/prelaunch/BetaStickyHeader";
import { BetaMobileCTA } from "@/components/sections/prelaunch/BetaMobileCTA";
const Beta = () => {
  return <>
      <SEOHead
        title="Proprietary Feasibility Computation Engine"
        description="The world's first proprietary feasibility computation engine. Built on protected Geospatial Inference Stack™ and Neural Constraint Resolution Engine™. Private access only."
        keywords={["feasibility engine", "AI real estate", "geospatial AI"]}
      />

      <BetaStickyHeader />
      <div className="min-h-screen bg-background">
        <ProprietaryHero />
        <ProprietaryTrustBar />
        
        <ProprietaryProblem />
        <ProprietaryParadigm />
        <ProprietaryTechStack />
        <ProprietaryOutcome />
        <ProprietaryAccess />
        <ProprietaryRequestForm />
        <ProprietaryFAQ />
        <ProprietaryFinalCTA />
        <PrelaunchFooter />
      </div>
      <BetaMobileCTA />
    </>;
};
export default Beta;