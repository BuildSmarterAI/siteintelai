import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, useScroll } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UserCircle, ChevronDown, Menu, X } from "lucide-react";
import buildSmarterLogo from "@/assets/buildsmarter-logo-new.png";
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
          : "h-[96px] bg-transparent"
      }`}
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : -100 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <motion.img
            src={buildSmarterLogo}
            alt="BuildSmarter"
            className={`transition-all duration-300 ${
              isScrolled ? "h-7" : "h-9"
            }`}
            whileHover={{ scale: 1.05 }}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/feasibility" className={navLinkClass}>
            Feasibility
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
          <Button
            asChild
            className="bg-gradient-to-r from-[#FF7A00] to-[#FF9240] hover:shadow-[0_4px_20px_rgba(255,122,0,0.4)] text-white font-semibold rounded-full px-6 relative overflow-hidden group"
          >
            <Link to="/application?step=2">
              <span className="relative z-10">Run a Feasibility QuickCheck →</span>
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

          <Link
            to="/auth"
            className="text-white/90 hover:text-[#06B6D4] transition-colors group relative"
          >
            <UserCircle className="h-6 w-6" />
            <span className="absolute -bottom-8 right-0 bg-[#0A0F2C] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Sign In or Access Dashboard
            </span>
          </Link>
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
              <Link to="/feasibility" className="text-white hover:text-[#06B6D4] font-medium">
                Feasibility
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

              <Link
                to="/auth"
                className="flex items-center gap-2 text-white/90 hover:text-[#06B6D4] transition-colors"
              >
                <UserCircle className="h-5 w-5" />
                Sign In
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </motion.header>
  );
};
