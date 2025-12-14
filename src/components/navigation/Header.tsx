import { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useSearchParams } from "react-router-dom";
import { motion, useScroll } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronDown, Menu } from "lucide-react";
import siteintelLogo from "@/assets/siteintel-ai-logo-main.png";
import { AuthButton } from "@/components/AuthButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

  const products = [
    { name: "Feasibility-as-a-Service™", href: "/feasibility-as-a-service", description: "Full-stack feasibility platform", highlight: true },
    { name: "Feasibility Intelligence", href: "/products/feasibility", description: "Zoning, flood, utilities" },
    { name: "Survey Upload", href: "/survey-upload", description: "Extract buildable envelope" },
    { name: "Cost Intelligence", href: "/products/cost-intelligence", description: "Real-time construction costs" },
    { name: "Schedule Intelligence", href: "/products/schedule-intelligence", description: "Timeline risk & permits", comingSoon: true },
  ];

  const industries = [
    { label: "Texas Developers", href: "/industries/texas-developers", highlight: true },
    { label: "Developers & Investors", href: "/industries/developers" },
    { label: "Lenders & Underwriters", href: "/industries/lenders" },
    { label: "Design-Build & Architecture", href: "/industries/design-build" },
    { label: "Municipalities & Planners", href: "/industries/municipalities" },
  ];

  const resources = [
    { label: "Blog", href: "/resources/blog" },
    { label: "Case Studies", href: "/resources/case-studies" },
    { label: "Developer Docs", href: "/docs", highlight: true, badge: "NEW" },
    { label: "API Access", href: "/resources/api" },
    { label: "Book a Demo", href: "/demo", highlight: true },
  ];

  const adminLinks = [
    { label: "System Health", href: "/admin/system-health" },
    { label: "Data Sources", href: "/admin/data-sources" },
    { label: "Tile Management", href: "/admin/tiles", highlight: true },
    { label: "GIS Admin", href: "/admin/geospatial" },
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
            src={siteintelLogo} 
            alt="SiteIntel AI" 
            className="h-12 md:h-16 w-auto drop-shadow-[0_0_8px_rgba(255,122,0,0.5)]"
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
          {/* Products Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-white/90 hover:text-[#06B6D4] transition-colors">
              Products
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0A0F2C] backdrop-blur-md border-white/10 z-[100]">
              <DropdownMenuItem asChild>
                <Link to="/products" className="text-white/90 hover:text-[#06B6D4] font-semibold cursor-pointer">
                  All Products
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              {products.map((product) => (
                <DropdownMenuItem key={product.href} asChild>
                  <Link to={product.href} className="cursor-pointer">
                    <div className="flex flex-col py-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${product.highlight ? 'text-[#06B6D4]' : 'text-white'}`}>{product.name}</span>
                        {product.comingSoon && (
                          <span className="text-[10px] bg-[#8B5CF6] text-white px-2 py-0.5 rounded-full font-semibold">Soon</span>
                        )}
                        {product.highlight && (
                          <span className="text-[10px] bg-[#06B6D4] text-white px-2 py-0.5 rounded-full font-semibold">NEW</span>
                        )}
                      </div>
                      <span className="text-xs text-white/60">{product.description}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <NavLink to="/how-it-works" className={navLinkClass}>
            How It Works
          </NavLink>

          <NavLink to="/pricing" className={navLinkClass}>
            Pricing
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
                    className={`cursor-pointer ${
                      item.highlight 
                        ? "text-[#FF7A00] hover:text-[#FF9240] font-semibold hover:bg-[#FF7A00]/10" 
                        : "text-white/90 hover:text-[#06B6D4] hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                    {item.highlight && (
                      <span className="ml-2 text-[10px] bg-[#FF7A00] text-white px-2 py-0.5 rounded-full font-semibold">NEW</span>
                    )}
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
                    className={`cursor-pointer ${
                      item.highlight 
                        ? "text-[#FF7A00] hover:text-[#FF9240] font-semibold hover:bg-[#FF7A00]/10" 
                        : "text-white/90 hover:text-[#06B6D4] hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                    {item.highlight && (
                      <span className="ml-2 text-[10px] bg-[#FF7A00] text-white px-2 py-0.5 rounded-full font-semibold">NEW</span>
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Admin Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-white/90 hover:text-[#06B6D4] transition-colors">
              Admin
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0A0F2C] backdrop-blur-md border-white/10 z-[100]">
              {adminLinks.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    to={item.href}
                    className={`cursor-pointer ${
                      item.highlight 
                        ? "text-[#FF7A00] hover:text-[#FF9240] font-semibold hover:bg-[#FF7A00]/10" 
                        : "text-white/90 hover:text-[#06B6D4] hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                    {item.highlight && (
                      <span className="ml-2 text-[10px] bg-[#FF7A00] text-white px-2 py-0.5 rounded-full font-semibold">NEW</span>
                    )}
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
        <div className="flex md:hidden items-center gap-2">
          <AuthButton compact />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#0A0F2C] border-white/10 w-[300px]">
            <nav className="flex flex-col gap-6 mt-8">
              {/* Auth Section at Top */}
              <div className="pb-4 border-b border-white/10">
                <AuthButton />
                <Link 
                  to="/auth" 
                  className="block mt-3 text-sm text-white/70 hover:text-[#06B6D4] transition-colors"
                >
                  Create Account →
                </Link>
              </div>

              <Link to="/" className="text-white hover:text-[#06B6D4] font-medium">
                Home
              </Link>
              
              {/* Products */}
              <div className="space-y-2">
                <p className="text-[#06B6D4] font-semibold text-sm">PRODUCTS</p>
                <Link to="/products" className="block pl-4 text-white/90 hover:text-[#06B6D4] text-sm font-medium">
                  All Products
                </Link>
                {products.map((product) => (
                  <Link key={product.href} to={product.href} className={`block pl-4 text-sm flex items-center gap-2 ${product.highlight ? 'text-[#06B6D4]' : 'text-white/80 hover:text-[#06B6D4]'}`}>
                    {product.name}
                    {product.comingSoon && (
                      <span className="text-[10px] bg-[#8B5CF6] text-white px-2 py-0.5 rounded-full font-semibold">Soon</span>
                    )}
                    {product.highlight && (
                      <span className="text-[10px] bg-[#06B6D4] text-white px-2 py-0.5 rounded-full font-semibold">NEW</span>
                    )}
                  </Link>
                ))}
              </div>

              <Link to="/how-it-works" className="text-white hover:text-[#06B6D4] font-medium">
                How It Works
              </Link>
              
              <Link to="/pricing" className="text-white hover:text-[#06B6D4] font-medium">
                Pricing
              </Link>
              
              <div className="space-y-2">
                <p className="text-[#06B6D4] font-semibold text-sm">Industries</p>
                {industries.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`block pl-4 text-sm ${
                      item.highlight 
                        ? "text-[#FF7A00] hover:text-[#FF9240] font-semibold flex items-center gap-2" 
                        : "text-white/80 hover:text-[#06B6D4]"
                    }`}
                  >
                    {item.label}
                    {item.highlight && (
                      <span className="text-[10px] bg-[#FF7A00] text-white px-2 py-0.5 rounded-full font-semibold">NEW</span>
                    )}
                  </Link>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-[#06B6D4] font-semibold text-sm">Resources</p>
                {resources.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`block pl-4 text-sm ${
                      item.highlight 
                        ? "text-[#FF7A00] hover:text-[#FF9240] font-semibold flex items-center gap-2" 
                        : "text-white/80 hover:text-[#06B6D4]"
                    }`}
                  >
                    {item.label}
                    {item.highlight && (
                      <span className="text-[10px] bg-[#FF7A00] text-white px-2 py-0.5 rounded-full font-semibold">NEW</span>
                    )}
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

            </nav>
          </SheetContent>
        </Sheet>
      </div>
      </div>
    </motion.header>
  );
};
