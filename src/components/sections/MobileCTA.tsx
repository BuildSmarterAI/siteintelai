import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export const MobileCTA = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show CTA after scrolling 400px
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-maxx-red p-4 shadow-lg border-t border-maxx-red/20 md:hidden animate-fade-in">
      <div className="flex items-center justify-between space-x-4">
        <div>
          <p className="font-cta font-semibold text-maxx-red-foreground text-sm">
            10-Minute Feasibility
          </p>
          <p className="font-body text-xs text-maxx-red-foreground/80">
            Free QuickCheck available
          </p>
        </div>
        <Button 
          variant="outline"
          className="bg-maxx-red-foreground text-maxx-red border-maxx-red-foreground hover:bg-maxx-red-foreground/90 font-cta font-semibold px-6 min-h-[2.75rem]"
          onClick={() => window.location.href = '/application?step=2'}
        >
          Run QuickCheck
        </Button>
      </div>
    </div>
  );
};