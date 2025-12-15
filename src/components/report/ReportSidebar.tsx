import { cn } from "@/lib/utils";
import { Link, useParams, useLocation } from "react-router-dom";
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
  path: string;
}

const sections: Section[] = [
  { id: "score", label: "Score", icon: <FileText className="h-4 w-4" />, path: "" },
  { id: "map", label: "Map", icon: <MapPin className="h-4 w-4" />, path: "map" },
  { id: "zoning", label: "Zoning", icon: <Building2 className="h-4 w-4" />, path: "zoning" },
  { id: "flood", label: "Flood", icon: <Droplets className="h-4 w-4" />, path: "flood" },
  { id: "utilities", label: "Utilities", icon: <Zap className="h-4 w-4" />, path: "utilities" },
  { id: "environmental", label: "Environmental", icon: <Leaf className="h-4 w-4" />, path: "environmental" },
  { id: "traffic", label: "Traffic", icon: <Car className="h-4 w-4" />, path: "traffic" },
  { id: "market", label: "Market", icon: <Users className="h-4 w-4" />, path: "market" },
  { id: "costs", label: "Costs", icon: <DollarSign className="h-4 w-4" />, path: "costs" },
];

interface ReportSidebarProps {
  hasKillFactors?: boolean;
}

export function ReportSidebar({ hasKillFactors = false }: ReportSidebarProps) {
  const { reportId } = useParams<{ reportId: string }>();
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Determine active section from URL path
  const currentPath = location.pathname;
  const getActiveSection = () => {
    for (const section of sections) {
      if (section.path === "") {
        // Score is the index route
        if (currentPath === `/report/${reportId}` || currentPath === `/report/${reportId}/`) {
          return section.id;
        }
      } else if (currentPath.endsWith(`/${section.path}`)) {
        return section.id;
      }
    }
    return "score";
  };

  const activeSection = getActiveSection();

  const buildPath = (sectionPath: string) => {
    return sectionPath === "" 
      ? `/report/${reportId}` 
      : `/report/${reportId}/${sectionPath}`;
  };

  return (
    <Sidebar 
      className={cn(
        "border-r border-white/10 transition-all duration-300",
        isCollapsed ? "w-16" : "w-56"
      )}
      collapsible="icon"
      style={{
        '--sidebar-background': 'var(--midnight-blue)',
        '--sidebar-foreground': '210 20% 98%',
        '--sidebar-accent': '0 0% 100% / 0.1',
        '--sidebar-accent-foreground': '0 0% 100%',
      } as React.CSSProperties}
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
                    asChild
                    className={cn(
                      "w-full justify-start gap-3 rounded-lg px-3 py-2.5 transition-all",
                      "bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/30"
                    )}
                    tooltip={isCollapsed ? "Critical Issues" : undefined}
                  >
                    <Link to={`/report/${reportId}`}>
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span className="font-medium">Critical Issues</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {sections.map((section) => (
                <SidebarMenuItem key={section.id}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "w-full justify-start gap-3 rounded-lg px-3 py-2.5 transition-all",
                      activeSection === section.id
                        ? "bg-[hsl(var(--feasibility-orange))] text-white font-medium shadow-md"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    )}
                    tooltip={isCollapsed ? section.label : undefined}
                  >
                    <Link to={buildPath(section.path)}>
                      <span className="shrink-0">{section.icon}</span>
                      {!isCollapsed && <span>{section.label}</span>}
                    </Link>
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
