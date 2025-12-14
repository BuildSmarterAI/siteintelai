import { motion } from "framer-motion";
import { Target, CheckCircle, XCircle, AlertCircle, DollarSign, TrendingUp, Lightbulb, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DataGauge } from "./DataGauge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import DOMPurify from "dompurify";

interface ProjectFeasibilityCardProps {
  componentScore?: number;
  verdict?: string;
  zoningCompliance?: string;
  budgetAnalysis?: {
    estimated_hard_costs?: number;
    estimated_soft_costs?: number;
    budget_adequacy?: string;
  };
  useSpecificInsights?: string[];
  desiredBudget?: number;
  className?: string;
}

export function ProjectFeasibilityCard({
  componentScore = 0,
  verdict,
  zoningCompliance,
  budgetAnalysis,
  useSpecificInsights = [],
  desiredBudget,
  className,
}: ProjectFeasibilityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getComplianceStatus = (compliance?: string) => {
    if (!compliance) return { icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted" };
    switch (compliance.toLowerCase()) {
      case "permitted":
        return { icon: CheckCircle, color: "text-[hsl(var(--status-success))]", bg: "bg-[hsl(var(--status-success)/0.1)]" };
      case "conditional":
        return { icon: AlertCircle, color: "text-[hsl(var(--status-warning))]", bg: "bg-[hsl(var(--status-warning)/0.1)]" };
      default:
        return { icon: XCircle, color: "text-[hsl(var(--status-error))]", bg: "bg-[hsl(var(--status-error)/0.1)]" };
    }
  };

  const getBudgetStatus = (adequacy?: string) => {
    if (!adequacy) return { label: "Unknown", color: "bg-muted text-muted-foreground" };
    switch (adequacy.toLowerCase()) {
      case "adequate":
        return { label: "ADEQUATE", color: "bg-[hsl(var(--status-success))] text-white" };
      case "tight":
        return { label: "TIGHT", color: "bg-[hsl(var(--status-warning))] text-[hsl(var(--midnight-blue))]" };
      default:
        return { label: "INSUFFICIENT", color: "bg-[hsl(var(--status-error))] text-white" };
    }
  };

  const totalEstimatedCost = (budgetAnalysis?.estimated_hard_costs || 0) + (budgetAnalysis?.estimated_soft_costs || 0);
  const budgetProgress = desiredBudget && totalEstimatedCost ? Math.min((totalEstimatedCost / desiredBudget) * 100, 150) : 0;
  const budgetStatus = getBudgetStatus(budgetAnalysis?.budget_adequacy);
  const complianceStatus = getComplianceStatus(zoningCompliance);
  const ComplianceIcon = complianceStatus.icon;

  return (
    <Card className={cn("glass-card border-l-4 border-l-[hsl(var(--status-success))] overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-[hsl(var(--midnight-blue)/0.03)] to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[hsl(var(--status-success))]" />
            Project Feasibility Analysis
          </CardTitle>
          {componentScore > 0 && (
            <Badge className="bg-[hsl(var(--status-success))] text-white font-mono">
              Score: {componentScore}/100
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Score Gauge + Compliance Badges Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Score Gauge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring" }}
            className="flex flex-col items-center"
          >
            <DataGauge
              value={componentScore}
              label="Feasibility"
              size="lg"
              showValue={true}
            />
          </motion.div>

          {/* Compliance Badges */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Zoning Compliance */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={cn("p-3 rounded-lg border flex items-center gap-3", complianceStatus.bg)}
            >
              <ComplianceIcon className={cn("h-5 w-5", complianceStatus.color)} />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Zoning</p>
                <p className={cn("font-semibold text-sm", complianceStatus.color)}>
                  {zoningCompliance?.toUpperCase().replace(/_/g, " ") || "N/A"}
                </p>
              </div>
            </motion.div>

            {/* Budget Status */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="p-3 rounded-lg border bg-[hsl(var(--muted)/0.3)] flex items-center gap-3"
            >
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Budget</p>
                <Badge className={cn("font-semibold", budgetStatus.color)}>
                  {budgetStatus.label}
                </Badge>
              </div>
            </motion.div>

            {/* Project Viability */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "p-3 rounded-lg border flex items-center gap-3",
                componentScore >= 70 ? "bg-[hsl(var(--status-success)/0.1)]" : 
                componentScore >= 50 ? "bg-[hsl(var(--status-warning)/0.1)]" : 
                "bg-[hsl(var(--status-error)/0.1)]"
              )}
            >
              <TrendingUp className={cn(
                "h-5 w-5",
                componentScore >= 70 ? "text-[hsl(var(--status-success))]" : 
                componentScore >= 50 ? "text-[hsl(var(--status-warning))]" : 
                "text-[hsl(var(--status-error))]"
              )} />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Viability</p>
                <p className={cn(
                  "font-semibold text-sm",
                  componentScore >= 70 ? "text-[hsl(var(--status-success))]" : 
                  componentScore >= 50 ? "text-[hsl(var(--status-warning))]" : 
                  "text-[hsl(var(--status-error))]"
                )}>
                  {componentScore >= 70 ? "HIGH" : componentScore >= 50 ? "MODERATE" : "LOW"}
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Budget Visual */}
        {desiredBudget && totalEstimatedCost > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-4 bg-[hsl(var(--muted)/0.3)] rounded-lg border space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Budget Utilization</p>
              <span className="text-xs text-muted-foreground">
                ${(totalEstimatedCost / 1000000).toFixed(2)}M of ${(desiredBudget / 1000000).toFixed(2)}M
              </span>
            </div>
            <Progress 
              value={Math.min(budgetProgress, 100)} 
              className={cn(
                "h-3",
                budgetProgress > 100 && "[&>div]:bg-[hsl(var(--status-error))]"
              )}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Estimated: ${(totalEstimatedCost / 1000000).toFixed(2)}M</span>
              <span className={cn(
                "font-semibold",
                budgetProgress <= 80 ? "text-[hsl(var(--status-success))]" :
                budgetProgress <= 100 ? "text-[hsl(var(--status-warning))]" :
                "text-[hsl(var(--status-error))]"
              )}>
                {Math.round(budgetProgress)}% of budget
              </span>
            </div>
          </motion.div>
        )}

        {/* Use-Specific Insights */}
        {useSpecificInsights.length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--data-cyan))] hover:text-[hsl(var(--feasibility-orange))] transition-colors w-full">
              <Lightbulb className="h-4 w-4" />
              <span>Use-Specific Insights ({useSpecificInsights.length})</span>
              <ChevronDown className={cn("h-4 w-4 ml-auto transition-transform", isExpanded && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="space-y-2 pl-6 border-l-2 border-[hsl(var(--data-cyan)/0.3)]">
                {useSpecificInsights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="text-[hsl(var(--data-cyan))]">•</span>
                    <span>{insight}</span>
                  </motion.div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* AI Verdict */}
        {verdict && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-gradient-to-r from-[hsl(var(--midnight-blue)/0.05)] to-transparent rounded-lg border"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--feasibility-orange))] animate-pulse" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">AI Recommendation</p>
            </div>
            <div 
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(verdict) }}
            />
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
