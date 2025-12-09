import { cn } from '@/lib/utils';
import { 
  MapPin, 
  Droplets, 
  Zap, 
  TreeDeciduous, 
  Car, 
  Building2, 
  Mountain,
  Shield,
  HelpCircle
} from 'lucide-react';

interface DatasetFamilyBadgeProps {
  family: string | null;
  className?: string;
}

const familyConfig: Record<string, { icon: typeof MapPin; color: string; label: string }> = {
  parcels: { icon: MapPin, color: 'bg-blue-500/20 text-blue-600 border-blue-500/30', label: 'Parcels' },
  flood: { icon: Droplets, color: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30', label: 'Flood' },
  utilities: { icon: Zap, color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30', label: 'Utilities' },
  wetlands: { icon: TreeDeciduous, color: 'bg-green-500/20 text-green-600 border-green-500/30', label: 'Wetlands' },
  traffic: { icon: Car, color: 'bg-orange-500/20 text-orange-600 border-orange-500/30', label: 'Traffic' },
  zoning: { icon: Building2, color: 'bg-purple-500/20 text-purple-600 border-purple-500/30', label: 'Zoning' },
  topo: { icon: Mountain, color: 'bg-stone-500/20 text-stone-600 border-stone-500/30', label: 'Topography' },
  environmental: { icon: Shield, color: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30', label: 'Environmental' },
};

export function DatasetFamilyBadge({ family, className }: DatasetFamilyBadgeProps) {
  const config = family ? familyConfig[family] : null;
  const Icon = config?.icon || HelpCircle;
  const color = config?.color || 'bg-muted text-muted-foreground border-border';
  const label = config?.label || family || 'Other';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border',
        color,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
