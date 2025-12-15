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
  AlertTriangle,
  PanelLeftClose,
  PanelLeft
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

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

interface ReportSidebarProps {
  hasKillFactors?: boolean;
}

export function ReportSidebar({ hasKillFactors = false }: ReportSidebarProps) {
  const [activeSection, setActiveSection] = useState("score");
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    const handleScroll = () => {
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
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <Sidebar 
      className={cn(
        "border-r border-border/50 bg-[hsl(var(--midnight-blue))] transition-all duration-300",
        isCollapsed ? "w-16" : "w-56"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-white/10 p-3">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <span className="text-sm font-semibold text-white/90">Report Sections</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {hasKillFactors && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => scrollToSection("kill-factors")}
                    className={cn(
                      "w-full justify-start gap-3 rounded-lg px-3 py-2.5 transition-all",
                      "bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/30"
                    )}
                    tooltip={isCollapsed ? "Critical Issues" : undefined}
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="font-medium">Critical Issues</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {sections.map((section) => (
                <SidebarMenuItem key={section.id}>
                  <SidebarMenuButton
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "w-full justify-start gap-3 rounded-lg px-3 py-2.5 transition-all",
                      activeSection === section.id
                        ? "bg-[hsl(var(--feasibility-orange))] text-white font-medium shadow-md"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    )}
                    tooltip={isCollapsed ? section.label : undefined}
                  >
                    <span className="shrink-0">{section.icon}</span>
                    {!isCollapsed && <span>{section.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
