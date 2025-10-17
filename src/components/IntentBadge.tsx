import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntentBadgeProps {
  intentType: 'build' | 'buy';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function IntentBadge({ intentType, size = 'md', showIcon = true, className }: IntentBadgeProps) {
  const config = {
    build: {
      label: 'Build / Develop',
      icon: Building2,
      className: 'bg-primary/10 text-primary border-primary/20'
    },
    buy: {
      label: 'Buy / Invest',
      icon: DollarSign,
      className: 'bg-accent/10 text-accent border-accent/20'
    }
  }[intentType];
  
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.className,
        {
          'text-xs px-2 py-0.5': size === 'sm',
          'text-sm px-3 py-1': size === 'md',
          'text-base px-4 py-1.5': size === 'lg',
        },
        className
      )}
    >
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
