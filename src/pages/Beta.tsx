import { Helmet } from "react-helmet";
import { PrelaunchHero } from "@/components/sections/prelaunch/PrelaunchHero";
import { InlineMetrics } from "@/components/sections/prelaunch/InlineMetrics";
import { TwoColumnSection } from "@/components/sections/prelaunch/TwoColumnSection";
import { FeatureGrid } from "@/components/sections/prelaunch/FeatureGrid";
import { StepsTimeline } from "@/components/sections/prelaunch/StepsTimeline";
import { ReportShowcase } from "@/components/sections/prelaunch/ReportShowcase";
import { PersonaStrip } from "@/components/sections/prelaunch/PersonaStrip";
import { TestimonialsStrip } from "@/components/sections/prelaunch/TestimonialsStrip";
import { WaitlistSection } from "@/components/sections/prelaunch/WaitlistSection";
import { PrelaunchFooter } from "@/components/sections/prelaunch/PrelaunchFooter";

const Beta = () => {
  return (
    <>
      <Helmet>
        <title>SiteIntel™ | Feasibility-as-a-Service™ for Commercial Real Estate</title>
        <meta 
          name="description" 
          content="AI-powered feasibility reports that combine zoning, floodplain, wetlands, utilities, topography, traffic, and costs into a lender-ready package in 24 hours." 
        />
        <link rel="canonical" href="https://siteintel.ai/" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <PrelaunchHero />
        <InlineMetrics />
        <TwoColumnSection />
        <FeatureGrid />
        <StepsTimeline />
        <ReportShowcase />
        <PersonaStrip />
        <TestimonialsStrip />
        <WaitlistSection />
        <PrelaunchFooter />
      </div>
    </>
  );
};

export default Beta;
