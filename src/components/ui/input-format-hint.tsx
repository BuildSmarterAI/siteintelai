/**
 * Input Format Hint Component - P2
 * Displays real-time validation feedback with hints
 */

import { Check, AlertCircle, Info, MapPin, Hash, Crosshair, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ValidationResult, InputFormat } from '@/lib/inputFormatValidation';

interface InputFormatHintProps {
  validation: ValidationResult | null;
  className?: string;
  showIcon?: boolean;
}

const FORMAT_ICONS: Record<InputFormat, React.ReactNode> = {
  address: <MapPin className="h-3.5 w-3.5" />,
  coordinates: <Crosshair className="h-3.5 w-3.5" />,
  apn: <Hash className="h-3.5 w-3.5" />,
  intersection: <Navigation className="h-3.5 w-3.5" />,
  unknown: <Info className="h-3.5 w-3.5" />,
};

const FORMAT_LABELS: Record<InputFormat, string> = {
  address: 'Address',
  coordinates: 'Coordinates',
  apn: 'Parcel ID',
  intersection: 'Intersection',
  unknown: 'Unknown',
};

export function InputFormatHint({ 
  validation, 
  className,
  showIcon = true 
}: InputFormatHintProps) {
  if (!validation) return null;

  const { isValid, format, hint, example, confidence } = validation;

  // Don't show anything for unknown format with low confidence
  if (format === 'unknown' && confidence === 'low' && !hint) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs transition-all duration-200',
        isValid 
          ? 'text-green-600 dark:text-green-400' 
          : confidence === 'medium'
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-muted-foreground',
        className
      )}
    >
      {/* Status icon */}
      {showIcon && (
        <span className="flex-shrink-0">
          {isValid ? (
            <Check className="h-3.5 w-3.5" />
          ) : confidence === 'medium' ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : (
            FORMAT_ICONS[format]
          )}
        </span>
      )}

      {/* Format label */}
      {format !== 'unknown' && (
        <span className={cn(
          'font-medium',
          isValid && 'text-green-600 dark:text-green-400'
        )}>
          {FORMAT_LABELS[format]}
        </span>
      )}

      {/* Hint text */}
      {hint && (
        <span className="text-muted-foreground">
          {hint}
        </span>
      )}

      {/* Example */}
      {example && !isValid && (
        <span className="text-muted-foreground/70 font-mono text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">
          e.g., {example}
        </span>
      )}
    </div>
  );
}

/**
 * Compact badge variant for inline display
 */
interface FormatBadgeProps {
  format: InputFormat;
  isValid: boolean;
  county?: string;
  className?: string;
}

export function FormatBadge({ format, isValid, county, className }: FormatBadgeProps) {
  if (format === 'unknown') return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
        isValid
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        className
      )}
    >
      {FORMAT_ICONS[format]}
      <span>{county || FORMAT_LABELS[format]}</span>
      {isValid && <Check className="h-3 w-3" />}
    </span>
  );
}
