import { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useSearchParams } from "react-router-dom";
import { motion, useScroll } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronDown, Menu } from "lucide-react";

import { AuthButton } from "@/components/AuthButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { scrollY } = useScroll();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Check if we're on the application page
  const isApplicationPage = location.pathname === '/application';
  const currentStep = parseInt(searchParams.get('step') || '1', 10);
  const totalSteps = 5;

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setIsScrolled(latest > 20);
      
      // Hide on scroll down, show on scroll up
      if (latest > lastScrollY && latest > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(latest);
    });

    return () => unsubscribe();
  }, [scrollY, lastScrollY]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative text-sm font-medium transition-colors hover:text-[#06B6D4] ${
      isActive
        ? "text-[#06B6D4] after:absolute after:bottom-[-8px] after:left-0 after:w-full after:h-[2px] after:bg-[#06B6D4]"
        : "text-white/90"
    }`;

  const industries = [
    { label: "Developers & Investors", href: "/industries/developers" },
    { label: "Lenders & Underwriters", href: "/industries/lenders" },
    { label: "Design-Build & Architecture", href: "/industries/design-build" },
    { label: "Municipalities & Planners", href: "/industries/municipalities" },
  ];

  const resources = [
    { label: "Blog", href: "/resources/blog" },
    { label: "Case Studies", href: "/resources/case-studies" },
    { label: "Documentation", href: "/resources/documentation" },
    { label: "API Access", href: "/resources/api" },
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "h-[72px] backdrop-blur-md bg-[#0A0F2C]/80 border-b border-white/10"
          : "h-[96px] backdrop-blur-md bg-[#0A0F2C]/80 border-b border-white/10"
      }`}
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : -100 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-6 h-full flex items-center justify-between gap-4">
        
        {/* Logo as Home Link */}
        <Link to="/" className="flex items-center transition-transform hover:scale-105 duration-200">
          <img 
            src="/src/assets/siteintel-logo.png" 
            alt="SiteIntel" 
            className="h-8 md:h-10 w-auto"
          />
        </Link>

        {/* Application Progress Indicator */}
        {isApplicationPage && (
          <>
            {/* Desktop Progress */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2">
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      step < currentStep
                        ? 'bg-[#06B6D4]'
                        : step === currentStep
                        ? 'bg-[#06B6D4] w-6'
                        : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-white/90">
                Step {currentStep}/{totalSteps}
              </span>
            </div>
            
            {/* Mobile Progress */}
            <div className="flex md:hidden items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
              <span className="text-xs font-medium text-white/90">
                Step {currentStep}/{totalSteps}
              </span>
            </div>
          </>
        )}

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8" style={{ minHeight: '20px', fontSizeAdjust: '0.5' }}>
              <NavLink to="/feasibility" className={navLinkClass}>
                Feasibility
              </NavLink>
              
              <NavLink to="/cost-intelligence" className={navLinkClass}>
                Cost Intelligence
              </NavLink>

          <NavLink to="/how-it-works" className={navLinkClass}>
            How It Works
          </NavLink>

          {/* Industries Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-white/90 hover:text-[#06B6D4] transition-colors">
              Industries
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0A0F2C] backdrop-blur-md border-white/10 z-[100]">
              {industries.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    to={item.href}
                    className="text-white/90 hover:text-[#06B6D4] hover:bg-white/5 cursor-pointer"
                  >
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Resources Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-white/90 hover:text-[#06B6D4] transition-colors">
              Resources
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0A0F2C] backdrop-blur-md border-white/10 z-[100]">
              {resources.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    to={item.href}
                    className="text-white/90 hover:text-[#06B6D4] hover:bg-white/5 cursor-pointer"
                  >
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
        </nav>

        {/* CTA + Account */}
        <div className="hidden md:flex items-center gap-4">
          {!isApplicationPage && (
            <Button
              asChild
              variant="maxx-red"
              className="rounded-full px-6 relative overflow-hidden group"
            >
              <Link to="/application?step=2">
                <span className="relative z-10">Run Free QuickCheck →</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{
                    x: '100%',
                    transition: { duration: 0.5, ease: 'easeInOut' }
                  }}
                />
              </Link>
            </Button>
          )}

          <AuthButton />
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#0A0F2C] border-white/10 w-[300px]">
            <nav className="flex flex-col gap-6 mt-8">
              <Link to="/" className="text-white hover:text-[#06B6D4] font-medium">
                Home
              </Link>
              <Link to="/feasibility" className="text-white hover:text-[#06B6D4] font-medium">
                Feasibility
              </Link>
              <Link to="/cost-intelligence" className="text-white hover:text-[#06B6D4] font-medium">
                Cost Intelligence
              </Link>
              <Link to="/how-it-works" className="text-white hover:text-[#06B6D4] font-medium">
                How It Works
              </Link>
              
              <div className="space-y-2">
                <p className="text-[#06B6D4] font-semibold text-sm">Industries</p>
                {industries.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="block pl-4 text-white/80 hover:text-[#06B6D4] text-sm"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-[#06B6D4] font-semibold text-sm">Resources</p>
                {resources.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="block pl-4 text-white/80 hover:text-[#06B6D4] text-sm"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <Link to="/about" className="text-white hover:text-[#06B6D4] font-medium">
                About
              </Link>

              <Button
                asChild
                className="bg-gradient-to-r from-[#FF7A00] to-[#FF9240] text-white font-semibold rounded-full mt-4"
              >
                <Link to="/application?step=2">Run a QuickCheck →</Link>
              </Button>

              <div className="pt-4 border-t border-white/10">
                <AuthButton />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </motion.header>
  );
};
