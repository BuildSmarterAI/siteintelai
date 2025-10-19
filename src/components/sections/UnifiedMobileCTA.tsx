import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Zap } from "lucide-react";

export const UnifiedMobileCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed (sessionStorage)
    const dismissed = sessionStorage.getItem('cta-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    const handleScroll = () => {
      // Show after scrolling 300px (user engaged with hero)
      setIsVisible(window.scrollY > 300 && !isDismissed);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('cta-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-maxx-red to-[#D96500] shadow-2xl border-t border-white/10 animate-slide-in-right md:hidden"
      style={{
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="font-cta font-semibold text-white text-sm leading-tight truncate">
            Join Private Beta
          </p>
          <p className="font-body text-xs text-white/80 truncate">
            Limited seats available
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            size="sm"
            className="bg-white text-maxx-red hover:bg-white/90 font-cta font-semibold px-4 h-10 whitespace-nowrap shadow-lg"
            onClick={() => window.location.href = '/beta-signup'}
          >
            <Zap className="h-3.5 w-3.5 mr-1" />
            Join Beta
          </Button>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
