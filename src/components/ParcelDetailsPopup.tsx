import { X, Sparkles, MapPin, Copy, ExternalLink, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// County display config with colors
const COUNTY_CONFIG: Record<string, { label: string; color: string }> = {
  harris: { label: 'Harris', color: 'bg-blue-500' },
  montgomery: { label: 'Montgomery', color: 'bg-green-500' },
  travis: { label: 'Travis', color: 'bg-purple-500' },
  bexar: { label: 'Bexar', color: 'bg-orange-500' },
  dallas: { label: 'Dallas', color: 'bg-red-500' },
  tarrant: { label: 'Tarrant', color: 'bg-cyan-500' },
  williamson: { label: 'Williamson', color: 'bg-yellow-500' },
  fortbend: { label: 'Fort Bend', color: 'bg-pink-500' },
};

// CAD website URLs
const CAD_WEBSITES: Record<string, string> = {
  harris: 'https://hcad.org/property-search/',
  montgomery: 'https://www.mcad-tx.org/property-search',
  travis: 'https://traviscad.org/property-search/',
  bexar: 'https://www.bcad.org/property-search/',
  dallas: 'https://www.dallascad.org/SearchOwner.aspx',
  tarrant: 'https://www.tad.org/property-search/',
  williamson: 'https://search.wcad.org/',
  fortbend: 'https://esearch.fbcad.org/',
};

interface ParcelDetailsPopupProps {
  parcel: {
    id: string;
    address: string;
    owner: string;
    acreage: number;
    landValue: number;
    imprValue?: number;
    county?: string;
    source?: string;
    datasetVersion?: string | null;
    landUseDesc?: string | null;
  };
  onClose: () => void;
  onUseForAnalysis: (parcel: any) => void;
}

export function ParcelDetailsPopup({ parcel, onClose, onUseForAnalysis }: ParcelDetailsPopupProps) {
  const countyKey = parcel.county?.toLowerCase() || 'harris';
  const countyInfo = COUNTY_CONFIG[countyKey] || { label: parcel.county || 'Unknown', color: 'bg-muted' };
  const cadUrl = CAD_WEBSITES[countyKey];

  const handleCopyAddress = () => {
    if (parcel.address) {
      navigator.clipboard.writeText(parcel.address);
      toast.success('Address copied to clipboard');
    }
  };

  const handleOpenGoogleMaps = () => {
    if (parcel.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parcel.address)}`;
      window.open(url, '_blank');
    }
  };

  const handleOpenCAD = () => {
    if (cadUrl) {
      window.open(cadUrl, '_blank');
    }
  };

  return (
    <div className="absolute bottom-4 left-4 z-20 w-80 glass-ai-panel rounded-lg p-4 shadow-xl">
      {/* Header with county badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge className={`${countyInfo.color} text-white text-xs`}>
              {countyInfo.label} County
            </Badge>
            {parcel.source && (
              <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">
                {parcel.source}
              </Badge>
            )}
            {parcel.datasetVersion && (
              <Badge variant="secondary" className="text-xs font-mono">
                v{parcel.datasetVersion}
              </Badge>
            )}
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                {parcel.address || 'Address not available'}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                ID: {parcel.id}
              </p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Property details */}
      <div className="space-y-2 text-xs border-t border-border/50 pt-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Owner:</span>
          <span className="font-mono text-foreground text-right max-w-[60%] truncate">
            {parcel.owner || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Acreage:</span>
          <span className="font-mono text-foreground">
            {parcel.acreage?.toFixed(2) || 'N/A'} ac
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Land Value:</span>
          <span className="font-mono text-foreground">
            ${parcel.landValue?.toLocaleString() || 'N/A'}
          </span>
        </div>
        {parcel.imprValue && parcel.imprValue > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Improvement Value:</span>
            <span className="font-mono text-foreground">
              ${parcel.imprValue.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyAddress}
          className="flex-1 h-8 text-xs"
          title="Copy address"
        >
          <Copy className="h-3 w-3 mr-1" />
          Copy
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenGoogleMaps}
          className="flex-1 h-8 text-xs"
          title="Open in Google Maps"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Maps
        </Button>
        {cadUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenCAD}
            className="flex-1 h-8 text-xs"
            title="View on CAD website"
          >
            <Building2 className="h-3 w-3 mr-1" />
            CAD
          </Button>
        )}
      </div>

      {/* Primary CTA */}
      <Button
        onClick={() => onUseForAnalysis(parcel)}
        className="w-full mt-3"
        variant="default"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Run Feasibility Analysis
      </Button>
    </div>
  );
}
