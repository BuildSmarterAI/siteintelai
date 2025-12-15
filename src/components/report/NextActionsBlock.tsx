import { motion } from "framer-motion";
import { CheckCircle2, Circle, User, Building2, Landmark, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type ActionOwner = "developer" | "lender" | "consultant" | "government";

export interface NextAction {
  id: string;
  label: string;
  owner: ActionOwner;
  isComplete?: boolean;
  priority: 1 | 2 | 3;
}

interface NextActionsBlockProps {
  actions: NextAction[];
  verdictType: "PROCEED" | "CONDITIONAL" | "DO_NOT_PROCEED";
}

const ownerConfig: Record<ActionOwner, {
  label: string;
  icon: React.ReactNode;
  color: string;
}> = {
  developer: {
    label: "Developer",
    icon: <Building2 className="h-3.5 w-3.5" />,
    color: "bg-[hsl(var(--feasibility-orange)/0.1)] text-[hsl(var(--feasibility-orange))] border-[hsl(var(--feasibility-orange)/0.3)]",
  },
  lender: {
    label: "Lender",
    icon: <Landmark className="h-3.5 w-3.5" />,
    color: "bg-[hsl(var(--data-cyan)/0.1)] text-[hsl(var(--data-cyan))] border-[hsl(var(--data-cyan)/0.3)]",
  },
  consultant: {
    label: "Consultant",
    icon: <User className="h-3.5 w-3.5" />,
    color: "bg-[hsl(var(--midnight-blue)/0.1)] text-[hsl(var(--midnight-blue))] border-[hsl(var(--midnight-blue)/0.3)]",
  },
  government: {
    label: "Government",
    icon: <FileCheck className="h-3.5 w-3.5" />,
    color: "bg-[hsl(var(--status-info)/0.1)] text-[hsl(var(--status-info))] border-[hsl(var(--status-info)/0.3)]",
  },
};

function ActionRow({ action, index }: { action: NextAction; index: number }) {
  const owner = ownerConfig[action.owner];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border bg-white",
        action.isComplete 
          ? "border-[hsl(var(--verdict-proceed)/0.3)] opacity-60" 
          : "border-[hsl(var(--border-subtle))]"
      )}
    >
      <div className="shrink-0 pt-0.5">
        {action.isComplete ? (
          <CheckCircle2 className="h-5 w-5 text-[hsl(var(--verdict-proceed))]" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "text-sm font-medium",
            action.isComplete ? "line-through text-muted-foreground" : "text-foreground"
          )}>
            {action.label}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={cn("text-xs gap-1", owner.color)}
          >
            {owner.icon}
            {owner.label}
          </Badge>
          
          <Badge 
            variant="secondary"
            className="text-xs"
          >
            P{action.priority}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}

export function NextActionsBlock({ actions, verdictType }: NextActionsBlockProps) {
  // Limit to top 3 actions, sorted by priority
  const sortedActions = [...actions]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);
  
  const headerColorMap: Record<string, string> = {
    PROCEED: "text-[hsl(var(--verdict-proceed))]",
    CONDITIONAL: "text-[hsl(var(--verdict-conditional))]",
    DO_NOT_PROCEED: "text-[hsl(var(--verdict-blocked))]",
  };
  
  const bgColorMap: Record<string, string> = {
    PROCEED: "bg-[hsl(var(--verdict-proceed-bg))]",
    CONDITIONAL: "bg-[hsl(var(--verdict-conditional-bg))]",
    DO_NOT_PROCEED: "bg-[hsl(var(--verdict-blocked-bg))]",
  };
  
  return (
    <div className={cn(
      "rounded-xl border p-5",
      verdictType === "CONDITIONAL" 
        ? "border-[hsl(var(--verdict-conditional)/0.3)] " + bgColorMap[verdictType]
        : "border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-sunken))]"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <FileCheck className={cn("h-5 w-5", headerColorMap[verdictType])} />
        <h3 className={cn("text-lg font-semibold font-heading", headerColorMap[verdictType])}>
          {verdictType === "CONDITIONAL" ? "Required Actions" : "Next Steps"}
        </h3>
        {verdictType === "CONDITIONAL" && (
          <Badge variant="outline" className="text-xs bg-white">
            Before Proceeding
          </Badge>
        )}
      </div>
      
      {sortedActions.length > 0 ? (
        <div className="space-y-3">
          {sortedActions.map((action, i) => (
            <ActionRow key={action.id} action={action} index={i} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic p-3">
          No immediate actions required.
        </p>
      )}
    </div>
  );
}
