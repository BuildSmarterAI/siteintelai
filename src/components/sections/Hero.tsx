import { Button } from "@/components/ui/button";
import { useState } from "react";
import aerialPropertySite from "@/assets/aerial-property-site.jpg";
import buildsmarterLogo from "@/assets/buildsmarter-logo-new.png";

interface TooltipState {
  visible: boolean;
  content: string;
  title: string;
}

export const Hero = () => {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, content: "", title: "" });

  const showTooltip = (title: string, content: string) => {
    setTooltip({ visible: true, title, content });
  };

  const hideTooltip = () => {
    setTooltip({ visible: false, content: "", title: "" });
  };

  return (
    <section className="relative min-h-screen bg-charcoal flex items-center overflow-hidden py-[120px] lg:py-[100px] md:py-[80px] sm:py-[60px]">
      {/* Aerial Property Background with Enhanced Overlay */}
      <div className="absolute inset-0">
        <img 
          src={aerialPropertySite} 
          alt="Aerial view of commercial real estate development site showing zoning and utility risks" 
          className="w-full h-full object-cover opacity-40 grayscale-[50%] blur-[0.5px] scale-105"
        />
        {/* Enhanced gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/60 to-charcoal/40" />
      </div>
      
      {/* Desktop Professional Markers (Hidden on Mobile) */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        {/* Zoning Overlay - Professional Annotation Style */}
        <div 
          className="absolute top-[25%] right-[20%] pointer-events-auto group cursor-pointer"
          onMouseEnter={() => showTooltip("Rezoning Required", "Rezoning required. Adds 9–12 month delay.")}
          onMouseLeave={hideTooltip}
        >
          <div className="relative">
            <div className="w-6 h-6 bg-maxx-red rounded-full animate-pulse shadow-lg ring-4 ring-maxx-red/20 border-2 border-white"></div>
            <div className="absolute -bottom-8 -left-12 bg-maxx-red/95 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xl backdrop-blur-sm border border-maxx-red whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-1">
              Rezoning Delay
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-maxx-red rotate-45"></div>
            </div>
          </div>
        </div>
        
        {/* Utilities - Professional Annotation Style */}
        <div 
          className="absolute top-[45%] right-[15%] pointer-events-auto group cursor-pointer"
          onMouseEnter={() => showTooltip("Sewer Capacity Risk", "Insufficient capacity. Upgrade could cost $250K+.")}
          onMouseLeave={hideTooltip}
        >
          <div className="relative">
            <div className="w-6 h-6 bg-navy rounded-full animate-pulse shadow-lg ring-4 ring-navy/20 border-2 border-white"></div>
            <div className="absolute -bottom-8 -left-10 bg-navy/95 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xl backdrop-blur-sm border border-navy whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-1">
              Utility Risk
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-navy rotate-45"></div>
            </div>
          </div>
        </div>
        
        {/* Easement - Professional Zone Marker */}
        <div 
          className="absolute bottom-[35%] right-[25%] pointer-events-auto group cursor-pointer"
          onMouseEnter={() => showTooltip("Development Restriction", "Restricted development zone. Reduces buildable area.")}
          onMouseLeave={hideTooltip}
        >
          <div className="relative">
            <div className="w-20 h-14 border-3 border-maxx-red border-dashed bg-maxx-red/5 rounded-md backdrop-blur-sm shadow-lg opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"></div>
            <div className="absolute -top-8 -left-8 bg-maxx-red/95 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xl backdrop-blur-sm border border-maxx-red whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300">
              Restricted Zone
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-maxx-red rotate-45"></div>
            </div>
          </div>
        </div>
        
        {/* Cost Benchmark Alert - Professional Marker */}
        <div 
          className="absolute top-[35%] right-[35%] pointer-events-auto group cursor-pointer"
          onMouseEnter={() => showTooltip("Cost Benchmark Alert", "Outdated $/SF data. Budget 15–20% over plan.")}
          onMouseLeave={hideTooltip}
        >
          <div className="relative">
            <div className="w-6 h-6 bg-charcoal rounded-full animate-pulse shadow-lg ring-4 ring-charcoal/20 border-2 border-white"></div>
            <div className="absolute -bottom-8 -left-12 bg-charcoal/95 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xl backdrop-blur-sm border border-charcoal whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-1">
              Budget Alert
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-charcoal rotate-45"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Professional Markers (Max 2 for clarity) */}
      <div className="absolute inset-0 pointer-events-none lg:hidden">
        {/* Primary Risk - Rezoning */}
        <div className="absolute top-[20%] right-[8%] bg-maxx-red/95 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-xl backdrop-blur-sm border border-maxx-red max-w-[160px]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse flex-shrink-0"></div>
            <span>Rezoning: +9–12 Month Delay</span>
          </div>
        </div>
        
        {/* Secondary Risk - Budget Alert */}
        <div className="absolute bottom-[35%] right-[10%] bg-charcoal/95 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-xl backdrop-blur-sm border border-charcoal max-w-[140px]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse flex-shrink-0"></div>
            <span>Budget Alert: 15–20% Over Plan</span>
          </div>
        </div>
      </div>

      {/* Desktop Tooltip */}
      {tooltip.visible && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none hidden lg:block">
          <div className="bg-white/95 backdrop-blur-sm border border-charcoal/20 rounded-lg shadow-2xl p-4 max-w-xs animate-fade-in">
            <h4 className="font-headline font-bold text-charcoal text-sm uppercase mb-2">{tooltip.title}</h4>
            <p className="font-body text-charcoal/80 text-sm leading-relaxed">{tooltip.content}</p>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-2xl lg:max-w-4xl">
          {/* Logo */}
          <img 
            src={buildsmarterLogo} 
            alt="BuildSmarter Feasibility" 
            className="h-20 sm:h-24 md:h-28 lg:h-36 xl:h-44 mb-6 sm:mb-8 lg:mb-10 object-contain animate-fade-in"
          />
          
          {/* Text Container with Enhanced Background */}
          <div className="bg-charcoal/70 backdrop-blur-md rounded-xl border border-white/10 p-6 sm:p-8 lg:p-10 shadow-2xl">
            
            {/* Main Headline - Enhanced Typography */}
            <h1 className="font-headline font-black text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] xl:text-[44px] text-white mb-5 lg:mb-[20px] leading-[1.1] tracking-wide uppercase animate-fade-in">
              <span className="block text-white drop-shadow-2xl">
                BuildSmarter™ Feasibility
              </span>
              <span className="block text-white drop-shadow-2xl mb-1 sm:mb-2">
                Evaluate Your CRE Property
              </span>
              <span className="block text-maxx-red font-black drop-shadow-2xl">
                Before You Buy—or Before You Build.
              </span>
            </h1>
            
            {/* Enhanced Subheadline */}
            <h2 className="font-body text-[16px] lg:text-[20px] text-white/95 leading-[1.5] max-w-2xl mb-6 lg:mb-8 animate-fade-in">
              Evaluate your CRE property—before acquisition or before breaking ground. Identify zoning, utility, and cost risks early to protect IRR and financing.
            </h2>
            
            {/* Enhanced CTA Section */}
            <div className="animate-fade-in">
              {/* CTA Button */}
              <div className="mb-4">
                <Button 
                  variant="maxx-red" 
                  size="lg" 
                  className="font-cta font-medium text-[18px] px-8 py-4 h-auto w-full sm:w-auto hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-maxx-red/30"
                  onClick={() => window.location.href = '/application?step=2'}
                >
                  Start My Feasibility Review
                </Button>
              </div>
              
              {/* CTA Subtext */}
              <p className="font-body text-sm text-white/90">
                Takes 60 seconds. No obligation.
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
};