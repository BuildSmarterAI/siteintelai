import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle, Info, ExternalLink, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type KillFactorSeverity = "deal_killer" | "conditional" | "advisory";
export type KillFactorStatus = "FAIL" | "WARN" | "PASS";

export interface KillFactorItem {
  id: string;
  title: string;
  status: KillFactorStatus;
  impact: string;
  requiredAction?: string;
  confidence: number;
  source: string;
  sourceUrl?: string;
  geometryType?: string; // For map sync
}

interface KillFactorPanelProps {
  dealKillers: KillFactorItem[];
  conditionalRisks: KillFactorItem[];
  advisoryNotes: KillFactorItem[];
  onItemClick?: (item: KillFactorItem) => void;
}

const statusConfig: Record<KillFactorStatus, {
  label: string;
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  FAIL: {
    label: "FAIL",
    icon: <AlertTriangle className="h-4 w-4" />,
    bgClass: "bg-[hsl(var(--verdict-blocked-bg))]",
    textClass: "text-[hsl(var(--verdict-blocked))]",
    borderClass: "border-[hsl(var(--verdict-blocked)/0.3)]",
  },
  WARN: {
    label: "WARN",
    icon: <AlertCircle className="h-4 w-4" />,
    bgClass: "bg-[hsl(var(--verdict-conditional-bg))]",
    textClass: "text-[hsl(var(--verdict-conditional))]",
    borderClass: "border-[hsl(var(--verdict-conditional)/0.3)]",
  },
  PASS: {
    label: "PASS",
    icon: <Shield className="h-4 w-4" />,
    bgClass: "bg-[hsl(var(--verdict-proceed-bg))]",
    textClass: "text-[hsl(var(--verdict-proceed))]",
    borderClass: "border-[hsl(var(--verdict-proceed)/0.3)]",
  },
};

function KillFactorRow({ 
  item, 
  index, 
  onClick 
}: { 
  item: KillFactorItem; 
  index: number;
  onClick?: () => void;
}) {
  const config = statusConfig[item.status];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg border p-4 transition-all",
        config.borderClass,
        onClick && "cursor-pointer hover:shadow-md hover:border-[hsl(var(--primary)/0.5)]"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn("p-1.5 rounded-lg shrink-0", config.bgClass)}>
            <span className={config.textClass}>{config.icon}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground">{item.title}</h4>
              <Badge 
                variant="outline" 
                className={cn("text-xs font-mono", config.textClass, config.borderClass)}
              >
                {config.label}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              <span className="font-medium text-foreground">Impact:</span> {item.impact}
            </p>
            
            {item.requiredAction && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Action:</span> {item.requiredAction}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all", config.textClass.replace("text-", "bg-"))}
                style={{ width: `${item.confidence}%` }}
              />
            </div>
            <span className="font-mono w-8">{item.confidence}%</span>
          </div>
          
          <a 
            href={item.sourceUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[hsl(var(--data-cyan))] hover:underline"
          >
            {item.source}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function SectionHeader({ 
  title, 
  count, 
  severity 
}: { 
  title: string; 
  count: number; 
  severity: KillFactorSeverity;
}) {
  const colorMap: Record<KillFactorSeverity, string> = {
    deal_killer: "text-[hsl(var(--verdict-blocked))]",
    conditional: "text-[hsl(var(--verdict-conditional))]",
    advisory: "text-[hsl(var(--data-cyan))]",
  };
  
  return (
    <div className="flex items-center gap-2 mb-3">
      <h3 className={cn("text-lg font-semibold font-heading", colorMap[severity])}>
        {title}
      </h3>
      <Badge variant="secondary" className="rounded-full text-xs">
        {count}
      </Badge>
    </div>
  );
}

export function KillFactorPanel({
  dealKillers,
  conditionalRisks,
  advisoryNotes,
  onItemClick,
}: KillFactorPanelProps) {
  const totalIssues = dealKillers.length + conditionalRisks.length + advisoryNotes.length;
  
  if (totalIssues === 0) {
    return (
      <div id="section-kill-factors" className="bg-[hsl(var(--verdict-proceed-bg))] border border-[hsl(var(--verdict-proceed)/0.3)] rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[hsl(var(--verdict-proceed)/0.2)]">
            <Shield className="h-5 w-5 text-[hsl(var(--verdict-proceed))]" />
          </div>
          <div>
            <h3 className="font-semibold text-[hsl(var(--verdict-proceed))]">No Kill Factors Detected</h3>
            <p className="text-sm text-muted-foreground">All critical constraints passed initial screening.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div id="section-kill-factors" className="space-y-6">
      {/* Deal Killers */}
      {dealKillers.length > 0 && (
        <div className="bg-[hsl(var(--verdict-blocked-bg))] border border-[hsl(var(--verdict-blocked)/0.2)] rounded-xl p-5">
          <SectionHeader title="Deal-Killers" count={dealKillers.length} severity="deal_killer" />
          <div className="space-y-3">
            {dealKillers.map((item, i) => (
              <KillFactorRow 
                key={item.id} 
                item={item} 
                index={i} 
                onClick={onItemClick ? () => onItemClick(item) : undefined}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Conditional Risks */}
      {conditionalRisks.length > 0 && (
        <div className="bg-[hsl(var(--verdict-conditional-bg))] border border-[hsl(var(--verdict-conditional)/0.2)] rounded-xl p-5">
          <SectionHeader title="Conditional Risks" count={conditionalRisks.length} severity="conditional" />
          <div className="space-y-3">
            {conditionalRisks.map((item, i) => (
              <KillFactorRow 
                key={item.id} 
                item={item} 
                index={i}
                onClick={onItemClick ? () => onItemClick(item) : undefined}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Advisory Notes */}
      {advisoryNotes.length > 0 && (
        <div className="bg-[hsl(var(--surface-sunken))] border border-[hsl(var(--border-subtle))] rounded-xl p-5">
          <SectionHeader title="Advisory Notes" count={advisoryNotes.length} severity="advisory" />
          <div className="space-y-3">
            {advisoryNotes.map((item, i) => (
              <KillFactorRow 
                key={item.id} 
                item={item} 
                index={i}
                onClick={onItemClick ? () => onItemClick(item) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
