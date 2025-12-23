/**
 * Editable Chip Component - P6
 * Clickable chip that allows inline editing
 */

import { useState, useRef, useEffect } from 'react';
import { Check, X, Pencil, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EditableChipProps {
  label: string;
  value: string;
  onEdit?: (newValue: string) => void;
  editable?: boolean;
  uncertain?: boolean;
  className?: string;
}

export function EditableChip({
  label,
  value,
  onEdit,
  editable = true,
  uncertain = false,
  className,
}: EditableChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    if (editValue.trim() && editValue !== value) {
      onEdit?.(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn('inline-flex items-center gap-1', className)}>
        <span className="text-xs text-muted-foreground">{label}:</span>
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-6 w-32 text-xs px-2 py-0"
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5"
          onClick={handleSave}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5"
          onClick={handleCancel}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => editable && setIsEditing(true)}
      disabled={!editable}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors',
        uncertain
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
          : 'bg-muted text-muted-foreground',
        editable && 'hover:bg-accent cursor-pointer group',
        !editable && 'cursor-default',
        className
      )}
    >
      <span className="font-medium">{label}:</span>
      <span className={cn(
        'font-normal',
        uncertain && 'italic'
      )}>
        {value || '—'}
      </span>
      {uncertain && (
        <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
      )}
      {editable && !uncertain && (
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

/**
 * Read-only chip variant
 */
interface ChipProps {
  label: string;
  value: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function Chip({ label, value, variant = 'default', className }: ChipProps) {
  const variantStyles = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
        variantStyles[variant],
        className
      )}
    >
      <span className="font-medium">{label}:</span>
      <span className="font-normal">{value || '—'}</span>
    </span>
  );
}
