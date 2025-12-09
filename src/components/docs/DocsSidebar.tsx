import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { docsNavigation } from "@/data/docs-navigation";
import { cn } from "@/lib/utils";

export const DocsSidebar = () => {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<string[]>(
    docsNavigation.map((s) => s.title)
  );

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => location.pathname === href;

  return (
    <aside className="w-64 min-h-screen bg-[hsl(var(--midnight-blue))] border-r border-white/10 overflow-y-auto">
      <div className="p-4 border-b border-white/10">
        <NavLink to="/docs" className="flex items-center gap-2">
          <span className="font-heading text-lg text-white">SiteIntel™ Docs</span>
        </NavLink>
      </div>

      <nav className="p-4 space-y-2">
        {docsNavigation.map((section) => {
          const Icon = section.icon;
          const isOpen = openSections.includes(section.title);
          const hasActiveChild = section.items.some((item) => isActive(item.href));

          return (
            <div key={section.title} className="space-y-1">
              <button
                onClick={() => toggleSection(section.title)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  hasActiveChild
                    ? "bg-[hsl(var(--data-cyan))]/10 text-[hsl(var(--data-cyan))]"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{section.title}</span>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {isOpen && (
                <div className="ml-6 space-y-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "block px-3 py-1.5 rounded-md text-sm transition-colors",
                        isActive(item.href)
                          ? "bg-[hsl(var(--feasibility-orange))]/20 text-[hsl(var(--feasibility-orange))] font-medium"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {item.title}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};
