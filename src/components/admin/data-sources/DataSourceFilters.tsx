import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Filters {
  jurisdiction?: string;
  dataset_family?: string;
  is_active?: boolean;
  accuracy_tier?: string;
}

interface DataSourceFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  options: {
    jurisdictions: string[];
    families: string[];
    tiers: string[];
  };
}

export function DataSourceFilters({
  filters,
  onFiltersChange,
  options,
}: DataSourceFiltersProps) {
  const hasFilters = Object.values(filters).some((v) => v !== undefined);

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={filters.jurisdiction || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            jurisdiction: value === 'all' ? undefined : value,
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Jurisdiction" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Jurisdictions</SelectItem>
          {options.jurisdictions.map((j) => (
            <SelectItem key={j} value={j}>
              {j}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.dataset_family || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            dataset_family: value === 'all' ? undefined : value,
          })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Family" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Families</SelectItem>
          {options.families.map((f) => (
            <SelectItem key={f} value={f}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.accuracy_tier || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            accuracy_tier: value === 'all' ? undefined : value,
          })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Tier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tiers</SelectItem>
          {options.tiers.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.is_active === undefined ? 'all' : filters.is_active ? 'active' : 'inactive'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            is_active: value === 'all' ? undefined : value === 'active',
          })
        }
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
