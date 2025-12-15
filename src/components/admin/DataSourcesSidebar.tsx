import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Database,
  History,
  AlertTriangle,
  Activity,
  Settings,
  LayoutDashboard,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    title: 'Data Sources',
    url: '/admin/data-sources',
    icon: Database,
    description: 'Manage GIS endpoints',
  },
  {
    title: 'Reports',
    url: '/admin/reports',
    icon: FileText,
    description: 'Manage all reports',
  },
  {
    title: 'Version History',
    url: '/admin/data-source-versions',
    icon: History,
    description: 'Schema snapshots',
  },
  {
    title: 'Error Logs',
    url: '/admin/data-source-errors',
    icon: AlertTriangle,
    description: 'Failure tracking',
  },
  {
    title: 'System Health',
    url: '/admin/system-health',
    icon: Activity,
    description: 'Pipeline monitoring',
  },
];

export function DataSourcesSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar
      className={cn(
        'border-r bg-sidebar transition-all duration-200',
        collapsed ? 'w-14' : 'w-60'
      )}
      collapsible="icon"
    >
      <SidebarContent>
        {/* Back to Main Admin */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/admin/system-health"
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                        'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                      )
                    }
                  >
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="text-sm">Back to Admin</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Data Registry Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={cn(collapsed && 'sr-only')}>
            Data Registry
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url ||
                  (item.url === '/admin/data-sources' && location.pathname.startsWith('/admin/data-sources/'));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <div className="flex flex-col">
                            <span className="text-sm">{item.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.description}
                            </span>
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
