import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { docsNavigation } from "@/data/docs-navigation";
import { cn } from "@/lib/utils";

export const DocsBreadcrumb = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Find current page info
  let currentSection: string | null = null;
  let currentPage: string | null = null;

  for (const section of docsNavigation) {
    const item = section.items.find((i) => i.href === pathname);
    if (item) {
      currentSection = section.title;
      currentPage = item.title;
      break;
    }
  }

  // If on /docs index, don't show breadcrumb
  if (pathname === "/docs") {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-sm text-white/60 mb-6"
    >
      <Link
        to="/docs"
        className="flex items-center gap-1 hover:text-white transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Docs</span>
      </Link>

      {currentSection && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-white/40" />
          <span className="text-white/50">{currentSection}</span>
        </>
      )}

      {currentPage && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-white/40" />
          <span className="text-white font-medium">{currentPage}</span>
        </>
      )}
    </nav>
  );
};
