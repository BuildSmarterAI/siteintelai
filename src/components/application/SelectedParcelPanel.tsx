import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Hash, 
  Ruler, 
  User, 
  Building2, 
  MapIcon,
  ExternalLink, 
  Copy, 
  X, 
  ArrowRight,
  Loader2,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface SelectedParcelPanelProps {
  parcel: {
    id?: string;
    address?: string;
    acreage?: number;
    owner?: string;
    zoning?: string;
    county?: string;
    lat?: number;
    lng?: number;
    isDrawn?: boolean;
  };
  onClear: () => void;
  onContinue: () => void;
  isLoading?: boolean;
}

export function SelectedParcelPanel({
  parcel,
  onClear,
  onContinue,
  isLoading = false
}: SelectedParcelPanelProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied`, description: text });
  };

  const openGoogleMaps = () => {
    if (parcel.lat && parcel.lng) {
      window.open(
        `https://www.google.com/maps?q=${parcel.lat},${parcel.lng}`,
        '_blank'
      );
    }
  };

  // Count available fields for enrichment indicator
  const enrichedFieldCount = [
    parcel.id,
    parcel.acreage,
    parcel.owner,
    parcel.zoning,
    parcel.county
  ].filter(Boolean).length;

  return (
    <Card className="bg-background/95 backdrop-blur-sm shadow-2xl border-border/50 overflow-hidden">
      <CardContent className="p-0">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
        
        <div className="p-4">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {parcel.address || 'Selected Property'}
                </h3>
                {parcel.lat && parcel.lng && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {parcel.lat.toFixed(6)}, {parcel.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => parcel.address && copyToClipboard(parcel.address, 'Address')}
                title="Copy address"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={openGoogleMaps}
                title="View on Google Maps"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={onClear}
                title="Clear selection"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Parcel Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {parcel.id && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
              >
                <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Parcel ID</p>
                  <p className="text-sm font-medium truncate">{parcel.id}</p>
                </div>
              </motion.div>
            )}
            
            {parcel.acreage !== undefined && parcel.acreage > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="flex items-center gap-2"
              >
                <Ruler className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Lot Size</p>
                  <p className="text-sm font-medium">{parcel.acreage.toFixed(2)} ac</p>
                </div>
              </motion.div>
            )}
            
            {parcel.owner && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <p className="text-sm font-medium truncate">{parcel.owner}</p>
                </div>
              </motion.div>
            )}
            
            {parcel.zoning && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-2"
              >
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Zoning</p>
                  <p className="text-sm font-medium">{parcel.zoning}</p>
                </div>
              </motion.div>
            )}
            
            {parcel.county && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2"
              >
                <MapIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">County</p>
                  <p className="text-sm font-medium">{parcel.county}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer with enrichment indicator and CTA */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              {enrichedFieldCount > 0 && (
                <Badge variant="secondary" className="gap-1.5 text-xs">
                  <Sparkles className="h-3 w-3" />
                  {enrichedFieldCount} fields auto-filled
                </Badge>
              )}
              {parcel.isDrawn && (
                <Badge variant="outline" className="text-xs">
                  Custom Boundary
                </Badge>
              )}
            </div>
            
            <Button
              onClick={onContinue}
              disabled={isLoading || !parcel.address}
              className="gap-2 shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm & Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
