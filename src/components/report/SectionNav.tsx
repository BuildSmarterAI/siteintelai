import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Landmark, 
  Droplets, 
  Cable, 
  Leaf, 
  Car, 
  Users, 
  Route,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
}

const sections: Section[] = [
  { id: 'section-zoning', label: 'Zoning', icon: Landmark },
  { id: 'section-flood', label: 'Flood Risk', icon: Droplets },
  { id: 'section-utilities', label: 'Utilities', icon: Cable },
  { id: 'section-environmental', label: 'Environmental', icon: Leaf },
  { id: 'section-traffic', label: 'Traffic', icon: Car },
  { id: 'section-market', label: 'Market', icon: Users },
  { id: 'section-access', label: 'Access', icon: Route },
];

interface SectionNavProps {
  className?: string;
}

export function SectionNav({ className }: SectionNavProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Update scroll buttons state
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  // Intersection Observer for active section detection
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Update scroll buttons on mount and resize
  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, []);

  const scrollTo = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollNav = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className={cn(
      "sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border py-3",
      className
    )}>
      <div className="relative flex items-center gap-2">
        {/* Left scroll button */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 z-10 h-8 w-8 shrink-0 bg-background/80 backdrop-blur-sm shadow-md"
            onClick={() => scrollNav('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-1"
          onScroll={updateScrollButtons}
        >
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <Button
                key={section.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "shrink-0 gap-1.5 transition-all",
                  isActive 
                    ? "bg-[hsl(var(--feasibility-orange))] text-white hover:bg-[hsl(var(--feasibility-orange)/0.9)]" 
                    : "hover:bg-muted"
                )}
                onClick={() => scrollTo(section.id)}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{section.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Right scroll button */}
        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 z-10 h-8 w-8 shrink-0 bg-background/80 backdrop-blur-sm shadow-md"
            onClick={() => scrollNav('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
