import { motion } from "framer-motion";
import { FileText, TrendingUp, AlertTriangle, Lightbulb, ChevronDown, CheckCircle2, Calculator, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CostIntakeModal } from "./CostIntakeModal";

interface ExecutiveSummaryCardProps {
  executiveSummary: string;
  overallScore: number;
  scoreBand: string;
  keyOpportunities?: string[];
  keyRisks?: string[];
  zoningCode?: string;
  floodZone?: string;
  acreage?: number;
  className?: string;
  applicationId?: string;
  onCostEstimateRefresh?: () => void;
}

export function ExecutiveSummaryCard({
  executiveSummary,
  overallScore,
  scoreBand,
  keyOpportunities = [],
  keyRisks = [],
  zoningCode,
  floodZone,
  acreage,
  className,
  applicationId,
  onCostEstimateRefresh,
}: ExecutiveSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCostIntake, setShowCostIntake] = useState(false);

  const getRecommendation = () => {
    if (scoreBand === "A" || scoreBand === "B") {
      return { label: "HIGH POTENTIAL", color: "bg-[hsl(var(--status-success))]", textColor: "text-white" };
    }
    if (scoreBand === "C") {
      return { label: "PROCEED WITH CAUTION", color: "bg-[hsl(var(--status-warning))]", textColor: "text-[hsl(var(--midnight-blue))]" };
    }
    return { label: "HIGH RISK", color: "bg-[hsl(var(--status-error))]", textColor: "text-white" };
  };

  const recommendation = getRecommendation();
  const shortSummary = executiveSummary?.substring(0, 300);
  const hasMoreContent = executiveSummary?.length > 300;

  return (
    <Card id="section-summary" className={cn("glass-card border-l-4 border-l-[hsl(var(--feasibility-orange))] overflow-hidden", className)}>
      {/* Dark AI Header */}
      <CardHeader className="bg-gradient-to-r from-[hsl(var(--midnight-blue))] to-[hsl(var(--midnight-blue)/0.85)] text-white relative overflow-hidden">
        {/* AI Grid Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--data-cyan) / 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--data-cyan) / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }} />
        </div>
        
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--feasibility-orange)/0.2)] border border-[hsl(var(--feasibility-orange)/0.3)]">
              <FileText className="h-5 w-5 text-[hsl(var(--feasibility-orange))]" />
            </div>
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                Executive Summary
                <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-400 bg-green-500/10">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  DATA-VERIFIED
                </Badge>
              </CardTitle>
              <p className="text-xs text-white/60 mt-1">Comprehensive feasibility analysis</p>
            </div>
          </div>

          {/* AI Recommendation Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <Badge className={cn("text-sm px-4 py-2 font-bold", recommendation.color, recommendation.textColor)}>
              {recommendation.label}
            </Badge>
          </motion.div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Quick Facts Strip */}
        <div className="flex flex-wrap gap-3 p-3 bg-[hsl(var(--muted)/0.3)] rounded-lg border border-[hsl(var(--border))]">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Score</span>
            <span className="font-mono font-bold text-[hsl(var(--feasibility-orange))]">{overallScore}</span>
          </div>
          {zoningCode && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Zone</span>
              <span className="font-mono font-bold">{zoningCode}</span>
            </div>
          )}
          {floodZone && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Flood</span>
              <span className="font-mono font-bold">{floodZone}</span>
            </div>
          )}
          {acreage && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Acres</span>
              <span className="font-mono font-bold">{acreage.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Risks</span>
            <span className={cn("font-mono font-bold", keyRisks.length > 3 ? "text-[hsl(var(--status-error))]" : "text-foreground")}>
              {keyRisks.length}
            </span>
          </div>
        </div>

        {/* Key Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Opportunities */}
          {keyOpportunities.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-lg border border-[hsl(var(--status-success)/0.3)] bg-[hsl(var(--status-success)/0.05)]"
            >
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-[hsl(var(--status-success))]" />
                <span className="text-sm font-semibold text-[hsl(var(--status-success))]">Key Opportunities</span>
              </div>
              <ul className="space-y-2">
                {keyOpportunities.slice(0, 4).map((opp, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-start gap-2 text-sm"
                  >
                    <TrendingUp className="h-3 w-3 mt-1 text-[hsl(var(--status-success))] shrink-0" />
                    <span className="text-muted-foreground">{opp}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Risks */}
          {keyRisks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-lg border border-[hsl(var(--status-error)/0.3)] bg-[hsl(var(--status-error)/0.05)]"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-error))]" />
                <span className="text-sm font-semibold text-[hsl(var(--status-error))]">Key Risks</span>
              </div>
              <ul className="space-y-2">
                {keyRisks.slice(0, 4).map((risk, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-start gap-2 text-sm"
                  >
                    <AlertTriangle className="h-3 w-3 mt-1 text-[hsl(var(--status-error))] shrink-0" />
                    <span className="text-muted-foreground">{risk}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* Cost Estimate CTA */}
        {applicationId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 rounded-lg bg-gradient-to-r from-[hsl(var(--feasibility-orange)/0.1)] to-[hsl(var(--data-cyan)/0.05)] border border-[hsl(var(--feasibility-orange)/0.2)]"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--feasibility-orange)/0.15)]">
                  <Calculator className="h-5 w-5 text-[hsl(var(--feasibility-orange))]" />
                </div>
                <div>
                  <p className="font-medium text-sm">Refine Your Cost Estimate</p>
                  <p className="text-xs text-muted-foreground">
                    Add construction details for a more accurate budget range
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setShowCostIntake(true)}
                className="bg-[hsl(var(--feasibility-orange))] hover:bg-[hsl(var(--feasibility-orange)/0.9)] shrink-0"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Add Details
              </Button>
            </div>
          </motion.div>
        )}

        {/* Expandable Detailed Analysis */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="border-t pt-4">
            <p className="text-muted-foreground leading-relaxed">
              {shortSummary}{!isExpanded && hasMoreContent && "..."}
            </p>
            
            {hasMoreContent && (
              <>
                <CollapsibleContent className="mt-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {executiveSummary.substring(300)}
                  </p>
                </CollapsibleContent>
                
                <CollapsibleTrigger asChild>
                  <button className="mt-4 flex items-center gap-2 text-sm text-[hsl(var(--data-cyan))] hover:text-[hsl(var(--feasibility-orange))] transition-colors">
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                    {isExpanded ? "Show Less" : "Read Full Analysis"}
                  </button>
                </CollapsibleTrigger>
              </>
            )}
          </div>
        </Collapsible>
      </CardContent>

      {/* Cost Intake Modal */}
      {applicationId && (
        <CostIntakeModal
          open={showCostIntake}
          onOpenChange={setShowCostIntake}
          applicationId={applicationId}
          onSubmitSuccess={onCostEstimateRefresh}
        />
      )}
    </Card>
  );
}
