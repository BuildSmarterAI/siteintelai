/**
 * Geocoding Error Recovery Component - P4
 * Displays structured errors with actionable recovery suggestions
 */

import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GeocodingError, RecoveryAction, RecoveryActionType } from '@/types/geocodingErrors';

interface GeocodingErrorRecoveryProps {
  error: GeocodingError;
  onAction: (actionType: RecoveryActionType) => void;
  onDismiss?: () => void;
  className?: string;
}

const SEVERITY_STYLES = {
  error: {
    bg: 'bg-destructive/10 border-destructive/30',
    icon: AlertTriangle,
    iconColor: 'text-destructive',
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/30',
    icon: AlertCircle,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700/30',
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
};

function getIcon(iconName: string): React.ComponentType<{ className?: string }> {
  // Dynamic icon lookup from Lucide
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    Hash: LucideIcons.Hash,
    PenTool: LucideIcons.PenTool,
    Navigation: LucideIcons.Navigation,
    Edit: LucideIcons.Edit,
    SpellCheck: LucideIcons.SpellCheck2,
    MapPin: LucideIcons.MapPin,
    MessageCircle: LucideIcons.MessageCircle,
    RefreshCw: LucideIcons.RefreshCw,
    ArrowRight: LucideIcons.ArrowRight,
    HelpCircle: LucideIcons.HelpCircle,
  };
  return icons[iconName] || LucideIcons.HelpCircle;
}

function RecoveryActionButton({ 
  action, 
  onClick,
  compact = false
}: { 
  action: RecoveryAction; 
  onClick: () => void;
  compact?: boolean;
}) {
  const Icon = getIcon(action.icon);
  
  return (
    <Button
      variant={action.primary ? 'default' : 'outline'}
      size={compact ? 'sm' : 'default'}
      onClick={onClick}
      className={cn(
        'gap-2',
        action.primary && 'bg-primary hover:bg-primary/90'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{action.label}</span>
    </Button>
  );
}

export function GeocodingErrorRecovery({
  error,
  onAction,
  onDismiss,
  className,
}: GeocodingErrorRecoveryProps) {
  const styles = SEVERITY_STYLES[error.severity];
  const SeverityIcon = styles.icon;
  
  // Split suggestions into primary and secondary
  const primaryActions = error.suggestions.filter(s => s.primary);
  const secondaryActions = error.suggestions.filter(s => !s.primary);

  return (
    <Card className={cn('border', styles.bg, className)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <SeverityIcon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', styles.iconColor)} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-foreground">
                {error.title}
              </h4>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mr-2 -mt-1"
                  onClick={onDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mt-1">
              {error.message}
            </p>
            
            {error.details && (
              <p className="text-xs text-muted-foreground/70 mt-1 font-mono">
                {error.details}
              </p>
            )}
          </div>
        </div>

        {/* Recovery Actions */}
        {error.suggestions.length > 0 && (
          <div className="mt-4 space-y-3">
            {/* Primary actions */}
            {primaryActions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {primaryActions.map((action) => (
                  <RecoveryActionButton
                    key={action.type}
                    action={action}
                    onClick={() => onAction(action.type)}
                  />
                ))}
              </div>
            )}

            {/* Secondary actions */}
            {secondaryActions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {secondaryActions.slice(0, 3).map((action) => (
                  <RecoveryActionButton
                    key={action.type}
                    action={action}
                    onClick={() => onAction(action.type)}
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact inline error variant
 */
interface InlineErrorProps {
  message: string;
  severity?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  className?: string;
}

export function InlineError({ 
  message, 
  severity = 'error',
  onRetry,
  className 
}: InlineErrorProps) {
  const styles = SEVERITY_STYLES[severity];
  const SeverityIcon = styles.icon;

  return (
    <div className={cn(
      'flex items-center gap-2 text-sm px-3 py-2 rounded-md',
      styles.bg,
      className
    )}>
      <SeverityIcon className={cn('h-4 w-4 flex-shrink-0', styles.iconColor)} />
      <span className="flex-1 text-foreground/80">{message}</span>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="h-7 px-2"
        >
          Retry
        </Button>
      )}
    </div>
  );
}
