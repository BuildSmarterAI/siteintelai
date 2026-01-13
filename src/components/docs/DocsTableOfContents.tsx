import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface DocsTableOfContentsProps {
  className?: string;
}

export const DocsTableOfContents = ({ className }: DocsTableOfContentsProps) => {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  // Extract headings from the page
  useEffect(() => {
    const article = document.querySelector("article, main");
    if (!article) return;

    const elements = article.querySelectorAll("h2, h3");
    const items: TocItem[] = Array.from(elements).map((el) => ({
      id: el.id || el.textContent?.toLowerCase().replace(/\s+/g, "-") || "",
      text: el.textContent || "",
      level: parseInt(el.tagName[1]),
    }));

    // Assign IDs to headings that don't have them
    elements.forEach((el, i) => {
      if (!el.id && items[i]) {
        el.id = items[i].id;
      }
    });

    setHeadings(items);
  }, []);

  // Track active heading on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0% -80% 0%" }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className={cn("space-y-2", className)}>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
        On This Page
      </h4>
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li key={heading.id}>
            <button
              onClick={() => handleClick(heading.id)}
              className={cn(
                "block w-full text-left text-sm py-1 transition-colors hover:text-white",
                heading.level === 3 && "pl-3",
                activeId === heading.id
                  ? "text-[hsl(var(--feasibility-orange))] font-medium"
                  : "text-white/60"
              )}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
