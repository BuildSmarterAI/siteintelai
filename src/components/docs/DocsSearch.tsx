import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, ArrowRight } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { searchDocs, groupSearchResults, docsContent } from "@/data/docs-content";
import { cn } from "@/lib/utils";

interface DocsSearchProps {
  className?: string;
}

export const DocsSearch = ({ className }: DocsSearchProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Get recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("docs-recent-searches");
    return stored ? JSON.parse(stored) : [];
  });

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const saveRecentSearch = useCallback((search: string) => {
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("docs-recent-searches", JSON.stringify(updated));
  }, [recentSearches]);

  const handleSelect = useCallback((slug: string, title: string) => {
    saveRecentSearch(title);
    setOpen(false);
    setQuery("");
    navigate(`/docs${slug ? `/${slug}` : ""}`);
  }, [navigate, saveRecentSearch]);

  const results = searchDocs(query);
  const groupedResults = groupSearchResults(results);
  const hasQuery = query.length >= 2;

  // Quick links for empty state
  const quickLinks = docsContent.slice(0, 5);

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start rounded-lg border-white/20 bg-white/5 text-sm text-white/60 hover:bg-white/10 hover:text-white md:w-64",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden md:inline-flex">Search docs...</span>
        <span className="inline-flex md:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white/50 md:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search documentation..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No results found</p>
              <p className="text-xs text-muted-foreground/70">
                Try searching for "cityengine", "zoning", or "tiles"
              </p>
            </div>
          </CommandEmpty>

          {!hasQuery && recentSearches.length > 0 && (
            <CommandGroup heading="Recent Searches">
              {recentSearches.map((search) => {
                const doc = docsContent.find(d => d.title === search);
                return (
                  <CommandItem
                    key={search}
                    value={search}
                    onSelect={() => doc && handleSelect(doc.slug, doc.title)}
                    className="cursor-pointer"
                  >
                    <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{search}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {!hasQuery && (
            <CommandGroup heading="Quick Links">
              {quickLinks.map((doc) => (
                <CommandItem
                  key={doc.slug}
                  value={doc.title}
                  onSelect={() => handleSelect(doc.slug, doc.title)}
                  className="cursor-pointer"
                >
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{doc.title}</span>
                    <span className="text-xs text-muted-foreground">{doc.description}</span>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {hasQuery && Object.entries(groupedResults).map(([section, docs]) => (
            <CommandGroup key={section} heading={section}>
              {docs.map((doc) => (
                <CommandItem
                  key={doc.slug}
                  value={`${doc.title} ${doc.description} ${doc.keywords.join(" ")}`}
                  onSelect={() => handleSelect(doc.slug, doc.title)}
                  className="cursor-pointer"
                >
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{doc.title}</span>
                    <span className="text-xs text-muted-foreground">{doc.description}</span>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
};
