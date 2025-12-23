/**
 * Recent Searches Dropdown - P5
 * Displays recent searches and favorites with quick actions
 */

import { useState } from 'react';
import { 
  Clock, 
  Star, 
  StarOff, 
  Trash2, 
  MapPin, 
  Hash, 
  Crosshair, 
  Navigation,
  ChevronDown,
  History 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { SavedLocation, SearchQueryType } from '@/hooks/useSearchHistory';

interface RecentSearchesDropdownProps {
  recentSearches: SavedLocation[];
  favorites: SavedLocation[];
  onSelect: (search: SavedLocation) => void;
  onToggleFavorite: (id: string) => void;
  onRemove: (id: string) => void;
  onClearHistory?: () => void;
  className?: string;
  disabled?: boolean;
}

const QUERY_TYPE_ICONS: Record<SearchQueryType, React.ReactNode> = {
  address: <MapPin className="h-3.5 w-3.5" />,
  apn: <Hash className="h-3.5 w-3.5" />,
  coordinates: <Crosshair className="h-3.5 w-3.5" />,
  intersection: <Navigation className="h-3.5 w-3.5" />,
  draw: <MapPin className="h-3.5 w-3.5" />,
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function SearchItem({
  search,
  onSelect,
  onToggleFavorite,
  onRemove,
}: {
  search: SavedLocation;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onRemove: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="group relative flex items-center gap-2 px-2 py-2 hover:bg-accent rounded-md cursor-pointer transition-colors"
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Query type icon */}
      <span className="flex-shrink-0 text-muted-foreground">
        {QUERY_TYPE_ICONS[search.queryType]}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {search.label}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatTimeAgo(search.lastUsedAt)}</span>
          {search.county && (
            <>
              <span>•</span>
              <span>{search.county}</span>
            </>
          )}
          {search.useCount > 1 && (
            <>
              <span>•</span>
              <span>{search.useCount}×</span>
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div 
        className={cn(
          'flex items-center gap-1 transition-opacity',
          showActions ? 'opacity-100' : 'opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onToggleFavorite}
          title={search.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {search.isFavorite ? (
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          ) : (
            <StarOff className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          title="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function RecentSearchesDropdown({
  recentSearches,
  favorites,
  onSelect,
  onToggleFavorite,
  onRemove,
  onClearHistory,
  className,
  disabled,
}: RecentSearchesDropdownProps) {
  const hasHistory = recentSearches.length > 0 || favorites.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn('relative', className)}
          disabled={disabled || !hasHistory}
          title="Recent searches"
        >
          <History className="h-4 w-4" />
          {hasHistory && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <ScrollArea className="max-h-[400px]">
          {/* Favorites section */}
          {favorites.length > 0 && (
            <>
              <DropdownMenuLabel className="flex items-center gap-2 text-xs">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                Favorites
              </DropdownMenuLabel>
              <div className="px-1">
                {favorites.map((search) => (
                  <SearchItem
                    key={search.id}
                    search={search}
                    onSelect={() => onSelect(search)}
                    onToggleFavorite={() => onToggleFavorite(search.id)}
                    onRemove={() => onRemove(search.id)}
                  />
                ))}
              </div>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Recent searches section */}
          {recentSearches.length > 0 && (
            <>
              <DropdownMenuLabel className="flex items-center gap-2 text-xs">
                <Clock className="h-3.5 w-3.5" />
                Recent
              </DropdownMenuLabel>
              <div className="px-1">
                {recentSearches.map((search) => (
                  <SearchItem
                    key={search.id}
                    search={search}
                    onSelect={() => onSelect(search)}
                    onToggleFavorite={() => onToggleFavorite(search.id)}
                    onRemove={() => onRemove(search.id)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Clear history */}
          {onClearHistory && recentSearches.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-muted-foreground text-xs justify-center"
                onClick={onClearHistory}
              >
                Clear recent history
              </DropdownMenuItem>
            </>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Inline recent searches list (for expanded view)
 */
interface RecentSearchesListProps {
  searches: SavedLocation[];
  onSelect: (search: SavedLocation) => void;
  maxItems?: number;
  className?: string;
}

export function RecentSearchesList({
  searches,
  onSelect,
  maxItems = 5,
  className,
}: RecentSearchesListProps) {
  if (searches.length === 0) return null;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <Clock className="h-3 w-3" />
        <span>Recent</span>
      </div>
      {searches.slice(0, maxItems).map((search) => (
        <button
          key={search.id}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-accent rounded transition-colors"
          onClick={() => onSelect(search)}
        >
          <span className="text-muted-foreground">
            {QUERY_TYPE_ICONS[search.queryType]}
          </span>
          <span className="truncate flex-1">{search.label}</span>
          {search.isFavorite && (
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          )}
        </button>
      ))}
    </div>
  );
}
