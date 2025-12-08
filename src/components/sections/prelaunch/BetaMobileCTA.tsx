import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";

const STORAGE_KEY = "beta-cta-dismissed";

export const BetaMobileCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if previously dismissed
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem(STORAGE_KEY, "true");
  };

  const handleClick = () => {
    const element = document.getElementById("request-access");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="bg-gradient-to-r from-[#FF7A00] to-[#D96500] p-4 shadow-lg shadow-primary/20">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClick}
                className="flex-1 flex items-center justify-center gap-2 bg-background text-foreground font-semibold py-3 px-4 rounded-lg min-h-[48px] active:scale-[0.98] transition-transform"
              >
                <Sparkles className="w-4 h-4" />
                Request Early Access
              </button>
              <button
                onClick={handleDismiss}
                className="p-3 text-white/80 hover:text-white transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center text-white/80 text-xs mt-2">
              Limited Q1 2025 seats
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
