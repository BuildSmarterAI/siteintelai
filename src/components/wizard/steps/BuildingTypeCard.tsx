/**
 * Building Type Card
 * Displays a building archetype as a selectable card
 */

import { Check, Building2, Store, ShoppingBag, Stethoscope, Warehouse, Home, Hotel, UtensilsCrossed } from 'lucide-react';
import type { BuildingTypeArchetype } from '@/types/buildingTypes';
import { YIELD_COLORS, RISK_COLORS, CATEGORY_CONFIG } from '@/lib/archetypes/buildingTypeRegistry';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Icon mapping for building types
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Store,
  ShoppingBag,
  Stethoscope,
  Warehouse,
  Home,
  Hotel,
  UtensilsCrossed,
};

interface BuildingTypeCardProps {
  archetype: BuildingTypeArchetype;
  isSelected: boolean;
  onSelect: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
}

export function BuildingTypeCard({
  archetype,
  isSelected,
  onSelect,
  onHover,
  onHoverEnd,
}: BuildingTypeCardProps) {
  // Dynamic icon lookup
  const IconComponent = ICON_MAP[archetype.icon] || Building2;
  
  // Format stories display
  const storiesDisplay = typeof archetype.typicalStories === 'number'
    ? `${archetype.typicalStories} story`
    : `${archetype.typicalStories[0]}-${archetype.typicalStories[1]} stories`;

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all duration-200',
        'hover:shadow-md hover:border-primary/50',
        'focus:outline-none focus:ring-2 focus:ring-primary/20',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-card hover:bg-accent/50'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          <IconComponent className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm truncate">{archetype.name}</h4>
            {isSelected && (
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
            )}
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {archetype.description}
          </p>
          
          {/* Badges */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {storiesDisplay}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {CATEGORY_CONFIG[archetype.category].label}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn('text-[10px] px-1.5 py-0', YIELD_COLORS[archetype.yieldProfile])}
            >
              Yield: {archetype.yieldProfile}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn('text-[10px] px-1.5 py-0', RISK_COLORS[archetype.riskProfile])}
            >
              Risk: {archetype.riskProfile}
            </Badge>
          </div>
        </div>
      </div>
    </button>
  );
}
