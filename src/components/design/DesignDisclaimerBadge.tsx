/**
 * SiteIntel™ Design Mode - Persistent Disclaimer Badge
 * 
 * MANDATORY: Always visible, cannot be hidden.
 * Per PRD: "Conceptual Design – Not for Construction"
 */

import { AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DesignDisclaimerBadgeProps {
  variant?: "default" | "compact";
  className?: string;
}

export function DesignDisclaimerBadge({ 
  variant = "default",
  className = "" 
}: DesignDisclaimerBadgeProps) {
  const content = (
    <div className={`
      inline-flex items-center gap-2 
      bg-amber-500/10 border border-amber-500/30 
      text-amber-600 dark:text-amber-400
      rounded-full px-3 py-1.5
      text-xs font-medium
      select-none pointer-events-auto
      ${className}
    `}>
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      {variant === "default" ? (
        <span>Conceptual Design – Not for Construction</span>
      ) : (
        <span>Conceptual</span>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="max-w-xs text-center"
        >
          <p className="text-sm font-medium mb-1">Conceptual Design Only</p>
          <p className="text-xs text-muted-foreground">
            This tool is for early-stage exploration only. Designs are not 
            architectural drawings and are not suitable for construction, 
            permitting, or bidding purposes. Consult a licensed professional 
            for actual development.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Footer disclaimer for exports and reports
 */
export function DesignExportDisclaimer() {
  return (
    <div className="text-xs text-muted-foreground text-center py-4 border-t mt-6">
      <p className="font-medium text-amber-600 dark:text-amber-400 mb-1">
        ⚠️ CONCEPTUAL DESIGN ONLY
      </p>
      <p>
        Design scenarios are illustrative and subject to professional verification.
        Not for construction, permitting, or bidding.
      </p>
      <p className="mt-1 opacity-70">
        © {new Date().getFullYear()} SiteIntel™ Feasibility Platform
      </p>
    </div>
  );
}
