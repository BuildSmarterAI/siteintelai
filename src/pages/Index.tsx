import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Hero } from "@/components/sections/Hero";
import { AssociationLogos } from "@/components/sections/AssociationLogos";
import { PlatformOverview } from "@/components/sections/PlatformOverview";
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
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        navigate("/dashboard", { replace: true });
      } else {
        setCheckingAuth(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && event === 'SIGNED_IN') {
        navigate("/dashboard", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Hero />
      <AssociationLogos />
      <PlatformOverview />
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
