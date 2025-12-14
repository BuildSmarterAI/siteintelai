import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Droplets, Leaf, Zap, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface KillFactor {
  id: string;
  label: string;
  description: string;
  severity: 'critical' | 'warning';
  icon: React.ReactNode;
}

interface KillFactorsBannerProps {
  floodZone?: string;
  wetlandsPercent?: number;
  hasUtilities?: boolean;
  environmentalIssues?: string[];
  customKillFactors?: string[];
}

export function KillFactorsBanner({
  floodZone,
  wetlandsPercent = 0,
  hasUtilities = true,
  environmentalIssues = [],
  customKillFactors = [],
}: KillFactorsBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Build kill factors from data
  const killFactors: KillFactor[] = [];
  
  // Check for floodway (critical)
  if (floodZone?.toLowerCase().includes('floodway') || floodZone === 'AE' || floodZone === 'A') {
    killFactors.push({
      id: 'floodway',
      label: 'High Flood Risk Zone',
      description: `Property located in FEMA Zone ${floodZone}. Development may require flood insurance and elevation certificates.`,
      severity: floodZone?.toLowerCase().includes('floodway') ? 'critical' : 'warning',
      icon: <Droplets className="h-4 w-4" />
    });
  }
  
  // Check wetlands (>50% = critical, >25% = warning)
  if (wetlandsPercent >= 25) {
    killFactors.push({
      id: 'wetlands',
      label: `Wetlands Coverage: ${wetlandsPercent.toFixed(0)}%`,
      description: wetlandsPercent >= 50 
        ? 'More than half the parcel is wetlands. Army Corps 404 permit required. Significant buildable area reduction.'
        : 'Significant wetlands present. May require Army Corps 404 permit and mitigation.',
      severity: wetlandsPercent >= 50 ? 'critical' : 'warning',
      icon: <Leaf className="h-4 w-4" />
    });
  }
  
  // Check utilities
  if (!hasUtilities) {
    killFactors.push({
      id: 'no_utilities',
      label: 'No Public Utilities',
      description: 'No public water or sewer within 1000ft. Will require on-site septic/well or expensive utility extension.',
      severity: 'critical',
      icon: <Zap className="h-4 w-4" />
    });
  }
  
  // Environmental issues
  if (environmentalIssues.length > 0) {
    killFactors.push({
      id: 'environmental',
      label: `Environmental Concerns (${environmentalIssues.length})`,
      description: `Potential issues: ${environmentalIssues.slice(0, 3).join(', ')}${environmentalIssues.length > 3 ? '...' : ''}`,
      severity: 'warning',
      icon: <AlertCircle className="h-4 w-4" />
    });
  }
  
  // Custom kill factors from report
  customKillFactors.forEach((kf, idx) => {
    killFactors.push({
      id: `custom_${idx}`,
      label: kf,
      description: 'Identified during feasibility analysis.',
      severity: 'warning',
      icon: <AlertTriangle className="h-4 w-4" />
    });
  });
  
  // Don't render if no kill factors
  if (killFactors.length === 0) return null;
  
  const criticalCount = killFactors.filter(kf => kf.severity === 'critical').length;
  const warningCount = killFactors.filter(kf => kf.severity === 'warning').length;
  
  return (
    <div 
      id="section-kill-factors"
      className={cn(
        "rounded-lg border-2 overflow-hidden transition-all",
        criticalCount > 0 
          ? "bg-destructive/5 border-destructive/30" 
          : "bg-amber-500/5 border-amber-500/30"
      )}
    >
      {/* Banner Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-full",
            criticalCount > 0 ? "bg-destructive/20" : "bg-amber-500/20"
          )}>
            <AlertTriangle className={cn(
              "h-5 w-5",
              criticalCount > 0 ? "text-destructive" : "text-amber-600"
            )} />
          </div>
          
          <div className="text-left">
            <h3 className={cn(
              "font-semibold",
              criticalCount > 0 ? "text-destructive" : "text-amber-700"
            )}>
              {criticalCount > 0 ? 'Critical Issues Detected' : 'Attention Required'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {killFactors.length} issue{killFactors.length !== 1 ? 's' : ''} may affect feasibility
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {criticalCount} Critical
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge className="rounded-full bg-amber-500 hover:bg-amber-600">
              {warningCount} Warning
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="h-px bg-border" />
          
          {killFactors.map((kf) => (
            <div 
              key={kf.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg",
                kf.severity === 'critical' 
                  ? "bg-destructive/10 border border-destructive/20" 
                  : "bg-amber-500/10 border border-amber-500/20"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-full shrink-0",
                kf.severity === 'critical' ? "bg-destructive/20 text-destructive" : "bg-amber-500/20 text-amber-600"
              )}>
                {kf.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  "font-medium text-sm",
                  kf.severity === 'critical' ? "text-destructive" : "text-amber-700"
                )}>
                  {kf.label}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {kf.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
