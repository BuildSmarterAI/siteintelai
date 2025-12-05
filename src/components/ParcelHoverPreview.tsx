import { motion } from 'framer-motion';
import { MapPin, User, Ruler, Building } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ParcelHoverPreviewProps {
  parcel: {
    id?: string;
    address?: string;
    owner?: string;
    acreage?: number;
    zoning?: string;
  } | null;
  position: { x: number; y: number } | null;
}

export function ParcelHoverPreview({ parcel, position }: ParcelHoverPreviewProps) {
  if (!parcel || !position) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="fixed z-50 pointer-events-none"
      style={{ 
        left: position.x + 16, 
        top: position.y - 10,
        maxWidth: 280
      }}
    >
      <Card className="p-3 bg-background/95 backdrop-blur-sm shadow-xl border-primary/20">
        <div className="space-y-2">
          {/* Address */}
          {parcel.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm font-medium line-clamp-2">{parcel.address}</span>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {parcel.id && (
              <>
                <span className="text-muted-foreground">Parcel ID:</span>
                <span className="font-mono truncate">{parcel.id}</span>
              </>
            )}
            {parcel.owner && (
              <>
                <span className="text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Owner:
                </span>
                <span className="truncate">{parcel.owner}</span>
              </>
            )}
            {parcel.acreage !== undefined && parcel.acreage > 0 && (
              <>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  Size:
                </span>
                <span>{parcel.acreage.toFixed(2)} acres</span>
              </>
            )}
            {parcel.zoning && (
              <>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  Zoning:
                </span>
                <span>{parcel.zoning}</span>
              </>
            )}
          </div>

          {/* Click hint */}
          <p className="text-xs text-primary font-medium pt-1 border-t border-border/50">
            Click to select this parcel
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
