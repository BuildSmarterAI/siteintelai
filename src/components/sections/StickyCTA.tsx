import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowUp } from "lucide-react";

export const StickyCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 300px down
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-in-right">
      {/* Expanded Version */}
      {isExpanded && (
        <div className="bg-gradient-to-r from-maxx-red to-navy text-white p-6 shadow-2xl animate-fade-in">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-headline font-bold text-lg mb-2">
                $10K Feasibility in Seconds—Verified by FEMA
              </h4>
              <p className="font-body text-sm text-white/90">
                Run a Free QuickCheck or get a lender-ready Professional Report for $795.
              </p>
            </div>
            <div className="flex items-center gap-4 ml-6">
              <Button 
                variant="secondary"
                size="lg"
                className="px-6 py-3 font-cta bg-white text-charcoal hover:bg-white/90"
                onClick={() => window.location.href = '/application?step=2'}
              >
                Run Free QuickCheck →
              </Button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Version */}
      {!isExpanded && (
        <div className="bg-maxx-red text-white shadow-2xl">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setIsExpanded(true)}
              className="flex-1 text-left group"
            >
              <div className="font-headline font-bold text-base group-hover:text-white/90 transition-colors">
                60-Second Feasibility Reports
              </div>
              <div className="font-body text-sm text-white/80">
                Free QuickCheck available →
              </div>
            </button>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="secondary"
                className="px-4 py-2 font-cta bg-white text-charcoal hover:bg-white/90 text-sm"
                onClick={() => window.location.href = '/application?step=2'}
              >
                Free QuickCheck
              </Button>
              <button
                onClick={scrollToTop}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Back to top"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};