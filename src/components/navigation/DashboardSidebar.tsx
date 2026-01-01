import { NavLink, useLocation } from "react-router-dom";
import { Home, FileText, PlusCircle, LayoutDashboard, TrendingUp, Globe2, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "All Reports", url: "/dashboard?tab=all", icon: FileText },
  { title: "Portfolio Analytics", url: "/analytics", icon: TrendingUp },
  { title: "Market Intelligence", url: "/market-intelligence", icon: Globe2, badge: "NEW" },
  { title: "New Application", url: "/application?step=1", icon: PlusCircle },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname + location.search;

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" && !location.search;
    }
    return currentPath === path;
  };

  const getNavClass = (active: boolean) =>
    active
      ? "bg-[#06B6D4]/10 text-[#06B6D4] font-semibold hover:bg-[#06B6D4]/20"
      : "text-charcoal/70 hover:bg-charcoal/5 hover:text-charcoal";

  return (
    <Sidebar
      className={`border-r border-charcoal/10 bg-white transition-all duration-300 ${
        collapsed ? "w-14" : "w-64"
      }`}
      collapsible="icon"
    >
      <div className="p-4 border-b border-charcoal/10 flex items-center justify-between">
        {!collapsed && (
          <h2 className="font-headline text-lg font-bold text-charcoal uppercase tracking-wide">
            Dashboard
          </h2>
        )}
        <SidebarTrigger className="ml-auto" />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className={getNavClass(active)}>
                      <NavLink to={item.url} end>
                        <item.icon className={`${collapsed ? "" : "mr-3"} h-5 w-5`} />
                        {!collapsed && (
                          <span className="flex items-center gap-2">
                            {item.title}
                            {'badge' in item && item.badge && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[hsl(var(--feasibility-orange))] text-white rounded">
                                {item.badge}
                              </span>
                            )}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Quick Actions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={isActive("/settings") ? "bg-[#06B6D4]/10 text-[#06B6D4] font-semibold hover:bg-[#06B6D4]/20" : "text-charcoal/70 hover:bg-charcoal/5 hover:text-charcoal"}>
                  <NavLink to="/settings">
                    <Settings className={`${collapsed ? "" : "mr-3"} h-5 w-5`} />
                    {!collapsed && <span>Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" className="text-charcoal/70 hover:bg-charcoal/5 hover:text-charcoal">
                    <Home className={`${collapsed ? "" : "mr-3"} h-5 w-5`} />
                    {!collapsed && <span>Home</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
