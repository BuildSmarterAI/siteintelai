import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { docsNavigation } from "@/data/docs-navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  section: string;
}

export const DocsPagination = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Flatten navigation into ordered list
  const flatNav = useMemo(() => {
    const items: NavItem[] = [];
    docsNavigation.forEach((section) => {
      section.items.forEach((item) => {
        items.push({
          title: item.title,
          href: item.href,
          section: section.title,
        });
      });
    });
    return items;
  }, []);

  // Find current index
  const currentIndex = flatNav.findIndex((item) => item.href === pathname);
  const prevPage = currentIndex > 0 ? flatNav[currentIndex - 1] : null;
  const nextPage = currentIndex < flatNav.length - 1 ? flatNav[currentIndex + 1] : null;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only if no input/textarea is focused
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && prevPage) {
        window.location.href = prevPage.href;
      } else if (e.key === "ArrowRight" && nextPage) {
        window.location.href = nextPage.href;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevPage, nextPage]);

  if (!prevPage && !nextPage) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4 pt-8 mt-8 border-t border-white/10"
    >
      {prevPage ? (
        <Link
          to={prevPage.href}
          className="group flex flex-col items-start gap-1 p-4 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-colors flex-1 max-w-[45%]"
        >
          <span className="flex items-center gap-1 text-xs text-white/50">
            <ChevronLeft className="h-3 w-3" />
            Previous
          </span>
          <span className="text-sm font-medium text-white group-hover:text-[hsl(var(--feasibility-orange))] transition-colors truncate w-full">
            {prevPage.title}
          </span>
          <span className="text-xs text-white/40">{prevPage.section}</span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {nextPage ? (
        <Link
          to={nextPage.href}
          className="group flex flex-col items-end gap-1 p-4 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-colors flex-1 max-w-[45%]"
        >
          <span className="flex items-center gap-1 text-xs text-white/50">
            Next
            <ChevronRight className="h-3 w-3" />
          </span>
          <span className="text-sm font-medium text-white group-hover:text-[hsl(var(--feasibility-orange))] transition-colors truncate w-full text-right">
            {nextPage.title}
          </span>
          <span className="text-xs text-white/40">{nextPage.section}</span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  );
};
