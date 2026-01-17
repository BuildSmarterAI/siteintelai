/**
 * Building Model Gallery
 * Visual grid of 3D building models for selection
 */

import { useMemo, useState } from 'react';
import { useBuildingModels, type BuildingModel } from '@/hooks/useBuildingModels';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Building2, Sparkles, Loader2 } from 'lucide-react';

interface BuildingModelGalleryProps {
  archetypeId: string | null;
  selectedModelId: string | null;
  onSelectModel: (modelId: string | null) => void;
}

type StyleFilter = 'all' | 'modern' | 'traditional' | 'industrial' | 'mixed';

const STYLE_LABELS: Record<StyleFilter, string> = {
  all: 'All',
  modern: 'Modern',
  traditional: 'Traditional',
  industrial: 'Industrial',
  mixed: 'Mixed',
};

export function BuildingModelGallery({
  archetypeId,
  selectedModelId,
  onSelectModel,
}: BuildingModelGalleryProps) {
  const { data: models, isLoading, error } = useBuildingModels(archetypeId);
  const [styleFilter, setStyleFilter] = useState<StyleFilter>('all');

  // Filter models by style
  const filteredModels = useMemo(() => {
    if (!models) return [];
    if (styleFilter === 'all') return models;
    return models.filter((m) => m.style === styleFilter);
  }, [models, styleFilter]);

  // Get available styles from models
  const availableStyles = useMemo(() => {
    if (!models) return ['all'];
    const styles = new Set(models.map((m) => m.style));
    return ['all', ...Array.from(styles)] as StyleFilter[];
  }, [models]);

  if (!archetypeId) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Select a building type above to see available 3D models
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading 3D models...
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive text-sm">
        Failed to load 3D models. Please try again.
      </div>
    );
  }

  if (!models || models.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No 3D models available for this building type yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          3D Models
        </h4>
        <Badge variant="secondary" className="text-xs">
          {models.length} available
        </Badge>
      </div>

      {/* Style Filter */}
      {availableStyles.length > 2 && (
        <Tabs
          value={styleFilter}
          onValueChange={(v) => setStyleFilter(v as StyleFilter)}
          className="w-full"
        >
          <TabsList className="w-full h-8">
            {availableStyles.map((style) => (
              <TabsTrigger
                key={style}
                value={style}
                className="text-xs flex-1"
              >
                {STYLE_LABELS[style]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Model Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredModels.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            isSelected={selectedModelId === model.id}
            onSelect={() => onSelectModel(model.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ModelCardProps {
  model: BuildingModel;
  isSelected: boolean;
  onSelect: () => void;
}

function ModelCard({ model, isSelected, onSelect }: ModelCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onSelect}
            className={cn(
              'relative rounded-lg border-2 p-3 text-left transition-all',
              'hover:border-primary/50 hover:bg-muted/50',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              isSelected
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border bg-card'
            )}
          >
            {/* Featured badge */}
            {model.is_featured && (
              <div className="absolute -top-2 -right-2">
                <Badge
                  variant="default"
                  className="h-5 px-1.5 text-[10px] bg-primary"
                >
                  <Sparkles className="h-3 w-3 mr-0.5" />
                  Featured
                </Badge>
              </div>
            )}

            {/* Thumbnail placeholder */}
            <div className="aspect-video mb-2 rounded bg-muted/50 flex items-center justify-center overflow-hidden">
              {model.thumbnail_url ? (
                <img
                  src={model.thumbnail_url}
                  alt={model.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground/50" />
              )}
            </div>

            {/* Model info */}
            <div className="space-y-1">
              <p className="text-xs font-medium truncate">{model.name}</p>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="capitalize">{model.style}</span>
                <span>
                  {model.base_width_ft}×{model.base_depth_ft} ft
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {model.base_stories} {model.base_stories === 1 ? 'story' : 'stories'} • {model.base_height_ft} ft
              </div>
            </div>

            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute bottom-2 right-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <div className="space-y-1">
            <p className="font-medium text-sm">{model.name}</p>
            {model.description && (
              <p className="text-xs text-muted-foreground">{model.description}</p>
            )}
            <div className="text-xs">
              <span className="text-muted-foreground">Dimensions: </span>
              {model.base_width_ft}′ × {model.base_depth_ft}′ × {model.base_height_ft}′ H
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
