import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logoSmall from "@/assets/buildsmarter-logo-small.png";

export const BetaHeader = () => {
  const scrollToForm = () => {
    document.getElementById("beta-signup-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-6 lg:px-8 max-w-[1400px] h-20 flex items-center justify-between">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={logoSmall} alt="SiteIntel Logo" className="h-8 w-auto" />
          <span className="font-headline text-xl font-bold text-secondary">SiteIntel</span>
        </Link>
        
        {/* Right: Join Beta Button */}
        <Button 
          variant="expandIcon"
          Icon={ArrowRight}
          iconPlacement="right"
          className="font-body text-sm md:text-base font-semibold uppercase tracking-wide"
          onClick={scrollToForm}
        >
          Join Beta
        </Button>
      </div>
    </header>
  );
};
