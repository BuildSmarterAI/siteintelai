/**
 * Address Components Preview - P6
 * Displays parsed address components with editable chips
 */

import { useState, useMemo } from 'react';
import { Check, AlertCircle, Edit2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EditableChip, Chip } from '@/components/ui/editable-chip';
import { cn } from '@/lib/utils';

export interface AddressComponents {
  streetNumber?: string;
  streetName?: string;
  streetSuffix?: string;
  unitType?: string;
  unitNumber?: string;
  city?: string;
  county?: string;
  state?: string;
  zip?: string;
  neighborhood?: string;
  formattedAddress?: string;
}

export interface AddressComponentEdit {
  field: keyof AddressComponents;
  originalValue: string;
  newValue: string;
}

interface AddressComponentsPreviewProps {
  components: AddressComponents;
  precision?: 'exact' | 'approximate' | 'low';
  source?: string;
  onConfirm: (components: AddressComponents, edits: AddressComponentEdit[]) => void;
  onCancel?: () => void;
  editable?: boolean;
  className?: string;
}

const COMPONENT_ORDER: (keyof AddressComponents)[] = [
  'streetNumber',
  'streetName',
  'streetSuffix',
  'unitType',
  'unitNumber',
  'city',
  'county',
  'state',
  'zip',
  'neighborhood',
];

const COMPONENT_LABELS: Record<keyof AddressComponents, string> = {
  streetNumber: 'Number',
  streetName: 'Street',
  streetSuffix: 'Suffix',
  unitType: 'Unit Type',
  unitNumber: 'Unit',
  city: 'City',
  county: 'County',
  state: 'State',
  zip: 'ZIP',
  neighborhood: 'Neighborhood',
  formattedAddress: 'Address',
};

// Fields that should be marked as uncertain if missing
const REQUIRED_FIELDS: (keyof AddressComponents)[] = [
  'streetNumber',
  'streetName',
  'city',
  'state',
  'zip',
];

export function AddressComponentsPreview({
  components: initialComponents,
  precision = 'exact',
  source,
  onConfirm,
  onCancel,
  editable = true,
  className,
}: AddressComponentsPreviewProps) {
  const [components, setComponents] = useState<AddressComponents>(initialComponents);
  const [edits, setEdits] = useState<AddressComponentEdit[]>([]);

  // Track which fields have been edited
  const editedFields = useMemo(() => {
    return new Set(edits.map(e => e.field));
  }, [edits]);

  // Calculate which fields are uncertain
  const uncertainFields = useMemo(() => {
    const uncertain = new Set<keyof AddressComponents>();
    
    // Mark required fields as uncertain if missing
    REQUIRED_FIELDS.forEach(field => {
      if (!components[field]) {
        uncertain.add(field);
      }
    });

    // If precision is low/approximate, mark more fields uncertain
    if (precision === 'low') {
      uncertain.add('streetNumber');
      uncertain.add('streetName');
    } else if (precision === 'approximate') {
      uncertain.add('streetNumber');
    }

    return uncertain;
  }, [components, precision]);

  const handleEdit = (field: keyof AddressComponents, newValue: string) => {
    const originalValue = initialComponents[field] || '';
    
    // Update components
    setComponents(prev => ({
      ...prev,
      [field]: newValue,
    }));

    // Track edit
    setEdits(prev => {
      // Remove existing edit for this field if any
      const filtered = prev.filter(e => e.field !== field);
      
      // Only add if value changed from original
      if (newValue !== originalValue) {
        return [...filtered, { field, originalValue, newValue }];
      }
      
      return filtered;
    });
  };

  const handleReset = () => {
    setComponents(initialComponents);
    setEdits([]);
  };

  const handleConfirm = () => {
    onConfirm(components, edits);
  };

  // Get non-empty components to display
  const displayComponents = COMPONENT_ORDER.filter(
    field => components[field] || uncertainFields.has(field)
  );

  const hasEdits = edits.length > 0;
  const hasUncertainFields = uncertainFields.size > 0;

  return (
    <Card className={cn('border-dashed', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Edit2 className="h-4 w-4 text-muted-foreground" />
            Verify Address Components
          </CardTitle>
          {source && (
            <span className="text-xs text-muted-foreground">
              Source: {source}
            </span>
          )}
        </div>

        {/* Precision indicator */}
        {precision !== 'exact' && (
          <div className={cn(
            'flex items-center gap-2 text-xs px-2 py-1 rounded-md',
            precision === 'approximate' 
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          )}>
            <AlertCircle className="h-3.5 w-3.5" />
            <span>
              {precision === 'approximate' 
                ? 'Approximate match — please verify details'
                : 'Low confidence — some fields may be incorrect'}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Formatted address */}
        {components.formattedAddress && (
          <div className="text-sm font-medium text-foreground border-b pb-2">
            {components.formattedAddress}
          </div>
        )}

        {/* Component chips */}
        <div className="flex flex-wrap gap-2">
          {displayComponents.map(field => (
            <EditableChip
              key={field}
              label={COMPONENT_LABELS[field]}
              value={components[field] || ''}
              onEdit={(newValue) => handleEdit(field, newValue)}
              editable={editable}
              uncertain={uncertainFields.has(field) && !editedFields.has(field)}
            />
          ))}
        </div>

        {/* Edit summary */}
        {hasEdits && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            {edits.length} field{edits.length > 1 ? 's' : ''} modified
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {hasEdits && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-muted-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={hasUncertainFields && edits.length === 0}
              className="gap-1"
            >
              <Check className="h-4 w-4" />
              {hasUncertainFields ? 'Confirm & Continue' : 'Use This Address'}
            </Button>
          </div>
        </div>

        {/* Warning for uncertain fields */}
        {hasUncertainFields && edits.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Please review highlighted fields before continuing
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact inline preview variant
 */
interface CompactAddressPreviewProps {
  components: AddressComponents;
  onEdit?: () => void;
  className?: string;
}

export function CompactAddressPreview({
  components,
  onEdit,
  className,
}: CompactAddressPreviewProps) {
  const mainComponents = [
    components.streetNumber,
    components.streetName,
    components.streetSuffix,
  ].filter(Boolean).join(' ');

  const secondaryComponents = [
    components.city,
    components.state,
    components.zip,
  ].filter(Boolean).join(', ');

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{mainComponents}</div>
        <div className="text-xs text-muted-foreground truncate">{secondaryComponents}</div>
      </div>
      {onEdit && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
