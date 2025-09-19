import { Button } from "@/components/ui/button";
import aerialPropertySite from "@/assets/aerial-property-site.jpg";
import buildsmarterLogo from "@/assets/buildsmarter-logo.png";

export const Hero = () => {
  return (
    <section className="relative min-h-screen bg-light-gray flex items-center overflow-hidden">
      {/* Aerial Property Background with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={aerialPropertySite} 
          alt="Aerial view of commercial real estate development site" 
          className="w-full h-full object-cover opacity-40"
        />
        {/* Semi-transparent overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/60 via-charcoal/40 to-transparent" />
      </div>
      
      {/* Static Risk Annotation Labels */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Rezoning Risk - Top Right */}
        <div className="absolute top-[20%] right-[15%] bg-maxx-red/90 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-lg backdrop-blur-sm border border-maxx-red">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-bold">Rezoning: +9–12 Month Delay</span>
          </div>
        </div>
        
        {/* Utility Risk - Center Right */}
        <div className="absolute top-[45%] right-[10%] bg-navy/90 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-lg backdrop-blur-sm border border-navy">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-bold">Utility Risk: $250K+ Upgrade</span>
          </div>
        </div>
        
        {/* Budget Alert - Bottom Right */}
        <div className="absolute bottom-[30%] right-[20%] bg-charcoal/90 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-lg backdrop-blur-sm border border-charcoal">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-bold">Budget Alert: 15–20% Over Plan</span>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl lg:max-w-3xl">
          {/* Logo */}
          <img 
            src={buildsmarterLogo} 
            alt="BuildSmarter Feasibility" 
            className="h-20 sm:h-24 md:h-32 lg:h-40 mb-6 sm:mb-8 object-contain"
          />
          
          {/* Main Headline - Mobile First */}
          <h1 className="font-headline font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white mb-4 sm:mb-6 leading-[1.1] tracking-tight uppercase">
            <span className="block text-white drop-shadow-2xl">
              BuildSmarter™ Feasibility
            </span>
            <span className="block text-white drop-shadow-2xl mb-2">
              Evaluate Your CRE Property
            </span>
            <span className="block text-[#D00E07] font-black drop-shadow-2xl">
              Before You Buy—or Before You Build.
            </span>
          </h1>
          
          {/* Subheadline */}
          <h2 className="font-body text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 mb-6 sm:mb-8 leading-relaxed max-w-xl lg:max-w-2xl drop-shadow-lg">
            Evaluate your CRE property—before acquisition or before breaking ground. Identify zoning, utility, and cost risks early to protect IRR and financing.
          </h2>
          
          {/* CTA Button */}
          <div className="mb-4 sm:mb-6">
            <Button 
              variant="maxx-red" 
              size="lg" 
              className="font-cta font-medium text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto w-full sm:w-auto hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              Start My Feasibility Review
            </Button>
          </div>
          
          {/* CTA Subtext */}
          <p className="font-body text-sm sm:text-base text-white/80 drop-shadow-md">
            Takes 60 seconds. No obligation.
          </p>
        </div>
      </div>
    </section>
  );
};