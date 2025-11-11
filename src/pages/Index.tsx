import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Hero } from "@/components/sections/Hero";
import { AssociationLogos } from "@/components/sections/AssociationLogos";
import { PlatformOverview } from "@/components/sections/PlatformOverview";
import GlobeFeatureSection from "@/components/ui/globe-feature-section";
import { Solution } from "@/components/sections/Solution";
import { Comparison } from "@/components/sections/Comparison";
import { IndustriesWeServe } from "@/components/sections/IndustriesWeServe";
import { PackagesPricing } from "@/components/sections/PackagesPricing";
import { Advantage } from "@/components/sections/Advantage";
import { FAQ } from "@/components/sections/FAQ";
import { LeadMagnet } from "@/components/sections/LeadMagnet";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";
import { UnifiedMobileCTA } from "@/components/sections/UnifiedMobileCTA";
import { KeyAdvantages } from "@/components/sections/KeyAdvantages";
import { Button } from "@/components/ui/button";
import { Map } from "lucide-react";


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
      <GlobeFeatureSection />
      <AssociationLogos />
      
      {/* Parcel Explorer CTA */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Explore HCAD Parcels on Map</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Browse parcels interactively, search by address or cross-street, and instantly run feasibility analysis on any property.
          </p>
          <Button size="lg" onClick={() => navigate('/parcel-explorer')}>
            <Map className="h-5 w-5 mr-2" />
            Open Parcel Map
          </Button>
        </div>
      </section>
      
      <PlatformOverview />
      <Solution />
      <KeyAdvantages />
      <Comparison />
      <IndustriesWeServe />
      <PackagesPricing />
      <Advantage />
      <FAQ />
      <LeadMagnet />
      <FinalCTA />
      <Footer />
      <UnifiedMobileCTA />
    </div>
  );
};

export default Index;
