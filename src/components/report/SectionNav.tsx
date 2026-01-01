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
  { id: 'section-flood', label: 'Flood', icon: Droplets },
  { id: 'section-utilities', label: 'Utilities', icon: Cable },
  { id: 'section-environmental', label: 'Environment', icon: Leaf },
  { id: 'section-traffic', label: 'Traffic', icon: Car },
  { id: 'section-market', label: 'Demographics', icon: Users },
  { id: 'section-access', label: 'Access', icon: Route },
  { id: 'section-tax', label: 'Tax', icon: Landmark },
  { id: 'section-employment', label: 'Employment', icon: Users },
];

interface SectionNavProps {
  className?: string;
}

export function SectionNav({ className }: SectionNavProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Update scroll buttons state
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
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
          // Auto-scroll the nav to show active section button
          const activeBtn = scrollContainerRef.current?.querySelector(`[data-section="${entry.target.id}"]`);
          if (activeBtn) {
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
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
      const scrollAmount = 150;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className={cn(
      "sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border py-2 md:py-3 -mx-4 px-4 md:mx-0 md:px-0",
      className
    )}>
      <div className="relative flex items-center">
        {/* Left scroll button - always visible on mobile when can scroll */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute left-0 z-10 h-7 w-7 md:h-8 md:w-8 shrink-0 bg-background shadow-md border transition-opacity",
            canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => scrollNav('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Scrollable container - improved for mobile */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide px-8 md:px-10 snap-x snap-mandatory"
          onScroll={updateScrollButtons}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <Button
                key={section.id}
                data-section={section.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "shrink-0 gap-1 md:gap-1.5 transition-all snap-center px-2 md:px-3 h-8 md:h-9",
                  isActive 
                    ? "bg-[hsl(var(--feasibility-orange))] text-white hover:bg-[hsl(var(--feasibility-orange)/0.9)]" 
                    : "hover:bg-muted border border-transparent hover:border-border"
                )}
                onClick={() => scrollTo(section.id)}
              >
                <Icon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                <span className="text-[10px] md:text-xs font-medium whitespace-nowrap">{section.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Right scroll button - always visible on mobile when can scroll */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute right-0 z-10 h-7 w-7 md:h-8 md:w-8 shrink-0 bg-background shadow-md border transition-opacity",
            canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => scrollNav('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Mobile scroll hint - shows dots to indicate more content */}
      <div className="flex justify-center gap-1 mt-1.5 md:hidden">
        {sections.map((section, idx) => (
          <div 
            key={section.id}
            className={cn(
              "h-1 rounded-full transition-all",
              activeSection === section.id 
                ? "w-3 bg-[hsl(var(--feasibility-orange))]" 
                : "w-1 bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}
