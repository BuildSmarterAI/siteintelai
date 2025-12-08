import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import siteIntelLogo from "@/assets/siteintel-ai-logo-main.png";

export const BetaStickyHeader = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show header after scrolling past 300px
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToForm = () => {
    document.getElementById("request-access")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
        >
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <a href="/beta" className="flex items-center">
              <img 
                src={siteIntelLogo} 
                alt="SiteIntel AI" 
                className="h-8 md:h-10 w-auto"
              />
            </a>

            {/* CTA */}
            <Button
              size="sm"
              onClick={scrollToForm}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 md:px-6"
            >
              Request Access
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
};
