import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  MapPin, 
  Building2, 
  Droplets, 
  Zap, 
  Car, 
  Leaf,
  DollarSign,
  Users,
  AlertTriangle
} from "lucide-react";

interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const sections: Section[] = [
  { id: "score", label: "Score", icon: <FileText className="h-4 w-4" /> },
  { id: "map", label: "Map", icon: <MapPin className="h-4 w-4" /> },
  { id: "zoning", label: "Zoning", icon: <Building2 className="h-4 w-4" /> },
  { id: "flood", label: "Flood", icon: <Droplets className="h-4 w-4" /> },
  { id: "utilities", label: "Utilities", icon: <Zap className="h-4 w-4" /> },
  { id: "environmental", label: "Environmental", icon: <Leaf className="h-4 w-4" /> },
  { id: "traffic", label: "Traffic", icon: <Car className="h-4 w-4" /> },
  { id: "market", label: "Market", icon: <Users className="h-4 w-4" /> },
  { id: "costs", label: "Costs", icon: <DollarSign className="h-4 w-4" /> },
];

interface ReportNavBarProps {
  hasKillFactors?: boolean;
}

export function ReportNavBar({ hasKillFactors = false }: ReportNavBarProps) {
  const [activeSection, setActiveSection] = useState("score");
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Check if we've scrolled past the hero section
      setIsSticky(window.scrollY > 300);

      // Find active section based on scroll position
      const sectionElements = sections
        .map(s => ({ id: s.id, el: document.getElementById(`section-${s.id}`) }))
        .filter(s => s.el);

      const scrollPosition = window.scrollY + 200;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i];
        if (section.el && section.el.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      const offset = 140; // Account for sticky headers
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <nav 
      className={cn(
        "sticky z-40 transition-all duration-300",
        isSticky 
          ? "top-[73px] bg-background/80 backdrop-blur-xl border-b shadow-sm" 
          : "top-[73px] bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
          {hasKillFactors && (
            <button
              onClick={() => scrollToSection("kill-factors")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30"
              )}
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Critical Issues</span>
            </button>
          )}
          
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                activeSection === section.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {section.icon}
              <span className="hidden sm:inline">{section.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
