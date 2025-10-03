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
    <section className="relative min-h-screen flex items-center overflow-hidden py-20 lg:py-16 gradient-mesh">
      {/* Modern background with enhanced visual depth */}
      <div className="absolute inset-0">
        <img 
          src={aerialPropertySite} 
          alt="Aerial view of commercial real estate development site showing zoning and utility risks" 
          className="w-full h-full object-cover opacity-30 saturate-50 scale-105"
        />
        {/* Modern gradient overlay with depth */}
        <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/20 via-transparent to-charcoal/10" />
      </div>
      
      {/* Desktop Professional Markers (Hidden on Mobile) */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        {/* Modern risk indicator - Zoning */}
        <div 
          className="absolute top-[25%] right-[20%] pointer-events-auto group cursor-pointer"
          onMouseEnter={() => showTooltip("Rezoning Required", "Rezoning required. Adds 9–12 month delay.")}
          onMouseLeave={hideTooltip}
        >
          <div className="relative">
            <div className="w-6 h-6 bg-gradient-to-br from-maxx-red to-red-600 rounded-full shadow-lg ring-4 ring-maxx-red/30 border-2 border-white/90 hover:scale-110 transition-all duration-300" style={{ boxShadow: 'var(--shadow-glow)' }}>
              <div className="absolute inset-1 bg-white/20 rounded-full animate-pulse" />
            </div>
            <div className="absolute -bottom-8 -left-12 glass-subtle text-white px-3 py-1.5 rounded-xl text-xs font-medium shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-1">
              Rezoning Delay
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white/20 rotate-45 backdrop-blur-sm"></div>
            </div>
          </div>
        </div>
        
        {/* Modern risk indicator - Utilities */}
        <div 
          className="absolute top-[45%] right-[15%] pointer-events-auto group cursor-pointer"
          onMouseEnter={() => showTooltip("Sewer Capacity Risk", "Insufficient capacity. Upgrade could cost $250K+.")}
          onMouseLeave={hideTooltip}
        >
          <div className="relative">
            <div className="w-6 h-6 bg-gradient-to-br from-navy to-blue-700 rounded-full shadow-lg ring-4 ring-navy/30 border-2 border-white/90 hover:scale-110 transition-all duration-300" style={{ boxShadow: 'var(--shadow-medium)' }}>
              <div className="absolute inset-1 bg-white/20 rounded-full animate-pulse" />
            </div>
            <div className="absolute -bottom-8 -left-10 glass-subtle text-white px-3 py-1.5 rounded-xl text-xs font-medium shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-1">
              Utility Risk
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white/20 rotate-45 backdrop-blur-sm"></div>
            </div>
          </div>
        </div>
        
        {/* Modern zone restriction indicator */}
        <div 
          className="absolute bottom-[35%] right-[25%] pointer-events-auto group cursor-pointer"
          onMouseEnter={() => showTooltip("Development Restriction", "Restricted development zone. Reduces buildable area.")}
          onMouseLeave={hideTooltip}
        >
          <div className="relative">
            <div className="w-20 h-14 border-2 border-maxx-red/60 border-dashed bg-gradient-to-br from-maxx-red/10 to-maxx-red/5 rounded-lg backdrop-blur-sm shadow-lg opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105 hover-lift"></div>
            <div className="absolute -top-8 -left-8 glass-subtle text-white px-3 py-1.5 rounded-xl text-xs font-medium shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300">
              Restricted Zone
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white/20 rotate-45 backdrop-blur-sm"></div>
            </div>
          </div>
        </div>
        
        {/* Modern budget alert indicator */}
        <div 
          className="absolute top-[35%] right-[35%] pointer-events-auto group cursor-pointer"
          onMouseEnter={() => showTooltip("Cost Benchmark Alert", "Outdated $/SF data. Budget 15–20% over plan.")}
          onMouseLeave={hideTooltip}
        >
          <div className="relative">
            <div className="w-6 h-6 bg-gradient-to-br from-charcoal to-gray-800 rounded-full shadow-lg ring-4 ring-charcoal/30 border-2 border-white/90 hover:scale-110 transition-all duration-300" style={{ boxShadow: 'var(--shadow-medium)' }}>
              <div className="absolute inset-1 bg-white/20 rounded-full animate-pulse" />
            </div>
            <div className="absolute -bottom-8 -left-12 glass-subtle text-white px-3 py-1.5 rounded-xl text-xs font-medium shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-1">
              Budget Alert
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white/20 rotate-45 backdrop-blur-sm"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern mobile risk indicators */}
      <div className="absolute inset-0 pointer-events-none lg:hidden">
        {/* Primary Risk - Rezoning */}
        <div className="absolute top-[20%] right-[8%] glass-card text-white px-4 py-3 rounded-xl text-sm font-medium shadow-xl max-w-[160px] scale-in">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-maxx-red rounded-full animate-pulse flex-shrink-0" style={{ boxShadow: 'var(--shadow-glow)' }}></div>
            <span>Rezoning: +9–12 Month Delay</span>
          </div>
        </div>
        
        {/* Secondary Risk - Budget Alert */}
        <div className="absolute bottom-[35%] right-[10%] glass-card text-white px-4 py-3 rounded-xl text-sm font-medium shadow-xl max-w-[140px] scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse flex-shrink-0"></div>
            <span>Budget Alert: 15–20% Over Plan</span>
          </div>
        </div>
      </div>

      {/* Modern desktop tooltip */}
      {tooltip.visible && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none hidden lg:block">
          <div className="glass-card p-5 max-w-xs scale-in" style={{ boxShadow: 'var(--shadow-strong)' }}>
            <h4 className="font-headline font-bold text-white text-sm uppercase mb-3 tracking-wide">{tooltip.title}</h4>
            <p className="font-body text-white/90 text-sm leading-relaxed">{tooltip.content}</p>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-2xl lg:max-w-4xl">
          {/* Modern logo presentation */}
          <div className="mb-8 lg:mb-12 fade-in-up">
            <img 
              src={buildsmarterLogo} 
              alt="BuildSmarter Feasibility" 
              className="h-20 sm:h-24 md:h-28 lg:h-32 xl:h-36 object-contain hover-lift"
            />
          </div>
          
          {/* Modern content container with glassmorphism */}
          <div className="glass-card p-8 sm:p-10 lg:p-12 rounded-2xl fade-in-up" style={{ animationDelay: '0.2s' }}>
            
            {/* Modern headline with refined typography */}
            <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white mb-6 lg:mb-8 leading-tight tracking-tight">
              <span className="block text-white">
                BuildSmarter™
              </span>
              <span className="block text-white/95 font-light text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-2">
                Feasibility Intelligence
              </span>
              <span className="block bg-gradient-to-r from-maxx-red to-red-500 bg-clip-text text-transparent font-bold">
                Before You Buy—Before You Build.
              </span>
            </h1>
            
            {/* Modern subheadline */}
            <h2 className="font-body text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl mb-8 lg:mb-10 fade-in-up" style={{ animationDelay: '0.4s' }}>
              Advanced CRE property analysis powered by AI. Identify zoning, utility, and cost risks early to protect your investment and optimize returns.
            </h2>
            
            {/* Modern CTA section */}
            <div className="fade-in-up" style={{ animationDelay: '0.6s' }}>
              <div className="mb-6">
                <Button 
                  variant="maxx-red" 
                  size="lg" 
                  className="font-cta text-lg px-10 py-4 h-auto w-full sm:w-auto rounded-xl hover-lift group"
                  onClick={() => window.location.href = '/application?step=2'}
                  style={{ boxShadow: 'var(--shadow-glow)' }}
                >
                  <span className="group-hover:scale-105 transition-transform duration-200">
                    Start My Feasibility Review
                  </span>
                </Button>
              </div>
              
              <p className="font-body text-white/80 text-sm">
                Advanced analysis • 60 seconds • No commitment required
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
};