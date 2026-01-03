/**
 * Template Card Component
 * Displays a single template with scoring, compliance, and actions
 */

import { cn } from '@/lib/utils';
import type { DesignTemplate, TemplateScore, ComplianceStatus } from '@/types/wizard';
import * as Icons from 'lucide-react';
import { Check, Plus, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TemplateCardProps {
  template: DesignTemplate;
  score: TemplateScore;
  isSelected: boolean;
  onHover: (templateKey: string | null) => void;
  onAdd: () => void;
  onRemove: () => void;
}

const complianceConfig: Record<ComplianceStatus, { 
  icon: React.ElementType; 
  color: string; 
  bgColor: string;
}> = {
  PASS: { 
    icon: CheckCircle2, 
    color: 'text-emerald-600', 
    bgColor: 'bg-emerald-500/10' 
  },
  WARN: { 
    icon: AlertTriangle, 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-500/10' 
  },
  FAIL: { 
    icon: XCircle, 
    color: 'text-red-600', 
    bgColor: 'bg-red-500/10' 
  },
};

export function TemplateCard({
  template,
  score,
  isSelected,
  onHover,
  onAdd,
  onRemove,
}: TemplateCardProps) {
  const IconComponent = (Icons as any)[template.render_icon] || Icons.Building;
  const compliance = complianceConfig[score.complianceStatus];
  const ComplianceIcon = compliance.icon;
  
  const isFail = score.complianceStatus === 'FAIL';
  
  return (
    <div
      className={cn(
        "group relative p-3 rounded-lg border transition-all cursor-pointer",
        isSelected && "border-primary bg-primary/5",
        !isSelected && !isFail && "border-border hover:border-muted-foreground/50 hover:bg-muted/30",
        isFail && !isSelected && "border-red-500/30 bg-red-500/5 opacity-75"
      )}
      onMouseEnter={() => onHover(template.template_key)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0",
          isSelected ? "bg-primary/20" : "bg-muted"
        )}>
          <IconComponent className={cn(
            "h-5 w-5",
            isSelected ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className={cn(
                "font-medium text-sm truncate",
                isFail && "text-muted-foreground"
              )}>
                {template.name}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {template.description}
              </p>
            </div>
            
            {/* Compliance Badge */}
            <Badge 
              variant="outline" 
              className={cn(
                "flex-shrink-0 gap-1 text-xs px-1.5",
                compliance.bgColor,
                compliance.color
              )}
            >
              <ComplianceIcon className="h-3 w-3" />
              {score.complianceStatus}
            </Badge>
          </div>
          
          {/* Metrics */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{(score.estimatedGfa / 1000).toFixed(0)}K SF</span>
            <span className="w-px h-3 bg-border" />
            <span>FAR {score.estimatedFar}</span>
            <span className="w-px h-3 bg-border" />
            <span>{Math.round(score.estimatedHeight)}'</span>
          </div>
          
          {/* Score Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  score.finalScore >= 70 ? "bg-emerald-500" :
                  score.finalScore >= 40 ? "bg-amber-500" : "bg-red-500"
                )}
                style={{ width: `${score.finalScore}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-8">
              {score.finalScore}%
            </span>
          </div>
        </div>
        
        {/* Action Button */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {isSelected ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Check className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={isFail}
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
