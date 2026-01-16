import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  className?: string;
}

export function TableOfContents({ className }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Extract headings from article content
    const article = document.querySelector("article");
    if (!article) return;

    const elements = article.querySelectorAll("h2, h3");
    const items: TocItem[] = [];

    elements.forEach((element, index) => {
      const id = element.id || `heading-${index}`;
      if (!element.id) {
        element.id = id;
      }
      items.push({
        id,
        text: element.textContent || "",
        level: element.tagName === "H2" ? 2 : 3,
      });
    });

    setHeadings(items);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0,
      }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveId(id);
    }
  };

  if (headings.length === 0) return null;

  return (
    <nav className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
        <List className="h-4 w-4" />
        <span>Table of Contents</span>
      </div>
      <ul className="space-y-1 text-sm">
        {headings.map((heading) => (
          <li key={heading.id}>
            <button
              onClick={() => handleClick(heading.id)}
              className={cn(
                "block w-full text-left py-1.5 px-3 rounded-md transition-colors",
                heading.level === 3 && "pl-6",
                activeId === heading.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
