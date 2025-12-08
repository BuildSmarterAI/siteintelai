import { Helmet } from "react-helmet";
import { ProprietaryHero } from "@/components/sections/prelaunch/ProprietaryHero";
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

const Beta = () => {
  return (
    <>
      <Helmet>
        <title>SiteIntel™ | Proprietary Feasibility Intelligence Engine</title>
        <meta 
          name="description" 
          content="The world's first proprietary feasibility computation engine. AI-powered, underwriting-grade precision for commercial real estate. Private access only." 
        />
        <link rel="canonical" href="https://siteintel.ai/beta" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <ProprietaryHero />
        <ProprietarySocialProof />
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
    </>
  );
};

export default Beta;
