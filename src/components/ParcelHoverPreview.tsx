import { motion } from 'framer-motion';
import { MapPin, User, Ruler, Building, Globe, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ParcelHoverPreviewProps {
  parcel: {
    id?: string;
    parcel_id?: string;
    address?: string;
    situs_address?: string;
    owner?: string;
    owner_name?: string;
    acreage?: number;
    zoning?: string;
    land_use_desc?: string;
    jurisdiction?: string;
    source?: 'canonical' | 'external';
  } | null;
  position: { x: number; y: number } | null;
  isInComparison?: boolean;
}

export function ParcelHoverPreview({ parcel, position, isInComparison }: ParcelHoverPreviewProps) {
  if (!parcel || !position) return null;

  // Support both field naming conventions
  const id = parcel.parcel_id || parcel.id;
  const address = parcel.situs_address || parcel.address;
  const owner = parcel.owner_name || parcel.owner;
  const landUse = parcel.land_use_desc || parcel.zoning;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.15 }}
      className="fixed z-50 pointer-events-none"
      style={{ 
        left: Math.min(position.x + 16, window.innerWidth - 300), 
        top: Math.min(position.y - 10, window.innerHeight - 250),
        maxWidth: 280
      }}
    >
      <Card className="p-3 bg-background/95 backdrop-blur-sm shadow-xl border-primary/20">
        <div className="space-y-2">
          {/* Address */}
          {address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm font-medium line-clamp-2">{address}</span>
            </div>
          )}

          {/* Source badge and comparison status */}
          <div className="flex items-center gap-2">
            {parcel.source && (
              <Badge variant={parcel.source === 'canonical' ? 'default' : 'secondary'} className="text-xs">
                {parcel.source === 'canonical' ? 'SiteIntel' : 'County CAD'}
              </Badge>
            )}
            {isInComparison && (
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500">
                In Compare
              </Badge>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            {id && (
              <>
                <span className="text-muted-foreground">Parcel ID:</span>
                <span className="font-mono truncate">{id}</span>
              </>
            )}
            {owner && (
              <>
                <span className="text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Owner:
                </span>
                <span className="truncate">{owner}</span>
              </>
            )}
            {parcel.acreage !== undefined && parcel.acreage !== null && parcel.acreage > 0 && (
              <>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  Size:
                </span>
                <span>{parcel.acreage.toFixed(2)} acres</span>
              </>
            )}
            {landUse && (
              <>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  Land Use:
                </span>
                <span className="truncate">{landUse}</span>
              </>
            )}
            {parcel.jurisdiction && (
              <>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Jurisdiction:
                </span>
                <span className="truncate">{parcel.jurisdiction}</span>
              </>
            )}
          </div>

          {/* Click hints */}
          <div className="pt-1.5 border-t border-border/50 space-y-0.5">
            <p className="text-xs text-primary font-medium flex items-center gap-1">
              <span className="opacity-70">Click</span> to select
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Plus className="h-3 w-3" />
              <span className="opacity-70">Right-click</span> to add to compare
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
