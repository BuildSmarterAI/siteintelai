import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useEvidenceDrawer } from "@/contexts/EvidenceDrawerContext";
import { EvidenceDomain } from "@/types/evidence";
import { cn } from "@/lib/utils";

interface ShowSourceButtonProps {
  domain: EvidenceDomain;
  title: string;
  rawData: Record<string, unknown>;
  timestamp?: string;
  pdfUrl?: string;
  reliabilityScore?: number;
  className?: string;
  variant?: "default" | "inline" | "badge";
}

export function ShowSourceButton({
  domain,
  title,
  rawData,
  timestamp,
  pdfUrl,
  reliabilityScore,
  className,
  variant = "default",
}: ShowSourceButtonProps) {
  const { openForDomain } = useEvidenceDrawer();

  const handleClick = () => {
    openForDomain({
      domain,
      title,
      rawData,
      timestamp,
      pdfUrl,
      reliabilityScore,
    });
  };

  if (variant === "inline") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline",
          className
        )}
      >
        <ExternalLink className="h-3 w-3" />
        Show Source
      </button>
    );
  }

  if (variant === "badge") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
          className
        )}
      >
        <ExternalLink className="h-3 w-3" />
        Source
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn("text-xs text-muted-foreground hover:text-foreground", className)}
    >
      <ExternalLink className="h-3 w-3 mr-1.5" />
      Show Source
    </Button>
  );
}
