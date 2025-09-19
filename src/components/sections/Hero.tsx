import { Button } from "@/components/ui/button";
import { useState } from "react";
import aerialPropertySite from "@/assets/aerial-property-site.jpg";
import buildsmarterLogo from "@/assets/buildsmarter-logo.png";

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
    <section className="relative min-h-screen bg-light-gray flex items-center overflow-hidden">
      {/* Aerial Property Background with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={aerialPropertySite} 
          alt="Aerial view of commercial real estate development site showing zoning and utility risks" 
          className="w-full h-full object-cover opacity-50 grayscale-[30%]"
        />
        {/* Semi-transparent overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/70 via-charcoal/50 to-charcoal/30" />
      </div>
      
      {/* Desktop Interactive Annotations (Hidden on Mobile) */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        {/* Zoning Overlay - Rezoning Required */}
        <div 
          className="absolute top-[25%] right-[20%] pointer-events-auto group cursor-pointer"
          onMouseEnter={() => showTooltip("Rezoning Required", "Rezoning required. Adds 9–12 month delay.")}
          onMouseLeave={hideTooltip}
        >
          <div className="w-4 h-4 bg-maxx-red rounded-full animate-pulse shadow-lg ring-4 ring-maxx-red/30"></div>
          <div className="absolute -top-2 -left-2 w-8 h-8 border-2 border-maxx-red rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-200"></div>
        </div>
        
        {/* Utilities - Sewer Capacity Risk */}
        <div 
          className="absolute top-[45%] right-[15%] pointer-events-auto group cursor-pointer"
          onMouseEnter={() => showTooltip("Sewer Capacity Risk", "Insufficient capacity. Upgrade could cost $250K+.")}
          onMouseLeave={hideTooltip}
        >
          <div className="w-4 h-4 bg-navy rounded-full animate-pulse shadow-lg ring-4 ring-navy/30"></div>
          <div className="absolute -top-2 -left-2 w-8 h-8 border-2 border-navy rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-200"></div>
        </div>
        
        {/* Easement - Restricted Development Zone */}
        <div 
          className="absolute bottom-[35%] right-[25%] pointer-events-auto group cursor-pointer"
          onMouseEnter={() => showTooltip("Development Restriction", "Restricted development zone. Reduces buildable area.")}
          onMouseLeave={hideTooltip}
        >
          <div className="w-16 h-12 border-2 border-maxx-red border-dashed bg-maxx-red/10 rounded opacity-70 group-hover:opacity-100 transition-opacity duration-200"></div>
        </div>
        
        {/* Cost Benchmark Alert */}
        <div 
          className="absolute top-[35%] right-[35%] pointer-events-auto group cursor-pointer"
          onMouseEnter={() => showTooltip("Cost Benchmark Alert", "Outdated $/SF data. Budget 15–20% over plan.")}
          onMouseLeave={hideTooltip}
        >
          <div className="w-4 h-4 bg-charcoal rounded-full animate-pulse shadow-lg ring-4 ring-charcoal/30"></div>
          <div className="absolute -top-2 -left-2 w-8 h-8 border-2 border-charcoal rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-200"></div>
        </div>
      </div>

      {/* Mobile Static Annotations (Visible on Mobile Only) */}
      <div className="absolute inset-0 pointer-events-none lg:hidden">
        {/* Rezoning Risk */}
        <div className="absolute top-[20%] right-[8%] bg-maxx-red/95 text-white px-2 py-1.5 rounded-md text-xs font-bold shadow-lg backdrop-blur-sm border border-maxx-red max-w-[140px]">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse flex-shrink-0"></div>
            <span>Rezoning: +9–12 Month Delay</span>
          </div>
        </div>
        
        {/* Utility Risk */}
        <div className="absolute top-[40%] right-[5%] bg-navy/95 text-white px-2 py-1.5 rounded-md text-xs font-bold shadow-lg backdrop-blur-sm border border-navy max-w-[130px]">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse flex-shrink-0"></div>
            <span>Utility Risk: $250K+ Upgrade</span>
          </div>
        </div>
        
        {/* Budget Alert */}
        <div className="absolute bottom-[35%] right-[10%] bg-charcoal/95 text-white px-2 py-1.5 rounded-md text-xs font-bold shadow-lg backdrop-blur-sm border border-charcoal max-w-[120px]">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse flex-shrink-0"></div>
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
        <div className="max-w-2xl lg:max-w-3xl">
          {/* Logo */}
          <img 
            src={buildsmarterLogo} 
            alt="BuildSmarter Feasibility" 
            className="h-16 sm:h-20 md:h-24 lg:h-32 xl:h-40 mb-4 sm:mb-6 lg:mb-8 object-contain animate-fade-in"
          />
          
          {/* Main Headline - Mobile First */}
          <h1 className="font-headline font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl text-white mb-4 sm:mb-6 leading-[1.1] tracking-tight uppercase animate-fade-in">
            <span className="block text-white drop-shadow-2xl">
              BuildSmarter™ Feasibility
            </span>
            <span className="block text-white drop-shadow-2xl mb-1 sm:mb-2">
              Evaluate Your CRE Property
            </span>
            <span className="block text-[#D00E07] font-black drop-shadow-2xl">
              Before You Buy—or Before You Build.
            </span>
          </h1>
          
          {/* Subheadline */}
          <div className="bg-charcoal/60 backdrop-blur-sm rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 animate-fade-in border border-white/10">
            <h2 className="font-body text-sm sm:text-base md:text-lg lg:text-xl text-white leading-relaxed max-w-xl lg:max-w-2xl">
              Evaluate your CRE property—before acquisition or before breaking ground. Identify zoning, utility, and cost risks early to protect IRR and financing.
            </h2>
          </div>
          
          {/* CTA Section */}
          <div className="bg-charcoal/40 backdrop-blur-sm rounded-lg p-4 sm:p-6 animate-fade-in border border-white/10">
            {/* CTA Button */}
            <div className="mb-3 sm:mb-4">
              <Button 
                variant="maxx-red" 
                size="lg" 
                className="font-cta font-medium text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto w-full sm:w-auto hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-maxx-red/25"
              >
                Start My Feasibility Review
              </Button>
            </div>
            
            {/* CTA Subtext */}
            <p className="font-body text-xs sm:text-sm text-white/90">
              Takes 60 seconds. No obligation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};