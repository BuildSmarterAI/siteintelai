import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentButton } from "@/components/PaymentButton";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Check, FileText, Shield, Clock, Database } from "lucide-react";

export const PackagesPricing = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const features = [
    "AI Feasibility Score (0-100)",
    "Detailed Zoning Analysis",
    "FEMA Flood Zone Data",
    "Utility Infrastructure Analysis",
    "EPA Environmental Data",
    "TxDOT Traffic & AADT Data",
    "Market Demographics",
    "AI-Generated Narrative Report",
    "Lender-Ready PDF Export",
    "60-Second Delivery",
  ];

  return (
    <section className="bg-light-gray py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <Badge variant="outline" className="mb-4 border-accent text-accent">
            Simple Pricing
          </Badge>
          <h3 className="font-headline text-4xl md:text-5xl lg:text-6xl text-charcoal mb-6 lg:mb-8">
            Complete Feasibility Intelligence
          </h3>
          <h4 className="font-body text-lg md:text-xl lg:text-2xl text-charcoal/85 max-w-3xl mx-auto leading-relaxed">
            One comprehensive report with everything you need for confident site decisions.
          </h4>
        </div>
        
        {/* Single Pricing Card - Centered */}
        <div className="max-w-lg mx-auto mb-12 md:mb-16">
          <div className="relative group">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
              <Badge className="bg-navy text-navy-foreground px-4 py-1 text-sm font-medium">
                Complete Package
              </Badge>
            </div>
            
            <div className="bg-white border rounded-xl ring-2 ring-navy shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <div className="p-8 md:p-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-navy/10 w-fit">
                    <FileText className="h-8 w-8 text-navy" />
                  </div>
                  <h5 className="font-body font-semibold text-xl md:text-2xl text-navy mb-2">
                    Site Feasibility Intelligence™
                  </h5>
                  <p className="text-charcoal/70 mb-4">
                    Complete professional feasibility analysis
                  </p>
                  <div className="text-4xl md:text-5xl font-bold text-maxx-red mb-1">
                    $1,495
                  </div>
                  <div className="text-sm text-charcoal/60">
                    per report
                  </div>
                </div>
                
                {/* Features */}
                <div className="space-y-3 mb-8">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="font-body text-charcoal">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* CTA Button */}
                <div className="mt-8">
                  {isAuthenticated ? (
                    <PaymentButton type="report" className="w-full text-lg py-6">
                      Get Your Report - $1,495
                    </PaymentButton>
                  ) : (
                    <Button 
                      variant="default"
                      className="w-full text-lg py-6 bg-maxx-red hover:bg-maxx-red/90"
                      onClick={() => navigate('/auth')}
                    >
                      Get Your Report - $999
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-12 text-charcoal/60">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium">FEMA • EPA • TxDOT Data</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium">60-Second Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium">Lender-Ready Format</span>
          </div>
        </div>
        
        {/* Risk Reversal */}
        <div className="text-center">
          <div className="bg-white border border-maxx-red/20 rounded-lg p-4 md:p-6 max-w-3xl mx-auto">
            <p className="font-body text-base md:text-lg text-charcoal leading-relaxed">
              <strong className="text-maxx-red">100% Satisfaction Guarantee:</strong> If our system cannot generate a report due to data limitations, you won't be charged. Contact us within 7 days for any issues.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
